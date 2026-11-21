// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * YOLO 物件辨識（YOLOX，COCO 80 類）
 *
 * - 模型：YOLOX-Nano（快速）/ YOLOX-Tiny（準確），Megvii，Apache 2.0，放在網站的 static（見 yolo-config.js）
 * - onnxruntime-web 執行期從 CDN 載入；有 WebGPU 用 GPU，沒有或失敗就用 CPU（見 yolo-loader.js）
 * - 來源：Scratch 視訊（連續辨識）、舞台畫面、圖片網址、上傳圖片檔
 * - 結果用舞台座標（x、y 是框的中心），視訊鏡像時左右跟著翻轉，和舞台上看到的一致
 *
 * 重要：不可使用 async/await（專案 babel 會產生需要 regeneratorRuntime 的程式，
 * GUI 沒有載入它）。全部用 Promise。
 */
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const msg = require('./translation');
const core = require('./yolo-core');
const config = require('./yolo-config');
const loader = require('./yolo-loader');
const YoloOverlay = require('./yolo-overlay');

// 原創圖示：辨識框 + 標籤
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
    '<rect x="1" y="1" width="38" height="38" rx="9" fill="#6A35D9"/>' +
    '<rect x="8" y="12" width="24" height="20" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2.4"/>' +
    '<rect x="8" y="7" width="15" height="7" rx="1.5" fill="#FFD43B"/>' +
    '<circle cx="20" cy="22" r="4.2" fill="#FFFFFF"/>' +
    '<circle cx="20" cy="22" r="1.8" fill="#6A35D9"/>' +
    '</svg>';
