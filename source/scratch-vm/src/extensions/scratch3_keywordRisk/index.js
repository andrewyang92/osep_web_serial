// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 關鍵字風險偵測插件（keywordRisk）
 *
 * 用「訊息是否包含某類關鍵字」當特徵（F1、F2…，0 / 1），從已標記的訓練訊息算出每個特徵的風險值，
 * 再用新訊息符合的特徵風險值平均當風險分數，≥ 門檻就判斷為有風險（例：疑似詐騙）。
 * 內建範例是貓咪盃「智慧防詐訊息偵測員」題目的設定（samples.js）。
 *
 * - 計算：risk-core.js（純計算，可在 Node 測）
 * - 風險值表：risk-view.js 產生 HTML，用 window.open 在新視窗顯示；被擋住時改在本頁浮動視窗顯示
 * - 特徵、訓練資料改變時風險值自動重算（「計算風險值」積木只是明確地算一次並更新狀態）
 *
 * 重要：不可使用 async/await（專案 babel 會產生需要 regeneratorRuntime 的程式，GUI 沒有載入它）。
 * 本插件全部是同步運算，不連網路。
 */
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const msg = require('./translation');
const core = require('./risk-core');
const view = require('./risk-view');
const samples = require('./samples');

// 原創圖示：紫底、白色簡訊對話框、黃色驚嘆號
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
    '<circle cx="20" cy="20" r="19" fill="#6230B8"/>' +
    '<path d="M9 11 h22 a3 3 0 0 1 3 3 v11 a3 3 0 0 1 -3 3 h-13 l-6 5 v-5 h-3 a3 3 0 0 1 -3 -3 v-11 ' +
    'a3 3 0 0 1 3 -3 z" fill="#FFFFFF"/>' +
    '<rect x="11" y="15" width="11" height="2.4" rx="1.2" fill="#C9A2FF"/>' +
    '<rect x="11" y="20" width="8" height="2.4" rx="1.2" fill="#C9A2FF"/>' +
    '<circle cx="28" cy="19.5" r="5.5" fill="#FFBD00"/>' +
    '<rect x="27" y="15.5" width="2" height="5" rx="1" fill="#6B3A1E"/>' +
    '<circle cx="28" cy="22.6" r="1.1" fill="#6B3A1E"/>' +
    '</svg>';
