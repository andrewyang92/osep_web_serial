// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 決策樹插件
 *
 * - 資料：Google 試算表插件「讀取的 Google 資料」產生的 JSON（[{欄位: 值}, ...]）
 *   文字和數字都接受，值保留原樣（2026-11-27 起不再統一成 是 / 否）
 * - 訓練功能暫時關閉（TRAINING_ENABLED = false）：讀入資料後自動用全部資料建樹，可以看圖和預測；
 *   訓練設定、正確率的積木隱藏（opcode 保留，舊專案仍可載入）
 * - 「[欄位] 為 [值]」的值格子：value-field.js（文字欄位有下拉選單、數字欄位直接打字）
 * - 訓練：dt-core.js（C4.5 風格，文字欄位多分支、數字欄位自動找門檻）
 * - 分層順序：預設由演算法挑；「決策樹分層順序設為」可自己指定每一層問哪個欄位
 * - 機率：「在 [條件] 的情況下，答案為「是」的機率」直接從資料計算（和樹無關）
 * - 欄位下拉選單（columnMenu）：列出目前資料的欄位（不含答案欄）；還沒讀資料時列範例資料的欄位。
 *   讀入資料後呼叫 runtime.requestToolboxExtensionsUpdate()，讓積木區的預設值換成新資料的欄位
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
const valueField = require('./value-field');

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

// 訓練功能暫時關閉（讀入資料就自動建樹、可看圖）；改成 true 就恢復訓練、預測的積木
const TRAINING_ENABLED = false;

const WINDOW_NAME = 'osepDecisionTree';
const OVERLAY_ID = 'osep-decision-tree-overlay';

let theLocale = 'en';

const round1 = x => Math.round(x * 1000) / 10;

class Scratch3DecisionTree {
    /**
     * @param {Runtime} runtime
     * @param {object} [deps] 測試用：{win: 取代 window, doc: 取代 document, trainingEnabled: 覆寫 TRAINING_ENABLED}
     */
    constructor (runtime, deps = {}) {
        this.runtime = runtime;
        this._deps = deps;
        this._trainingEnabled = typeof deps.trainingEnabled === 'boolean' ? deps.trainingEnabled : TRAINING_ENABLED;

        this._data = null; // {rows, columns}
        this._target = '';
        this._targetFromSample = false; // _target 是「使用範例資料」設的
        this._features = null; // null = 全部
        this._trainPercent = 70;
        this._maxDepth = 5;
        this._order = null; // 自訂分層順序；null = 演算法自動挑
        this._model = null;

        this._input = {};
        this._last = null; // 最後一次預測
        this._shownKey = null; // 視窗目前顯示的內容（避免重複刷新）
        this._win = null;

        this._status = {key: 'st_noData'};
        theLocale = this._setLocale();
        this._useValueField = false;
        this._waitValueField();
    }

    /**
     * 「值」格子要等編輯器畫面出來才能註冊；還沒好時先用一般文字格，好了再更新積木區
     */
    _waitValueField () {
        const win = this._window();
        if (!win || typeof win.setTimeout !== 'function' || this._deps.noValueField) return;
        let tries = 0;
        const check = () => {
            if (this._useValueField) return;
            if (valueField.setup(this, win)) {
                this._refreshToolbox();
                return;
            }
            if (++tries < 60) win.setTimeout(check, 500);
        };
        win.setTimeout(check, 500);
    }

    _refreshToolbox () {
        if (this.runtime && typeof this.runtime.requestToolboxExtensionsUpdate === 'function') {
            this.runtime.requestToolboxExtensionsUpdate();
        }
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
        if (!this._deps.noValueField) this._useValueField = valueField.setup(this, this._window());
        const info = {
            id: 'decisionTree',
            name: s('title'),
            color1: '#7B3FD9',
            color2: '#6230B8',
            color3: '#4E2696',
            menuIconURI,
            blockIconURI,
            blocks: this._blocks(s),
            menus: {
                columns: {acceptReporters: true, items: 'columnMenu'},
                answers: {acceptReporters: true, items: 'answerMenu'},
                layers: {acceptReporters: true, items: 'layerMenu'},
                // 舊版「[欄位] 為 [是/否]」的選單；保留，舊專案的積木才載入得了
                yesNo: {
                    acceptReporters: true,
                    items: [s('yes'), s('no')]
                },
                prop: {
                    acceptReporters: false,
                    items: ['depth', 'leaves', 'nTrain', 'nTest', 'features', 'target']
                        .map(v => ({text: s(`prop_${v}`), value: v}))
                }
            }
        };
        if (this._useValueField) {
            info.customFieldTypes = {
                [valueField.KEY]: {output: 'String', outputShape: 2, implementation: {}}
            };
        }
        return info;
    }

