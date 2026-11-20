// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/*
 * Scratch 風格積木繪製器（純 HTML + CSS，不需要外部函式庫）
 *
 * OSEPBlocks.block(def, plugin, opts)   畫一塊插件積木（def 是資料檔中的 block）
 * OSEPBlocks.script(nodes, plugin)      畫一段腳本（範例用，見 guide 的「範例腳本寫法」）
 */
(function () {
    'use strict';

    // Scratch 3 內建分類的顏色 [主色, 次色, 邊框色]
    const CATS = {
        motion: ['#4C97FF', '#4280D7', '#3373CC'],
        looks: ['#9966FF', '#855CD6', '#774DCB'],
        sound: ['#CF63CF', '#C94FC9', '#BD42BD'],
        events: ['#FFBF00', '#E6AC00', '#CC9900'],
        control: ['#FFAB19', '#EC9C13', '#CF8B17'],
        sensing: ['#5CB1D6', '#47A8D1', '#2E8EB8'],
        operators: ['#59C059', '#46B946', '#389438'],
        data: ['#FF8C1A', '#FF8000', '#DB6E00'],
        list: ['#FF661A', '#FF5500', '#E64D00'],
        pen: ['#0FBD8C', '#0DA57A', '#0B8E69'],
        myblocks: ['#FF6680', '#FF4D6A', '#FF3355']
    };

    const hexToRgb = hex => {
        let h = String(hex || '').replace('#', '');
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const n = parseInt(h, 16);
        return isNaN(n) ? [128, 128, 128] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const shade = (hex, f) => {
        const [r, g, b] = hexToRgb(hex);
        const m = v => Math.max(0, Math.min(255, Math.round(v * f)));
        return `#${[m(r), m(g), m(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
    };

    /** 插件的三個顏色；次色、邊框色和主色一樣時自動調暗 */
    const pluginColors = p => {
        const c = (p && p.color) || {};
        const c1 = c.primary || '#4C97FF';
        let c2 = c.secondary || c1;
        let c3 = c.tertiary || c2;
        if (c2.toLowerCase() === c1.toLowerCase()) c2 = shade(c1, 0.9);
        if (c3.toLowerCase() === c1.toLowerCase() || c3.toLowerCase() === c2.toLowerCase()) c3 = shade(c1, 0.78);
        return [c1, c2, c3];
    };

    const el = (tag, cls, text) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    };
    const setColors = (e, colors) => {
        e.style.setProperty('--c1', colors[0]);
        e.style.setProperty('--c2', colors[1]);
        e.style.setProperty('--c3', colors[2]);
    };

    const isNode = v => v && typeof v === 'object' && (v.use || v.t || v.text);

    /** 把範例中的一個節點轉成可以畫的資料 */
    const resolve = (node, plugin) => {
        if (node.use) {
            let pid = plugin && plugin.id;
            let op = node.use;
            if (op.indexOf('.') > 0) [pid, op] = op.split('.');
            const p = window.OSEP && window.OSEP.get(pid);
            const b = p && window.OSEP.findBlock(p, op);
            if (!b) {
                return {type: 'command', text: `⚠ 找不到積木 ${node.use}`, colors: ['#9AA0A6', '#8A9096', '#6B7177'], argDefs: {}, argVals: {}};
            }
            return {
                type: node.type || b.type,
                text: b.text,
                argDefs: b.args || {},
                argVals: node.args || {},
                colors: pluginColors(p),
                icon: p.blockIcon,
                opcode: op,
                pluginId: p.id
            };
        }
        const colors = node.color ? [node.color, shade(node.color, 0.9), shade(node.color, 0.78)] :
            (CATS[node.cat] || CATS.control);
        return {
            type: node.type || 'command',
            text: node.t || node.text || '',
            argDefs: {},
            argVals: node.args || {},
            colors,
            body: node.body,
            elseBody: node.else,
            elseText: node.elseText
        };
    };

    const renderInput = (def, val, colors, plugin) => {
        if (isNode(val)) return renderResolved(resolve(val, plugin), plugin, {inline: true});
        let type = def ? def.type : 'string';
        let v;
        if (val && typeof val === 'object') {
            if (val.menu) type = 'menu';
            if (val.num !== undefined) {
                type = 'number';
                v = val.num;
            }
            if (val.bool) type = 'boolean';
            if (v === undefined) v = val.v !== undefined ? val.v : '';
        } else if (val !== undefined && val !== null) {
            v = val;
        } else if (def && def.value !== undefined) {
            v = def.value;
        } else {
            v = '';
        }
        v = String(v);
        if (type === 'boolean') return el('span', 'in-bool');
        if (type === 'menu') {
            const s = el('span', 'in-menu');
            s.appendChild(el('span', 'in-menu-text', v));
            s.appendChild(el('span', 'in-arrow', '▾'));
            return s;
        }
        if (type === 'color') {
            const s = el('span', 'in-color');
            s.style.background = v || '#ff0000';
            return s;
        }
        const s = el('span', type === 'number' ? 'in-num' : 'in-str', v.trim() === '' ? ' ' : v);
        if (v.length > 18) s.title = v;
        return s;
    };

    /** 把積木文字（含 [ARG]）轉成一列元素 */
    const fillRow = (row, r, plugin) => {
        if (r.icon) {
            const img = el('img', 'blk-icon');
            img.src = r.icon;
            img.alt = '';
            row.appendChild(img);
            row.appendChild(el('span', 'blk-sep'));
        }
        const parts = String(r.text).split(/(\[[A-Za-z0-9_]+\])/);
        parts.forEach(part => {
            const m = /^\[([A-Za-z0-9_]+)\]$/.exec(part);
            if (m) {
                const name = m[1];
                const def = r.argDefs[name];
                const val = r.argVals[name];
                if (!def && val === undefined) {
                    row.appendChild(el('span', 'blk-label', part));
                    return;
                }
                row.appendChild(renderInput(def, val, r.colors, plugin));
            } else if (part.trim()) {
                row.appendChild(el('span', 'blk-label', part.trim()));
            }
        });
    };

    const renderResolved = (r, plugin, opts) => {
        opts = opts || {};
        if (r.type === 'c') {
            const wrap = el('div', 'blk-c');
            setColors(wrap, r.colors);
            const head = el('div', 'blk c-head');
            setColors(head, r.colors);
            fillRow(head, r, plugin);
            wrap.appendChild(head);
            const mouth = (nodes) => {
                const m = el('div', 'c-mouth');
                m.appendChild(el('div', 'c-arm'));
                const inner = renderScript(nodes || [], plugin);
                inner.classList.add('c-inner');
                m.appendChild(inner);
                return m;
            };
            wrap.appendChild(mouth(r.body));
            if (r.elseBody) {
                const mid = el('div', 'blk c-mid');
                setColors(mid, r.colors);
                mid.appendChild(el('span', 'blk-label', r.elseText || '否則'));
                wrap.appendChild(mid);
                wrap.appendChild(mouth(r.elseBody));
            }
            wrap.appendChild(el('div', 'c-foot'));
            return wrap;
        }
        const b = el('div', `blk blk-${r.type}${opts.inline ? ' blk-inline' : ''}`);
        setColors(b, r.colors);
        fillRow(b, r, plugin);
        if (r.type === 'boolean' || r.type === 'reporter') {
            // 布林積木用兩層做出有邊框的六角形
            if (r.type === 'boolean') b.classList.add('blk-hex');
        }
        if (opts.href) {
            const a = el('a', 'blk-link');
            a.href = opts.href;
            a.appendChild(b);
            return a;
        }
        return b;
    };

    const renderScript = (nodes, plugin) => {
        const stack = el('div', 'stack');
        (nodes || []).forEach(n => {
            if (!n) return;
            stack.appendChild(renderResolved(resolve(n, plugin), plugin));
        });
        return stack;
    };

    /** 畫一塊插件積木（用資料檔的預設值） */
    const block = (def, plugin, opts) => {
        const r = {
            type: def.type,
            text: def.text,
            argDefs: def.args || {},
            argVals: {},
            colors: pluginColors(plugin),
            icon: plugin.blockIcon
        };
        return renderResolved(r, plugin, opts);
    };

    const script = (nodes, plugin) => {
        const ws = el('div', 'workspace');
        // 一段範例可以有多個並排的腳本：[[...], [...]]
        const scripts = Array.isArray(nodes[0]) ? nodes : [nodes];
        scripts.forEach(s => ws.appendChild(renderScript(s, plugin)));
        return ws;
    };

    window.OSEPBlocks = {block, script, pluginColors, CATS, shade};
}());