const menuIconURI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg)}`;
const blockIconURI = menuIconURI;

const DEFAULT_THRESHOLD = 0.5;
// 用 CPU 辨識視訊時，每次辨識後至少休息這麼久（毫秒，乘上辨識花的時間），讓 Scratch 不會卡
const CPU_REST_RATIO = 1;

const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    CAMERA: 'camera',
    RUNNING: 'running',
    DETECTING: 'detecting',
    DONE: 'done',
    CHOOSING: 'choosing',
    CANCELLED: 'cancelled',
    STOPPED: 'stopped',
    VIDEO_OFF: 'videoOff',
    ERR_CAMERA: 'errCamera',
    ERR_LIBRARY: 'errLibrary',
    ERR_DOWNLOAD: 'errDownload',
    ERR_MODEL: 'errModel',
    ERR_IMAGE: 'errImage',
    ERR_OTHER: 'errOther'
};
const STAGE_TO_STATUS = {
    library: STATUS.ERR_LIBRARY,
    download: STATUS.ERR_DOWNLOAD,
    model: STATUS.ERR_MODEL,
    image: STATUS.ERR_IMAGE,
    camera: STATUS.ERR_CAMERA
};

const statusError = (code, message) => {
    const err = new Error(message);
    err.statusCode = code;
    return err;
};

let theLocale = 'en';

// ---------- 瀏覽器預設的輸入方式（測試時用 deps 取代） ----------

/** 把圖片 / 視訊 / 畫布縮放成模型輸入 */
const browserPrepareInput = (() => {
    let canvas = null;
    let ctx = null;
    return (source, srcWidth, srcHeight, size) => {
        if (!canvas) {
            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d', {willReadFrequently: true});
        }
        if (canvas.width !== size) {
            canvas.width = size;
            canvas.height = size;
        }
        const lb = core.letterbox(srcWidth, srcHeight, size);
        ctx.fillStyle = `rgb(${core.PAD_VALUE},${core.PAD_VALUE},${core.PAD_VALUE})`;
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(source, 0, 0, lb.width, lb.height);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        return {input: core.rgbaToInput(pixels, size), scale: lb.scale};
    };
})();

/** 讀取圖片網址（需要對方允許跨網域，否則畫布無法讀取像素） */
const browserLoadImage = url => new Promise((resolve, reject) => {
    const img = new Image();
    if (!/^(data|blob):/i.test(url)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(statusError(STATUS.ERR_IMAGE, url));
    img.src = url;
});

/**
 * 讓使用者選一張圖片檔
 * 瀏覽器只允許在使用者剛點擊後開檔案視窗；如果不行，就跳出一個小對話框讓他按按鈕
 * @returns {Promise<string|null>} 圖片的 blob 網址；取消回傳 null
 */
const browserChooseFile = (texts, cancelSignal) => new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    let dialog = null;
    let done = false;
    const finish = value => {
        if (done) return;
        done = true;
        if (dialog) dialog.remove();
        input.remove();
        resolve(value);
    };
    cancelSignal.cancel = () => finish(null);
    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        finish(file ? URL.createObjectURL(file) : null);
    });
    input.addEventListener('cancel', () => finish(null));

    const ua = navigator.userActivation;
    if (!ua || ua.isActive) {
        input.click();
        return;
    }
    // 沒有使用者點擊（例如由計時器觸發）：顯示按鈕讓使用者點
    dialog = document.createElement('div');
    dialog.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;' +
        'justify-content:center;background:rgba(0,0,0,.35);font-family:sans-serif;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:10px;padding:20px 24px;box-shadow:0 6px 24px rgba(0,0,0,.3);' +
        'text-align:center;min-width:240px;';
    const title = document.createElement('div');
    title.textContent = texts.title;
    title.style.cssText = 'font-size:16px;margin-bottom:14px;color:#333;';
    const pick = document.createElement('button');
    pick.textContent = texts.button;
    pick.style.cssText = 'font-size:15px;padding:8px 16px;margin:0 6px;border:0;border-radius:6px;' +
        'background:#6A35D9;color:#fff;cursor:pointer;';
    const cancel = document.createElement('button');
    cancel.textContent = texts.cancel;
    cancel.style.cssText = 'font-size:15px;padding:8px 16px;margin:0 6px;border:1px solid #ccc;border-radius:6px;' +
        'background:#fff;color:#333;cursor:pointer;';
    pick.onclick = () => {
        dialog.style.display = 'none';
        input.click();
    };
    cancel.onclick = () => finish(null);
    box.appendChild(title);
    box.appendChild(pick);
    box.appendChild(cancel);
    dialog.appendChild(box);
    document.body.appendChild(dialog);
});

class Scratch3YoloDetection {
    /**
     * @param {Runtime} runtime
     * @param {object} [deps] 測試用：{createDetector, runDetector, prepareInput, loadImage, chooseFile,
     *                         createOverlay, raf, now, setTimeout}
     */
    constructor (runtime, deps = {}) {
        this.runtime = runtime;
        this._createDetector = deps.createDetector || loader.createDetector;
        this._runDetector = deps.runDetector || loader.runDetector;
        this._prepareInput = deps.prepareInput || browserPrepareInput;
        this._loadImage = deps.loadImage || browserLoadImage;
        this._chooseFile = deps.chooseFile || browserChooseFile;
        this._createOverlay = deps.createOverlay || (renderer => new YoloOverlay(renderer));
        this._raf = deps.raf || (fn => window.requestAnimationFrame(fn));
        this._now = deps.now || (() => performance.now());
        this._setTimeout = deps.setTimeout || ((fn, ms) => setTimeout(fn, ms));

        this._modelKey = config.DEFAULT_MODEL;
        this._detector = null;
        this._loadPromise = null;
        this._loadingKey = null;
        this._progress = 0;
        this._queue = Promise.resolve(); // 一次只跑一個辨識（WebGPU 不能同時跑）

        this._videoDetecting = false;
        this._videoOpenedByStart = false;
        this._lastVideoTime = -1;
        this._restUntil = 0;

        this._threshold = DEFAULT_THRESHOLD;
        this._objects = []; // 全部候選（分數 ≥ 0.1），由高到低
        this._source = null; // 'video' | 'stage' | 'image'
        this._image = null; // 上傳或網址圖片（要畫在舞台上）
        this._imageFit = null;
        this._showBoxes = true;
        this._overlay = null;
        this._pendingChoose = null;

        this._status = STATUS.IDLE;
        this._errorDetail = '';
        theLocale = this._setLocale();

        if (runtime && runtime.on) {
            // 按停止：取消還沒選的圖片（積木不會一直卡著）
            runtime.on('PROJECT_STOP_ALL', () => {
                if (this._pendingChoose && this._pendingChoose.cancel) this._pendingChoose.cancel();
            });
        }
    }

    _setLocale () {
        const locale = formatMessage.setup().locale;
        return locale === 'zh-tw' ? 'zh-tw' : 'en';
    }

    _t (key) {
        const entry = msg[key];
        if (!entry) return key;
        return entry[theLocale] || entry.en;
    }

    _className (classId) {
        const en = core.CLASSES[classId];
        if (en === undefined) return '';
        return theLocale === 'zh-tw' ? msg.CLASS_ZH[en] : en;
    }

    getInfo () {
        theLocale = this._setLocale();
        const classArg = {type: ArgumentType.STRING, menu: 'classMenu', defaultValue: 'person'};
        return {
            id: 'yoloDetection',
            name: this._t('title'),
            color1: '#6A35D9',
            color2: '#5A2CBA',
            color3: '#4A249A',
            menuIconURI,
            blockIconURI,
            blocks: [
                {
                    opcode: 'loadModel',
                    blockType: BlockType.COMMAND,
                    text: this._t('loadModel'),
                    arguments: {MODEL: {type: ArgumentType.STRING, menu: 'modelMenu', defaultValue: 'fast'}}
                },
                {
                    opcode: 'videoToggle',
                    blockType: BlockType.COMMAND,
                    text: this._t('videoToggle'),
                    arguments: {
                        VIDEO_STATE: {type: ArgumentType.STRING, menu: 'videoMenu', defaultValue: 'on'}
                    }
                },
                {opcode: 'startVideo', blockType: BlockType.COMMAND, text: this._t('startVideo')},
                {opcode: 'stopVideo', blockType: BlockType.COMMAND, text: this._t('stopVideo')},
                {opcode: 'detectStage', blockType: BlockType.COMMAND, text: this._t('detectStage')},
                {
                    opcode: 'detectUrl',
                    blockType: BlockType.COMMAND,
                    text: this._t('detectUrl'),
                    arguments: {URL: {type: ArgumentType.STRING, defaultValue: 'https://'}}
                },
                {opcode: 'detectFile', blockType: BlockType.COMMAND, text: this._t('detectFile')},
                '---',
                {
                    opcode: 'showBoxes',
                    blockType: BlockType.COMMAND,
                    text: this._t('showBoxes'),
                    arguments: {STATE: {type: ArgumentType.STRING, menu: 'showMenu', defaultValue: 'show'}}
                },
                {
                    opcode: 'setThreshold',
                    blockType: BlockType.COMMAND,
                    text: this._t('setThreshold'),
                    arguments: {VALUE: {type: ArgumentType.NUMBER, defaultValue: 50}}
                },
                {opcode: 'clearResults', blockType: BlockType.COMMAND, text: this._t('clearResults')},
                {opcode: 'getStatus', blockType: BlockType.REPORTER, text: this._t('status')},
                '---',
                {
                    opcode: 'whenDetected',
                    blockType: BlockType.HAT,
                    text: this._t('whenDetected'),
                    isEdgeActivated: true,
                    arguments: {CLASS: classArg}
                },
                {
                    opcode: 'isDetected',
                    blockType: BlockType.BOOLEAN,
                    text: this._t('isDetected'),
                    arguments: {CLASS: classArg}
                },
                {opcode: 'getCount', blockType: BlockType.REPORTER, text: this._t('count')},
                {
                    opcode: 'getClassCount',
                    blockType: BlockType.REPORTER,
                    text: this._t('classCount'),
                    arguments: {CLASS: classArg}
                },
                {
                    opcode: 'getObjectProp',
                    blockType: BlockType.REPORTER,
                    text: this._t('objectProp'),
                    arguments: {
                        INDEX: {type: ArgumentType.NUMBER, defaultValue: 1},
                        PROP: {type: ArgumentType.STRING, menu: 'objectPropMenu', defaultValue: 'name'}
                    }
                },
                {
                    opcode: 'getClassProp',
                    blockType: BlockType.REPORTER,
                    text: this._t('classProp'),
                    arguments: {
                        CLASS: classArg,
                        PROP: {type: ArgumentType.STRING, menu: 'classPropMenu', defaultValue: 'x'}
                    }
                },
                {opcode: 'getAllLabels', blockType: BlockType.REPORTER, text: this._t('allLabels')}
            ],
            menus: {
                modelMenu: {
                    acceptReporters: false,
                    items: [
                        {text: this._t('model_fast'), value: 'fast'},
                        {text: this._t('model_accurate'), value: 'accurate'}
                    ]
                },
                videoMenu: {
                    acceptReporters: false,
                    items: [
                        {text: this._t('off'), value: 'off'},
                        {text: this._t('on'), value: 'on'},
                        {text: this._t('onFlipped'), value: 'on-flipped'}
                    ]
                },
                showMenu: {
                    acceptReporters: false,
                    items: [
                        {text: this._t('show'), value: 'show'},
                        {text: this._t('hide'), value: 'hide'}
                    ]
                },
                classMenu: {
                    acceptReporters: true,
                    items: core.CLASSES.map((en, i) => ({text: this._className(i), value: en}))
                },
                objectPropMenu: {
                    acceptReporters: true,
                    items: ['name', 'confidence', 'x', 'y', 'width', 'height']
                        .map(k => ({text: this._t(`prop_${k}`), value: k}))
                },
                classPropMenu: {
                    acceptReporters: true,
                    items: ['x', 'y', 'width', 'height', 'confidence']
                        .map(k => ({text: this._t(`prop_${k}`), value: k}))
                }
            }
        };
    }

    // ---------- 狀態 ----------

    _setStatus (code, detail) {
        this._status = code;
        this._errorDetail = detail || '';
    }

    _handleError (error) {
        const code = (error && (error.statusCode || STAGE_TO_STATUS[error.stage])) || STATUS.ERR_OTHER;
        const cause = (error && error.cause) || error;
        const detail = cause && cause.message ? cause.message : String(cause);
        console.error('YOLO 物件辨識錯誤:', error); // eslint-disable-line no-console
        this._setStatus(code, code === STATUS.ERR_IMAGE ? '' : detail);
    }

    // ---------- 模型 ----------

    /**
     * 確保目前選的模型已載入（同時呼叫只載入一次）
     * @returns {Promise}
     */
    _ensureModel () {
        const key = this._modelKey;
        if (this._detector && this._detector.key === key) return Promise.resolve();
        if (this._loadPromise && this._loadingKey === key) return this._loadPromise;
        const previous = this._loadPromise || Promise.resolve();
        this._loadingKey = key;
        this._progress = 0;
        this._setStatus(STATUS.LOADING);
        const p = previous.catch(() => {})
            .then(() => this._createDetector(key, {
                onProgress: v => {
                    this._progress = Math.max(this._progress, v);
                },
                // 背景的 GPU 版好了：如果還是同一個模型，就換成 GPU
                onUpgrade: gpu => this._upgradeDetector(key, gpu)
            }))
            .then(det => {
                det.key = key;
                this._swapDetector(det);
                console.log(`YOLO 模型載入完成：${det.name}（${det.provider}）`); // eslint-disable-line no-console
                if (this._status === STATUS.LOADING) this._setStatus(STATUS.READY);
            });
        this._loadPromise = p;
        const clear = () => {
            if (this._loadPromise === p) {
                this._loadPromise = null;
                this._loadingKey = null;
            }
        };
        p.then(clear, clear);
        return p;
    }

    /** 換成新的 detector；舊的等目前的辨識跑完再釋放 */
    _swapDetector (det) {
        const old = this._detector;
        this._detector = det;
        if (old && old !== det) this._release(old);
    }

    _release (det) {
        if (det && det.session && det.session.release) {
            this._queue = this._queue.then(() => det.session.release()).catch(() => {});
        }
    }

    _upgradeDetector (key, gpu) {
        const cur = this._detector;
        if (cur && cur.key === key && cur.provider !== 'GPU' && this._modelKey === key) {
            gpu.key = key;
            this._swapDetector(gpu);
            this._restUntil = 0;
            console.log(`YOLO 改用 GPU：${gpu.name}`); // eslint-disable-line no-console
        } else {
            this._release(gpu); // 已經換了別的模型
        }
    }

    loadModel (args) {
        this._modelKey = config.MODELS[args.MODEL] ? args.MODEL : config.DEFAULT_MODEL;
        return this._ensureModel().catch(err => this._handleError(err));
    }

    /**
     * 排隊執行一次辨識
     * @param {CanvasImageSource} source
     * @param {object} info {width, height, fit, mirror}
     * @returns {Promise<Array>} 舞台結果
     */
    _detect (source, info) {
        const job = this._queue.then(() => {
            const det = this._detector;
            const {input, scale} = this._prepareInput(source, info.width, info.height, det.size);
            return this._runDetector(det, input).then(data => core.postprocess(data, {
                size: det.size,
                scale,
                imgWidth: info.width,
                imgHeight: info.height,
                fit: info.fit,
                mirror: info.mirror
            }));
        });
        this._queue = job.catch(() => {});
        return job;
    }

    // ---------- 舞台上的框 ----------

    _overlayLayer () {
        if (!this._overlay && this.runtime.renderer) {
            this._overlay = this._createOverlay(this.runtime.renderer);
            this._overlay.setVisible(this._showBoxes);
        }
        return this._overlay;
    }

    _redraw () {
        const overlay = this._overlayLayer();
        if (!overlay || !this._showBoxes) return; // 隱藏時不畫，重新顯示時再畫
        if (!this._source) {
            overlay.clear();
            return;
        }
        overlay.draw({
            objects: this._visibleObjects(),
            labelOf: o => `${this._className(o.classId)} ${Math.round(o.score * 100)}%`,
            image: this._source === 'image' ? this._image : null,
            fit: this._imageFit
        });
        if (this.runtime.requestRedraw) this.runtime.requestRedraw();
    }

    _setResults (source, objects, image, fit) {
        this._source = source;
        this._objects = objects;
        this._image = image || null;
        this._imageFit = fit || null;
        this._redraw();
    }

    showBoxes (args) {
        this._showBoxes = args.STATE !== 'hide';
        const overlay = this._overlayLayer();
        if (overlay) overlay.setVisible(this._showBoxes);
        if (this._showBoxes) this._redraw();
    }

    setThreshold (args) {
        let v = Number(args.VALUE);
        if (!isFinite(v)) return;
        v = Math.min(Math.max(v, 10), 100);
        this._threshold = v / 100;
        this._redraw();
    }

    clearResults () {
        this._setResults(null, []);
    }

    // ---------- 視訊 ----------

    _video () {
        return this.runtime.ioDevices && this.runtime.ioDevices.video;
    }

    _isVideoEnabled () {
        const v = this._video();
        return Boolean(v && v.provider && v.provider.enabled);
    }

    _getVideoElement () {
        const v = this._video();
        if (!v || !v.provider || !v.videoReady) return null;
        return v.provider.video;
    }

    _isMirrored () {
        const v = this._video();
        // Scratch 預設是鏡像；「翻轉」= 不鏡像
        return !v || v.mirror !== false;
    }

    videoToggle (args) {
        const v = this._video();
        if (!v) return;
        this._videoOpenedByStart = false; // 使用者自己控制視訊
        if (args.VIDEO_STATE === 'off') {
            v.disableVideo();
            return;
        }
        v.mirror = args.VIDEO_STATE === 'on';
        const p = v.enableVideo();
        if (p) return p.then(() => {});
    }

    _openVideo () {
        const v = this._video();
        if (!v || !v.provider) return Promise.reject(statusError(STATUS.ERR_CAMERA, '找不到視訊裝置'));
        if (!this._isVideoEnabled()) {
            this._videoOpenedByStart = true;
            v.mirror = true;
        }
        // 使用者拒絕攝影機時 enableVideo 不會 reject，只是 provider.video 是 null
        return Promise.resolve(v.enableVideo()).then(() => {
            if (!v.provider.video) throw statusError(STATUS.ERR_CAMERA, '攝影機無法開啟');
        });
    }

    /** 回傳 Promise：積木會等到模型與攝影機準備好（或失敗）才往下執行 */
    startVideo () {
        if (this._videoDetecting) {
            if (!this._isVideoEnabled()) {
                this._setStatus(STATUS.CAMERA);
                return this._openVideo().catch(err => this._handleError(err));
            }
            return;
        }
        return this._ensureModel()
            .then(() => {
                this._setStatus(STATUS.CAMERA);
                return this._openVideo();
            })
            .then(() => {
                if (this._videoDetecting) return;
                this._setStatus(STATUS.RUNNING);
                this._videoDetecting = true;
                this._lastVideoTime = -1;
                this._restUntil = 0;
                this._setResults('video', []);
                this._loop();
            })
            .catch(err => {
                this._handleError(err);
                this._closeVideoIfOpenedByStart();
            });
    }

    _closeVideoIfOpenedByStart () {
        if (this._videoOpenedByStart) {
            this._videoOpenedByStart = false;
            const v = this._video();
            if (v) v.disableVideo();
        }
    }

    _stopVideoDetection () {
        if (!this._videoDetecting) return false;
        this._videoDetecting = false;
        this._closeVideoIfOpenedByStart();
        return true;
    }

    stopVideo () {
        const wasRunning = this._stopVideoDetection();
        if (wasRunning || this._source === 'video') {
            this._setResults(null, []);
            this._setStatus(STATUS.STOPPED);
        }
    }

    _loop () {
        if (!this._videoDetecting) return;
        this._processFrame();
        this._raf(() => this._loop());
    }

    _processFrame () {
        if (this._frameBusy) return;
        const videoEl = this._getVideoElement();
        if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) {
            if (!this._isVideoEnabled() && this._status !== STATUS.VIDEO_OFF) {
                this._setStatus(STATUS.VIDEO_OFF);
                this._setResults('video', []);
            }
            return;
        }
        if (this._status !== STATUS.RUNNING) this._setStatus(STATUS.RUNNING);
        if (this._now() < this._restUntil) return;
        // 同一幀不重複辨識
        if (videoEl.currentTime === this._lastVideoTime) return;
        this._lastVideoTime = videoEl.currentTime;

        this._frameBusy = true;
        const start = this._now();
        this._detect(videoEl, {
            width: videoEl.videoWidth,
            height: videoEl.videoHeight,
            fit: 'stretch',
            mirror: this._isMirrored()
        }).then(objects => {
            if (this._videoDetecting) this._setResults('video', objects);
        }, err => {
            console.error('YOLO 視訊辨識錯誤:', err); // eslint-disable-line no-console
        }).then(() => {
            this._frameBusy = false;
            // CPU 辨識會佔用主執行緒，休息一下讓 Scratch 能順暢執行
            if (this._detector && this._detector.provider === 'CPU') {
                this._restUntil = this._now() + ((this._now() - start) * CPU_REST_RATIO);
            }
        });
    }

    // ---------- 圖片 ----------

    /** 圖片辨識前：停止視訊辨識（不然下一幀會蓋掉結果），載入模型 */
    _beforeImage () {
        this._stopVideoDetection();
        return this._ensureModel();
    }

    _detectImage (img) {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) return Promise.reject(statusError(STATUS.ERR_IMAGE, '圖片大小為 0'));
        this._setStatus(STATUS.DETECTING);
        return this._detect(img, {width, height, fit: 'contain', mirror: false}).then(objects => {
            this._setResults('image', objects, img, core.stageFit(width, height, 'contain'));
            this._setStatus(STATUS.DONE);
        });
    }

    detectUrl (args) {
        const url = String(args.URL).trim();
        return this._beforeImage()
            .then(() => {
                this._setStatus(STATUS.DETECTING);
                return this._loadImage(url);
            })
            .then(img => this._detectImage(img))
            .catch(err => {
                // 圖片能載入但跨網域不能讀像素時，getImageData 會丟 SecurityError
                if (err && err.name === 'SecurityError') err.statusCode = STATUS.ERR_IMAGE;
                this._handleError(err);
            });
    }

    detectFile () {
        if (this._pendingChoose) return; // 已經在選了
        const cancelSignal = {};
        this._pendingChoose = cancelSignal;
        // 先開檔案視窗（要趁使用者剛點擊），模型在背景同時載入
        const modelReady = this._beforeImage();
        modelReady.catch(() => {}); // 錯誤在選完圖片後處理
        this._setStatus(STATUS.CHOOSING);
        return this._chooseFile({
            title: this._t('pickTitle'),
            button: this._t('pickButton'),
            cancel: this._t('pickCancel')
        }, cancelSignal)
            .then(url => {
                this._pendingChoose = null;
                if (!url) {
                    this._setStatus(STATUS.CANCELLED);
                    return;
                }
                return modelReady
                    .then(() => this._loadImage(url))
                    .then(img => this._detectImage(img));
            })
            .catch(err => {
                this._pendingChoose = null;
                this._handleError(err);
            });
    }

    /** 拍下目前的舞台畫面（不含自己的框） */
    _snapshotStage () {
        const renderer = this.runtime.renderer;
        if (!renderer || !renderer.requestSnapshot) {
            return Promise.reject(statusError(STATUS.ERR_OTHER, '找不到舞台'));
        }
        const overlay = this._overlay;
        if (overlay) overlay.setVisible(false);
        return new Promise(resolve => renderer.requestSnapshot(resolve))
            .then(dataUrl => {
                if (overlay) overlay.setVisible(this._showBoxes);
                return this._loadImage(dataUrl);
            }, err => {
                if (overlay) overlay.setVisible(this._showBoxes);
                throw err;
            });
    }

    detectStage () {
        return this._beforeImage()
            .then(() => {
                this._setStatus(STATUS.DETECTING);
                return this._snapshotStage();
            })
            .then(img => {
                const width = img.naturalWidth || img.width;
                const height = img.naturalHeight || img.height;
                return this._detect(img, {width, height, fit: 'stretch', mirror: false});
            })
            .then(objects => {
                this._setResults('stage', objects);
                this._setStatus(STATUS.DONE);
            })
            .catch(err => this._handleError(err));
    }

    // ---------- 回報積木 ----------

    _visibleObjects () {
        return core.filterByScore(this._objects, this._threshold);
    }

    _classIdOf (value) {
        return core.classIdOf(value, msg.CLASS_ZH);
    }

    _ofClass (value) {
        const id = this._classIdOf(value);
        if (id < 0) return [];
        return this._visibleObjects().filter(o => o.classId === id);
    }

    _prop (o, prop) {
        if (!o) return prop === 'name' ? '' : 0;
        switch (String(prop)) {
        case 'name': return this._className(o.classId);
        case 'confidence': return Math.round(o.score * 100);
        case 'x': return o.x;
        case 'y': return o.y;
        case 'width': return o.width;
        case 'height': return o.height;
        default: return 0;
        }
    }

    whenDetected (args) {
        return this._ofClass(args.CLASS).length > 0;
    }

    isDetected (args) {
        return this.whenDetected(args);
    }

    getCount () {
        return this._visibleObjects().length;
    }

    getClassCount (args) {
        return this._ofClass(args.CLASS).length;
    }

    getObjectProp (args) {
        const i = Math.floor(Number(args.INDEX));
        const list = this._visibleObjects();
        return this._prop(i >= 1 ? list[i - 1] : null, args.PROP);
    }

    getClassProp (args) {
        return this._prop(this._ofClass(args.CLASS)[0], args.PROP);
    }

    getAllLabels () {
        const seen = [];
        for (const o of this._visibleObjects()) {
            const name = this._className(o.classId);
            if (seen.indexOf(name) < 0) seen.push(name);
        }
        return seen.join(theLocale === 'zh-tw' ? '、' : ', ');
    }

    getStatus () {
        let text = this._t(`status_${this._status}`);
        if (this._status === STATUS.LOADING && this._progress > 0 && this._progress < 1) {
            text += ` ${Math.round(this._progress * 100)}%`;
        }
        if ((this._status === STATUS.READY || this._status === STATUS.RUNNING || this._status === STATUS.DONE) &&
            this._detector) {
            text += `（${this._detector.name}，${this._detector.provider}）`;
        }
        if (this._errorDetail && this._status.indexOf('err') === 0) text += `（${this._errorDetail}）`;
        return text;
    }
}

module.exports = Scratch3YoloDetection;
