#!/usr/bin/env node
// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 從 Scratch 插件原始碼產生（或更新）插件說明資料檔。
 *
 * 用法（在 osep_plugin_docs 資料夾執行）：
 *   node tools/extract-plugin.js <插件資料夾>
 *   例：node tools/extract-plugin.js ../node_modules/scratch-vm/src/extensions/scratch3_claude
 *
 * 做的事：
 *   1. 載入插件的 index.js，用 zh-tw 與 en 各呼叫一次 getInfo()
 *   2. 產生 plugins/<id>.js：積木文字、類型、參數、預設值、選單選項、分組（依 '---'）、顏色
 *   3. 把積木圖示（blockIconURI）存成 images/<id>/block-icon.svg 或 .png
 *   4. 在 plugins/list.js 加入這個插件（已存在就不重複加）
 *
 * 如果 plugins/<id>.js 已經存在：只更新「從程式碼來的欄位」（積木文字、參數、類型、順序、顏色），
 * 你手寫的說明（summary、detail、args 的 desc、returns、tips、概述、範例、FAQ…）都會保留。
 * 程式碼裡已經刪掉的積木，會被移到檔案最後的 removedBlocks，不會直接消失，方便你決定要不要留。
 *
 * 選項：
 *   --dry   只印出結果，不寫檔
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const extDir = args.find(a => !a.startsWith('--'));
if (!extDir) {
    console.error('請指定插件資料夾，例如：node tools/extract-plugin.js ../node_modules/scratch-vm/src/extensions/scratch3_claude');
    process.exit(1);
}
const EXT = path.resolve(extDir);
const SITE = path.resolve(__dirname, '..');
const indexFile = path.join(EXT, 'index.js');
if (!fs.existsSync(indexFile)) {
    console.error(`找不到 ${indexFile}`);
    process.exit(1);
}

/* ---------- 1. 讓 Node 能載入插件 ---------- */

// 插件資料夾裡的檔案若用 ES module 寫法（export const），轉成 CommonJS
const origJs = Module._extensions['.js'];
Module._extensions['.js'] = function (module, filename) {
    if (filename.startsWith(EXT + path.sep)) {
        let src = fs.readFileSync(filename, 'utf8');
        if (/^\s*export\s/m.test(src)) {
            src = src
                .replace(/^(\s*)export\s+default\s+/gm, '$1module.exports = ')
                .replace(/^(\s*)export\s+(const|let|var)\s+(\w+)/gm, '$1$2 $3 = exports.$3')
                .replace(/^(\s*)export\s+(function|class)\s+(\w+)/gm, '$1exports.$3 = $2 $3');
            // 「const X = exports.X = ...」可正常運作
        }
        return module._compile(src, filename);
    }
    return origJs(module, filename);
};

