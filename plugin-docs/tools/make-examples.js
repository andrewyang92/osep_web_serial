#!/usr/bin/env node
// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 把說明網站的「範例作品」轉成可以下載的 Scratch 專案檔（.sb3）。
 *
 * 用法（在 plugin-docs 資料夾執行）：
 *   node tools/make-examples.js            全部擴充功能
 *   node tools/make-examples.js claude     只做某些擴充功能
 *
 * 產生：
 *   examples/<擴充功能id>/zh-<n>.sb3、en-<n>.sb3   第 n 個範例（中文／英文版）
 *   plugins/examples.js                         有哪些範例檔（網站用來顯示下載按鈕）
 *
 * 範例腳本裡的擴充功能積木（{use: 'opcode'}）依擴充功能的 getInfo() 產生；
 * 內建積木（{t: '說出 [M]', cat: 'looks'}）依下面的 CORE 對照表產生，表裡沒有的積木會報錯。
 * 範例用到的造型、音效會自動加到角色裡：造型是寫著名字的示意圖，音效先用「喵」代替。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');

const SITE = path.resolve(__dirname, '..');
const REPO = path.resolve(SITE, '..');
const EXT_ROOT = path.join(REPO, 'node_modules', 'scratch-vm', 'src', 'extensions');
const ASSETS = path.join(REPO, 'src', 'lib', 'default-project');

/* ================= 1. 讓 Node 能載入擴充功能（和 extract-plugin.js 相同的做法） ================= */

const origJs = Module._extensions['.js'];
Module._extensions['.js'] = function (module, filename) {
    if (filename.startsWith(EXT_ROOT + path.sep)) {
        let src = fs.readFileSync(filename, 'utf8');
        if (/^\s*export\s/m.test(src)) {
            src = src
                .replace(/^(\s*)export\s+default\s+/gm, '$1module.exports = ')
                .replace(/^(\s*)export\s+(const|let|var)\s+(\w+)/gm, '$1$2 $3 = exports.$3')
                .replace(/^(\s*)export\s+(function|class)\s+(\w+)/gm, '$1exports.$3 = $2 $3');
        }
        return module._compile(src, filename);
    }
    return origJs(module, filename);
};
const makeStub = () => {
    const fn = function () {
        return stub;
    };
    const stub = new Proxy(fn, {
        get (target, prop) {
            if (prop === Symbol.toPrimitive) return () => '';
            if (prop === 'then') return undefined;
            if (prop === Symbol.iterator) return function* () {};
            return stub;
        },
        apply: () => stub,
        construct: () => stub
    });
    return stub;
};
const STUB_ALWAYS = ['ml5', 'face-api.js', '@tensorflow/tfjs', '@tensorflow/tfjs-core', 'babel-polyfill'];
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (STUB_ALWAYS.includes(request)) return makeStub();
    try {
        return origLoad.call(this, request, parent, isMain);
    } catch (e) {
        if (parent && parent.filename && parent.filename.startsWith(EXT_ROOT)) return makeStub();
        throw e;
    }
};
const setGlobal = (name, value) => {
    try {
        if (typeof global[name] === 'undefined') global[name] = value;
    } catch (e) {
        // 唯讀的全域變數，略過
    }
};
setGlobal('window', global);
setGlobal('document', makeStub());
setGlobal('navigator', {userAgent: 'node', language: 'zh-TW'});
setGlobal('localStorage', {getItem: () => null, setItem () {}, removeItem () {}});
setGlobal('XMLHttpRequest', function () {
    return makeStub();
});
try {
    if (global.navigator && !global.navigator.mediaDevices) {
        Object.defineProperty(global.navigator, 'mediaDevices', {
            value: {getUserMedia: () => new Promise(() => {}), enumerateDevices: () => Promise.resolve([])},
            configurable: true
        });
    }
} catch (e) {
    // 略過
}
// 擴充功能會 console.log 很多東西，產生範例時不需要
const quiet = fn => {
    const saved = [console.log, console.warn, console.info];
    console.log = console.warn = console.info = () => {};
    try {
        return fn();
    } finally {
        [console.log, console.warn, console.info] = saved;
    }
};

