// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/*
 * OSEP 插件說明網站主程式
 * 不需要伺服器：直接雙擊 index.html 就能開（所有資料都用 <script> 載入）。
 */
(function () {
    'use strict';

    /* ================= 語言 ================= */

    // 網址 ?lang=en|zh 優先，其次是上次選的（localStorage），預設中文
    const LANG = (() => {
        const m = /[?&]lang=(en|zh)\b/.exec(location.search);
        if (m) return m[1];
        try {
            const v = localStorage.getItem('osep-docs-lang');
            if (v === 'en' || v === 'zh') return v;
        } catch (e) {
            // 有些瀏覽器在 file:// 不能用 localStorage
        }
        return 'zh';
    })();
    window.OSEP_LANG = LANG;
    const EN = LANG === 'en';

    const UI = {
        zh: {
            siteTitle: 'OSEP 插件說明', sep: '｜',
            heroTitle: 'OSEP Scratch 插件說明書',
            heroText: '每個插件能做什麼、每一塊積木怎麼用、可以做出什麼作品，都整理在這裡。',
            searchPh: '搜尋插件或積木，例如：舞台、情緒、攝影機',
            stats: (p, b) => `<b>${p}</b> 個插件　·　<b>${b}</b> 塊積木`,
            addTitle: '新增插件說明',
            addText: '照著步驟，幾分鐘就能把新插件加進來',
            noPlugin: '沒有符合的插件',
            all: '全部',
            matchBlocks: '符合的積木',
            nBlocks: n => `${n} 塊`,
            noBlock: '沒有符合的積木，換個關鍵字試試',
            cardBlocks: n => `<b>${n}</b> 塊積木`,
            inputs: '參數', inputCol: '空格', typeCol: '類型', descCol: '說明',
            tMenuVar: '選單（可放變數）', tMenu: '選單', tNum: '數字', tBool: '布林', tColor: '顏色', tText: '文字',
            def: '預設：',
            returns: '回傳值', tip: '小提醒', usage: '用法',
            opcodeTitle: '程式內部名稱（opcode）',
            otherUi: '英文介面',
            noPluginId: id => `找不到插件「${id}」`,
            cardAlt: n => `${n} 卡片圖`,
            allPlugins: '所有插件',
            metaBlocks: n => `積木 <b>${n}</b> 塊`,
            author: '作者', updated: '更新',
            seeBlocks: '看所有積木', examples: '範例作品',
            overview: '概述', whatFor: '這個插件可以做什麼？',
            palette: '積木總覽',
            paletteText: '在 Scratch 的積木區看到的順序就是這樣。點一下積木可以跳到它的詳細說明。',
            detail: '積木詳解',
            exampleN: (i, t) => `範例 ${i}：${t}`,
            faq: '常見問題', changelog: '更新紀錄',
            prev: '← 上一個插件', next: '下一個插件 →',
            onThisPage: '本頁內容',
            cheatTitle: '積木速查',
            cheatLead: '所有插件的積木放在同一頁，方便上課時快速查找。點積木看完整說明。',
            guideTitle: '新增插件說明',
            notFound: '找不到頁面', home: '回到首頁',
            noRoute: x => `網址 #/${x} 不存在`,
            loadFail: '有插件資料載入失敗：',
            noFile: id => `找不到 plugins/${id}.js（檔名要和 list.js 裡寫的一樣，大小寫也要一樣）`,
            notAdded: id => `plugins/${id}.js 沒有成功加入：可能有語法錯誤，或 OSEP.addPlugin 裡的 id 不是「${id}」`,
            noId: '有一個資料檔呼叫了 OSEP.addPlugin，但沒有 id',
            lineErr: (f, n, m) => `${f} 第 ${n} 行：${m}`,
            navHome: '插件', navBlocks: '積木速查', navGuide: '新增插件',
            brandSub: '插件說明', brandSmall: 'Scratch 擴充功能',
            footer: 'OSEP 插件說明・資料放在 <code>plugins/</code> 資料夾，一個插件一個檔案',
            switchTo: 'English', switchTitle: 'Switch to English',
            untranslated: '',
            q: x => `「${x}」`
        },
        en: {
            siteTitle: 'OSEP Plugin Guide', sep: ' | ',
            heroTitle: 'OSEP Scratch Plugin Guide',
            heroText: 'What each plugin does, how every block works, and what you can make with them.',
            searchPh: 'Search plugins or blocks, e.g. stage, emotion, camera',
            stats: (p, b) => `<b>${p}</b> plugins　·　<b>${b}</b> blocks`,
            addTitle: 'Add a plugin page',
            addText: 'Follow the steps to add a new plugin in a few minutes',
            noPlugin: 'No matching plugins',
            all: 'All',
            matchBlocks: 'Matching blocks',
            nBlocks: n => `${n} block${n === 1 ? '' : 's'}`,
            noBlock: 'No matching blocks. Try another word.',
            cardBlocks: n => `<b>${n}</b> block${n === 1 ? '' : 's'}`,
            inputs: 'Inputs', inputCol: 'Input', typeCol: 'Type', descCol: 'Description',
            tMenuVar: 'Menu (accepts variables)', tMenu: 'Menu', tNum: 'Number', tBool: 'Boolean', tColor: 'Color', tText: 'Text',
            def: 'Default: ',
            returns: 'Returns', tip: 'Tip', usage: 'Example',
            opcodeTitle: 'Internal name (opcode)',
            otherUi: 'Chinese UI',
            noPluginId: id => `Plugin "${id}" not found`,
            cardAlt: n => `${n} card`,
            allPlugins: 'All plugins',
            metaBlocks: n => `<b>${n}</b> block${n === 1 ? '' : 's'}`,
            author: 'Author', updated: 'Updated',
            seeBlocks: 'See all blocks', examples: 'Examples',
            overview: 'Overview', whatFor: 'What does this plugin do?',
            palette: 'Blocks at a glance',
            paletteText: 'This is the order you see in the Scratch block palette. Click a block to jump to its description.',
            detail: 'Block reference',
            exampleN: (i, t) => `Example ${i}: ${t}`,
            faq: 'FAQ', changelog: 'Changelog',
            prev: '← Previous plugin', next: 'Next plugin →',
            onThisPage: 'On this page',
            cheatTitle: 'Block cheat sheet',
            cheatLead: 'Every plugin block on one page, for quick lookup in class. Click a block for its full description.',
            guideTitle: 'Add a plugin page',
            notFound: 'Page not found', home: 'Back to home',
            noRoute: x => `#/${x} does not exist`,
            loadFail: 'Some plugin data failed to load:',
            noFile: id => `plugins/${id}.js not found (the file name must match list.js exactly, including upper/lower case)`,
            notAdded: id => `plugins/${id}.js was not added: it may have a syntax error, or the id in OSEP.addPlugin is not "${id}"`,
            noId: 'A data file called OSEP.addPlugin without an id',
            lineErr: (f, n, m) => `${f} line ${n}: ${m}`,
            navHome: 'Plugins', navBlocks: 'Cheat sheet', navGuide: 'Add a plugin',
            brandSub: 'Plugin Guide', brandSmall: 'Scratch extensions',
            footer: 'OSEP Plugin Guide · data lives in the <code>plugins/</code> folder, one file per plugin',
            switchTo: '中文', switchTitle: '切換成中文',
            untranslated: 'This page has not been fully translated into English yet. Parts in Chinese are shown as they are.',
            q: x => `"${x}"`
        }
    };
    const T = (key, ...a) => {
        const v = UI[LANG][key] !== undefined ? UI[LANG][key] : UI.zh[key];
        return typeof v === 'function' ? v(...a) : v;
    };

    /* ================= 資料 ================= */

    const TYPE_NAMES = EN ? {
        command: 'Command block',
        reporter: 'Reporter block',
        boolean: 'Boolean block',
        hat: 'Hat block',
        c: 'C block',
        button: 'Button'
    } : {
        command: '指令積木',
        reporter: '數值積木',
        boolean: '布林積木',
        hat: '事件積木',
        c: '控制積木',
        button: '按鈕'
    };
    const TYPE_HINT = EN ? {
        command: 'Does something. Stacks above and below other blocks.',
        reporter: 'Gives back a value (text or number) to put inside another block.',
        boolean: 'Gives back true or false. Fits the hexagon slots of "if" and "wait until".',
        hat: 'Starts the script below it when something happens.',
        c: 'Wraps around other blocks.'
    } : {
        command: '執行一個動作，可以疊在其他積木上下',
        reporter: '回傳一個值（文字或數字），放進其他積木的空格裡使用',
        boolean: '回傳「是／否」（true / false），放進「如果」「等待直到」等六角形空格',
        hat: '條件成立時，自動開始執行底下的腳本',
        c: '把其他積木包在裡面'
    };

    const OSEP = window.OSEP = {
        plugins: [],
        errors: [],
        addPlugin (p) {
            if (!p || !p.id) {
                this.errors.push(T('noId'));
                return;
            }
            p.groups = p.groups || [];
            // 在積木區隱藏的積木（hidden: true）不顯示在網站上；資料檔裡仍保留說明，之後開放時改掉 hidden 即可
            p.hiddenBlocks = [];
            p.groups.forEach(g => {
                g.blocks = (g.blocks || []).filter(b => {
                    if (b.hidden) p.hiddenBlocks.push(b);
                    return !b.hidden;
                });
            });
            p.groups = p.groups.filter(g => g.blocks.length);
            p.tags = p.tags || [];
            p.needs = p.needs || [];
            this.plugins.push(p);
        },
        // 其他語言的說明：plugins/<id>.en.js 呼叫 OSEP.addText('<id>', 'en', {...})
        texts: {},
        addText (id, lang, t) {
            if (!id || !t) return;
            this.texts[`${id}:${lang}`] = t;
        },
        get (id) {
            return this.plugins.find(p => p.id === id);
        },
        findBlock (p, opcode) {
            for (const g of p.groups) {
                const b = g.blocks.find(x => x.opcode === opcode);
                if (b) return b;
            }
            return null;
        },
        blocksOf (p, includeHidden) {
            const out = [];
            p.groups.forEach(g => g.blocks.forEach(b => {
                if (includeHidden || !b.hidden) out.push(b);
            }));
            return out;
        }
    };

    /* ================= 工具 ================= */

    const $ = (sel, root) => (root || document).querySelector(sel);
    const esc = s => String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const h = (html) => {
        const t = document.createElement('template');
        t.innerHTML = html.trim();
        return t.content.firstElementChild;
    };
    const isTodo = s => !s || /^TODO/.test(String(s));

    /** 迷你 markdown：段落、**粗體**、`程式碼`、- 清單、> 提醒、> ! 警告、| 表格、[文字](網址)、[[opcode]] */
    const inline = (s, plugin) => esc(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\[\[([\w.]+)\]\]/g, (m, ref) => {
            let pid = plugin && plugin.id;
            let op = ref;
            if (ref.indexOf('.') > 0) [pid, op] = ref.split('.');
            const p = OSEP.get(pid);
            const b = p && OSEP.findBlock(p, op);
            if (!b) return `<code>${ref}</code>`;
            const label = b.text.replace(/\s*\[[A-Za-z0-9_]+\]\s*/g, ' ( ) ').replace(/\s+/g, ' ').trim();
            return `<a class="blkref" href="#/p/${pid}/${op}">${esc(T('q', label))}</a>`;
        })
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|#[^)\s]*)\)/g, '<a href="$2"$3>$1</a>'.replace('$3', ''));
    const md = (src, plugin) => {
        if (!src) return '';
        if (Array.isArray(src)) src = src.join('\n\n');
        // 標題、表格、清單前後不一定有空行，先補上
        const text = String(src).trim().replace(/^(###\s.*)$/gm, '\n$1\n')
            .replace(/([^\n|])\n(\s*\|)/g, '$1\n\n$2');
        return text.split(/\n\s*\n/).filter(b => b.trim()).map(block => {
            const lines = block.split('\n');
            if (lines.every(l => /^\s*-\s+/.test(l))) {
                return `<ul>${lines.map(l => `<li>${inline(l.replace(/^\s*-\s+/, ''), plugin)}</li>`).join('')}</ul>`;
            }
            if (lines.every(l => /^\s*\|/.test(l))) {
                const rows = lines.filter(l => !/^\s*\|[\s:|-]+\|\s*$/.test(l))
                    .map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
                const [head, ...body] = rows;
                return `<table><thead><tr>${head.map(c => `<th>${inline(c, plugin)}</th>`).join('')}</tr></thead>` +
                    `<tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c, plugin)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
            }
            if (/^>\s*!/.test(lines[0])) {
                return `<div class="note warn">${lines.map(l => inline(l.replace(/^>\s*!?\s?/, ''), plugin)).join('<br>')}</div>`;
            }
            if (/^>/.test(lines[0])) {
                return `<div class="note">${lines.map(l => inline(l.replace(/^>\s?/, ''), plugin)).join('<br>')}</div>`;
            }
            if (/^```/.test(lines[0])) {
                return `<pre><code>${esc(lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : undefined).join('\n'))}</code></pre>`;
            }
            if (/^###\s/.test(lines[0])) {
                return `<h3>${inline(lines[0].replace(/^###\s/, ''), plugin)}</h3>${lines.length > 1 ? `<p>${lines.slice(1).map(l => inline(l, plugin)).join('<br>')}</p>` : ''}`;
            }
            return `<p>${lines.map(l => inline(l, plugin)).join('<br>')}</p>`;
        }).join('');
    };

    const NEED_ICONS = {網路: '🌐', 攝影機: '📷', 麥克風: '🎤', 金鑰: '🔑', 硬體: '🔌',
        internet: '🌐', camera: '📷', webcam: '📷', microphone: '🎤', key: '🔑', hardware: '🔌'};
    const needChip = n => {
        const icon = Object.keys(NEED_ICONS).find(k => n.toLowerCase().indexOf(k) >= 0);
        return `<span class="need">${icon ? NEED_ICONS[icon] : '•'} ${esc(n)}</span>`;
    };

    const plainText = s => String(s || '').replace(/\[\[([\w.]+)\]\]/g, '$1').replace(/[*`>|]/g, '');

    /* ================= 星空 ================= */

    const starsSvg = (w, hgt, n, seed) => {
        let s = seed || 7;
        const rnd = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
        let c = '';
        for (let i = 0; i < n; i++) {
            c += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * hgt).toFixed(1)}" r="${(1 + rnd() * 1.8).toFixed(2)}" fill="#fff" opacity="${(0.3 + rnd() * 0.6).toFixed(2)}"/>`;
        }
        const star = (x, y, r) => `<path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="#FFD84D"/>`;
        c += star(w * 0.86, hgt * 0.2, 9) + star(w * 0.1, hgt * 0.75, 6) + star(w * 0.62, hgt * 0.88, 5);
        return `<svg class="hero-stars" viewBox="0 0 ${w} ${hgt}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${c}</svg>`;
    };

    /* ================= 頁面 ================= */

    const app = () => $('#app');
    const setNav = name => {
        document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
    };
    const totalBlocks = () => OSEP.plugins.reduce((n, p) => n + OSEP.blocksOf(p).length, 0);
    const allTags = () => {
        const set = [];
        OSEP.plugins.forEach(p => p.tags.forEach(t => {
            if (!isTodo(t) && set.indexOf(t) < 0) set.push(t);
        }));
        return set;
    };

    let homeState = {q: '', tag: ''};

    const renderHome = () => {
        setNav('home');
        document.title = T('siteTitle');
        const root = app();
        root.innerHTML = '';
        root.appendChild(h(`
            <div class="hero">
                ${starsSvg(1400, 420, 70, 11)}
                <div class="hero-orbit"></div>
                <div class="hero-inner">
                    <h1>${esc(T('heroTitle'))}<span class="spark"> ✦</span></h1>
                    <p>${esc(T('heroText'))}</p>
                    <div class="search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                        <input id="q" type="search" placeholder="${esc(T('searchPh'))}" autocomplete="off" value="${esc(homeState.q)}">
                    </div>
                    <div class="hero-stats">${T('stats', OSEP.plugins.length, totalBlocks())}</div>
                </div>
            </div>`));
        const body = h('<div class="wrap"></div>');
        root.appendChild(body);

        const draw = () => {
            body.innerHTML = '';
            const q = homeState.q.trim().toLowerCase();
            const tags = allTags();
            const list = OSEP.plugins.filter(p => {
                if (homeState.tag && p.tags.indexOf(homeState.tag) < 0) return false;
                if (!q) return true;
                const hay = [p.name, p.subName, p.tagline, p.overview, p.tags.join(' ')].join(' ').toLowerCase();
                return hay.indexOf(q) >= 0;
            });

            const grid = h('<div class="grid"></div>');
            list.forEach(p => grid.appendChild(pluginCard(p)));
            if (!q && !homeState.tag) {
                grid.appendChild(h(`<a class="pcard add" href="#/guide"><div><div class="plus">＋</div><b>${esc(T('addTitle'))}</b><br><span>${esc(T('addText'))}</span></div></a>`));
            }
            body.appendChild(grid);
            if (!list.length) body.appendChild(h(`<div class="empty">${esc(T('noPlugin'))}</div>`));

            if (tags.length > 1 && !q) {
                const chips = h(`<div class="chips" style="margin-top:22px"></div>`);
                [''].concat(tags).forEach(t => {
                    const c = h(`<button class="chip${homeState.tag === t ? ' on' : ''}">${t ? esc(t) : esc(T('all'))}</button>`);
                    c.onclick = () => {
                        homeState.tag = t;
                        draw();
                    };
                    chips.appendChild(c);
                });
                body.insertBefore(chips, grid.nextSibling);
            }

            if (q) {
                const hits = [];
                OSEP.plugins.forEach(p => OSEP.blocksOf(p, true).forEach(b => {
                    const hay = [b.text, b.otherText, b.opcode, b.summary, plainText(b.detail),
                        Object.keys(b.args || {}).map(k => [(b.args[k].options || []).join(' '), b.args[k].desc].join(' ')).join(' ')]
                        .join(' ').toLowerCase();
                    if (hay.indexOf(q) >= 0) hits.push({p, b});
                }));
                const res = h(`<div class="results"><div class="section-title"><h2>${esc(T('matchBlocks'))}</h2><span>${esc(T('nBlocks', hits.length))}</span></div></div>`);
                hits.forEach(({p, b}) => {
                    const a = h(`<a class="result" href="#/p/${p.id}/${b.opcode}"><div class="r-block"></div><div class="r-text"><b>${esc(p.name)}</b>${esc(isTodo(b.summary) ? '' : b.summary)}</div></a>`);
                    $('.r-block', a).appendChild(OSEPBlocks.block(b, p));
                    res.appendChild(a);
                });
                if (!hits.length) res.appendChild(h(`<div class="empty">${esc(T('noBlock'))}</div>`));
                body.appendChild(res);
            }
        };
        draw();
        const input = $('#q');
        input.addEventListener('input', () => {
            homeState.q = input.value;
            draw();
        });
        if (homeState.q) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    };

    const pluginCard = p => {
        const n = OSEP.blocksOf(p).length;
        return h(`
            <a class="pcard" href="#/p/${p.id}">
                <img class="pcard-img" src="${esc(p.card)}" alt="" onerror="this.style.visibility='hidden'">
                <div class="pcard-body">
                    <div class="pcard-title">
                        ${p.icon ? `<img src="${esc(p.icon)}" alt="" onerror="this.remove()">` : ''}
                        <div><h3>${esc(p.name)}</h3>${p.subName && p.subName !== p.name ? `<div class="en">${esc(p.subName)}</div>` : ''}</div>
                    </div>
                    <p>${esc(isTodo(p.tagline) ? '' : p.tagline)}</p>
                    <div>${p.tags.filter(t => !isTodo(t)).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
                    <div class="pcard-foot"><span>${T('cardBlocks', n)}</span><span>${p.needs.map(x => esc(x)).join('・')}</span></div>
                </div>
            </a>`);
    };

    /* ---------- 插件頁 ---------- */

    const argRows = (b, plugin) => {
        const names = Object.keys(b.args || {});
        if (!names.length) return '';
        const typeName = a => (a.type === 'menu' ? (a.acceptReporters ? T('tMenuVar') : T('tMenu')) :
            a.type === 'number' ? T('tNum') : a.type === 'boolean' ? T('tBool') : a.type === 'color' ? T('tColor') : T('tText'));
        return `<h5>${esc(T('inputs'))}</h5><table class="args"><thead><tr><th>${esc(T('inputCol'))}</th><th>${esc(T('typeCol'))}</th><th>${esc(T('descCol'))}</th></tr></thead><tbody>${
            names.map(k => {
                const a = b.args[k];
                const opts = a.options ? `<div>${a.options.map(o => `<span class="opt">${esc(o)}</span>`).join('')}</div>` : '';
                const def = a.value !== undefined && String(a.value).trim() !== '' ? `<div style="font-size:13.5px;color:var(--ink-3)">${esc(T('def'))}${esc(a.value)}</div>` : '';
                return `<tr><td><code>${esc(k)}</code></td><td>${typeName(a)}</td><td>${isTodo(a.desc) ? '' : `<div class="prose">${md(a.desc, plugin)}</div>`}${opts}${def}</td></tr>`;
            }).join('')
        }</tbody></table>`;
    };

    const blockCard = (b, p) => {
        const card = h(`
            <article class="bcard" id="b-${b.opcode}">
                <div class="bcard-top">
                    <div class="blk-area"></div>
                    <span class="btype${b.hidden ? ' hidden' : ''}" title="${esc(TYPE_HINT[b.type] || '')}">${TYPE_NAMES[b.type] || b.type}</span>
                </div>
                <div class="bcard-body">
                    ${isTodo(b.summary) ? '' : `<p class="summary">${inline(b.summary, p)}</p>`}
                    <div class="prose">${md(b.detail, p)}</div>
                    ${argRows(b, p)}
                    ${b.returns ? `<h5>${esc(T('returns'))}</h5><div class="returns prose">${md(b.returns, p)}</div>` : ''}
                    ${b.tips ? `<h5>${esc(T('tip'))}</h5><div class="prose">${md(b.tips, p)}</div>` : ''}
                    <div class="ex-slot"></div>
                    <div class="opcode" title="${esc(T('opcodeTitle'))}">opcode: ${esc(b.opcode)}${b.otherText ? `　·　${esc(T('otherUi'))}: ${esc(b.otherText)}` : ''}</div>
                </div>
            </article>`);
        $('.blk-area', card).appendChild(OSEPBlocks.block(b, p));
        if (b.example) {
            const slot = $('.ex-slot', card);
            slot.appendChild(h(`<h5>${esc(T('usage'))}</h5>`));
            slot.appendChild(OSEPBlocks.script(b.example, p));
        }
        return card;
    };

    const renderPlugin = (id, opcode) => {
        const p = OSEP.get(id);
        if (!p) return renderNotFound(T('noPluginId', id));
        setNav('home');
        document.title = `${p.name}${T('sep')}${T('siteTitle')}`;
        const root = app();
        root.innerHTML = '';
        const visible = OSEP.blocksOf(p);

        root.appendChild(h(`
            <div class="p-hero">
                ${starsSvg(1400, 380, 55, id.length * 13)}
                <div class="p-hero-inner">
                    <img class="card" src="${esc(p.card)}" alt="${esc(T('cardAlt', p.name))}" onerror="this.style.visibility='hidden'">
                    <div>
                        <div class="crumb"><a href="#/">${esc(T('allPlugins'))}</a> ／</div>
                        <h1>${esc(p.name)}</h1>
                        ${p.subName && p.subName !== p.name ? `<div class="en">${esc(p.subName)}</div>` : ''}
                        <div class="tagline">${esc(isTodo(p.tagline) ? '' : p.tagline)}</div>
                        <div>${p.tags.filter(t => !isTodo(t)).map(t => `<span class="tag">${esc(t)}</span>`).join('')}${p.needs.map(needChip).join('')}</div>
                        <div class="meta">
                            <span>${T('metaBlocks', visible.length)}</span>
                            ${p.author ? `<span>${esc(T('author'))} <b>${esc(p.author)}</b></span>` : ''}
                            ${p.updated ? `<span>${esc(T('updated'))} <b>${esc(p.updated)}</b></span>` : ''}
                        </div>
                        <div class="btns">
                            <a class="btn" href="#/p/${p.id}/@blocks">${esc(T('seeBlocks'))}</a>
                            ${p.examples && p.examples.length ? `<a class="btn ghost" href="#/p/${p.id}/@examples">${esc(T('examples'))}</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>`));

        const layout = h('<div class="p-layout"><nav class="toc"></nav><main class="p-main"></main></div>');
        root.appendChild(layout);
        const toc = $('.toc', layout);
        const main = $('.p-main', layout);
        const tocItems = [];
        const addToc = (anchor, label, sub) => tocItems.push(`<a href="#/p/${p.id}/@${anchor}" data-a="${anchor}" class="${sub ? 'sub' : ''}">${esc(label)}</a>`);
        if (EN && p.untranslated) main.appendChild(h(`<div class="note">${esc(T('untranslated'))}</div>`));

        // 概述
        if (!isTodo(p.overview) || (p.highlights && p.highlights.length)) {
            addToc('overview', T('overview'));
            const sec = h(`<section id="s-overview"><h2>${esc(T('whatFor'))}</h2><div class="prose">${isTodo(p.overview) ? '' : md(p.overview, p)}</div></section>`);
            if (p.highlights && p.highlights.length) {
                sec.appendChild(h(`<div class="highlights">${p.highlights.map(x => `<div class="hl"><div class="hl-icon">${esc(x.icon || '✦')}</div><h4>${esc(x.title)}</h4><p>${inline(x.text, p)}</p></div>`).join('')}</div>`));
            }
            main.appendChild(sec);
        }

        // 積木總覽
        addToc('blocks', T('palette'));
        const pal = h(`<section id="s-blocks"><h2>${esc(T('palette'))} <span class="num">${visible.length}</span></h2><p class="prose">${esc(T('paletteText'))}</p><div class="palette"></div></section>`);
        const palEl = $('.palette', pal);
        p.groups.forEach((g, gi) => {
            const box = h(`<div class="palette-group"><h4>${gi + 1}. ${esc(g.name)}</h4></div>`);
            g.blocks.forEach(b => {
                const item = h('<div class="pal-item"></div>');
                item.appendChild(OSEPBlocks.block(b, p, {href: `#/p/${p.id}/${b.opcode}`}));
                box.appendChild(item);
            });
            palEl.appendChild(box);
        });
        main.appendChild(pal);

        // 積木詳解
        const detail = h(`<section id="s-detail"><h2>${esc(T('detail'))}</h2></section>`);
        p.groups.forEach((g, gi) => {
            const anchor = `g${gi + 1}`;
            addToc(anchor, g.name, true);
            const head = h(`<div class="group-head" id="s-${anchor}"><h3><span class="gnum">${gi + 1}</span>${esc(g.name)}</h3>${g.intro ? `<div class="prose">${md(g.intro, p)}</div>` : ''}</div>`);
            detail.appendChild(head);
            g.blocks.forEach(b => detail.appendChild(blockCard(b, p)));
        });
        main.appendChild(detail);

        // 範例
        if (p.examples && p.examples.length) {
            addToc('examples', T('examples'));
            const sec = h(`<section id="s-examples"><h2>${esc(T('examples'))}</h2></section>`);
            p.examples.forEach((ex, i) => {
                const e = h(`<div class="example"><div class="example-head"><h3>${esc(T('exampleN', i + 1, ex.title))}</h3>${ex.intro ? `<div class="prose">${md(ex.intro, p)}</div>` : ''}</div><div class="example-body"></div></div>`);
                const body = $('.example-body', e);
                body.appendChild(OSEPBlocks.script(ex.script || [], p));
                if (ex.explain) body.appendChild(h(`<div class="prose">${md(ex.explain, p)}</div>`));
                sec.appendChild(e);
            });
            main.appendChild(sec);
        }

        // FAQ
        if (p.faq && p.faq.length) {
            addToc('faq', T('faq'));
            main.appendChild(h(`<section id="s-faq" class="faq"><h2>${esc(T('faq'))}</h2>${p.faq.map(f => `<details><summary>${esc(f.q)}</summary><div class="prose">${md(f.a, p)}</div></details>`).join('')}</section>`));
        }

        // 更新紀錄
        if (p.changelog && p.changelog.length) {
            addToc('changelog', T('changelog'));
            main.appendChild(h(`<section id="s-changelog"><h2>${esc(T('changelog'))}</h2><ul class="changelog">${p.changelog.map(c => `<li><time>${esc(c.date)}</time>${inline(c.text, p)}</li>`).join('')}</ul></section>`));
        }

        // 上一個／下一個
        const idx = OSEP.plugins.indexOf(p);
        const prev = OSEP.plugins[idx - 1];
        const next = OSEP.plugins[idx + 1];
        main.appendChild(h(`<div class="pager">${prev ? `<a href="#/p/${prev.id}"><small>${esc(T('prev'))}</small>${esc(prev.name)}</a>` : ''}${next ? `<a class="next" href="#/p/${next.id}"><small>${esc(T('next'))}</small>${esc(next.name)}</a>` : ''}</div>`));

        toc.innerHTML = `<div class="toc-h">${esc(T('onThisPage'))}</div>${tocItems.join('')}`;
        setupScrollSpy(toc);

        // 跳到指定位置
        if (opcode) {
            const target = opcode.charAt(0) === '@' ? document.getElementById(`s-${opcode.slice(1)}`) : document.getElementById(`b-${opcode}`);
            if (target) {
                requestAnimationFrame(() => {
                    target.scrollIntoView({behavior: 'instant', block: 'start'});
                    if (target.classList.contains('bcard')) {
                        target.classList.add('flash');
                        setTimeout(() => target.classList.remove('flash'), 1600);
                    }
                });
                return;
            }
        }
        window.scrollTo({top: 0, behavior: 'instant'});
    };

    let spyHandler = null;
    const setupScrollSpy = toc => {
        if (spyHandler) window.removeEventListener('scroll', spyHandler);
        const links = Array.from(toc.querySelectorAll('a[data-a]'));
        spyHandler = () => {
            let current = null;
            links.forEach(a => {
                const t = document.getElementById(`s-${a.dataset.a}`);
                if (t && t.getBoundingClientRect().top < 200) current = a;
            });
            links.forEach(a => a.classList.toggle('on', a === current));
        };
        window.addEventListener('scroll', spyHandler, {passive: true});
        spyHandler();
    };

    /* ---------- 積木速查 ---------- */

    const renderCheat = () => {
        setNav('blocks');
        document.title = `${T('cheatTitle')}${T('sep')}${T('siteTitle')}`;
        const root = app();
        root.innerHTML = '';
        const doc = h(`<div class="doc" style="max-width:1240px"><h1>${esc(T('cheatTitle'))}</h1><p class="lead">${esc(T('cheatLead'))}</p></div>`);
        OSEP.plugins.forEach(p => {
            doc.appendChild(h(`<div class="cheat-plugin">${p.icon ? `<img src="${esc(p.icon)}" alt="">` : ''}<h2><a href="#/p/${p.id}" style="color:inherit;text-decoration:none">${esc(p.name)}</a></h2></div>`));
            const grid = h('<div class="cheat"></div>');
            OSEP.blocksOf(p).forEach(b => {
                const a = h(`<a href="#/p/${p.id}/${b.opcode}"><div class="c-blk"></div><div class="c-sum">${esc(isTodo(b.summary) ? '' : b.summary)}</div></a>`);
                $('.c-blk', a).appendChild(OSEPBlocks.block(b, p));
                grid.appendChild(a);
            });
            doc.appendChild(grid);
        });
        root.appendChild(doc);
        window.scrollTo({top: 0, behavior: 'instant'});
    };

    /* ---------- 新增插件指南 ---------- */

    const renderGuide = () => {
        setNav('guide');
        document.title = `${T('guideTitle')}${T('sep')}${T('siteTitle')}`;
        const root = app();
        root.innerHTML = '';
        root.appendChild(h(`<div class="doc">${(EN && window.OSEP_GUIDE_HTML_EN) || window.OSEP_GUIDE_HTML || '<p>assets/guide.js not found</p>'}</div>`));
        // 指南裡的示範積木
        document.querySelectorAll('[data-demo-script]').forEach(slot => {
            try {
                const nodes = JSON.parse(slot.getAttribute('data-demo-script'));
                const p = OSEP.get(slot.getAttribute('data-plugin')) || {id: '', color: {}};
                slot.appendChild(OSEPBlocks.script(nodes, p));
            } catch (e) {
                slot.textContent = EN ? 'Demo block data is invalid' : '示範積木格式錯誤';
            }
        });
        window.scrollTo({top: 0, behavior: 'instant'});
    };

    const renderNotFound = msg => {
        app().innerHTML = `<div class="doc"><h1>${esc(T('notFound'))}</h1><p class="lead">${esc(msg)}</p><p><a href="#/">${esc(T('home'))}</a></p></div>`;
    };

    /* ================= 路由 ================= */

    let currentPlugin = null;
    const scrollToAnchor = anchor => {
        const target = anchor.charAt(0) === '@' ? document.getElementById(`s-${anchor.slice(1)}`) : document.getElementById(`b-${anchor}`);
        if (!target) return false;
        target.scrollIntoView({behavior: 'smooth', block: 'start'});
        if (target.classList.contains('bcard')) {
            target.classList.add('flash');
            setTimeout(() => target.classList.remove('flash'), 1600);
        }
        return true;
    };
    const route = () => {
        const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
        const parts = hash.split('/').filter(Boolean);
        if (parts[0] === 'p' && parts[1] && parts[1] === currentPlugin && parts[2] && scrollToAnchor(parts[2])) return;
        currentPlugin = parts[0] === 'p' ? parts[1] : null;
        if (!parts.length) return renderHome();
        if (parts[0] === 'p' && parts[1]) return renderPlugin(parts[1], parts[2]);
        if (parts[0] === 'blocks') return renderCheat();
        if (parts[0] === 'guide') return renderGuide();
        return renderNotFound(T('noRoute', hash));
    };

    /* ================= 載入插件資料檔 ================= */

    window.addEventListener('error', e => {
        if (e.filename && /\/plugins\//.test(e.filename)) {
            OSEP.errors.push(T('lineErr', e.filename.split('/plugins/')[1], e.lineno, e.message));
        }
    });

    const loadScript = src => new Promise(resolve => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
    });

    /**
     * 把插件資料換成目前的語言。
     * 英文：積木文字用 textEn、選單和預設值用 optionsEn／valueEn（插件自己的英文翻譯），
     * 說明文字用 plugins/<id>.en.js；英文沒寫的說明保留中文，並在頁面上方提示。
     */
    const localize = p => {
        p.subName = p.nameEn;
        OSEP.blocksOf(p).forEach(b => {
            b.otherText = b.textEn;
        });
        if (!EN) return;
        const t = OSEP.texts[`${p.id}:en`] || {};
        let missing = !OSEP.texts[`${p.id}:en`];
        p.subName = p.name;
        p.name = p.nameEn || p.name;
        ['tagline', 'overview', 'highlights', 'tags', 'needs', 'examples', 'faq', 'changelog'].forEach(k => {
            if (t[k] !== undefined) p[k] = t[k];
            else if (p[k] && (!Array.isArray(p[k]) || p[k].length)) missing = true;
        });
        const tg = t.groups || [];
        p.groups.forEach((g, i) => {
            const x = tg[i] || {};
            if (x.name) g.name = x.name;
            else missing = true;
            g.intro = x.intro !== undefined ? x.intro : g.intro;
        });
        const tb = t.blocks || {};
        OSEP.blocksOf(p).forEach(b => {
            b.otherText = b.text;
            b.text = b.textEn || b.text;
            const x = tb[b.opcode];
            if (!x) missing = true;
            Object.keys(b.args || {}).forEach(k => {
                const a = b.args[k];
                if (a.optionsEn) a.options = a.optionsEn;
                if (a.valueEn !== undefined) a.value = a.valueEn;
                const d = x && x.args && x.args[k];
                if (d) a.desc = d;
            });
            ['summary', 'detail', 'returns', 'tips'].forEach(k => {
                if (x && x[k] !== undefined) b[k] = x[k];
            });
            // 範例積木裡有中文的內建積木，英文沒寫範例時就不顯示
            b.example = x && x.example;
        });
        p.untranslated = missing;
    };

    const setupChrome = () => {
        document.documentElement.lang = EN ? 'en' : 'zh-Hant-TW';
        const set = (sel, html) => {
            const e = $(sel);
            if (e) e.innerHTML = html;
        };
        set('.nav a[data-nav="home"]', esc(T('navHome')));
        set('.nav a[data-nav="blocks"]', esc(T('navBlocks')));
        set('.nav a[data-nav="guide"]', esc(T('navGuide')));
        set('.brand .bt', esc(T('brandSub')));
        set('.brand small', esc(T('brandSmall')));
        set('.footer', T('footer'));
        const nav = $('.nav');
        if (nav && !$('.lang-btn', nav)) {
            const btn = h(`<button class="lang-btn" type="button" title="${esc(T('switchTitle'))}" lang="${EN ? 'zh-Hant-TW' : 'en'}">${esc(T('switchTo'))}</button>`);
            btn.onclick = () => {
                const next = EN ? 'zh' : 'en';
                try {
                    localStorage.setItem('osep-docs-lang', next);
                } catch (e) {
                    // 存不了也沒關係，網址上有 ?lang=
                }
                const search = location.search.replace(/[?&]lang=(en|zh)\b/g, '').replace(/^&/, '?');
                location.href = `${location.pathname}${search ? `${search}&` : '?'}lang=${next}${location.hash}`;
            };
            nav.appendChild(btn);
        }
    };

    const boot = () => {
        setupChrome();
        const list = window.OSEP_PLUGIN_LIST || [];
        let chain = Promise.resolve();
        list.forEach(id => {
            chain = chain.then(() => loadScript(`plugins/${id}.js`)).then(ok => {
                if (!ok) OSEP.errors.push(T('noFile', id));
                else if (!OSEP.get(id)) OSEP.errors.push(T('notAdded', id));
            });
            // 英文說明是另一個檔案，沒有也沒關係（顯示中文）
            if (EN) chain = chain.then(() => loadScript(`plugins/${id}.en.js`));
        });
        chain.then(() => {
            // 依 list.js 的順序排列
            OSEP.plugins.sort((a, b) => list.indexOf(a.id) - list.indexOf(b.id));
            OSEP.plugins.forEach(localize);
            if (OSEP.errors.length) {
                $('#loadwarn').innerHTML = `<div class="note warn"><b>${esc(T('loadFail'))}</b><br>${OSEP.errors.map(esc).join('<br>')}</div>`;
            }
            window.addEventListener('hashchange', route);
            route();
        });
    };

    document.addEventListener('DOMContentLoaded', boot);
}());
