// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 更新「空氣盒子設備編號查詢」網頁（airbox/index.html）裡內嵌的設備清單。
 *
 * 做的事：
 *   1. 讀 OSEP 的 GAS 中繼網址（轉存 Edimax 空氣盒子網站的資料，只有近 3 小時在線的設備）
 *   2. 讀 taiwan-atlas 的鄉鎮市區界線（內政部資料），用 GPS 經緯度判斷每台盒子在哪個縣市、鄉鎮市區
 *   3. 把 [縣市, 鄉鎮市區, 名稱, 設備編號, 緯度, 經度] 寫進 index.html 的 AIRBOX_DATA 區塊
 * 網頁本身因此不需要再連到任何網站。
 *
 * 用法（在 osep_web_serial 資料夾）：node airbox/tools/update-data.js
 * 需要 Node 18 以上（內建 fetch）。不需要安裝套件，界線檔的 TopoJSON 由這支程式自己解碼。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RELAY_URL = 'https://script.google.com/macros/s/AKfycbxT8a0laP6bOTx7q0skV8eOCgNOjrmiJ04kmdwlt7fGVu0qHxaHslPb7rL7Vi5CvcLw/exec';
const ATLAS_URL = 'https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/towns-10t.json';
const PAGE = path.join(__dirname, '..', 'index.html');
const START = '/* AIRBOX_DATA_START */';
const END = '/* AIRBOX_DATA_END */';
const NEAR_KM = 3;           // 落在邊界外（海邊、簡化誤差）但 3 公里內，歸到最近的鄉鎮
const OTHER = '其他（台灣以外或位置不明）';

/* ---------- TopoJSON 解碼（只處理 Polygon／MultiPolygon） ---------- */
function decodeArcs(topo) {
    const t = topo.transform;
    return topo.arcs.map(arc => {
        let x = 0, y = 0;
        return arc.map(p => {
            if (!t) return [p[0], p[1]];
            x += p[0];
            y += p[1];
            return [x * t.scale[0] + t.translate[0], y * t.scale[1] + t.translate[1]];
        });
    });
}
function ring(arcs, ids) {
    const out = [];
    ids.forEach(i => {
        const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
        a.forEach((p, k) => { if (k > 0 || out.length === 0) out.push(p); });
    });
    return out;
}
function toFeatures(topo, name) {
    const arcs = decodeArcs(topo);
    return topo.objects[name].geometries.map(g => {
        const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
        const coords = polys.map(p => p.map(r => ring(arcs, r)));
        const b = [Infinity, Infinity, -Infinity, -Infinity];
        coords.forEach(p => p[0].forEach(c => {
            b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]);
            b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]);
        }));
        return { props: g.properties, polys: coords, bbox: b };
    });
}

/* ---------- 點在多邊形內、點到邊界距離 ---------- */
function inRing(x, y, r) {
    let inside = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i], [xj, yj] = r[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
function contains(f, x, y) {
    const b = f.bbox;
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) return false;
    return f.polys.some(p => inRing(x, y, p[0]) && !p.slice(1).some(h => inRing(x, y, h)));
}
function segKm(px, py, a, b) {
    const k = Math.cos(py * Math.PI / 180);
    const dx = (b[0] - a[0]) * k, dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((px - a[0]) * k * dx + (py - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const ex = (a[0] + t * (b[0] - a[0]) - px) * k, ey = a[1] + t * (b[1] - a[1]) - py;
    return Math.sqrt(ex * ex + ey * ey) * 111.2;
}
function nearest(towns, x, y) {
    let best = null, bestKm = Infinity;
    towns.forEach(f => {
        const b = f.bbox;
        if (x < b[0] - 0.1 || x > b[2] + 0.1 || y < b[1] - 0.1 || y > b[3] + 0.1) return;
        f.polys.forEach(p => p.forEach(r => {
            for (let i = 1; i < r.length; i++) {
                const d = segKm(x, y, r[i - 1], r[i]);
                if (d < bestKm) { bestKm = d; best = f; }
            }
        }));
    });
    return bestKm <= NEAR_KM ? best : null;
}

function getJson(url) {
    return fetch(url).then(r => {
        if (!r.ok) throw new Error(url + ' HTTP ' + r.status);
        return r.json();
    });
}

Promise.all([getJson(RELAY_URL), getJson(ATLAS_URL)]).then(([data, topo]) => {
    const towns = toFeatures(topo, 'towns');
    const feeds = Array.isArray(data.feeds) ? data.feeds : [];
    if (feeds.length < 50) throw new Error('中繼只回傳 ' + feeds.length + ' 台，資料可能有問題，不更新網頁');

    const rows = feeds.map(d => {
        const x = Number(d.gps_lon), y = Number(d.gps_lat);
        let f = null;
        if (isFinite(x) && isFinite(y)) f = towns.find(t => contains(t, x, y)) || nearest(towns, x, y);
        return [
            f ? f.props.COUNTYNAME : OTHER,
            f ? f.props.TOWNNAME : '',
            String(d.name || '').trim(),       // 有些名稱前後有空白
            d.device_id,
            y,
            x
        ];
    });
    rows.sort((a, b) => (a[0] + a[1] + a[2] + a[3]).localeCompare(b[0] + b[1] + b[2] + b[3]));

    const date = (data.updated || data.version || new Date().toISOString());
    const block = START + '\n' +
        'var AIRBOX_DATE = ' + JSON.stringify(date) + ';\n' +
        '// [縣市, 鄉鎮市區, 名稱, 設備編號, 緯度, 經度]\n' +
        'var AIRBOX_DATA = [\n' + rows.map(r => '    ' + JSON.stringify(r)).join(',\n') + '\n];\n' +
        END;

    const html = fs.readFileSync(PAGE, 'utf8');
    const s = html.indexOf(START), e = html.indexOf(END);
    if (s < 0 || e < s) throw new Error('index.html 裡找不到 ' + START + ' … ' + END);
    fs.writeFileSync(PAGE, html.slice(0, s) + block + html.slice(e + END.length));

    const byCounty = {};
    rows.forEach(r => { byCounty[r[0]] = (byCounty[r[0]] || 0) + 1; });
    console.log('已更新 ' + path.relative(process.cwd(), PAGE) + '：' + rows.length + ' 台，資料時間 ' + date);
    console.log(byCounty);
}).catch(err => {
    console.error('更新失敗：' + err.message);
    process.exit(1);
});