const formatMessage = require(require.resolve('format-message', {paths: [EXT_ROOT]}));
const JSZip = require(require.resolve('jszip', {paths: [REPO]}));

/** 載入擴充功能，回傳 {zh, en} 兩種語言的 getInfo() 結果（同一個實例，呼叫動態選單用） */
const infoCache = {};
const loadInfo = dir => {
    if (infoCache[dir]) return infoCache[dir];
    const ExtClass = quiet(() => require(path.join(dir, 'index.js')));
    const out = {};
    [['zh', 'zh-tw'], ['en', 'en']].forEach(([lang, locale]) => {
        formatMessage.setup({locale});
        out[lang] = quiet(() => {
            const inst = new ExtClass(makeStub());
            const info = inst.getInfo();
            info._inst = inst;
            return info;
        });
    });
    formatMessage.setup({locale: 'en'});
    infoCache[dir] = out;
    return out;
};

/* ================= 2. 內建積木對照表 ================= */

// 輸入的種類：text=文字、num=數字、pos=正數、whole=整數、angle=角度
const CORE = {};
const core = (texts, spec) => texts.forEach(t => {
    CORE[t] = spec;
});
core(['當 🏁 被點擊', 'when 🏁 clicked'], {op: 'event_whenflagclicked'});
core(['當角色被點擊', 'when this sprite clicked'], {op: 'event_whenthisspriteclicked'});
core(['當 [K] 鍵被按下', 'when [K] key pressed'], {op: 'event_whenkeypressed', fields: {K: 'KEY_OPTION:key'}});
core(['當收到訊息 [M]', 'when I receive [M]'], {op: 'event_whenbroadcastreceived', fields: {M: 'BROADCAST_OPTION:broadcast'}});
core(['等待 [S] 秒', 'wait [S] seconds'], {op: 'control_wait', inputs: {S: 'DURATION:pos'}});
core(['等待直到 [C]', 'wait until [C]'], {op: 'control_wait_until', inputs: {C: 'CONDITION:bool'}});
core(['重複無限次', 'forever'], {op: 'control_forever'});
core(['如果 [C] 那麼', 'if [C] then'], {op: 'control_if', inputs: {C: 'CONDITION:bool'}});
core(['重複 [N] 次', 'repeat [N]'], {op: 'control_repeat', inputs: {N: 'TIMES:whole'}});
core(['重複直到 [C]', 'repeat until [C]'], {op: 'control_repeat_until', inputs: {C: 'CONDITION:bool'}});
core(['變數 [V] 設為 [N]', 'set [V] to [N]'], {op: 'data_setvariableto', fields: {V: 'VARIABLE:variable'}, inputs: {N: 'VALUE:text'}});
core(['變數 [V] 改變 [N]', 'change [V] by [N]'], {op: 'data_changevariableby', fields: {V: 'VARIABLE:variable'}, inputs: {N: 'VALUE:num'}});
core(['添加 [X] 到 [L]', 'add [X] to [L]'], {op: 'data_addtolist', fields: {L: 'LIST:list'}, inputs: {X: 'ITEM:text'}});
core(['刪除 [L] 的所有項目', 'delete all of [L]'], {op: 'data_deletealloflist', fields: {L: 'LIST:list'}});
core(['將 [E] 特效改變 [N]', 'change [E] effect by [N]'], {op: 'looks_changeeffectby', fields: {E: 'EFFECT:effect'}, inputs: {N: 'CHANGE:num'}});
core(['說出 [M]', 'say [M]'], {op: 'looks_say', inputs: {M: 'MESSAGE:text'}});
core(['說出 [M] 持續 [S] 秒', 'say [M] for [S] seconds'], {op: 'looks_sayforsecs', inputs: {M: 'MESSAGE:text', S: 'SECS:num'}});
core(['造型換成 [X]', 'switch costume to [X]'], {op: 'looks_switchcostumeto', menus: {X: 'COSTUME:looks_costume:COSTUME:costume'}});
core(['播放音效 [S]', 'start sound [S]'], {op: 'sound_play', menus: {S: 'SOUND_MENU:sound_sounds_menu:SOUND_MENU:sound'}});
core(['x 改變 [N]', 'change x by [N]'], {op: 'motion_changexby', inputs: {N: 'DX:num'}});
core(['滑行 [S] 秒到 x: [X] y: [Y]', 'glide [S] secs to x: [X] y: [Y]'], {op: 'motion_glidesecstoxy', inputs: {S: 'SECS:num', X: 'X:num', Y: 'Y:num'}});
core(['定位到 x: [X] y: [Y]', 'go to x: [X] y: [Y]'], {op: 'motion_gotoxy', inputs: {X: 'X:num', Y: 'Y:num'}});
core(['面朝 [D] 度', 'point in direction [D]'], {op: 'motion_pointindirection', inputs: {D: 'DIRECTION:angle'}});
core(['[A] < [B]'], {op: 'operator_lt', inputs: {A: 'OPERAND1:text', B: 'OPERAND2:text'}});
core(['[A] = [B]'], {op: 'operator_equals', inputs: {A: 'OPERAND1:text', B: 'OPERAND2:text'}});
core(['[A] > [B]'], {op: 'operator_gt', inputs: {A: 'OPERAND1:text', B: 'OPERAND2:text'}});
core(['[A] 包含 [B] ?', '[A] contains [B] ?'], {op: 'operator_contains', inputs: {A: 'STRING1:text', B: 'STRING2:text'}});
core(['[A] * [B]'], {op: 'operator_multiply', inputs: {A: 'NUM1:num', B: 'NUM2:num'}});
core(['[A] + [B]'], {op: 'operator_add', inputs: {A: 'NUM1:num', B: 'NUM2:num'}});
core(['[A] - [B]'], {op: 'operator_subtract', inputs: {A: 'NUM1:num', B: 'NUM2:num'}});
core(['字串組合 [A] [B]', 'join [A] [B]'], {op: 'operator_join', inputs: {A: 'STRING1:text', B: 'STRING2:text'}});
core(['[S] 的長度', 'length of [S]'], {op: 'operator_length', inputs: {S: 'STRING:text'}});
core(['詢問 [Q] 並等待', 'ask [Q] and wait'], {op: 'sensing_askandwait', inputs: {Q: 'QUESTION:text'}});
core(['詢問的答案', 'answer'], {op: 'sensing_answer'});
// Google 試算表擴充功能（範例裡用 color 畫的積木）
core(['取得 Google 試算表共用連結 [U]', 'get data from Google Sheet URL [U]'], {op: 'rwGoogle_googleJSON', ext: 'rwGoogle', inputs: {U: 'url:text'}});
core(['讀取的 Google 資料', 'Google data'], {op: 'rwGoogle_readFromJSON', ext: 'rwGoogle', inputs: {}, extraInputs: {id: 'text:id'}});
// 圖表擴充功能（範例裡用 color 畫的積木；選單值 1～5 = 折線圖、長條圖、圓餅圖、環形圖、雷達圖）
core(['圖表標題 [T]', 'chart title [T]'], {op: 'chart_showChartTitle', ext: 'chart', inputs: {T: 'title:text'}});
core(['座標軸標題：X軸 [X] Y軸 [Y]', 'axis titles: x axis [X] y axis [Y]'], {op: 'chart_showAxisTitle', ext: 'chart', inputs: {X: 'X_axis:text', Y: 'Y_axis:text'}});
core(['讀取資料 [D] 顯示 [C]', 'read data [D] show [C]'], {op: 'chart_showChart', ext: 'chart', inputs: {D: 'data:text'}, menus: {C: 'chart:chart_menu_chartSelectField:chartSelectField:chart'}});

