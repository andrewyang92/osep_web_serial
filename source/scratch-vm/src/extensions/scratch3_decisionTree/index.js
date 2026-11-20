/**
 * 決策樹插件
 *
 * - 資料：Google 試算表插件「讀取的 Google 資料」產生的 JSON（[{欄位: 值}, ...]）
 * - 訓練：dt-core.js（C4.5 風格，文字欄位多分支、數字欄位自動找門檻）
 * - 顯示：tree-view.js 產生 HTML，用 window.open 在新視窗顯示；
 *   彈出視窗被瀏覽器擋住時，改在本頁用浮動視窗顯示
 *
 * 重要：不可使用 async/await（專案 babel 會產生需要 regeneratorRuntime 的程式，
 * GUI 沒有載入它）。本插件全部是同步運算，也不需要 require('ml5')。
 */
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const msg = require('./translation');
const core = require('./dt-core');
const view = require('./tree-view');
const samples = require('./samples');

// 原創圖示：紫色樹狀節點
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
    '<circle cx="20" cy="20" r="19" fill="#6230B8"/>' +
    '<path d="M20 12 L11 22 M20 12 L29 22 M29 22 L24 31 M29 22 L34 31" stroke="#E9DDFF" ' +
    'stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
    '<rect x="14" y="7" width="12" height="8" rx="3" fill="#FFFFFF"/>' +
    '<rect x="6" y="19" width="10" height="7" rx="3" fill="#59C059"/>' +
    '<rect x="24" y="19" width="10" height="7" rx="3" fill="#FFFFFF"/>' +
    '<rect x="19" y="28" width="9" height="7" rx="3" fill="#4C97FF"/>' +
    '<rect x="30" y="28" width="8" height="7" rx="3" fill="#59C059"/>' +
    '<circle cx="31" cy="9" r="2" fill="#FFD84D"/>' +
    '</svg>';
