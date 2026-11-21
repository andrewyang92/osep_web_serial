// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 載入 onnxruntime-web 與 YOLOX 模型
 * - 先建立 CPU（wasm）版，馬上可以用
 * - 有 WebGPU 時同時在背景建立 GPU 版並暖機（編譯 shader），成功後用 onUpgrade 通知換成 GPU
 *   CPU 版和 GPU 版是兩個獨立的 onnxruntime 模組，可以同時執行
 * 不可使用 async/await。
 */
const config = require('./yolo-config');

/** 瀏覽器預設：用動態 import 從 CDN 載入（避開 webpack 4 打包 ES module 的問題） */
const defaultImport = url => {
    const dynamicImport = new Function('url', 'return import(url)'); // eslint-disable-line no-new-func
    return dynamicImport(url);
};

/** 每一個錯誤都帶 stage，讓插件知道是哪一步失敗 */
const stageError = (stage, cause) => {
    const err = new Error(stage);
    err.stage = stage;
    err.cause = cause;
    return err;
};

// GPU 暖機推論最多等多久（毫秒）；第一次編譯 shader 可能要 20～30 秒，慢的電腦更久
const WARMUP_TIMEOUT = 120000;

/** Promise 加上逾時 */
const withTimeout = (promise, ms, message) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(v => {
        clearTimeout(timer);
        resolve(v);
    }, e => {
        clearTimeout(timer);
        reject(e);
    });
});

// GPU 失敗過一次就記住，之後換模型直接用 CPU，不必再等逾時
let gpuFailed = false;
// 同一個 webgpu 模組不能同時跑兩個推論（"Session already started"），GPU 暖機要排隊
let gpuChain = Promise.resolve();

const hasWebGPU = () => typeof navigator !== 'undefined' && Boolean(navigator.gpu);

/**
 * 下載模型並回報進度（0～1）
 * @param {string} url
 * @param {function} fetchFn
 * @param {function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
const fetchModel = (url, fetchFn, onProgress) => fetchFn(url).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}：${url}`);
    const total = Number(res.headers && res.headers.get && res.headers.get('content-length')) || 0;
    if (!res.body || !res.body.getReader || !total || !onProgress) {
        return res.arrayBuffer().then(buf => new Uint8Array(buf));
    }
    const reader = res.body.getReader();
    const chunks = [];
    let loaded = 0;
    const pump = () => reader.read().then(({done, value}) => {
        if (done) return;
        chunks.push(value);
        loaded += value.length;
        onProgress(Math.min(loaded / total, 1));
        return pump();
    });
    return pump().then(() => {
        const out = new Uint8Array(loaded);
        let offset = 0;
        for (const c of chunks) {
            out.set(c, offset);
            offset += c.length;
        }
        return out;
    });
});

/**
 * @param {string} modelKey 'fast' 或 'accurate'
 * @param {object} [opts]
 * @param {function} [opts.importer] 測試用：取代動態 import
 * @param {function} [opts.fetch] 測試用：取代 fetch
 * @param {function} [opts.onProgress] 下載進度（0～1）
 * @param {object} [opts.config] 取代 yolo-config
 * @param {boolean} [opts.webgpu] 測試用：強制使用（或不用）WebGPU
 * @param {number} [opts.warmupTimeout] GPU 暖機逾時（毫秒）
 * @param {function} [opts.onUpgrade] GPU 版準備好時呼叫，參數是 GPU 版的 detector；
 *                                    沒給就不會在背景準備 GPU
 * @returns {Promise<{ort, session, provider: string, inputName: string, outputName: string, size: number}>}
 *          先回傳 CPU 版；CPU 版建立失敗而有 WebGPU 時，改等 GPU 版
 */