const CHART_TYPES = {折線圖: '1', 'line chart': '1', 長條圖: '2', 'bar chart': '2', 圓餅圖: '3', 'pie chart': '3',
    環形圖: '4', 'donut chart': '4', 雷達圖: '5', 'radar chart': '5'};
const PRIM = {num: 4, pos: 5, whole: 6, int: 7, angle: 8, color: 9, text: 10};
const KEYS = {空白: 'space', space: 'space', 上: 'up arrow', 下: 'down arrow', 左: 'left arrow', 右: 'right arrow'};
const EFFECTS = {亮度: 'BRIGHTNESS', brightness: 'BRIGHTNESS', 顏色: 'COLOR', color: 'COLOR', 幽靈: 'GHOST', ghost: 'GHOST'};

/* ================= 3. 範例 → 專案 ================= */

const md5 = buf => crypto.createHash('md5').update(buf).digest('hex');
const COLORS = ['#4C97FF', '#9966FF', '#FF8C1A', '#59C059', '#CF63CF', '#5CB1D6', '#FFAB19', '#0FBD8C'];
const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** 只寫著造型名稱的示意造型 */
const placeholderSvg = (name, i) => {
    const c = COLORS[i % COLORS.length];
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
        `<rect x="4" y="4" width="112" height="112" rx="20" fill="${c}" stroke="#ffffff" stroke-width="4"/>` +
        `<text x="60" y="68" font-family="sans-serif" font-size="${name.length > 6 ? 14 : 20}" font-weight="bold" ` +
        `text-anchor="middle" fill="#ffffff">${escXml(name)}</text></svg>`);
};