const menuIconURI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg)}`;
const blockIconURI = menuIconURI;

const WINDOW_NAME = 'osepDecisionTree';
const OVERLAY_ID = 'osep-decision-tree-overlay';

let theLocale = 'en';

const round1 = x => Math.round(x * 1000) / 10;

class Scratch3DecisionTree {
    /**
     * @param {Runtime} runtime
     * @param {object} [deps] 測試用：{win: 取代 window, doc: 取代 document}
     */
    constructor (runtime, deps = {}) {
        this.runtime = runtime;
        this._deps = deps;

        this._data = null; // {rows, columns}
        this._target = '';
        this._features = null; // null = 全部
        this._trainPercent = 70;
        this._maxDepth = 5;
        this._model = null;

        this._input = {};
        this._last = null; // 最後一次預測
        this._shownKey = null; // 視窗目前顯示的內容（避免重複刷新）
        this._win = null;

        this._status = {key: 'st_noData'};
        theLocale = this._setLocale();
    }

    _setLocale () {
        const locale = formatMessage.setup().locale;
        return locale === 'zh-tw' ? 'zh-tw' : 'en';
    }

    _t (key) {
        const m = msg[key];
        return m ? (m[theLocale] || m.en) : key;
    }

    _fmt (key, params) {
        let s = this._t(key);
        Object.keys(params || {}).forEach(k => {
            s = s.split(`{${k}}`).join(params[k]);
        });
        return s;
    }

    _setStatus (key, params) {
        this._status = {key, params: params || {}};
    }

    _window () {
        return this._deps.win || (typeof window === 'undefined' ? null : window);
    }

    _document () {
        return this._deps.doc || (typeof document === 'undefined' ? null : document);
    }

    getInfo () {
        theLocale = this._setLocale();
        const s = k => this._t(k);
        return {
            id: 'decisionTree',
            name: s('title'),
            color1: '#7B3FD9',
            color2: '#6230B8',
            color3: '#4E2696',
            menuIconURI,
            blockIconURI,
            blocks: [
                {opcode: 'useSample', blockType: BlockType.COMMAND, text: s('useSample')},
                {
                    opcode: 'setData', blockType: BlockType.COMMAND, text: s('setData'),
                    arguments: {DATA: {type: ArgumentType.STRING, defaultValue: s('defData')}}
                },
                {
                    opcode: 'setTarget', blockType: BlockType.COMMAND, text: s('setTarget'),
                    arguments: {COL: {type: ArgumentType.STRING, defaultValue: s('defTarget')}}
                },
                {
                    opcode: 'setFeatures', blockType: BlockType.COMMAND, text: s('setFeatures'),
                    arguments: {COLS: {type: ArgumentType.STRING, defaultValue: s('defFeatures')}}
                },
                {opcode: 'getColumns', blockType: BlockType.REPORTER, text: s('columns')},
                {opcode: 'getRowCount', blockType: BlockType.REPORTER, text: s('rowCount')},
                '---',
                {
                    opcode: 'setTrainPercent', blockType: BlockType.COMMAND, text: s('setTrainPercent'),
                    arguments: {P: {type: ArgumentType.NUMBER, defaultValue: 70}}
                },
                {
                    opcode: 'setMaxDepth', blockType: BlockType.COMMAND, text: s('setMaxDepth'),
                    arguments: {D: {type: ArgumentType.NUMBER, defaultValue: 5}}
                },
                {opcode: 'train', blockType: BlockType.COMMAND, text: s('train')},
                {opcode: 'getStatus', blockType: BlockType.REPORTER, text: s('status')},
                {opcode: 'getAccuracy', blockType: BlockType.REPORTER, text: s('accuracy')},
                {
                    opcode: 'getTreeInfo', blockType: BlockType.REPORTER, text: s('info'),
                    arguments: {PROP: {type: ArgumentType.STRING, menu: 'prop', defaultValue: 'depth'}}
                },
                {opcode: 'getRules', blockType: BlockType.REPORTER, text: s('rules')},
                '---',
                {opcode: 'showTree', blockType: BlockType.COMMAND, text: s('showTree')},
                {opcode: 'closeTree', blockType: BlockType.COMMAND, text: s('closeTree')},
                '---',
                {
                    opcode: 'setInput', blockType: BlockType.COMMAND, text: s('setInput'),
                    arguments: {
                        COL: {type: ArgumentType.STRING, defaultValue: s('defCol')},
                        VAL: {type: ArgumentType.STRING, defaultValue: s('defVal')}
                    }
                },
                {opcode: 'clearInput', blockType: BlockType.COMMAND, text: s('clearInput')},
                {opcode: 'predict', blockType: BlockType.REPORTER, text: s('predict')},
                {
                    opcode: 'predictText', blockType: BlockType.REPORTER, text: s('predictText'),
                    arguments: {TEXT: {type: ArgumentType.STRING, defaultValue: s('defText')}}
                },
                {opcode: 'getConfidence', blockType: BlockType.REPORTER, text: s('confidence')},
                {opcode: 'getPath', blockType: BlockType.REPORTER, text: s('path')}
            ],
            menus: {
                prop: {
                    acceptReporters: false,
                    items: ['depth', 'leaves', 'nTrain', 'nTest', 'features', 'target']
                        .map(v => ({text: s(`prop_${v}`), value: v}))
                }
            }
        };
    }

    /* ---------- 資料 ---------- */

    _loadData (input) {
        const r = core.parseData(input);
        this._model = null;
        this._last = null;
        if (r.error) {
            this._data = null;
            const key = {empty: 'st_dataEmpty', format: 'st_dataFormat', noRows: 'st_dataNoRows'}[r.error];
            this._setStatus(key || 'st_dataFormat');
            return false;
        }
        this._data = r;
        this._setStatus('st_dataReady', {rows: r.rows.length, cols: r.columns.length});
        return true;
    }

    useSample () {
        const sample = samples.tennis(theLocale);
        this._loadData(sample.rows);
        this._target = sample.target;
        this._features = null;
    }

    setData (args) {
        this._loadData(args.DATA);
    }

    setTarget (args) {
        this._target = String(args.COL).trim();
        this._model = null;
    }

    setFeatures (args) {
        this._features = core.isAllKeyword(args.COLS) ? null : core.splitList(args.COLS);
        this._model = null;
    }

    getColumns () {
        return this._data ? this._data.columns.join(', ') : '';
    }

    getRowCount () {
        return this._data ? this._data.rows.length : 0;
    }

    /* ---------- 訓練 ---------- */

    setTrainPercent (args) {
        const p = Number(args.P);
        if (isFinite(p)) this._trainPercent = Math.max(1, Math.min(100, p));
    }

    setMaxDepth (args) {
        const d = Math.round(Number(args.D));
        if (isFinite(d)) this._maxDepth = Math.max(1, Math.min(20, d));
    }

    train () {
        this._model = null;
        this._last = null;
        if (!this._data) {
            this._setStatus('st_noData');
            return;
        }
        const cols = this._data.columns;
        const target = this._target || cols[cols.length - 1];
        if (cols.indexOf(target) < 0) {
            this._setStatus('st_badTarget', {col: target, cols: cols.join(', ')});
            return;
        }
        let features = cols.filter(c => c !== target);
        if (this._features) {
            const missing = this._features.filter(f => cols.indexOf(f) < 0);
            if (missing.length) {
                this._setStatus('st_badFeatures', {missing: missing.join(', '), cols: cols.join(', ')});
                return;
            }
            features = this._features.filter(f => f !== target);
        }
        const m = core.train(this._data.rows, {
            target, features, maxDepth: this._maxDepth, trainPercent: this._trainPercent
        });
        if (m.error) {
            if (m.error === 'tooFewRows') this._setStatus('st_tooFewRows', {col: target});
            else this._setStatus('st_noFeatures');
            return;
        }
        this._model = m;
        this._setStatus(m.nTest ? 'st_trained' : 'st_trainedNoTest', {
            nTrain: m.nTrain, nTest: m.nTest, acc: round1(m.accuracy)
        });
        if (this._isShowing()) this._render();
    }

    getStatus () {
        let text = this._fmt(this._status.key, this._status.params);
        if (this._model && this._model.skipped.length &&
            (this._status.key === 'st_trained' || this._status.key === 'st_trainedNoTest')) {
            const list = this._model.skipped.map(sk =>
                this._fmt(sk.reason === 'unique' ? 'skip_unique' : 'skip_constant', {col: sk.feature}));
            text += this._fmt('st_skipped', {list: list.join('、')});
        }
        return text;
    }

    getAccuracy () {
        return this._model ? round1(this._model.accuracy) : '';
    }

    getTreeInfo (args) {
        const m = this._model;
        if (!m) return '';
        switch (args.PROP) {
        case 'depth': return m.depth;
        case 'leaves': return m.leaves;
        case 'nTrain': return m.nTrain;
        case 'nTest': return m.nTest;
        case 'features': return m.usedFeatures.join(', ');
        case 'target': return m.target;
        default: return '';
        }
    }

    getRules () {
        if (!this._model) return '';
        return core.rulesText(this._model, {
            if: this._t('rule_if'), and: this._t('rule_and'), then: this._t('rule_then'),
            always: this._t('rule_always'), rows: this._t('rule_rows')
        });
    }

    /* ---------- 顯示 ---------- */

    _html () {
        return view.buildHtml(this._model, {locale: theLocale, highlight: this._last});
    }

    _key () {
        return this._last ? this._last.nodeIds.join('-') + (this._last.unknown ? '?' : '') : '';
    }

    _overlay () {
        const doc = this._document();
        return doc ? doc.getElementById(OVERLAY_ID) : null;
    }

    _isShowing () {
        return !!((this._win && !this._win.closed) || this._overlay());
    }

    showTree () {
        if (!this._model) {
            this._setStatus('st_noTree');
            return;
        }
        const win = this._window();
        let w = this._win && !this._win.closed ? this._win : null;
        if (!w && win && win.open) {
            const sw = (win.screen && win.screen.availWidth) || 1280;
            const sh = (win.screen && win.screen.availHeight) || 800;
            const width = Math.round(Math.min(1200, sw * 0.7));
            const height = Math.round(Math.min(860, sh * 0.75));
            try {
                w = win.open('', WINDOW_NAME, `width=${width},height=${height},resizable=yes,scrollbars=no`);
            } catch (e) {
                w = null;
            }
        }
        if (w && w.document) {
            this._win = w;
            this._removeOverlay();
            this._writeWindow(w);
            if (w.focus) w.focus();
            return;
        }
        this._win = null;
        this._showOverlay();
        this._setStatus('st_popup');
    }

    _writeWindow (w) {
        w.document.open();
        w.document.write(this._html());
        w.document.close();
        this._shownKey = this._key();
    }

    /** 重新畫目前開著的視窗（訓練或預測後） */
    _render () {
        if (!this._model) return;
        if (this._win && !this._win.closed) {
            this._writeWindow(this._win);
        } else if (this._overlay()) {
            this._showOverlay();
        }
    }

    _showOverlay () {
        const doc = this._document();
        if (!doc || !doc.body) return;
        let ov = this._overlay();
        if (!ov) {
            ov = doc.createElement('div');
            ov.id = OVERLAY_ID;
            ov.style.cssText = 'position:fixed;inset:0;z-index:5000;background:rgba(30,15,85,.45);' +
                'display:flex;align-items:center;justify-content:center;';
            const panel = doc.createElement('div');
            panel.style.cssText = 'width:88vw;height:84vh;background:#fff;border-radius:12px;overflow:hidden;' +
                'display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.35);';
            const bar = doc.createElement('div');
            bar.style.cssText = 'display:flex;justify-content:flex-end;padding:4px 8px;background:#2E1A78;';
            const btn = doc.createElement('button');
            btn.textContent = `✕ ${theLocale === 'zh-tw' ? '關閉' : 'Close'}`;
            btn.style.cssText = 'border:0;border-radius:14px;padding:4px 12px;cursor:pointer;' +
                'background:rgba(255,255,255,.2);color:#fff;font-size:13px;';
            btn.onclick = () => this._removeOverlay();
            bar.appendChild(btn);
            const frame = doc.createElement('iframe');
            frame.style.cssText = 'flex:1;border:0;width:100%;';
            panel.appendChild(bar);
            panel.appendChild(frame);
            ov.appendChild(panel);
            ov.onclick = e => {
                if (e.target === ov) this._removeOverlay();
            };
            doc.body.appendChild(ov);
        }
        ov.querySelector('iframe').srcdoc = this._html();
        this._shownKey = this._key();
    }

    _removeOverlay () {
        const ov = this._overlay();
        if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    }

    closeTree () {
        if (this._win && !this._win.closed) this._win.close();
        this._win = null;
        this._removeOverlay();
    }

    /* ---------- 預測 ---------- */

    setInput (args) {
        const col = String(args.COL).trim();
        if (col) this._input[col] = String(args.VAL).trim();
    }

    clearInput () {
        this._input = {};
    }

    _predict (input) {
        if (!this._model) {
            this._setStatus('st_noTree');
            this._last = null;
            return '';
        }
        const r = core.predict(this._model, input);
        this._last = r;
        const okKey = this._model.nTest ? 'st_trained' : 'st_trainedNoTest';
        const okParams = {nTrain: this._model.nTrain, nTest: this._model.nTest, acc: round1(this._model.accuracy)};
        if (r.unknown) {
            this._setStatus('st_unknownValue', {col: r.unknown.feature, val: r.unknown.value});
        } else if (r.missing.length) {
            this._setStatus('st_missing', {list: r.missing.join(', ')});
        } else {
            this._setStatus(okKey, okParams);
        }
        // 視窗開著時，把預測路徑畫上去（路徑沒變就不重畫）
        if (this._isShowing() && this._key() !== this._shownKey) this._render();
        return r.prediction;
    }

    predict () {
        return this._predict(this._input);
    }

    predictText (args) {
        return this._predict(core.parseInputText(args.TEXT));
    }

    getConfidence () {
        return this._last ? round1(this._last.confidence) : '';
    }

    getPath () {
        const r = this._last;
        if (!r) return '';
        const parts = r.path.map(p => (p.op === '=' ? `${p.feature} = ${p.label}` : `${p.feature} ${p.label}`));
        if (r.unknown) parts.push(`${r.unknown.feature} = ${r.unknown.value} ${this._t('unknownMark')}`);
        parts.push(`${this._model ? this._model.target : ''} = ${r.prediction}`);
        return parts.join(' → ');
    }
}

module.exports = Scratch3DecisionTree;
