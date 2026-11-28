// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 風險值表：產生一頁 HTML（在新視窗或本頁浮動視窗顯示）
 * m = {t(key), features, stats, rows: [{text, label, vector, risky}], threshold, riskLabel, last}
 */
'use strict';

const core = require('./risk-core');

const esc = s => String(s === undefined || s === null ? '' : s)
    .replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

const CSS = [
    'body{margin:0;font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC",Helvetica,Arial,sans-serif;',
    'background:#F5F1FF;color:#2A2140;}',
    'header{background:linear-gradient(120deg,#2E1A78,#8A2BE2);color:#fff;padding:14px 20px;font-size:20px;',
    'font-weight:700;}',
    'main{padding:12px 20px 24px;}',
    'h2{font-size:16px;margin:18px 0 6px;color:#4E2696;}',
    'p.note{margin:4px 0 8px;font-size:13px;color:#5A4E78;}',
    'table{border-collapse:collapse;width:100%;background:#fff;font-size:14px;}',
    'th,td{border:1px solid #DCD2F2;padding:5px 8px;text-align:left;vertical-align:top;}',
    'th{background:#EDE5FF;color:#3A2470;white-space:nowrap;}',
    'td.n{text-align:center;white-space:nowrap;}',
    'td.one{background:#FFF1C2;font-weight:700;}',
    'tr.risk td.lab{color:#C0262D;font-weight:700;}',
    '.big{font-size:18px;font-weight:700;}',
    '.risk{color:#C0262D;}.safe{color:#1F8A3B;}'
].join('');

const html = m => {
    const t = m.t;
    const ids = m.features.map(f => f.id);
    const r4 = core.round4;
    const out = [];
    out.push(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(t('tbl_title'))}</title>`,
        `<style>${CSS}</style></head><body><header>${esc(t('tbl_title'))}</header><main>`);

    // 特徵與風險值
    out.push(`<h2>${esc(t('tbl_features'))}</h2><p class="note">${esc(t('tbl_formula'))}</p>`,
        `<table><tr><th>${esc(t('tbl_feature'))}</th><th>${esc(t('tbl_name'))}</th>`,
        `<th>${esc(t('tbl_keywords'))}</th><th>${esc(t('tbl_hit'))}</th><th>${esc(t('tbl_risky'))}</th>`,
        `<th>${esc(t('tbl_value'))}</th></tr>`);
    m.features.forEach(f => {
        const s = m.stats[f.id] || {hit: 0, risky: 0, value: 0};
        out.push(`<tr><td class="n">${esc(f.id)}</td><td>${esc(f.name)}</td><td>${esc(f.keywords.join('、'))}</td>`,
            `<td class="n">${s.hit}</td><td class="n">${s.risky}</td>`,
            `<td class="n">${s.risky} ÷ ${s.hit} = <b>${r4(s.value)}</b></td></tr>`);
    });
    if (!m.features.length) out.push(`<tr><td colspan="6">${esc(t('tbl_none'))}</td></tr>`);
    out.push('</table>');
    out.push(`<p class="note">${esc(t('tbl_threshold'))}</p>`);

    // 最後判斷的訊息
    if (m.last) {
        const L = m.last;
        const cls = L.risky ? 'risk' : 'safe';
        const detail = L.matched.length ?
            `(${L.matched.map(id => r4(m.stats[id] ? m.stats[id].value : 0)).join(' + ')}) ÷ ${L.matched.length}` :
            esc(t('tbl_noMatch'));
        out.push(`<h2>${esc(t('tbl_last'))}</h2><table><tr><th>${esc(t('tbl_text'))}</th>`,
            ids.map(id => `<th>${esc(id)}</th>`).join(''),
            `<th>${esc(t('tbl_score'))}</th><th>${esc(t('tbl_result'))}</th></tr><tr><td>${esc(L.text)}</td>`,
            ids.map(id => `<td class="n${L.vector[id] ? ' one' : ''}">${L.vector[id] ? 1 : 0}</td>`).join(''),
            `<td class="n">${detail} = <b>${r4(L.score)}</b></td>`,
            `<td class="n big ${cls}">${esc(L.verdict)}</td></tr></table>`);
    }

    // 訓練訊息
    out.push(`<h2>${esc(t('tbl_data'))}</h2><table><tr><th>${esc(t('tbl_no'))}</th><th>${esc(t('tbl_text'))}</th>`,
        ids.map(id => `<th>${esc(id)}</th>`).join(''), `<th>${esc(t('tbl_label'))}</th></tr>`);
    m.rows.forEach((d, i) => {
        out.push(`<tr${d.risky ? ' class="risk"' : ''}><td class="n">${i + 1}</td><td>${esc(d.text)}</td>`,
            ids.map(id => `<td class="n${d.vector[id] ? ' one' : ''}">${d.vector[id] ? 1 : 0}</td>`).join(''),
            `<td class="n lab">${esc(d.label)}</td></tr>`);
    });
    if (!m.rows.length) out.push(`<tr><td colspan="${ids.length + 3}">${esc(t('tbl_none'))}</td></tr>`);
    out.push('</table></main></body></html>');
    return out.join('');
};

module.exports = {html, esc};