const isNode = v => v && typeof v === 'object' && (v.use || v.t);

class Builder {
    constructor (lang, mainPlugin, infos) {
        this.lang = lang;
        this.main = mainPlugin;
        this.infos = infos; // pluginId -> {info, extId}
        this.blocks = {};
        this.n = 0;
        this.vars = {};
        this.lists = {};
        this.broadcasts = {};
        this.costumes = [];
        this.sounds = [];
        this.extensions = new Set();
        this.problems = [];
    }

    id (prefix) {
        this.n += 1;
        return `${prefix || 'b'}${this.n}`;
    }

    varId (name) {
        if (!this.vars[name]) this.vars[name] = this.id('var');
        return this.vars[name];
    }

    listId (name) {
        if (!this.lists[name]) this.lists[name] = this.id('list');
        return this.lists[name];
    }

    msgId (name) {
        if (!this.broadcasts[name]) this.broadcasts[name] = this.id('msg');
        return this.broadcasts[name];
    }

    text (v) {
        if (v && typeof v === 'object') {
            if ('num' in v) return String(v.num);
            if ('v' in v) return String(v.v);
            return '';
        }
        return v === undefined || v === null ? '' : String(v);
    }

    /** 主要輸入：一般值、或放進積木（reporter／boolean） */
    input (block, name, val, kind) {
        if (kind === 'bool') {
            if (isNode(val)) block.inputs[name] = [2, this.make(val, block.__id)];
            return;
        }
        const prim = [PRIM[kind] || 10, isNode(val) ? '' : this.text(val)];
        if (isNode(val)) block.inputs[name] = [3, this.make(val, block.__id), prim];
        else block.inputs[name] = [1, prim];
    }

    /** 內建積木的選單（造型、音效），以影子積木表示 */
    menuInput (block, name, val, shadowOp, field, kind) {
        let value = this.text(val);
        if (kind === 'chart') value = CHART_TYPES[value] || value;
        if (kind === 'costume' && this.costumes.indexOf(value) < 0) this.costumes.push(value);
        if (kind === 'sound' && this.sounds.indexOf(value) < 0) this.sounds.push(value);
        const sid = this.id('m');
        this.blocks[sid] = {opcode: shadowOp, next: null, parent: block.__id, inputs: {}, fields: {[field]: [value, null]}, shadow: true, topLevel: false};
        if (isNode(val)) block.inputs[name] = [3, this.make(val, block.__id), sid];
        else block.inputs[name] = [1, sid];
    }

    make (node, parent) {
        const bid = this.id();
        const block = {__id: bid, opcode: '', next: null, parent: parent || null, inputs: {}, fields: {}, shadow: false, topLevel: false};
        this.blocks[bid] = block;
        if (node.use) this.makeExt(block, node);
        else this.makeCore(block, node);
        if (node.body) block.inputs.SUBSTACK = [2, this.stack(node.body, bid)];
        if (node.else) {
            block.opcode = 'control_if_else';
            block.inputs.SUBSTACK2 = [2, this.stack(node.else, bid)];
        }
        return bid;
    }

