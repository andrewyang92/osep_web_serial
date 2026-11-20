/**
 * 文字情緒辨識核心（與 Scratch 無關，可在 Node 中單獨測試）
 *
 * - 自動判斷語言：含中文字 → 中文模型；英文 → 英文模型
 * - 模型以 transformers.js 在瀏覽器端執行（ONNX / WASM），不需翻譯 API
 * - transformers.js 於執行期由 CDN 載入，不需要修改專案的 package.json
 */
const {toSimplified} = require('./t2s');

const TRANSFORMERS_VERSION = '4.3.2';
const TRANSFORMERS_URL =
    `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${TRANSFORMERS_VERSION}/dist/transformers.min.js`;

const MODELS = {
    zh: {
        // IDEA-CCNL Erlangshen-Roberta-110M-Sentiment（8 個中文情緒資料集、約 22 萬筆訓練）
        id: 'onnx-community/Erlangshen-Roberta-110M-Sentiment-ONNX',
        dtype: 'q8', // int8 量化，約 103 MB
        // 模型以簡體語料訓練，繁體先逐字轉簡體可再提升一點準確度
        preprocess: toSimplified
    },
    en: {
        // DistilBERT fine-tuned on SST-2
        id: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        dtype: 'q8', // 約 67 MB
        preprocess: text => text
    }
};

const MAX_CHARS = 500; // 模型上限 512 tokens，過長的輸入先截斷
const LARGE_FILE_BYTES = 5 * 1024 * 1024; // 超過此大小視為模型權重檔

const CJK_RE = /[㐀-䶿一-鿿豈-﫿]/g;
const LATIN_WORD_RE = /[A-Za-z]+/g;

/**
 * 判斷文字語言。
 * @param {string} text 輸入文字
 * @returns {'zh'|'en'|null} 沒有中文字也沒有英文字時回傳 null
 */
const detectLanguage = text => {
    const s = String(text === null || typeof text === 'undefined' ? '' : text);
    const cjk = (s.match(CJK_RE) || []).length;
    const latin = (s.match(LATIN_WORD_RE) || []).length;
    if (cjk === 0 && latin === 0) return null;
    // 中英夾雜時，以中文字數與英文單字數比較
    return cjk >= latin ? 'zh' : 'en';
};

/** 把模型輸出（所有類別分數）換算成「正面機率」 */
const positiveProbability = outputs => {
    let pos = 0;
    let neg = 0;
    for (const o of outputs) {
        if (/pos/i.test(o.label)) pos += o.score;
        else if (/neg/i.test(o.label)) neg += o.score;
    }
    const total = pos + neg;
    return total > 0 ? pos / total : 0.5;
};

/** 瀏覽器預設：從 CDN 動態載入 transformers.js（避開 webpack 4 的打包） */
// 注意：本檔不使用 async/await —— 專案的 babel 設定會把它轉成需要
// regeneratorRuntime 的程式碼，而 GUI 沒有載入它，會導致插件無法載入。
const defaultPipelineFactory = () => {
    // eslint-disable-next-line no-new-func
    const dynamicImport = new Function('url', 'return import(url)');
    return dynamicImport(TRANSFORMERS_URL).then(mod => {
        // 不要向網站本身的 /models/ 路徑找模型（避免一連串 404）
        mod.env.allowLocalModels = false;
        return mod.pipeline;
    });
};

class SentimentAnalyzer {
    /**
     * @param {object} [options]
     * @param {Function} [options.pipelineFactory] async () => transformers.js 的 pipeline 函式
     * @param {object} [options.models] 覆寫模型設定（測試用）
     * @param {Function} [options.onStatus] (lang, status) => void
     */
    constructor (options = {}) {
        this.pipelineFactory = options.pipelineFactory || defaultPipelineFactory;
        this.models = options.models || MODELS;
        this.onStatus = options.onStatus || (() => {});
        this._pipelineFnPromise = null;
        this._classifiers = {}; // lang -> Promise<classifier>
        this.status = {};
        for (const lang of Object.keys(this.models)) {
            this.status[lang] = {state: 'idle', progress: 0, error: null};
        }
    }

    _setStatus (lang, patch) {
        this.status[lang] = Object.assign({}, this.status[lang], patch);
        this.onStatus(lang, this.status[lang]);
    }