    /** 「值」格子的參數：編輯器裡用可打字＋下拉的格子，否則一般文字格 */
    _valueArg (defaultValue) {
        return {type: this._useValueField ? valueField.KEY : ArgumentType.STRING, defaultValue};
    }

    _blocks (s) {
        const data = [
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
            {opcode: 'getRowCount', blockType: BlockType.REPORTER, text: s('rowCount')}
        ];
        const status = {opcode: 'getStatus', blockType: BlockType.REPORTER, text: s('status')};
        const train = [
            {
                opcode: 'setTrainPercent', blockType: BlockType.COMMAND, text: s('setTrainPercent'),
                arguments: {P: {type: ArgumentType.NUMBER, defaultValue: 70}}
            },
            {
                opcode: 'setMaxDepth', blockType: BlockType.COMMAND, text: s('setMaxDepth'),
                arguments: {D: {type: ArgumentType.NUMBER, defaultValue: 5}}
            },
            {opcode: 'train', blockType: BlockType.COMMAND, text: s('train')},
            status,
            {opcode: 'getAccuracy', blockType: BlockType.REPORTER, text: s('accuracy')},
            {
                opcode: 'getTreeInfo', blockType: BlockType.REPORTER, text: s('info'),
                arguments: {PROP: {type: ArgumentType.STRING, menu: 'prop', defaultValue: 'depth'}}
            },
            {opcode: 'getRules', blockType: BlockType.REPORTER, text: s('rules')}
        ];
        const firstCol = this._featureColumns()[0] || '';
        const firstVal = this.valueOptions(firstCol)[0] || '';
        const order = [
            {
                opcode: 'setLayer', blockType: BlockType.COMMAND, text: s('setLayer'),
                arguments: {
                    LAYER: {type: ArgumentType.STRING, menu: 'layers', defaultValue: '1'},
                    COL: {type: ArgumentType.STRING, menu: 'columns', defaultValue: firstCol}
                }
            },
            {
                opcode: 'setLayerOrder', blockType: BlockType.COMMAND, text: s('setLayerOrder'),
                arguments: {COLS: {type: ArgumentType.STRING, defaultValue: s('defOrder')}}
            },
            {opcode: 'useAutoOrder', blockType: BlockType.COMMAND, text: s('useAutoOrder')}
        ];
        const prob = [
            {
                opcode: 'condition', blockType: BlockType.REPORTER, text: s('condition'),
                arguments: {
                    COL: {type: ArgumentType.STRING, menu: 'columns', defaultValue: firstCol},
                    YN: this._valueArg(firstVal)
                }
            },
            {
                opcode: 'condAnd', blockType: BlockType.REPORTER, text: s('condAnd'),
                // 預設值空字串時 Scratch 會顯示「undefined」，所以用一個空格（condAnd 會去掉空白）
                arguments: {A: {type: ArgumentType.STRING, defaultValue: ' '}, B: {type: ArgumentType.STRING, defaultValue: ' '}}
            },
            {
                opcode: 'probability', blockType: BlockType.REPORTER, text: s('probability'),
                arguments: {
                    COND: {type: ArgumentType.STRING, defaultValue: s('defCond')},
                    ANS: {type: ArgumentType.STRING, menu: 'answers', defaultValue: this._defaultAnswer()}
                }
            }
        ];
        const show = [
            {opcode: 'showTree', blockType: BlockType.COMMAND, text: s('showTree')},
            {opcode: 'closeTree', blockType: BlockType.COMMAND, text: s('closeTree')}
        ];
        const predict = [
            {
                opcode: 'setInput', blockType: BlockType.COMMAND, text: s('setInput'),
                arguments: {
                    COL: {type: ArgumentType.STRING, menu: 'columns', defaultValue: firstCol},
                    VAL: this._valueArg(firstVal)
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
        ];
        // 問問題：條件積木、用條件預測、信心、路徑、機率；一欄一欄設定的預測放最後
        const byOp = (list, op) => list.filter(b => b.opcode === op)[0];
        const ask = [byOp(prob, 'condition'), byOp(prob, 'condAnd'), byOp(predict, 'predictText'),
            byOp(predict, 'getConfidence'), byOp(predict, 'getPath'), byOp(prob, 'probability')];
        const oneByOne = ['setInput', 'clearInput', 'predict'].map(op => byOp(predict, op));
        if (this._trainingEnabled) {
            return data.concat(['---'], train, order, ['---'], show, ['---'], ask, ['---'], oneByOne);
        }
        // 訓練關閉（用全部資料建樹）：訓練設定、正確率、規則等積木隱藏（opcode 不變，舊專案仍可載入）
        const hide = b => Object.assign({}, b, {hideFromPalette: true});
        const hidden = ['setTarget', 'setFeatures'];
        return data.map(b => (hidden.indexOf(b.opcode) >= 0 ? hide(b) : b))
            .concat([status], ['---'], order, ['---'], show, ['---'], ask, ['---'], oneByOne,
                train.filter(b => b !== status).map(hide));
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
        this._input = {};
        this._autoBuild();
        // 下拉選單的預設值換成新資料的欄位；畫面上的值格子重畫
        this._refreshToolbox();
        valueField.refresh(this._window());
        return true;
    }

    /** 目前的資料；還沒讀資料時用範例資料（給下拉選單用） */
    _menuData () {
        if (this._data) {
            const cols = this._data.columns;
            return {rows: this._data.rows, columns: cols, target: this._target || cols[cols.length - 1]};
        }
        const sample = samples.tennis(theLocale);
        return {rows: sample.rows, columns: Object.keys(sample.rows[0]), target: sample.target};
    }

    _isNumberColumn (rows, col) {
        return core.columnIsNumeric(rows, col);
    }

    /** 「值」格子的下拉選項：文字欄位列出出現過的值；數字欄位、找不到的欄位回傳 [] */
    valueOptions (col) {
        const d = this._menuData();
        if (d.columns.indexOf(col) < 0 || this._isNumberColumn(d.rows, col)) return [];
        return core.distinctValues(d.rows, col);
    }

    /** 答案欄出現過的答案 */
    answerMenu () {
        const d = this._menuData();
        const list = core.distinctValues(d.rows, d.target);
        return list.length ? list : [''];
    }

    _defaultAnswer () {
        const list = this.answerMenu();
        return list.indexOf(this._t('yes')) >= 0 ? this._t('yes') : list[0];
    }

    /** 可以用來判斷的欄位（不含答案欄）；還沒讀資料時用範例資料的欄位 */
    _featureColumns () {
        const d = this._menuData();
        return d.columns.filter(c => c !== d.target);
    }

    columnMenu () {
        return this._featureColumns();
    }

    layerMenu () {
        const n = Math.max(5, this._featureColumns().length);
        const list = [];
        for (let i = 1; i <= n; i++) list.push(String(i));
        return list;
    }

    /** 資料或分層順序改變後：訓練關閉時直接用全部資料建樹，給「在新視窗顯示決策樹」用 */
    _autoBuild () {
        const d = this._data;
        if (this._trainingEnabled) {
            this._model = null;
            this._setStatus('st_dataReady', {rows: d.rows.length, cols: d.columns.length});
        } else if (this._build(100)) {
            if (this._order) {
                this._setStatus('st_orderTree', {rows: d.rows.length, order: this._order.join(' → ')});
            } else {
                this._setStatus('st_dataReadyTree', {rows: d.rows.length, cols: d.columns.length});
            }
        }
    }

    useSample () {
        const sample = samples.tennis(theLocale);
        this._target = sample.target;
        this._targetFromSample = true;
        this._features = null;
        this._loadData(sample.rows);
    }

    setData (args) {
        // 範例資料設定的答案欄不沿用到自己的資料（改用最後一欄）
        if (this._targetFromSample) {
            this._target = '';
            this._targetFromSample = false;
        }
        this._loadData(args.DATA);
    }

    setTarget (args) {
        this._target = String(args.COL).trim();
        this._targetFromSample = false;
        this._model = null;
    }

    setFeatures (args) {
        this._features = core.isAllKeyword(args.COLS) ? null : core.splitList(args.COLS);
        this._model = null;
    }

    /* ---------- 分層順序 ---------- */

    setLayerOrder (args) {
        if (core.isAllKeyword(args.COLS)) {
            this._order = null;
        } else {
            const list = [];
            core.splitList(args.COLS).forEach(c => {
                if (list.indexOf(c) < 0) list.push(c);
            });
            this._order = list;
        }
        if (this._data) this._autoBuild();
    }

    setLayer (args) {
        const n = Math.round(Number(args.LAYER));
        const col = String(args.COL).trim();
        if (!isFinite(n) || n < 1 || n > 20 || !col) return;
        const order = this._order ? this._order.slice() : [];
        order[n - 1] = col;
        this._order = order;
        if (this._data) this._autoBuild();
    }

    useAutoOrder () {
        this._order = null;
        if (this._data) this._autoBuild();
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

    /** 沒有決策樹時設定狀態 */
    _noTree () {
        if (this._trainingEnabled) this._setStatus('st_noTree');
        // 訓練關閉：沒資料就請先設定資料；有資料卻沒樹時，保留建樹失敗的原因
        else if (!this._data) this._setStatus('st_noData');
    }

    train () {
        if (!this._trainingEnabled) {
            this._setStatus('st_trainingOff');
            return;
        }
        this._build(this._trainPercent);
    }

    /** 建樹；成功時回傳 true 並設定狀態（訓練關閉時由 _loadData 改寫狀態） */
    _build (trainPercent) {
        this._model = null;
        this._last = null;
        if (!this._data) {
            this._setStatus('st_noData');
            return false;
        }
        const cols = this._data.columns;
        const target = this._target || cols[cols.length - 1];
        if (cols.indexOf(target) < 0) {
            this._setStatus('st_badTarget', {col: target, cols: cols.join(', ')});
            return false;
        }
        let features = cols.filter(c => c !== target);
        if (this._features) {
            const missing = this._features.filter(f => cols.indexOf(f) < 0);
            if (missing.length) {
                this._setStatus('st_badFeatures', {missing: missing.join(', '), cols: cols.join(', ')});
                return false;
            }
            features = this._features.filter(f => f !== target);
        }
        if (this._order) {
            for (let i = 0; i < this._order.length; i++) {
                if (!this._order[i]) {
                    this._setStatus('st_orderGap', {n: i + 1});
                    return false;
                }
                if (this._order.indexOf(this._order[i]) !== i) {
                    this._setStatus('st_orderDup', {col: this._order[i]});
                    return false;
                }
            }
            const missing = this._order.filter(f => cols.indexOf(f) < 0);
            if (missing.length) {
                this._setStatus('st_badOrder', {missing: missing.join(', '), cols: cols.join(', ')});
                return false;
            }
            if (this._order.indexOf(target) >= 0) {
                this._setStatus('st_orderHasTarget', {col: target});
                return false;
            }
        }
        const m = core.train(this._data.rows, {
            target, features, maxDepth: this._maxDepth, trainPercent, order: this._order,
            valueOrder: [this._t('yes'), this._t('no')] // 是 一律在左
        });
        if (m.error) {
            if (m.error === 'tooFewRows') this._setStatus('st_tooFewRows', {col: target});
            else this._setStatus('st_noFeatures');
            return false;
        }
        this._model = m;
        this._setStatus(m.nTest ? 'st_trained' : 'st_trainedNoTest', {
            nTrain: m.nTrain, nTest: m.nTest, acc: round1(m.accuracy)
        });
        if (this._isShowing()) this._render();
        return true;
    }

    getStatus () {
        let text = this._fmt(this._status.key, this._status.params);
        if (this._model && this._model.skipped.length &&
            ['st_trained', 'st_trainedNoTest', 'st_dataReadyTree'].indexOf(this._status.key) >= 0) {
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
            this._noTree();
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
            this._noTree();
            this._last = null;
            return '';
        }
        const r = core.predict(this._model, input);
        this._last = r;
        if (r.unknown) {
            this._setStatus('st_unknownValue', {col: r.unknown.feature, val: r.unknown.value});
        } else if (r.missing.length) {
            this._setStatus('st_missing', {list: r.missing.join(', ')});
        } else {
            this._setStatus('st_predicted',
                {target: this._model.target, pred: r.prediction, conf: round1(r.confidence)});
        }
        // 視窗開著時，把預測路徑畫上去（路徑沒變就不重畫）
        if (this._isShowing() && this._key() !== this._shownKey) this._render();
        return r.prediction;
    }

    predict () {
        return this._predict(this._input);
    }

    predictText (args) {
        const text = String(args.TEXT === null || typeof args.TEXT === 'undefined' ? '' : args.TEXT).trim();
        if (text[0] === '{' || !this._data) return this._predict(core.parseInputText(text));
        // 「天氣=晴, 溫度=70」：和機率積木一樣先檢查欄位和值
        const conds = this._parseCond(text);
        if (!conds) {
            this._last = null;
            return '';
        }
        const notEqual = conds.filter(c => c.op !== '=')[0];
        if (notEqual) {
            this._setStatus('st_predictOp', {col: notEqual.col});
            this._last = null;
            return '';
        }
        const input = {};
        conds.forEach(c => {
            input[c.col] = c.value;
        });
        return this._predict(input);
    }

    getConfidence () {
        return this._last ? round1(this._last.confidence) : '';
    }

    /* ---------- 機率 ---------- */

    /**
     * 「天氣=晴, 溫度>70」→ [{col, op, value}]；只寫欄位名稱代表「=是」
     * 文字欄位只能用 =，值要是這一欄出現過的；數字欄位可以用 = > < >= <=
     * @returns {object[]|null} 有錯時設定狀態並回傳 null
     */
    _parseCond (text) {
        const rows = this._data.rows;
        const cols = this._data.columns;
        const conds = [];
        const parts = core.splitList(text);
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].replace(/＞/g, '>').replace(/＜/g, '<').replace(/＝/g, '=');
            const m = part.match(/^(.+?)\s*(>=|<=|>|<|=|:|：)\s*(.*)$/);
            const col = (m ? m[1] : part).trim();
            let op = m ? m[2] : '=';
            if (op === ':' || op === '：') op = '=';
            const value = m ? m[3].trim() : this._t('yes');
            if (cols.indexOf(col) < 0) {
                this._setStatus('st_badCond', {col, cols: cols.join(', ')});
                return null;
            }
            if (this._isNumberColumn(rows, col)) {
                if (!core.isNumeric(value)) {
                    this._setStatus('st_condNotNumber', {col, val: value});
                    return null;
                }
            } else {
                if (op !== '=') {
                    this._setStatus('st_condOpText', {col});
                    return null;
                }
                const values = core.distinctValues(rows, col);
                if (values.indexOf(value) < 0) {
                    this._setStatus('st_condBadValue', {col, val: value, list: values.join('、')});
                    return null;
                }
            }
            conds.push({col, op, value});
        }
        return conds;
    }

    /** 「[天氣] 為 [晴]」→ 天氣=晴；數字欄位可以打「>70」→ 溫度>70。可以放進預測、機率積木 */
    condition (args) {
        const col = String(args.COL).trim();
        const val = String(args.YN === null || typeof args.YN === 'undefined' ? '' : args.YN).trim();
        if (!col) return '';
        return /^(>=|<=|>|<|=|＞|＜|＝)/.test(val) ? `${col}${val}` : `${col}=${val}`;
    }

    /** 「[A] 且 [B]」→ A, B（空的略過） */
    condAnd (args) {
        return [args.A, args.B].map(x => String(x === null || typeof x === 'undefined' ? '' : x).trim())
            .filter(Boolean)
            .join(', ');
    }

    probability (args) {
        if (!this._data) {
            this._setStatus('st_noData');
            return '';
        }
        const cols = this._data.columns;
        const target = this._target || cols[cols.length - 1];
        if (cols.indexOf(target) < 0) {
            this._setStatus('st_badTarget', {col: target, cols: cols.join(', ')});
            return '';
        }
        const answers = core.distinctValues(this._data.rows, target);
        let ans = typeof args.ANS === 'undefined' ? '' : String(args.ANS).trim();
        if (!ans) ans = answers.indexOf(this._t('yes')) >= 0 ? this._t('yes') : answers[0]; // 舊專案沒有這一格
        if (answers.indexOf(ans) < 0) {
            this._setStatus('st_badAnswer', {target, ans, list: answers.join('、')});
            return '';
        }
        const conds = this._parseCond(args.COND);
        if (!conds) return '';
        const r = core.probability(this._data.rows, conds, target, ans);
        const cond = conds.map(c => `${c.col}${c.op}${c.value}`)
            .join(theLocale === 'zh-tw' ? '、' : ', ');
        if (!r.n) {
            this._setStatus('st_probNone', {cond});
            return '';
        }
        const p = round1(r.p);
        this._setStatus(cond ? 'st_prob' : 'st_probAll', {cond, n: r.n, hit: r.hit, target, ans, p});
        return p;
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