    makeCore (block, node) {
        const t = node.t;
        // 變數積木：t 就是變數名稱
        if (node.cat === 'data' && node.type === 'reporter') {
            block.opcode = 'data_variable';
            block.fields.VARIABLE = [t, this.varId(t)];
            return;
        }
        const spec = CORE[t];
        if (!spec) {
            this.problems.push(`沒有對照的內建積木：${t}`);
            block.opcode = 'looks_say';
            block.inputs.MESSAGE = [1, [10, `（${t}）`]];
            return;
        }
        block.opcode = spec.op;
        if (spec.ext) this.extensions.add(spec.ext);
        const args = node.args || {};
        Object.keys(spec.fields || {}).forEach(a => {
            const [field, kind] = spec.fields[a].split(':');
            const v = this.text(args[a]);
            if (kind === 'key') block.fields[field] = [KEYS[v] || v, null];
            else if (kind === 'effect') block.fields[field] = [EFFECTS[v] || v.toUpperCase(), null];
            else if (kind === 'variable') block.fields[field] = [v, this.varId(v)];
            else if (kind === 'list') block.fields[field] = [v, this.listId(v)];
            else if (kind === 'broadcast') block.fields[field] = [v, this.msgId(v)];
        });
        Object.keys(spec.inputs || {}).forEach(a => {
            const [name, kind] = spec.inputs[a].split(':');
            this.input(block, name, args[a], kind);
        });
        Object.keys(spec.menus || {}).forEach(a => {
            const [name, shadowOp, field, kind] = spec.menus[a].split(':');
            this.menuInput(block, name, args[a], shadowOp, field, kind);
        });
        Object.keys(spec.extraInputs || {}).forEach(name => {
            const [kind, v] = spec.extraInputs[name].split(':');
            block.inputs[name] = [1, [PRIM[kind] || 10, v]];
        });
    }

    makeExt (block, node) {
        let pid = this.main;
        let op = node.use;
        if (op.indexOf('.') > 0) [pid, op] = op.split('.');
        const entry = this.infos[pid];
        if (!entry) {
            this.problems.push(`找不到擴充功能 ${pid}`);
            return;
        }
        const info = entry.info[this.lang];
        const def = info.blocks.find(b => b && b.opcode === op);
        if (!def) {
            this.problems.push(`找不到積木 ${pid}.${op}`);
            return;
        }
        this.extensions.add(info.id);
        block.opcode = `${info.id}_${op}`;
        const args = node.args || {};
        Object.keys(def.arguments || {}).forEach(name => {
            const a = def.arguments[name];
            const given = args[name];
            const val = given === undefined ? a.defaultValue : given;
            if (a.menu) {
                this.extMenu(block, info, name, a, val);
                return;
            }
            const type = String(a.type || 'string');
            const custom = (CUSTOM_VALUE_ARGS[info.id] || {})[op];
            if (custom && custom.indexOf(name) >= 0) {
                // 自訂欄位（customFieldTypes）：在 Node 載入時 getInfo 給的是一般文字格，
                // 但編輯器存檔時是 <id>_value 影子積木，範例檔照編輯器的格式寫
                this.menuInput(block, name, val === undefined ? '' : val, `${info.id}_value`, `field_${info.id}_value`, 'text');
                return;
            }
            if (type === 'Boolean') {
                if (isNode(val)) block.inputs[name] = [2, this.make(val, block.__id)];
                return;
            }
            const kind = type === 'number' ? 'num' : type === 'angle' ? 'angle' : type === 'color' ? 'color' : 'text';
            this.input(block, name, val === undefined ? '' : val, kind);
        });
    }