    _getPipelineFn () {
        if (!this._pipelineFnPromise) {
            this._pipelineFnPromise = Promise.resolve()
                .then(() => this.pipelineFactory())
                .catch(err => {
                    this._pipelineFnPromise = null; // 允許下次重試
                    throw err;
                });
        }
        return this._pipelineFnPromise;
    }

    /**
     * 指定語言的模型是否都已可用（不會觸發載入）。
     * @param {string[]} langs 語言列表
     * @returns {boolean} 全部就緒才回傳 true
     */
    isReady (langs) {
        return langs.every(lang => this.status[lang] && this.status[lang].state === 'ready');
    }

    /**
     * 載入（或取得已載入的）某語言模型。同一語言只會下載一次。
     * @param {'zh'|'en'} lang 語言
     * @returns {Promise<Function>} classifier
     */
    load (lang) {
        const cfg = this.models[lang];
        if (!cfg) return Promise.reject(new Error(`Unsupported language: ${lang}`));
        if (this._classifiers[lang]) return this._classifiers[lang];

        // 模型由多個檔案組成（設定檔、tokenizer、ONNX 權重），會陸續開始下載。
        // 若只用「目前已知的檔案」計算，小檔先下載完時會短暫顯示 99%，
        // 之後大檔出現又掉回去。因此：
        //   1. 在大檔（模型權重）出現前不顯示百分比
        //   2. 百分比只增不減
        //   3. 所有檔案下載完後改顯示「初始化中」，直到模型真的可用
        const files = {}; // file -> {loaded, total}
        let sawLargeFile = false;
        const onProgress = p => {
            if (!p || !p.file || p.status !== 'progress' || !p.total) return;
            if (this.status[lang].state === 'ready' || this.status[lang].state === 'error') return;
            files[p.file] = {loaded: p.loaded, total: p.total};
            if (p.total >= LARGE_FILE_BYTES) sawLargeFile = true;
            if (!sawLargeFile) return;
            let loaded = 0;
            let total = 0;
            for (const f of Object.values(files)) {
                loaded += Math.min(f.loaded, f.total);
                total += f.total;
            }
            if (loaded >= total) {
                this._setStatus(lang, {state: 'initializing', progress: 100});
                return;
            }
            const pct = Math.min(99, Math.floor((100 * loaded) / total));
            if (pct > this.status[lang].progress) this._setStatus(lang, {progress: pct});
        };

        this._setStatus(lang, {state: 'loading', progress: 0, error: null});
        this._classifiers[lang] = this._getPipelineFn()
            .then(pipeline => pipeline('text-classification', cfg.id, {
                dtype: cfg.dtype,
                progress_callback: onProgress
            }))
            .then(classifier => {
                this._setStatus(lang, {state: 'ready', progress: 100});
                return classifier;
            })
            .catch(err => {
                delete this._classifiers[lang]; // 允許下次重試
                this._setStatus(lang, {state: 'error', error: err});
                throw err;
            });
        return this._classifiers[lang];
    }

    /**
     * 分析一段文字。
     * @param {string} text 輸入文字
     * @returns {Promise<{language: ?string, label: string, score: number, confidence: number}>}
     *   score = 正面機率 (0~1)；confidence = 對結果的把握度 (0.5~1)
     */
    analyze (text) {
        const raw = String(text === null || typeof text === 'undefined' ? '' : text).trim();
        const language = detectLanguage(raw);
        if (!language) {
            return Promise.resolve({language: null, label: 'neutral', score: 0.5, confidence: 0});
        }
        const cfg = this.models[language];
        return this.load(language)
            .then(classifier => classifier(cfg.preprocess(raw).slice(0, MAX_CHARS), {top_k: null}))
            .then(outputs => {
                const score = positiveProbability(Array.isArray(outputs) ? outputs : [outputs]);
                return {
                    language,
                    label: score >= 0.5 ? 'positive' : 'negative',
                    score,
                    confidence: Math.max(score, 1 - score)
                };
            });
    }
}

module.exports = {
    SentimentAnalyzer,
    detectLanguage,
    positiveProbability,
    MODELS,
    TRANSFORMERS_URL
};