// 任何東西都能呼叫、讀取的假物件（給 runtime 與載入失敗的套件用）
const makeStub = () => {
    const fn = function () {
        return stub;
    };
    const stub = new Proxy(fn, {
        get (target, prop) {
            if (prop === Symbol.toPrimitive) return () => '';
            if (prop === 'then') return undefined; // 不要被當成 Promise
            if (prop === Symbol.iterator) return function* () {};
            return stub;
        },
        apply () {
            return stub;
        },
        construct () {
            return stub;
        }
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
        if (parent && parent.filename && parent.filename.startsWith(EXT)) {
            console.warn(`（略過無法載入的套件 ${request}）`);
            return makeStub();
        }
        throw e;
    }
};
// 有些插件會用到瀏覽器全域變數
const setGlobal = (name, value) => {
    try {
        if (typeof global[name] === 'undefined') global[name] = value;
    } catch (e) {
        // Node 新版的 navigator 等是唯讀，略過
    }
};
setGlobal('window', global);
setGlobal('document', makeStub());
setGlobal('navigator', {userAgent: 'node', language: 'zh-TW'});
setGlobal('localStorage', {getItem: () => null, setItem () {}, removeItem () {}});

let formatMessage;
try {
    formatMessage = require(require.resolve('format-message', {paths: [EXT]}));
} catch (e) {
    console.error('找不到 format-message 套件。請確認插件資料夾位於 osep_web_serial 的 node_modules/scratch-vm 底下。');
    process.exit(1);
}

const ExtClass = require(indexFile);
const getInfo = locale => {
    formatMessage.setup({locale});
    const inst = new ExtClass(makeStub());
    return inst.getInfo();
};
const infoZh = getInfo('zh-tw');
const infoEn = getInfo('en');
formatMessage.setup({locale: 'en'});

/* ---------- 2. 轉成說明網站的格式 ---------- */

const TYPE_MAP = {
    command: 'command',
    reporter: 'reporter',
    Boolean: 'boolean',
    boolean: 'boolean',
    hat: 'hat',
    event: 'hat',
    conditional: 'c',
    loop: 'c',
    button: 'button'
};

const menuItems = (info, menuName) => {
    const m = info.menus && info.menus[menuName];
    if (!m) return null;
    const items = Array.isArray(m) ? m : m.items;
    if (!Array.isArray(items)) return {dynamic: true};
    return {
        acceptReporters: !Array.isArray(m) && !!m.acceptReporters,
        items: items.map(it => (typeof it === 'object' ? {text: String(it.text), value: String(it.value)} : {text: String(it), value: String(it)}))
    };
};

const convertArgs = (blockZh, blockEn) => {
    const out = {};
    Object.keys(blockZh.arguments || {}).forEach(name => {
        const a = blockZh.arguments[name];
        const arg = {};
        if (a.menu) {
            const mz = menuItems(infoZh, a.menu);
            arg.type = 'menu';
            if (mz && !mz.dynamic) {
                arg.options = mz.items.map(i => i.text);
                const def = mz.items.find(i => i.value === String(a.defaultValue));
                arg.value = def ? def.text : String(a.defaultValue === undefined ? '' : a.defaultValue);
                arg.values = mz.items.map(i => i.value);
                if (mz.acceptReporters) arg.acceptReporters = true;
            } else {
                arg.value = String(a.defaultValue === undefined ? '' : a.defaultValue);
                arg.dynamic = true;
            }
        } else {
            const t = String(a.type || 'string');
            arg.type = t === 'number' || t === 'angle' ? 'number' : t === 'Boolean' ? 'boolean' : t === 'color' ? 'color' : 'string';
            if (a.defaultValue !== undefined) arg.value = String(a.defaultValue);
        }
        out[name] = arg;
    });
    return out;
};

const groups = [[]];
infoZh.blocks.forEach((b, i) => {
    if (typeof b === 'string') {
        if (b.trim() === '---' && groups[groups.length - 1].length) groups.push([]);
        return;
    }
    if (!b || !b.opcode) return;
    const en = infoEn.blocks.find(x => x && x.opcode === b.opcode) || {};
    const block = {
        opcode: b.opcode,
        type: TYPE_MAP[b.blockType] || 'command',
        text: b.text,
        textEn: en.text || ''
    };
    const a = convertArgs(b, en);
    if (Object.keys(a).length) block.args = a;
    if (b.hideFromPalette) block.hidden = true;
    if (b.isEdgeActivated) block.edgeActivated = true;
    groups[groups.length - 1].push(block);
});

/* ---------- 3. 與既有檔案合併 ---------- */

const id = infoZh.id;
const pluginFile = path.join(SITE, 'plugins', `${id}.js`);

const loadExisting = () => {
    if (!fs.existsSync(pluginFile)) return null;
    let result = null;
    const OSEP = {addPlugin: p => {
        result = p;
    }};
    new Function('OSEP', fs.readFileSync(pluginFile, 'utf8'))(OSEP); // eslint-disable-line no-new-func
    return result;
};
const old = loadExisting();
const oldBlocks = {};
if (old) {
    (old.groups || []).forEach(g => (g.blocks || []).forEach(b => {
        oldBlocks[b.opcode] = b;
    }));
    (old.removedBlocks || []).forEach(b => {
        if (!oldBlocks[b.opcode]) oldBlocks[b.opcode] = b;
    });
}

const HAND_FIELDS = ['summary', 'detail', 'returns', 'tips', 'example'];
const usedOpcodes = new Set();
const newGroups = groups.filter(g => g.length).map((blocks, gi) => {
    const oldGroup = old && old.groups && old.groups[gi];
    return {
        name: oldGroup && oldGroup.name ? oldGroup.name : `第 ${gi + 1} 組（請改名）`,
        intro: oldGroup && oldGroup.intro ? oldGroup.intro : '',
        blocks: blocks.map(b => {
            usedOpcodes.add(b.opcode);
            const ob = oldBlocks[b.opcode];
            const nb = Object.assign({}, b);
            if (ob) {
                HAND_FIELDS.forEach(f => {
                    if (ob[f] !== undefined) nb[f] = ob[f];
                });
                if (nb.args && ob.args) {
                    Object.keys(nb.args).forEach(k => {
                        if (ob.args[k] && ob.args[k].desc) nb.args[k].desc = ob.args[k].desc;
                    });
                }
            }
            if (nb.summary === undefined) nb.summary = 'TODO：一句話說明這塊積木做什麼';
            if (nb.detail === undefined) nb.detail = '';
            if (nb.args) {
                Object.keys(nb.args).forEach(k => {
                    if (nb.args[k].desc === undefined) nb.args[k].desc = 'TODO：這個參數要填什麼';
                });
            }
            return nb;
        })
    };
});
const removed = Object.keys(oldBlocks).filter(op => !usedOpcodes.has(op)).map(op => oldBlocks[op]);

/* ---------- 4. 積木圖示 ---------- */

const saveIcon = uri => {
    if (!uri || typeof uri !== 'string' || !uri.startsWith('data:')) return null;
    const m = /^data:([^;,]+)(;charset=[^;,]+)?(;base64)?,(.*)$/s.exec(uri);
    if (!m) return null;
    const ext = m[1].includes('svg') ? 'svg' : m[1].includes('png') ? 'png' : m[1].includes('jpeg') ? 'jpg' : null;
    if (!ext) return null;
    const buf = m[3] ? Buffer.from(m[4], 'base64') : Buffer.from(decodeURIComponent(m[4]), 'utf8');
    const rel = `images/${id}/block-icon.${ext}`;
    if (!dry) {
        fs.mkdirSync(path.join(SITE, 'images', id), {recursive: true});
        fs.writeFileSync(path.join(SITE, rel), buf);
    }
    return rel;
};
const blockIcon = saveIcon(infoZh.blockIconURI || infoZh.menuIconURI);

/* ---------- 5. 組合並寫出 ---------- */

const base = old || {
    id,
    name: infoZh.name,
    nameEn: infoEn.name,
    author: 'Andrew Yang',
    updated: new Date().toISOString().slice(0, 10),
    tags: ['TODO'],
    needs: [],
    card: `images/${id}/card.png`,
    icon: `images/${id}/small.svg`,
    tagline: 'TODO：一句話介紹這個插件',
    overview: 'TODO：這個插件可以做什麼、適合什麼樣的作品。',
    highlights: [],
    examples: [],
    faq: [],
    changelog: [{date: new Date().toISOString().slice(0, 10), text: '建立說明頁'}]
};
const plugin = Object.assign({}, base, {
    id,
    name: base.name || infoZh.name,
    nameEn: infoEn.name,
    color: {
        primary: infoZh.color1 || '#4C97FF',
        secondary: infoZh.color2 || infoZh.color1 || '#4C97FF',
        tertiary: infoZh.color3 || infoZh.color2 || infoZh.color1 || '#3373CC'
    },
    blockIcon: blockIcon || base.blockIcon || '',
    source: path.relative(SITE, EXT).split(path.sep).join('/'),
    groups: newGroups
});
if (removed.length) plugin.removedBlocks = removed;
else delete plugin.removedBlocks;

// 固定欄位順序，讓檔案好讀
const ORDER = ['id', 'name', 'nameEn', 'author', 'updated', 'tags', 'needs', 'color', 'card', 'icon', 'blockIcon', 'source',
    'tagline', 'overview', 'highlights', 'groups', 'examples', 'faq', 'changelog', 'removedBlocks'];
const ordered = {};
ORDER.forEach(k => {
    if (plugin[k] !== undefined) ordered[k] = plugin[k];
});
Object.keys(plugin).forEach(k => {
    if (!(k in ordered)) ordered[k] = plugin[k];
});

const header = `/*\n * ${ordered.name} 插件說明資料\n * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。\n * 說明文字可用簡單格式：空一行=新段落、**粗體**、\`程式碼\`、開頭「- 」=清單、[[opcode]]=連到這個插件的積木。\n */\n`;
const body = `${header}OSEP.addPlugin(${JSON.stringify(ordered, null, 2)});\n`;

if (dry) {
    console.log(body);
    process.exit(0);
}
fs.mkdirSync(path.dirname(pluginFile), {recursive: true});
fs.writeFileSync(pluginFile, body);

// 加到 list.js
const listFile = path.join(SITE, 'plugins', 'list.js');
let list = fs.existsSync(listFile) ? fs.readFileSync(listFile, 'utf8') : 'OSEP_PLUGIN_LIST = [\n];\n';
if (!new RegExp(`['"]${id}['"]`).test(list)) {
    list = list.replace(/\n\];/, `\n    '${id}',\n];`).replace(/,(\s*),/g, ',$1');
    fs.writeFileSync(listFile, list);
    console.log(`已把 ${id} 加到 plugins/list.js`);
}

const blockCount = newGroups.reduce((n, g) => n + g.blocks.length, 0);
console.log(`${old ? '已更新' : '已建立'} plugins/${id}.js（${newGroups.length} 組、${blockCount} 個積木）`);
if (blockIcon) console.log(`積木圖示：${blockIcon}`);
if (removed.length) console.log(`注意：${removed.map(b => b.opcode).join(', ')} 已不在程式碼中，移到 removedBlocks`);
if (!old) {
    console.log('下一步：');
    console.log(`  1. 把卡片圖放到 images/${id}/card.png 與 images/${id}/small.svg`);
    console.log(`  2. 打開 plugins/${id}.js，把所有 TODO 換成說明`);
}