    /** 擴充功能選單：可放變數的選單是影子積木，不行的是積木上的欄位；選項文字換成值 */
    extMenu (block, info, name, a, val) {
        const menu = info.menus && info.menus[a.menu];
        const accept = menu && !Array.isArray(menu) && !!menu.acceptReporters;
        let value = isNode(val) ? '' : this.text(val);
        const rawItems = menu ? (Array.isArray(menu) ? menu : menu.items) : null;
        let items = rawItems;
        if (typeof rawItems === 'string') {
            try {
                items = info._inst[rawItems]();
            } catch (e) {
                items = null;
            }
        }
        if (Array.isArray(items)) {
            const norm = items.map(it => (typeof it === 'object' ? {text: String(it.text), value: String(it.value)} : {text: String(it), value: String(it)}));
            const hit = norm.find(it => it.text === value) || norm.find(it => it.value === value);
            if (hit) value = hit.value;
            else if (typeof rawItems !== 'string' && !isNode(val)) this.problems.push(`選單 ${a.menu} 沒有「${value}」`);
        }
        if (accept) {
            const sid = this.id('m');
            this.blocks[sid] = {opcode: `${info.id}_menu_${a.menu}`, next: null, parent: block.__id, inputs: {},
                fields: {[a.menu]: [value, null]}, shadow: true, topLevel: false};
            block.inputs[name] = isNode(val) ? [3, this.make(val, block.__id), sid] : [1, sid];
        } else {
            block.fields[name] = [value, null];
        }
    }

    stack (nodes, parent) {
        let first = null;
        let prev = null;
        nodes.forEach(node => {
            const bid = this.make(node, prev || parent);
            if (prev) this.blocks[prev].next = bid;
            else first = bid;
            prev = bid;
        });
        return first;
    }

    script (nodes, x, y) {
        const first = this.stack(nodes, null);
        const b = this.blocks[first];
        b.topLevel = true;
        b.parent = null;
        b.x = x;
        b.y = y;
        return first;
    }
}

const STR = {
    zh: {sprite: '角色1', costume: '造型', backdrop: '背景1', meow: '喵', pop: '啵', stage: 'Stage',
        placeholder: '「{names}」造型是示意圖，可以換成自己畫的造型。', soundNote: '音效「{names}」暫時用「喵」代替，可以換成其他音效。',
        source: 'OSEP 擴充功能說明網站的範例：', sep: '」「'},
    en: {sprite: 'Sprite1', costume: 'costume', backdrop: 'backdrop1', meow: 'Meow', pop: 'pop', stage: 'Stage',
        placeholder: 'The "{names}" costumes are placeholders; replace them with your own drawings.',
        soundNote: 'The "{names}" sound uses "Meow" for now; replace it with another sound.',
        source: 'Example from the OSEP plugin guide: ', sep: '", "'}
};