const createDetector = (modelKey, opts = {}) => {
    const cfg = Object.assign({}, config, opts.config || {});
    const model = cfg.MODELS[modelKey] || cfg.MODELS[cfg.DEFAULT_MODEL];
    const importer = opts.importer || defaultImport;
    const fetchFn = opts.fetch || (url => fetch(url));
    const useGPU = opts.webgpu === undefined ? (!gpuFailed && hasWebGPU()) : opts.webgpu;
    const warmupTimeout = opts.warmupTimeout || WARMUP_TIMEOUT;

    // 載入 onnxruntime（webgpu 版或 wasm 版是兩個獨立的模組）
    const loadOrt = url => Promise.resolve()
        .then(() => importer(url))
        .then(lib => {
            const ort = lib.default && lib.default.InferenceSession ? lib.default : lib;
            ort.env.wasm.wasmPaths = cfg.ORT_BASE;
            // 沒有跨來源隔離（GitHub Pages）就不能多執行緒
            const isolated = typeof self !== 'undefined' && self.crossOriginIsolated;
            ort.env.wasm.numThreads = isolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
            return ort;
        })
        .catch(e => { throw stageError('library', e); });

    const createSession = (ort, bytes, ep) => ort.InferenceSession.create(bytes, {
        executionProviders: [ep],
        graphOptimizationLevel: 'all'
    }).catch(e => { throw stageError('model', e); });

    const result = (ort, session, provider) => ({
        ort,
        session,
        provider,
        inputName: session.inputNames[0],
        outputName: session.outputNames[0],
        size: model.size,
        name: model.name
    });

    const cpuDetector = bytes => loadOrt(cfg.ORT_WASM_URL)
        .then(ort => createSession(ort, bytes, 'wasm').then(session => result(ort, session, 'CPU')));

    // GPU：建好後先跑一次暖機推論（編譯 shader）；失敗或逾時就放棄 GPU。
    // 有些電腦的 WebGPU 能建 session 但推論不會回來，所以一定要有逾時。
    const gpuDetector = bytes => {
        const job = gpuChain.then(() => {
            if (gpuFailed) throw new Error('WebGPU 先前已失敗');
            return loadOrt(cfg.ORT_WEBGPU_URL);
        })
            .then(ort => createSession(ort, bytes, 'webgpu').then(session => {
                const det = result(ort, session, 'GPU');
                const input = new Float32Array(3 * model.size * model.size).fill(cfg.PAD_VALUE || 114);
                return withTimeout(runDetector(det, input), warmupTimeout, 'WebGPU 暖機逾時').then(() => det);
            }))
            .catch(err => {
                console.warn('YOLO WebGPU 無法使用，維持 CPU:', err); // eslint-disable-line no-console
                gpuFailed = true;
                throw err;
            });
        gpuChain = job.catch(() => {});
        return job;
    };

    return fetchModel(model.url, fetchFn, opts.onProgress)
        .catch(e => { throw stageError('download', e); })
        .then(bytes => cpuDetector(bytes)
            .then(det => {
                if (useGPU && opts.onUpgrade) {
                    gpuDetector(bytes).then(opts.onUpgrade, () => {});
                }
                return det;
            }, cpuErr => {
                if (!useGPU) throw cpuErr;
                console.warn('YOLO CPU 版無法建立，改試 GPU:', cpuErr); // eslint-disable-line no-console
                return gpuDetector(bytes).catch(() => {
                    throw cpuErr;
                });
            }));
};

/**
 * 執行一次辨識
 * @param {object} detector createDetector 的結果
 * @param {Float32Array} input 1×3×S×S
 * @returns {Promise<Float32Array>}
 */
const runDetector = (detector, input) => {
    const {ort, session, inputName, outputName, size} = detector;
    const tensor = new ort.Tensor('float32', input, [1, 3, size, size]);
    return session.run({[inputName]: tensor}).then(out => {
        const t = out[outputName];
        // WebGPU 的輸出也已經下載回 CPU（預設 preferredOutputLocation = cpu）
        const data = t.data;
        if (tensor.dispose) tensor.dispose();
        return data;
    });
};

/** 測試用：清除「GPU 失敗過」的記錄 */
const resetGpuState = () => {
    gpuFailed = false;
    gpuChain = Promise.resolve();
};

module.exports = {createDetector, runDetector, fetchModel, hasWebGPU, withTimeout, resetGpuState};