const menuIconURI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSvg)}`;
const blockIconURI = menuIconURI;

const WINDOW_NAME = 'osepKeywordRisk';
const OVERLAY_ID = 'osep-keyword-risk-overlay';
const DEFAULT_IDS = ['F1', 'F2', 'F3', 'F4'];

let theLocale = 'en';

class Scratch3KeywordRisk {
    /**
     * @param {Runtime} runtime
     * @param {object} [deps] 測試用：{win: 取代 window, doc: 取代 document}
     */
    constructor (runtime, deps = {}) {
        this.runtime = runtime;
        this._deps = deps;
        theLocale = this._setLocale();
        this._features = [];
        this._data = [];
        this._riskLabel = this._t('defRisk');
        this._safeLabel = this._t('defSafe');
        this._threshold = 0.5;
        this._stats = null; // 風險值快取；null = 要重算
        this._last = null; // 最後判斷的訊息
        this._win = null;
        this._status = {key: 'st_ready'};
    }

    _setLocale () {
        const locale = formatMessage.setup().locale;
        return locale === 'zh-tw' ? 'zh-tw' : 'en';
    }

    /** 文字（{risk}、{safe} 換成目前的標記名稱） */
    _t (key) {
        const m = msg[key];
        const s = m ? (m[theLocale] || m.en) : key;
        return s.split('{risk}').join(this._riskLabel === undefined ? '' : this._riskLabel)
            .split('{safe}').join(this._safeLabel === undefined ? '' : this._safeLabel);
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

    _refreshToolbox () {
        if (this.runtime && typeof this.runtime.requestToolboxExtensionsUpdate === 'function') {
            this.runtime.requestToolboxExtensionsUpdate();
        }
    }

    getInfo () {
        theLocale = this._setLocale();
        const s = k => this._t(k);
        const text = {type: ArgumentType.STRING, defaultValue: s('defText')};
        const feat = {type: ArgumentType.STRING, menu: 'features', defaultValue: this._firstId()};
        const setup = [
            {opcode: 'loadSample', blockType: BlockType.COMMAND, text: s('loadSample')},
            {opcode: 'clearFeatures', blockType: BlockType.COMMAND, text: s('clearFeatures')},
            {
                opcode: 'setFeature', blockType: BlockType.COMMAND, text: s('setFeature'),
                arguments: {
                    FEAT: feat,
                    NAME: {type: ArgumentType.STRING, defaultValue: s('defName')},
                    KEYWORDS: {type: ArgumentType.STRING, defaultValue: s('defKeywords')}
                }
            },
            {
                opcode: 'setReminder', blockType: BlockType.COMMAND, text: s('setReminder'),
                arguments: {FEAT: feat, TEXT: {type: ArgumentType.STRING, defaultValue: s('defReminder')}}
            },
            {
                opcode: 'setLabels', blockType: BlockType.COMMAND, text: s('setLabels'),
                arguments: {
                    RISK: {type: ArgumentType.STRING, defaultValue: this._riskLabel},
                    SAFE: {type: ArgumentType.STRING, defaultValue: this._safeLabel}
                }
            },
            {
                opcode: 'setThreshold', blockType: BlockType.COMMAND, text: s('setThreshold'),
                arguments: {T: {type: ArgumentType.NUMBER, defaultValue: 0.5}}
            }
        ];
        const data = [
            {opcode: 'clearData', blockType: BlockType.COMMAND, text: s('clearData')},
            {
                opcode: 'addMessage', blockType: BlockType.COMMAND, text: s('addMessage'),
                arguments: {
                    TEXT: text,
                    LABEL: {type: ArgumentType.STRING, menu: 'labels', defaultValue: this._riskLabel}
                }
            },
            {
                opcode: 'loadFromLists', blockType: BlockType.COMMAND, text: s('loadFromLists'),
                arguments: {
                    TEXTS: {type: ArgumentType.STRING, menu: 'lists', defaultValue: s('textsList')},
                    LABELS: {type: ArgumentType.STRING, menu: 'lists', defaultValue: s('labelsList')}
                }
            },
            {opcode: 'train', blockType: BlockType.COMMAND, text: s('train')},
            {opcode: 'dataCount', blockType: BlockType.REPORTER, text: s('dataCount')},
            {
                opcode: 'dataProp', blockType: BlockType.REPORTER, text: s('dataProp'),
                arguments: {
                    N: {type: ArgumentType.NUMBER, defaultValue: 1},
                    PROP: {type: ArgumentType.STRING, menu: 'dataProps', defaultValue: 'text'}
                }
            },
            {opcode: 'riskValue', blockType: BlockType.REPORTER, text: s('riskValue'), arguments: {FEAT: feat}},
            {
                opcode: 'featureInfo', blockType: BlockType.REPORTER, text: s('featureInfo'),
                arguments: {FEAT: feat, INFO: {type: ArgumentType.STRING, menu: 'infos', defaultValue: 'hit'}}
            }
        ];
        const judge = [
            {opcode: 'verdict', blockType: BlockType.REPORTER, text: s('verdict'), arguments: {TEXT: text}},
            {opcode: 'isRisky', blockType: BlockType.BOOLEAN, text: s('isRisky'), arguments: {TEXT: text}},
            {opcode: 'riskScore', blockType: BlockType.REPORTER, text: s('riskScore'), arguments: {TEXT: text}},
            {
                opcode: 'matchedFeatures', blockType: BlockType.REPORTER, text: s('matchedFeatures'),
                arguments: {TEXT: text}
            },
            {opcode: 'reminders', blockType: BlockType.REPORTER, text: s('reminders'), arguments: {TEXT: text}}
        ];
        const tools = [
            {
                opcode: 'featureOf', blockType: BlockType.REPORTER, text: s('featureOf'),
                arguments: {TEXT: text, FEAT: feat}
            },
            {
                opcode: 'keywordsFound', blockType: BlockType.REPORTER, text: s('keywordsFound'),
                arguments: {TEXT: text, FEAT: feat}
            },
            {
                opcode: 'containsAny', blockType: BlockType.BOOLEAN, text: s('containsAny'),
                arguments: {TEXT: text, KEYWORDS: {type: ArgumentType.STRING, defaultValue: s('defKeywords')}}
            }
        ];
        const show = [
            {opcode: 'showTable', blockType: BlockType.COMMAND, text: s('showTable')},
            {opcode: 'closeTable', blockType: BlockType.COMMAND, text: s('closeTable')},
            {opcode: 'getStatus', blockType: BlockType.REPORTER, text: s('status')}
        ];
        return {
            id: 'keywordRisk',
            name: s('title'),
            color1: '#7B3FD9',
            color2: '#6230B8',
            color3: '#4E2696',
            menuIconURI,
            blockIconURI,
            blocks: setup.concat(['---'], data, ['---'], judge, ['---'], tools, ['---'], show),
            menus: {
                features: {acceptReporters: true, items: 'featureMenu'},
                labels: {acceptReporters: true, items: 'labelMenu'},
                lists: {acceptReporters: true, items: 'listMenu'},
                dataProps: {acceptReporters: true, items: 'dataPropMenu'},
                infos: {
                    acceptReporters: false,
                    items: ['name', 'keywords', 'reminder', 'hit', 'risky']
                        .map(v => ({text: s(`info_${v}`), value: v}))
                }
            }
        };
    }

    /* ---------- 選單 ---------- */

    _firstId () {
        return this._features.length ? this._features[0].id : 'F1';
    }

    featureMenu () {
        return this._features.length ? this._features.map(f => f.id) : DEFAULT_IDS.slice();
    }

    labelMenu () {
        const items = [String(this._riskLabel), String(this._safeLabel)].filter(x => x);
        return items.length ? items : [' '];
    }

    dataPropMenu () {
        return [{text: this._t('prop_text'), value: 'text'}, {text: this._t('prop_label'), value: 'label'}]
            .concat(this.featureMenu().map(id => ({text: id, value: id})));
    }

    /** 角色自己的清單和舞台（所有角色共用）的清單 */
    listMenu () {
        const names = [];
        const add = target => {
            if (!target || typeof target.getAllVariableNamesInScopeByType !== 'function') return;
            target.getAllVariableNamesInScopeByType('list').forEach(n => {
                if (names.indexOf(n) < 0) names.push(n);
            });
        };
        const rt = this.runtime;
        if (rt) {
            if (typeof rt.getEditingTarget === 'function') add(rt.getEditingTarget());
            if (typeof rt.getTargetForStage === 'function') add(rt.getTargetForStage());
        }
        return names.length ? names : [this._t('noList')];
    }

    /* ---------- 內部 ---------- */

    _findFeature (id) {
        const key = core.norm(String(id === undefined || id === null ? '' : id).trim());
        return this._features.filter(f => core.norm(f.id) === key)[0] || null;
    }

    _changed () {
        this._stats = null;
        this._last = null;
        this._render();
    }

    _getStats () {
        if (!this._stats) this._stats = core.train(this._features, this._data, this._riskLabel);
        return this._stats;
    }

    _judge (text) {
        const t = String(text === undefined || text === null ? '' : text);
        const r = core.judge(t, this._features, this._getStats(), this._threshold);
        r.text = t;
        r.verdict = r.risky ? this._t('verdictRisk') : String(this._safeLabel);
        const same = this._last && this._last.text === t;
        this._last = r;
        if (!this._features.length) {
            this._setStatus('st_noFeature');
        } else {
            this._setStatus('st_judged', {verdict: r.verdict, score: core.round4(r.score)});
        }
        if (!same) this._render();
        return r;
    }

    /* ---------- 特徵設定 ---------- */

    loadSample () {
        const s = samples.scam();
        this._features = s.features;
        this._data = s.data;
        this._riskLabel = s.riskLabel;
        this._safeLabel = s.safeLabel;
        this._threshold = s.threshold;
        this._changed();
        this._setStatus('st_sample', {f: this._features.length, n: this._data.length});
        this._refreshToolbox();
    }

    clearFeatures () {
        this._features = [];
        this._changed();
        this._setStatus('st_noFeature');
        this._refreshToolbox();
    }

    setFeature (args) {
        const id = String(args.FEAT === undefined ? '' : args.FEAT).trim();
        if (!id) return;
        const keywords = core.parseKeywords(args.KEYWORDS);
        const name = String(args.NAME === undefined ? '' : args.NAME).trim();
        const f = this._findFeature(id);
        if (f) {
            f.name = name;
            f.keywords = keywords;
        } else {
            this._features.push({id, name, keywords, reminder: ''});
        }
        this._changed();
        this._setStatus('st_ready');
        if (!f) this._refreshToolbox();
    }

    setReminder (args) {
        const f = this._findFeature(args.FEAT);
        if (!f) return;
        f.reminder = String(args.TEXT === undefined ? '' : args.TEXT).trim();
        this._render();
    }

    setLabels (args) {
        const risk = String(args.RISK === undefined ? '' : args.RISK).trim();
        const safe = String(args.SAFE === undefined ? '' : args.SAFE).trim();
        if (risk) this._riskLabel = risk;
        if (safe) this._safeLabel = safe;
        this._changed();
        this._refreshToolbox();
    }

    setThreshold (args) {
        const t = Number(args.T);
        if (!isFinite(t)) return;
        this._threshold = Math.max(0, Math.min(1, t));
        this._last = null;
        this._render();
    }

    /* ---------- 訓練資料 ---------- */

    clearData () {
        this._data = [];
        this._changed();
        this._setStatus('st_noData');
    }

    addMessage (args) {
        const text = String(args.TEXT === undefined ? '' : args.TEXT);
        if (!text.trim()) return;
        this._data.push({text, label: String(args.LABEL === undefined ? '' : args.LABEL).trim()});
        this._changed();
    }

    _readList (util, name) {
        const n = String(name === undefined ? '' : name);
        const target = util && util.target;
        let v = null;
        if (target && typeof target.lookupVariableByNameAndType === 'function') {
            v = target.lookupVariableByNameAndType(n, 'list');
        }
        if (!v && this.runtime && typeof this.runtime.getTargetForStage === 'function') {
            const stage = this.runtime.getTargetForStage();
            if (stage && typeof stage.lookupVariableByNameAndType === 'function') {
                v = stage.lookupVariableByNameAndType(n, 'list');
            }
        }
        return v && Array.isArray(v.value) ? v.value : null;
    }

    loadFromLists (args, util) {
        const texts = this._readList(util, args.TEXTS);
        const labels = this._readList(util, args.LABELS);
        if (!texts || !labels) {
            this._setStatus('st_noList', {name: !texts ? args.TEXTS : args.LABELS});
            return;
        }
        const n = Math.min(texts.length, labels.length);
        const data = [];
        for (let i = 0; i < n; i++) {
            const text = String(texts[i]);
            if (text.trim()) data.push({text, label: String(labels[i]).trim()});
        }
        this._data = data;
        this._changed();
        this._setStatus('st_loaded', {n: data.length});
    }

    train () {
        this._stats = null;
        this._getStats();
        if (!this._features.length) this._setStatus('st_noFeature');
        else if (!this._data.length) this._setStatus('st_noData');
        else this._setStatus('st_trained', {n: this._data.length});
        this._render();
    }

    dataCount () {
        return this._data.length;
    }

    dataProp (args) {
        const i = Math.floor(Number(args.N)) - 1;
        const d = this._data[i];
        if (!d) return '';
        const prop = String(args.PROP);
        if (prop === 'text') return d.text;
        if (prop === 'label') return d.label;
        const f = this._findFeature(prop);
        if (!f) return '';
        return core.containsAny(d.text, f.keywords) ? 1 : 0;
    }

    riskValue (args) {
        const f = this._findFeature(args.FEAT);
        if (!f) return '';
        return core.round4(this._getStats()[f.id].value);
    }

    featureInfo (args) {
        const f = this._findFeature(args.FEAT);
        if (!f) return '';
        const info = String(args.INFO);
        if (info === 'name') return f.name;
        if (info === 'keywords') return f.keywords.join('、');
        if (info === 'reminder') return f.reminder;
        const s = this._getStats()[f.id];
        if (info === 'hit') return s.hit;
        if (info === 'risky') return s.risky;
        return '';
    }

    /* ---------- 判斷新訊息 ---------- */

    verdict (args) {
        if (!this._features.length) {
            this._setStatus('st_noFeature');
            return '';
        }
        return this._judge(args.TEXT).verdict;
    }

    isRisky (args) {
        if (!this._features.length) return false;
        return this._judge(args.TEXT).risky;
    }

    riskScore (args) {
        return core.round4(this._judge(args.TEXT).score);
    }

    matchedFeatures (args) {
        return this._judge(args.TEXT).matched.join('、');
    }

    /** 判斷為有風險時，列出符合的特徵的提醒；正常時是空的 */
    reminders (args) {
        const r = this._judge(args.TEXT);
        if (!r.risky) return '';
        return r.matched.map(id => this._findFeature(id))
            .filter(f => f && f.reminder)
            .map(f => f.reminder)
            .join(' ');
    }

    /* ---------- 工具 ---------- */

    featureOf (args) {
        const f = this._findFeature(args.FEAT);
        if (!f) return '';
        return core.containsAny(args.TEXT, f.keywords) ? 1 : 0;
    }

    keywordsFound (args) {
        const f = this._findFeature(args.FEAT);
        if (!f) return '';
        return core.foundKeywords(args.TEXT, f.keywords).join('、');
    }

    containsAny (args) {
        return core.containsAny(args.TEXT, core.parseKeywords(args.KEYWORDS));
    }

    getStatus () {
        return this._fmt(this._status.key, this._status.params);
    }

    /* ---------- 風險值表 ---------- */

    _html () {
        const stats = this._getStats();
        const rows = this._data.map(d => ({
            text: d.text,
            label: d.label,
            vector: core.featureVector(d.text, this._features),
            risky: core.sameLabel(d.label, this._riskLabel)
        }));
        return view.html({
            t: k => this._fmt(k, {t: this._threshold}),
            features: this._features,
            stats,
            rows,
            threshold: this._threshold,
            riskLabel: this._riskLabel,
            last: this._last
        });
    }

    _overlay () {
        const doc = this._document();
        return doc ? doc.getElementById(OVERLAY_ID) : null;
    }

    showTable () {
        const win = this._window();
        let w = this._win && !this._win.closed ? this._win : null;
        if (!w && win && win.open) {
            const sw = (win.screen && win.screen.availWidth) || 1280;
            const sh = (win.screen && win.screen.availHeight) || 800;
            const width = Math.round(Math.min(1100, sw * 0.7));
            const height = Math.round(Math.min(860, sh * 0.8));
            try {
                w = win.open('', WINDOW_NAME, `width=${width},height=${height},resizable=yes,scrollbars=yes`);
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
    }

    /** 視窗開著時重畫（資料、特徵改變或判斷新訊息後） */
    _render () {
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
            btn.textContent = `✕ ${this._t('close')}`;
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
    }

    _removeOverlay () {
        const ov = this._overlay();
        if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    }

    closeTable () {
        if (this._win && !this._win.closed) this._win.close();
        this._win = null;
        this._removeOverlay();
    }
}

module.exports = Scratch3KeywordRisk;