const buildProject = (lang, pluginId, ex, infos) => {
    const S = STR[lang];
    const b = new Builder(lang, pluginId, infos);
    const stacks = Array.isArray(ex.script[0]) ? ex.script : [ex.script];
    // 先排一列兩段腳本；註解的高度算出來後再整體往下移到註解下面
    const tops = stacks.map((nodes, i) => [b.script(nodes, 40 + (i % 2) * 560, Math.floor(i / 2) * 420), Math.floor(i / 2) * 420]);
    Object.values(b.blocks).forEach(x => delete x.__id);

    const files = {};
    const asset = (buf, ext) => {
        const id = md5(buf);
        files[`${id}.${ext}`] = buf;
        return id;
    };
    const svg = f => fs.readFileSync(path.join(ASSETS, f));
    const catA = asset(svg('bcf454acf82e4504149f7ffe07081dbc.svg'), 'svg');
    const catB = asset(svg('0fb9be3e8397c983338cb71dc84d0b25.svg'), 'svg');
    const bd = asset(svg('cd21514d0531fdffb22204e0ec5ed84a.svg'), 'svg');
    const meow = asset(fs.readFileSync(path.join(ASSETS, '83c36d806dc92327b9e7049a565c6bff.wav')), 'wav');
    const pop = asset(fs.readFileSync(path.join(ASSETS, '83a9787d4cb6f3b7632b4ddfebf74367.wav')), 'wav');

    const costumes = [
        {name: `${S.costume}1`, bitmapResolution: 1, dataFormat: 'svg', assetId: catA, md5ext: `${catA}.svg`, rotationCenterX: 48, rotationCenterY: 50},
        {name: `${S.costume}2`, bitmapResolution: 1, dataFormat: 'svg', assetId: catB, md5ext: `${catB}.svg`, rotationCenterX: 46, rotationCenterY: 53}
    ];
    b.costumes.forEach((name, i) => {
        const id = asset(placeholderSvg(name, i), 'svg');
        costumes.push({name, bitmapResolution: 1, dataFormat: 'svg', assetId: id, md5ext: `${id}.svg`, rotationCenterX: 60, rotationCenterY: 60});
    });
    const meowSound = name => ({name, assetId: meow, dataFormat: 'wav', format: '', rate: 22050, sampleCount: 18688, md5ext: `${meow}.wav`});
    const sounds = [meowSound(S.meow)];
    const fakeSounds = b.sounds.filter(n => n !== S.meow);
    fakeSounds.forEach(n => sounds.push(meowSound(n)));

    const notes = [`${S.source}${ex.title}`];
    if (ex.intro) notes.push(ex.intro.replace(/\[\[[\w.]+\]\]/g, '').replace(/[*`]/g, ''));
    if (b.costumes.length) notes.push(S.placeholder.replace('{names}', b.costumes.join(S.sep)));
    if (fakeSounds.length) notes.push(S.soundNote.replace('{names}', fakeSounds.join(S.sep)));

    // 註解框的高度：大約一行 40 個字、每行 20px
    const noteText = notes.join('\n\n');
    const noteHeight = 50 + 20 * notes.reduce((n, t) => n + Math.ceil(t.length / 40) + 1, 0);
    tops.forEach(([id, y]) => {
        b.blocks[id].y = 20 + noteHeight + 60 + y;
    });

    const stage = {
        isStage: true, name: S.stage,
        variables: Object.fromEntries(Object.entries(b.vars).map(([n, id]) => [id, [n, 0]])),
        lists: Object.fromEntries(Object.entries(b.lists).map(([n, id]) => [id, [n, []]])),
        broadcasts: Object.fromEntries(Object.entries(b.broadcasts).map(([n, id]) => [id, n])),
        blocks: {}, comments: {}, currentCostume: 0,
        costumes: [{name: S.backdrop, dataFormat: 'svg', assetId: bd, md5ext: `${bd}.svg`, rotationCenterX: 240, rotationCenterY: 180}],
        sounds: [{name: S.pop, assetId: pop, dataFormat: 'wav', format: '', rate: 11025, sampleCount: 258, md5ext: `${pop}.wav`}],
        volume: 100, layerOrder: 0, tempo: 60, videoTransparency: 50, videoState: 'on', textToSpeechLanguage: null
    };
    const sprite = {
        isStage: false, name: S.sprite, variables: {}, lists: {}, broadcasts: {}, blocks: b.blocks,
        comments: {note: {blockId: null, x: 40, y: 20, width: 560, height: noteHeight, minimized: false, text: noteText}},
        currentCostume: 0, costumes, sounds, volume: 100, layerOrder: 1, visible: true,
        x: 0, y: 0, size: 100, direction: 90, draggable: false, rotationStyle: 'all around'
    };
    const project = {
        targets: [stage, sprite], monitors: [], extensions: Array.from(b.extensions),
        meta: {semver: '3.0.0', vm: '0.2.0', agent: 'OSEP plugin-docs tools/make-examples.js'}
    };
    return {project, files, problems: b.problems};
};

/**
 * 新版 OSEP（new/）和舊版（app/）擴充 id 不同的擴充功能：舊版 id → 新版 id。
 * 例：new/ 裡的 textSentiment 是原作者的 ml5 舊擴充功能，我們的版本叫 textSentimentTF（積木相同）。
 */
const NEW_IDS = {textSentiment: 'textSentimentTF', gasoLASS: 'lassAirbox', gasoThingSpeak: 'thingSpeakIoT'};

/** 用自訂欄位（customFieldTypes 的 value）的參數：擴充功能 id → 積木 → 參數名稱 */
const CUSTOM_VALUE_ARGS = {decisionTree: {condition: ['YN'], setInput: ['VAL']}};

/** 複製一份專案，把擴充 id（opcode 前綴、選單影子積木、extensions 清單）換成新的 */
const renameExtensions = (project, map) => {
    const p = JSON.parse(JSON.stringify(project));
    p.extensions = p.extensions.map(x => map[x] || x);
    p.targets.forEach(t => Object.values(t.blocks).forEach(b => {
        const ext = b.opcode.split('_')[0];
        if (map[ext]) b.opcode = map[ext] + b.opcode.slice(ext.length);
    }));
    return p;
};

/* ================= 4. 主程式 ================= */

const readList = () => {
    const src = fs.readFileSync(path.join(SITE, 'plugins', 'list.js'), 'utf8');
    return new Function(`${src}; return OSEP_PLUGIN_LIST;`)(); // eslint-disable-line no-new-func
};
const readPlugin = id => {
    let p = null;
    let en = null;
    new Function('OSEP', fs.readFileSync(path.join(SITE, 'plugins', `${id}.js`), 'utf8'))({addPlugin: x => { // eslint-disable-line no-new-func
        p = x;
    }});
    const enFile = path.join(SITE, 'plugins', `${id}.en.js`);
    if (fs.existsSync(enFile)) {
        new Function('OSEP', fs.readFileSync(enFile, 'utf8'))({addText: (a, b, x) => { // eslint-disable-line no-new-func
            en = x;
        }});
    }
    return {p, en};
};

const main = () => {
    const only = process.argv.slice(2);
    const list = readList();
    const infos = {};
    const extDir = id => {
        const {p} = readPlugin(id);
        return path.resolve(SITE, p.source);
    };
    list.forEach(id => {
        infos[id] = {info: loadInfo(extDir(id))};
    });

    const manifestFile = path.join(SITE, 'plugins', 'examples.js');
    let manifest = {};
    if (fs.existsSync(manifestFile)) {
        new Function('window', fs.readFileSync(manifestFile, 'utf8'))({ // eslint-disable-line no-new-func
            set OSEP_EXAMPLE_FILES (v) {
                manifest = v;
            }
        });
    }

    let count = 0;
    let bad = 0;
    const jobs = [];
    list.filter(id => !only.length || only.includes(id)).forEach(id => {
        const {p, en} = readPlugin(id);
        manifest[id] = {};
        [['zh', p.examples || []], ['en', (en && en.examples) || []]].forEach(([lang, exs]) => {
            manifest[id][lang] = [];
            exs.forEach((ex, i) => {
                const {project, files, problems} = buildProject(lang, id, ex, infos);
                if (problems.length) {
                    bad += 1;
                    console.log(`⚠ ${id} ${lang} 範例 ${i + 1}：${problems.join('；')}`);
                }
                const save = (proj, rel) => {
                    const zip = new JSZip();
                    zip.file('project.json', JSON.stringify(proj));
                    Object.keys(files).forEach(f => zip.file(f, files[f]));
                    count += 1;
                    jobs.push(zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}).then(buf => {
                        fs.mkdirSync(path.join(SITE, 'examples', id), {recursive: true});
                        fs.writeFileSync(path.join(SITE, rel), buf);
                    }));
                };
                // 舊版 app/ 用的檔（擴充功能原本的擴充 id）
                const rel = `examples/${id}/${lang}-${i + 1}.sb3`;
                manifest[id][lang][i] = rel;
                save(project, rel);
                // 新版 new/ 的擴充 id 不同時，多存一份換過 id 的檔
                if (project.extensions.some(x => NEW_IDS[x])) {
                    const relNew = `examples/${id}/${lang}-${i + 1}-new.sb3`;
                    manifest[id].new = manifest[id].new || {};
                    (manifest[id].new[lang] = manifest[id].new[lang] || [])[i] = relNew;
                    save(renameExtensions(project, NEW_IDS), relNew);
                }
            });
        });
    });
    return Promise.all(jobs).then(() => {
        const body = `// 由 tools/make-examples.js 產生：每個擴充功能各範例的 .sb3 檔（中文 zh、英文 en，依範例順序）\n` +
            `window.OSEP_EXAMPLE_FILES = ${JSON.stringify(manifest, null, 2)};\n`;
        fs.writeFileSync(manifestFile, body);
        console.log(`產生 ${count} 個範例檔${bad ? `，其中 ${bad} 個有問題（見上面的 ⚠）` : ''}`);
        process.exit(0);
    });
};

main();
