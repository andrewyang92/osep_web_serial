// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 關鍵字風險偵測：純計算（不依賴 Scratch，可在 Node 測）
 *
 * - 特徵：{id: 'F1', name, keywords: [...], reminder}
 *   訊息包含任一關鍵字 → 該特徵為 1，否則 0
 * - 訓練資料：[{text, label}]；label 等於「風險標記」（預設「詐騙」）就算有風險
 * - 特徵風險值 ＝ 符合且有風險的則數 ÷ 符合的總則數（沒有任何訊息符合時算 0）
 * - 風險分數 ＝ 新訊息符合的特徵風險值的平均（一個都沒符合時算 0）
 * - 風險分數 ≥ 門檻（預設 0.5）→ 有風險
 */
'use strict';

/** 比對用：全形轉半形（NFKC）、英文轉小寫 */
const norm = s => {
    let t = String(s === undefined || s === null ? '' : s);
    if (typeof t.normalize === 'function') t = t.normalize('NFKC');
    return t.toLowerCase();
};

/** 「連結、網址, 點擊」→ ['連結', '網址', '點擊']（頓號、逗號、分號、換行都可分隔；不重複） */
const parseKeywords = s => {
    const out = [];
    String(s === undefined || s === null ? '' : s).split(/[、,，;；\n\r]+/).forEach(k => {
        const w = k.trim();
        if (w && out.indexOf(w) < 0) out.push(w);
    });
    return out;
};

/** 訊息裡找到的關鍵字（依關鍵字順序） */
const foundKeywords = (text, keywords) => {
    const t = norm(text);
    return (keywords || []).filter(k => norm(k) && t.indexOf(norm(k)) >= 0);
};

const containsAny = (text, keywords) => foundKeywords(text, keywords).length > 0;

/** 訊息每個特徵的 0 / 1：{F1: 1, F2: 0, ...} */
const featureVector = (text, features) => {
    const v = {};
    features.forEach(f => {
        v[f.id] = containsAny(text, f.keywords) ? 1 : 0;
    });
    return v;
};

const sameLabel = (a, b) => norm(a).trim() === norm(b).trim();

/**
 * 計算每個特徵的風險值
 * @returns {{[id]: {hit, risky, value}}} hit = 符合則數、risky = 符合且有風險的則數
 */
const train = (features, data, riskLabel) => {
    const stats = {};
    features.forEach(f => {
        stats[f.id] = {hit: 0, risky: 0, value: 0};
    });
    data.forEach(d => {
        const v = featureVector(d.text, features);
        const isRisky = sameLabel(d.label, riskLabel);
        features.forEach(f => {
            if (!v[f.id]) return;
            stats[f.id].hit++;
            if (isRisky) stats[f.id].risky++;
        });
    });
    features.forEach(f => {
        const s = stats[f.id];
        s.value = s.hit ? s.risky / s.hit : 0;
    });
    return stats;
};

/**
 * 判斷一則訊息
 * @returns {{vector, matched: [id], score, risky: boolean}}
 */
const judge = (text, features, stats, threshold) => {
    const vector = featureVector(text, features);
    const matched = features.filter(f => vector[f.id]).map(f => f.id);
    let score = 0;
    if (matched.length) {
        score = matched.reduce((sum, id) => sum + (stats[id] ? stats[id].value : 0), 0) / matched.length;
    }
    // 1e-9：避免 (0.3 + 0.7) / 2 這類小數誤差剛好落在門檻下面
    return {vector, matched, score, risky: score + 1e-9 >= threshold};
};

/** 顯示用：最多 4 位小數（0.75、1、0.8、0.7667） */
const round4 = x => Math.round(x * 10000) / 10000;

module.exports = {norm, parseKeywords, foundKeywords, containsAny, featureVector, sameLabel, train, judge, round4};
