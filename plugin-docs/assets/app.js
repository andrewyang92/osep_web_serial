/*
 * OSEP 插件說明網站主程式
 * 不需要伺服器：直接雙擊 index.html 就能開（所有資料都用 <script> 載入）。
 */
(function () {
    'use strict';

    /* ================= 資料 ================= */

    const TYPE_NAMES = {
        command: '指令積木',
        reporter: '數值積木',
        boolean: '布林積木',
        hat: '事件積木',
        c: '控制積木',
        button: '按鈕'
    };
    const TYPE_HINT = {
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
                this.errors.push('有一個資料檔呼叫了 OSEP.addPlugin，但沒有 id');
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
            return `<a class="blkref" href="#/p/${pid}/${op}">「${esc(label)}」</a>`;
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

    const NEED_ICONS = {網路: '🌐', 攝影機: '📷', 麥克風: '🎤', 金鑰: '🔑', 硬體: '🔌'};
    const needChip = n => {
        const icon = Object.keys(NEED_ICONS).find(k => n.indexOf(k) >= 0);
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
        document.title = 'OSEP 插件說明';
        const root = app();
        root.innerHTML = '';
        root.appendChild(h(`
            <div class="hero">
                ${starsSvg(1400, 420, 70, 11)}
                <div class="hero-orbit"></div>
                <div class="hero-inner">
                    <h1>OSEP Scratch 插件說明書<span class="spark"> ✦</span></h1>
                    <p>每個插件能做什麼、每一塊積木怎麼用、可以做出什麼作品，都整理在這裡。</p>
                    <div class="search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                        <input id="q" type="search" placeholder="搜尋插件或積木，例如：舞台、情緒、攝影機" autocomplete="off" value="${esc(homeState.q)}">
                    </div>
                    <div class="hero-stats"><b>${OSEP.plugins.length}</b> 個插件　·　<b>${totalBlocks()}</b> 塊積木</div>
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
                const hay = [p.name, p.nameEn, p.tagline, p.overview, p.tags.join(' ')].join(' ').toLowerCase();
                return hay.indexOf(q) >= 0;
            });

            const grid = h('<div class="grid"></div>');
            list.forEach(p => grid.appendChild(pluginCard(p)));
            if (!q && !homeState.tag) {
                grid.appendChild(h(`<a class="pcard add" href="#/guide"><div><div class="plus">＋</div><b>新增插件說明</b><br><span>照著步驟，幾分鐘就能把新插件加進來</span></div></a>`));
            }
            body.appendChild(grid);
            if (!list.length) body.appendChild(h('<div class="empty">沒有符合的插件</div>'));

            if (tags.length > 1 && !q) {
                const chips = h(`<div class="chips" style="margin-top:22px"></div>`);
                [''].concat(tags).forEach(t => {
                    const c = h(`<button class="chip${homeState.tag === t ? ' on' : ''}">${t ? esc(t) : '全部'}</button>`);
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
                    const hay = [b.text, b.textEn, b.opcode, b.summary, plainText(b.detail),
                        Object.keys(b.args || {}).map(k => [(b.args[k].options || []).join(' '), b.args[k].desc].join(' ')).join(' ')]
                        .join(' ').toLowerCase();
                    if (hay.indexOf(q) >= 0) hits.push({p, b});
                }));
                const res = h(`<div class="results"><div class="section-title"><h2>符合的積木</h2><span>${hits.length} 塊</span></div></div>`);
                hits.forEach(({p, b}) => {
                    const a = h(`<a class="result" href="#/p/${p.id}/${b.opcode}"><div class="r-block"></div><div class="r-text"><b>${esc(p.name)}</b>${esc(isTodo(b.summary) ? '' : b.summary)}</div></a>`);
                    $('.r-block', a).appendChild(OSEPBlocks.block(b, p));
                    res.appendChild(a);
                });
                if (!hits.length) res.appendChild(h('<div class="empty">沒有符合的積木，換個關鍵字試試</div>'));
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
                        <div><h3>${esc(p.name)}</h3>${p.nameEn && p.nameEn !== p.name ? `<div class="en">${esc(p.nameEn)}</div>` : ''}</div>
                    </div>
                    <p>${esc(isTodo(p.tagline) ? '' : p.tagline)}</p>
                    <div>${p.tags.filter(t => !isTodo(t)).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
                    <div class="pcard-foot"><span><b>${n}</b> 塊積木</span><span>${p.needs.map(x => esc(x)).join('・')}</span></div>
                </div>
            </a>`);
    };

    /* ---------- 插件頁 ---------- */

    const argRows = (b, plugin) => {
        const names = Object.keys(b.args || {});
        if (!names.length) return '';
        const typeName = a => (a.type === 'menu' ? (a.acceptReporters ? '選單（可放變數）' : '選單') :
            a.type === 'number' ? '數字' : a.type === 'boolean' ? '布林' : a.type === 'color' ? '顏色' : '文字');
        return `<h5>參數</h5><table class="args"><thead><tr><th>空格</th><th>類型</th><th>說明</th></tr></thead><tbody>${
            names.map(k => {
                const a = b.args[k];
                const opts = a.options ? `<div>${a.options.map(o => `<span class="opt">${esc(o)}</span>`).join('')}</div>` : '';
                const def = a.value !== undefined && String(a.value).trim() !== '' ? `<div style="font-size:13.5px;color:var(--ink-3)">預設：${esc(a.value)}</div>` : '';
                return `<tr><td><code>${esc(k)}</code></td><td>${typeName(a)}</td><td>${isTodo(a.desc) ? '' : `<div class="prose">${md(a.desc, plugin)}</div>`}${opts}${def}</td></tr>`;
            }).join('')
        }</tbody></table>`;
    };

    const blockCard = (b, p) => {
        const card = h(`
            <article class="bcard" id="b-${b.opcode}">
                <div class="bcard-top">
                    <div class="blk-area"></div>
                    <span class="btype${b.hidden ? ' hidden' : ''}" title="${esc(TYPE_HINT[b.type] || '')}">${b.hidden ? '已隱藏・' : ''}${TYPE_NAMES[b.type] || b.type}</span>
                </div>
                <div class="bcard-body">
                    ${isTodo(b.summary) ? '' : `<p class="summary">${inline(b.summary, p)}</p>`}
                    <div class="prose">${md(b.detail, p)}</div>
                    ${argRows(b, p)}
                    ${b.returns ? `<h5>回傳值</h5><div class="returns prose">${md(b.returns, p)}</div>` : ''}
                    ${b.tips ? `<h5>小提醒</h5><div class="prose">${md(b.tips, p)}</div>` : ''}
                    <div class="ex-slot"></div>
                    <div class="opcode" title="程式內部名稱（opcode）">opcode：${esc(b.opcode)}${b.textEn ? `　·　English：${esc(b.textEn)}` : ''}</div>
                </div>
            </article>`);
        $('.blk-area', card).appendChild(OSEPBlocks.block(b, p));
        if (b.example) {
            const slot = $('.ex-slot', card);
            slot.appendChild(h('<h5>用法</h5>'));
            slot.appendChild(OSEPBlocks.script(b.example, p));
        }
        return card;
    };

    const renderPlugin = (id, opcode) => {
        const p = OSEP.get(id);
        if (!p) return renderNotFound(`找不到插件「${id}」`);
        setNav('home');
        document.title = `${p.name}｜OSEP 插件說明`;
        const root = app();
        root.innerHTML = '';
        const visible = OSEP.blocksOf(p);
        const hiddenCount = OSEP.blocksOf(p, true).length - visible.length;

        root.appendChild(h(`
            <div class="p-hero">
                ${starsSvg(1400, 380, 55, id.length * 13)}
                <div class="p-hero-inner">
                    <img class="card" src="${esc(p.card)}" alt="${esc(p.name)} 卡片圖" onerror="this.style.visibility='hidden'">
                    <div>
                        <div class="crumb"><a href="#/">所有插件</a> ／</div>
                        <h1>${esc(p.name)}</h1>
                        ${p.nameEn && p.nameEn !== p.name ? `<div class="en">${esc(p.nameEn)}</div>` : ''}
                        <div class="tagline">${esc(isTodo(p.tagline) ? '' : p.tagline)}</div>
                        <div>${p.tags.filter(t => !isTodo(t)).map(t => `<span class="tag">${esc(t)}</span>`).join('')}${p.needs.map(needChip).join('')}</div>
                        <div class="meta">
                            <span>積木 <b>${visible.length}</b> 塊${hiddenCount ? `（另有 ${hiddenCount} 塊隱藏）` : ''}</span>
                            ${p.author ? `<span>作者 <b>${esc(p.author)}</b></span>` : ''}
                            ${p.updated ? `<span>更新 <b>${esc(p.updated)}</b></span>` : ''}
                        </div>
                        <div class="btns">
                            <a class="btn" href="#/p/${p.id}/@blocks">看所有積木</a>
                            ${p.examples && p.examples.length ? `<a class="btn ghost" href="#/p/${p.id}/@examples">範例作品</a>` : ''}
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

        // 概述
        if (!isTodo(p.overview) || (p.highlights && p.highlights.length)) {
            addToc('overview', '概述');
            const sec = h(`<section id="s-overview"><h2>這個插件可以做什麼？</h2><div class="prose">${isTodo(p.overview) ? '' : md(p.overview, p)}</div></section>`);
            if (p.highlights && p.highlights.length) {
                sec.appendChild(h(`<div class="highlights">${p.highlights.map(x => `<div class="hl"><div class="hl-icon">${esc(x.icon || '✦')}</div><h4>${esc(x.title)}</h4><p>${inline(x.text, p)}</p></div>`).join('')}</div>`));
            }
            main.appendChild(sec);
        }

        // 積木總覽
        addToc('blocks', '積木總覽');
        const pal = h(`<section id="s-blocks"><h2>積木總覽 <span class="num">${visible.length}</span></h2><p class="prose">在 Scratch 的積木區看到的順序就是這樣。點一下積木可以跳到它的詳細說明。</p><div class="palette"></div></section>`);
        const palEl = $('.palette', pal);
        p.groups.forEach((g, gi) => {
            const box = h(`<div class="palette-group"><h4>${gi + 1}. ${esc(g.name)}</h4></div>`);
            g.blocks.forEach(b => {
                const item = h(`<div class="pal-item${b.hidden ? ' pal-hidden' : ''}" ${b.hidden ? 'title="這塊積木在積木區被隱藏了"' : ''}></div>`);
                item.appendChild(OSEPBlocks.block(b, p, {href: `#/p/${p.id}/${b.opcode}`}));
                box.appendChild(item);
            });
            palEl.appendChild(box);
        });
        main.appendChild(pal);

        // 積木詳解
        const detail = h('<section id="s-detail"><h2>積木詳解</h2></section>');
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
            addToc('examples', '範例作品');
            const sec = h(`<section id="s-examples"><h2>範例作品</h2></section>`);
            p.examples.forEach((ex, i) => {
                const e = h(`<div class="example"><div class="example-head"><h3>範例 ${i + 1}：${esc(ex.title)}</h3>${ex.intro ? `<div class="prose">${md(ex.intro, p)}</div>` : ''}</div><div class="example-body"></div></div>`);
                const body = $('.example-body', e);
                body.appendChild(OSEPBlocks.script(ex.script || [], p));
                if (ex.explain) body.appendChild(h(`<div class="prose">${md(ex.explain, p)}</div>`));
                sec.appendChild(e);
            });
            main.appendChild(sec);
        }

        // FAQ
        if (p.faq && p.faq.length) {
            addToc('faq', '常見問題');
            main.appendChild(h(`<section id="s-faq" class="faq"><h2>常見問題</h2>${p.faq.map(f => `<details><summary>${esc(f.q)}</summary><div class="prose">${md(f.a, p)}</div></details>`).join('')}</section>`));
        }

        // 更新紀錄
        if (p.changelog && p.changelog.length) {
            addToc('changelog', '更新紀錄');
            main.appendChild(h(`<section id="s-changelog"><h2>更新紀錄</h2><ul class="changelog">${p.changelog.map(c => `<li><time>${esc(c.date)}</time>${inline(c.text, p)}</li>`).join('')}</ul></section>`));
        }

        // 上一個／下一個
        const idx = OSEP.plugins.indexOf(p);
        const prev = OSEP.plugins[idx - 1];
        const next = OSEP.plugins[idx + 1];
        main.appendChild(h(`<div class="pager">${prev ? `<a href="#/p/${prev.id}"><small>← 上一個插件</small>${esc(prev.name)}</a>` : ''}${next ? `<a class="next" href="#/p/${next.id}"><small>下一個插件 →</small>${esc(next.name)}</a>` : ''}</div>`));

        toc.innerHTML = `<div class="toc-h">本頁內容</div>${tocItems.join('')}`;
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
        document.title = '積木速查｜OSEP 插件說明';
        const root = app();
        root.innerHTML = '';
        const doc = h(`<div class="doc" style="max-width:1240px"><h1>積木速查</h1><p class="lead">所有插件的積木放在同一頁，方便上課時快速查找。點積木看完整說明。</p></div>`);
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
        document.title = '新增插件說明｜OSEP 插件說明';
        const root = app();
        root.innerHTML = '';
        root.appendChild(h(`<div class="doc">${window.OSEP_GUIDE_HTML || '<p>找不到 assets/guide.js</p>'}</div>`));
        // 指南裡的示範積木
        document.querySelectorAll('[data-demo-script]').forEach(slot => {
            try {
                const nodes = JSON.parse(slot.getAttribute('data-demo-script'));
                const p = OSEP.get(slot.getAttribute('data-plugin')) || {id: '', color: {}};
                slot.appendChild(OSEPBlocks.script(nodes, p));
            } catch (e) {
                slot.textContent = '示範積木格式錯誤';
            }
        });
        window.scrollTo({top: 0, behavior: 'instant'});
    };

    const renderNotFound = msg => {
        app().innerHTML = `<div class="doc"><h1>找不到頁面</h1><p class="lead">${esc(msg)}</p><p><a href="#/">回到首頁</a></p></div>`;
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
        return renderNotFound(`網址 #/${hash} 不存在`);
    };

    /* ================= 載入插件資料檔 ================= */

    window.addEventListener('error', e => {
        if (e.filename && /\/plugins\//.test(e.filename)) {
            OSEP.errors.push(`${e.filename.split('/plugins/')[1]} 第 ${e.lineno} 行：${e.message}`);
        }
    });

    const loadScript = src => new Promise(resolve => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
    });

    const boot = () => {
        const list = window.OSEP_PLUGIN_LIST || [];
        let chain = Promise.resolve();
        list.forEach(id => {
            chain = chain.then(() => loadScript(`plugins/${id}.js`)).then(ok => {
                if (!ok) OSEP.errors.push(`找不到 plugins/${id}.js（檔名要和 list.js 裡寫的一樣，大小寫也要一樣）`);
                else if (!OSEP.get(id)) OSEP.errors.push(`plugins/${id}.js 沒有成功加入：可能有語法錯誤，或 OSEP.addPlugin 裡的 id 不是「${id}」`);
            });
        });
        chain.then(() => {
            // 依 list.js 的順序排列
            OSEP.plugins.sort((a, b) => list.indexOf(a.id) - list.indexOf(b.id));
            if (OSEP.errors.length) {
                $('#loadwarn').innerHTML = `<div class="note warn"><b>有插件資料載入失敗：</b><br>${OSEP.errors.map(esc).join('<br>')}</div>`;
            }
            window.addEventListener('hashchange', route);
            route();
        });
    };

    document.addEventListener('DOMContentLoaded', boot);
}());
