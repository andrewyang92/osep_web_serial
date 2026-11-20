// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 決策樹核心（不依賴 Scratch，可在 Node 測試）
 *
 * - 演算法：C4.5 風格
 *   - 文字欄位：每個值一個分支（例：天氣 → 晴 / 陰 / 雨），用過就不再用
 *   - 數字欄位：找最好的門檻值切成兩邊（例：溫度 ≤ 75.5 / > 75.5），可重複使用
 *   - 用「資訊增益比」挑欄位，只在增益不低於平均的欄位中挑（避免偏好值很多的欄位）
 * - 資料格式：Google 試算表插件的 JSON，[{欄位: 值, ...}, ...]，值通常都是字串
 *
 * - 目前只接受「是非」資料（checkYesNo）：每一格都要是 是/否、有/沒有… 這類答案，不接受數字
 *
 * 注意：不可使用 async/await（見專案的 regeneratorRuntime 調查）。
 */
'use strict';

const EPS = 1e-12;

/* ---------- 資料 ---------- */

const isNumeric = s => s !== '' && isFinite(Number(s));

function cleanCell (v) {
    if (v === null || typeof v === 'undefined') return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v).trim();
}

/** 簡單 CSV 解析（支援雙引號），資料不是 JSON 時的備用 */
function parseCsv (text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (c === '"') {
                quoted = false;
            } else {
                cell += c;
            }
        } else if (c === '"') {
            quoted = true;
        } else if (c === ',') {
            row.push(cell);
            cell = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += c;
        }
    }
    row.push(cell);
    rows.push(row);
    if (rows.length < 2) return null;
    const headers = rows[0];
    return rows.slice(1).map(r => {
        const o = {};
        headers.forEach((h, j) => {
            o[h] = typeof r[j] === 'undefined' ? '' : r[j];
        });
        return o;
    });
}

/**
 * 讀入資料。
 * @param {string|Array} input JSON 字串、物件陣列，或 CSV 文字
 * @returns {{rows: object[], columns: string[]} | {error: string}}
 *   error：'empty' | 'format' | 'noRows'
 */
function parseData (input) {
    let list = input;
    if (typeof input === 'number') input = String(input);
    if (typeof input === 'string') {
        const text = input.trim();
        if (!text) return {error: 'empty'};
        try {
            list = JSON.parse(text);
        } catch (e) {
            list = (text.indexOf(',') >= 0 && /[\r\n]/.test(text)) ? parseCsv(text) : null;
        }
    }
    if (list && !Array.isArray(list) && typeof list === 'object') {
        // 也接受 {data: [...]} 或 {data: "[...]"}
        if (Array.isArray(list.data)) list = list.data;
        else if (typeof list.data === 'string') return parseData(list.data);
    }
    if (!Array.isArray(list)) return {error: 'format'};

    const columns = [];
    const seen = {};
    const rows = [];
    const lines = []; // 每筆資料在試算表的第幾列（第 1 列是欄位名稱）
    list.forEach((item, idx) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        const row = {};
        let hasValue = false;
        Object.keys(item).forEach(k => {
            const key = String(k).trim();
            if (!key) return; // CSV 結尾多出的逗號
            const v = cleanCell(item[k]);
            row[key] = v;
            if (v !== '') hasValue = true;
            if (!seen[key]) {
                seen[key] = true;
                columns.push(key);
            }
        });
        if (hasValue) { // 跳過整列空白（CSV 最後一列）
            rows.push(row);
            lines.push(idx + 2);
        }
    });
    if (!rows.length) return {error: 'noRows'};
    rows.forEach(r => columns.forEach(c => {
        if (typeof r[c] === 'undefined') r[c] = '';
    }));
    return {rows, columns, lines};
}

/* ---------- 是非資料 ---------- */

// 比對前先轉小寫、去掉空白；不接受數字（1/0）
const YES_WORDS = ['是', '有', '會', '对', '對', '要', '真', 'yes', 'y', 'true'];
const NO_WORDS = ['否', '不是', '沒有', '没有', '沒', '没', '無', '无', '不會', '不会', '不對', '不对', '錯', '错',
    '不要', '假', 'no', 'n', 'false'];

/** 是非答案 → true / false；看不懂（含數字、空白）→ null */
function yesNoValue (v) {
    const s = cleanCell(v).toLowerCase()
        .replace(/\s+/g, '');
    if (YES_WORDS.indexOf(s) >= 0) return true;
    if (NO_WORDS.indexOf(s) >= 0) return false;
    return null;
}

/**
 * 檢查每一格都是是非答案，並統一成 words.yes / words.no（例：是 / 否）
 * @param {{rows, columns, lines}} data parseData 的結果
 * @param {{yes: string, no: string}} words
 * @returns {{rows, columns, lines}|{error: 'blank'|'notYesNo', col, line, value}}
 *   line 是試算表的列號（第 1 列是欄位名稱）
 */
function checkYesNo (data, words) {
    const rows = [];
    for (let i = 0; i < data.rows.length; i++) {
        const r = data.rows[i];
        const out = {};
        for (let j = 0; j < data.columns.length; j++) {
            const c = data.columns[j];
            const b = yesNoValue(r[c]);
            const line = data.lines ? data.lines[i] : i + 2;
            if (b === null) return {error: r[c] === '' ? 'blank' : 'notYesNo', col: c, line, value: r[c]};
            out[c] = b ? words.yes : words.no;
        }
        rows.push(out);
    }
    return {rows, columns: data.columns.slice(), lines: data.lines};
}

/** 欄位是否為數字欄：所有非空白值都是數字 */
function columnIsNumeric (rows, col) {
    let any = false;
    for (const r of rows) {
        const v = r[col];
        if (v === '') continue;
        if (!isNumeric(v)) return false;
        any = true;
    }
    return any;
}

/** 把「天氣, 溫度」之類的文字拆成欄位清單（支援 , ， 、 ; 換行） */
function splitList (text) {
    return String(text === null || typeof text === 'undefined' ? '' : text)
        .split(/[,，、;；\n]/)
        .map(s => s.trim())
        .filter(Boolean);
}

/** 「全部」「all」「*」或空白 → 使用全部欄位 */
function isAllKeyword (text) {
    const s = String(text === null || typeof text === 'undefined' ? '' : text).trim().toLowerCase();
    return s === '' || s === '*' || s === 'all' || s === '全部' || s === '全部欄位' || s === '所有欄位';
}

/**
 * 把預測資料文字轉成物件。
 * 支援 JSON（{"天氣":"晴"}）或「天氣=晴, 溫度=70」（= : ： 皆可）
 */
function parseInputText (text) {
    if (text && typeof text === 'object') return Object.assign({}, text);
    const s = String(text === null || typeof text === 'undefined' ? '' : text).trim();
    if (!s) return {};
    if (s[0] === '{') {
        try {
            const o = JSON.parse(s);
            const out = {};
            Object.keys(o).forEach(k => {
                out[String(k).trim()] = cleanCell(o[k]);
            });
            return out;
        } catch (e) { /* 當成一般文字處理 */ }
    }
    const out = {};
    splitList(s).forEach(part => {
        const m = part.match(/^([^=:：]+)[=:：](.*)$/);
        if (m) out[m[1].trim()] = m[2].trim();
    });
    return out;
}

/* ---------- 亂數（固定種子，同樣的資料每次切法一樣） ---------- */

function mulberry32 (seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffled (list, seed) {
    const rand = mulberry32(seed);
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
    return a;
}

/* ---------- 計算 ---------- */

function countBy (rows, target) {
    const counts = {};
    rows.forEach(r => {
        counts[r[target]] = (counts[r[target]] || 0) + 1;
    });
    return counts;
}

function entropyOfCounts (counts, total) {
    if (!total) return 0;
    let h = 0;
    Object.keys(counts).forEach(k => {
        const p = counts[k] / total;
        if (p > 0) h -= p * Math.log2(p);
    });
    return h;
}

/** 多數類別；同票時依 classOrder（資料中先出現的）決定，結果固定 */
function majority (counts, classOrder) {
    let best = null;
    let bestN = -1;
    classOrder.forEach(c => {
        if ((counts[c] || 0) > bestN) {
            best = c;
            bestN = counts[c] || 0;
        }
    });
    return best;
}

/** 好讀的門檻值：兩數中點，最多 4 位小數 */
function niceThreshold (a, b) {
    const mid = (a + b) / 2;
    return Number(mid.toFixed(4));
}

function formatNumber (x) {
    return String(Number(Number(x).toFixed(4)));
}

/** 文字欄位的分數 */
function scoreCategorical (rows, feature, target, baseH) {
    const groups = {};
    const order = [];
    rows.forEach(r => {
        const v = r[feature];
        if (!groups[v]) {
            groups[v] = [];
            order.push(v);
        }
        groups[v].push(r);
    });
    if (order.length < 2) return null;
    const n = rows.length;
    let rem = 0;
    let split = 0;
    order.forEach(v => {
        const g = groups[v];
        const w = g.length / n;
        rem += w * entropyOfCounts(countBy(g, target), g.length);
        split -= w * Math.log2(w);
    });
    const gain = baseH - rem;
    return {feature, kind: 'cat', gain, ratio: split > EPS ? gain / split : 0, values: order, groups};
}

/** 數字欄位：找最佳門檻。空白或非數字的列先不算，之後歸到筆數多的一邊 */
function scoreNumeric (rows, feature, target) {
    const known = [];
    const unknown = [];
    rows.forEach(r => {
        if (isNumeric(r[feature])) known.push({x: Number(r[feature]), y: r[target], r});
        else unknown.push(r);
    });
    if (known.length < 2) return null;
    known.sort((a, b) => a.x - b.x);
    const total = countBy(known.map(k => k.r), target);
    const nk = known.length;
    const h = entropyOfCounts(total, nk);
    const left = {};
    let best = null;
    for (let i = 0; i < nk - 1; i++) {
        left[known[i].y] = (left[known[i].y] || 0) + 1;
        if (known[i].x === known[i + 1].x) continue;
        const nl = i + 1;
        const nr = nk - nl;
        const right = {};
        Object.keys(total).forEach(c => {
            right[c] = total[c] - (left[c] || 0);
        });
        const rem = (nl / nk) * entropyOfCounts(left, nl) + (nr / nk) * entropyOfCounts(right, nr);
        const g = h - rem;
        if (!best || g > best.g + EPS) best = {g, i};
    }
    if (!best) return null;
    const threshold = niceThreshold(known[best.i].x, known[best.i + 1].x);
    const leftRows = [];
    const rightRows = [];
    known.forEach(k => (k.x <= threshold ? leftRows : rightRows).push(k.r));
    if (!leftRows.length || !rightRows.length) return null;
    // C4.5：有缺值時增益依已知比例打折
    const frac = nk / rows.length;
    const gain = frac * best.g;
    const missingGoes = leftRows.length >= rightRows.length ? 0 : 1;
    unknown.forEach(r => (missingGoes === 0 ? leftRows : rightRows).push(r));
    const n = rows.length;
    const wl = leftRows.length / n;
    const wr = rightRows.length / n;
    const split = -(wl * Math.log2(wl)) - (wr * Math.log2(wr));
    return {
        feature, kind: 'num', gain, ratio: split > EPS ? gain / split : 0,
        threshold, missingGoes, groups: [leftRows, rightRows]
    };
}

/* ---------- 訓練 ---------- */

/**
 * 訓練決策樹。
 * @param {object[]} rows 已清理的資料（parseData 的 rows）
 * @param {object} opts
 *   target：要預測的欄位
 *   features：用來判斷的欄位（陣列）
 *   maxDepth：最大深度（根節點的分岔算第 1 層），預設 5
 *   minSamples：少於幾筆就不再分，預設 2
 *   trainPercent：訓練資料百分比（1～100），預設 70
 *   seed：打亂資料的種子，預設 1
 * @returns {object} model 或 {error, detail}
 */
/** 分支順序：valueOrder 裡的值排前面（依 valueOrder 順序），其他照資料出現的先後 */
function sortValues (values, valueOrder) {
    if (!valueOrder || !valueOrder.length) return values;
    const rank = v => {
        const i = valueOrder.indexOf(v);
        return i < 0 ? valueOrder.length : i;
    };
    return values.map((v, i) => ({v, i}))
        .sort((a, b) => (rank(a.v) - rank(b.v)) || (a.i - b.i))
        .map(x => x.v);
}

/**
 * opts.valueOrder：文字欄位分支的固定順序，例：['是', '否'] → 「是」一律在左
 */
function train (rows, opts) {
    const target = opts.target;
    const valueOrder = opts.valueOrder || null;
    const maxDepth = Math.max(1, Math.min(20, Math.round(Number(opts.maxDepth) || 5)));
    const minSamples = Math.max(2, Math.round(Number(opts.minSamples) || 2));
    let trainPercent = Number(opts.trainPercent);
    if (!isFinite(trainPercent)) trainPercent = 70;
    trainPercent = Math.max(1, Math.min(100, trainPercent));
    const seed = typeof opts.seed === 'number' ? opts.seed : 1;

    const usable = rows.filter(r => r[target] !== '');
    const dropped = rows.length - usable.length;
    if (usable.length < 2) return {error: 'tooFewRows', detail: String(usable.length)};

    // 欄位型別、略過「每列都不一樣」的文字欄（例如姓名、編號）
    const featureInfo = [];
    const skipped = [];
    opts.features.forEach(f => {
        if (f === target) return;
        const numeric = columnIsNumeric(usable, f);
        if (!numeric) {
            const distinct = {};
            usable.forEach(r => {
                distinct[r[f]] = true;
            });
            const nd = Object.keys(distinct).length;
            if (nd === usable.length && usable.length >= 6) {
                skipped.push({feature: f, reason: 'unique'});
                return;
            }
            if (nd < 2) {
                skipped.push({feature: f, reason: 'constant'});
                return;
            }
        }
        featureInfo.push({name: f, type: numeric ? 'number' : 'text'});
    });
    if (!featureInfo.length) return {error: 'noFeatures', skipped};

    // 類別順序：依資料中出現的先後
    const classOrder = [];
    usable.forEach(r => {
        if (classOrder.indexOf(r[target]) < 0) classOrder.push(r[target]);
    });

    // 切訓練 / 測試
    const mixed = trainPercent >= 100 ? usable.slice() : shuffled(usable, seed);
    let nTrain = Math.round(mixed.length * trainPercent / 100);
    nTrain = Math.max(1, Math.min(mixed.length, nTrain));
    const trainRows = mixed.slice(0, nTrain);
    const testRows = mixed.slice(nTrain);

    let nextId = 0;
    const types = {};
    featureInfo.forEach(f => {
        types[f.name] = f.type;
    });

    function leaf (counts, n) {
        const prediction = majority(counts, classOrder);
        return {
            id: nextId++, leaf: true, n, counts, prediction,
            confidence: n ? counts[prediction] / n : 0
        };
    }

    function build (subset, available, depth) {
        const n = subset.length;
        const counts = countBy(subset, target);
        const nClasses = Object.keys(counts).length;
        if (nClasses <= 1 || depth >= maxDepth || n < minSamples || !available.length) {
            return leaf(counts, n);
        }
        const baseH = entropyOfCounts(counts, n);
        const candidates = [];
        available.forEach(f => {
            const s = types[f] === 'number' ?
                scoreNumeric(subset, f, target) :
                scoreCategorical(subset, f, target, baseH);
            if (s && s.gain > EPS) candidates.push(s);
        });
        if (!candidates.length) return leaf(counts, n);
        const avg = candidates.reduce((a, s) => a + s.gain, 0) / candidates.length;
        let best = null;
        candidates.forEach(s => {
            if (s.gain + EPS < avg) return;
            if (!best || s.ratio > best.ratio + EPS) best = s;
        });

        const node = {
            id: nextId++, leaf: false, n, counts,
            prediction: majority(counts, classOrder),
            feature: best.feature, kind: best.kind, children: []
        };
        node.confidence = counts[node.prediction] / n;
        if (best.kind === 'num') {
            node.threshold = best.threshold;
            node.missingGoes = best.missingGoes;
            const t = formatNumber(best.threshold);
            node.children.push({op: '<=', value: best.threshold, label: `≤ ${t}`,
                node: build(best.groups[0], available, depth + 1)});
            node.children.push({op: '>', value: best.threshold, label: `> ${t}`,
                node: build(best.groups[1], available, depth + 1)});
        } else {
            const rest = available.filter(f => f !== best.feature);
            sortValues(best.values, valueOrder).forEach(v => {
                node.children.push({op: '=', value: v, label: v === '' ? '(空白)' : v,
                    node: build(best.groups[v], rest, depth + 1)});
            });
        }
        // 所有子節點都是預測同一類的葉子 → 合併成一片葉子，圖比較簡潔
        if (node.children.every(c => c.node.leaf && c.node.prediction === node.prediction)) {
            return {id: node.id, leaf: true, n, counts, prediction: node.prediction, confidence: node.confidence};
        }
        return node;
    }

    const tree = build(trainRows, featureInfo.map(f => f.name), 0);
    renumber(tree);

    const model = {
        target, classes: classOrder, features: featureInfo, skipped,
        maxDepth, trainPercent,
        nRows: usable.length, droppedRows: dropped,
        nTrain: trainRows.length, nTest: testRows.length,
        tree
    };
    const evalRows = testRows.length ? testRows : trainRows;
    let correct = 0;
    evalRows.forEach(r => {
        if (predict(model, r).prediction === r[target]) correct++;
    });
    model.accuracy = evalRows.length ? correct / evalRows.length : 0;
    model.accuracyOn = testRows.length ? 'test' : 'train';
    model.correct = correct;
    model.nEval = evalRows.length;
    model.depth = treeDepth(tree);
    model.leaves = countLeaves(tree);
    model.usedFeatures = usedFeatures(tree);
    return model;
}

/** 依前序重新編號（合併節點後 id 會跳號） */
function renumber (tree) {
    let id = 0;
    (function walk (node) {
        node.id = id++;
        if (!node.leaf) node.children.forEach(c => walk(c.node));
    }(tree));
}

function treeDepth (node) {
    if (node.leaf) return 0;
    return 1 + Math.max.apply(null, node.children.map(c => treeDepth(c.node)));
}

function countLeaves (node) {
    if (node.leaf) return 1;
    return node.children.reduce((a, c) => a + countLeaves(c.node), 0);
}

function usedFeatures (tree) {
    const list = [];
    (function walk (node) {
        if (node.leaf) return;
        if (list.indexOf(node.feature) < 0) list.push(node.feature);
        node.children.forEach(c => walk(c.node));
    }(tree));
    return list;
}

/* ---------- 預測 ---------- */

/**
 * 預測一筆資料。
 * @returns {{prediction, confidence, nodeIds: number[], path: object[], unknown: object|null, missing: string[]}}
 *   path：[{feature, label}]；unknown：遇到沒看過的文字值時 {feature, value}，停在該節點用多數類別
 */
function predict (model, input) {
    const values = {};
    Object.keys(input || {}).forEach(k => {
        values[String(k).trim()] = cleanCell(input[k]);
    });
    let node = model.tree;
    const nodeIds = [node.id];
    const path = [];
    const missing = [];
    let unknown = null;
    while (!node.leaf) {
        const has = Object.prototype.hasOwnProperty.call(values, node.feature);
        const v = has ? values[node.feature] : '';
        let next = null;
        if (node.kind === 'num') {
            if (isNumeric(v)) {
                next = Number(v) <= node.threshold ? node.children[0] : node.children[1];
            } else {
                if (missing.indexOf(node.feature) < 0) missing.push(node.feature);
                next = node.children[node.missingGoes];
            }
        } else {
            next = node.children.filter(c => c.value === v)[0] || null;
            if (!next) {
                if (!has || v === '') {
                    if (missing.indexOf(node.feature) < 0) missing.push(node.feature);
                } else {
                    unknown = {feature: node.feature, value: v};
                }
                break;
            }
        }
        path.push({feature: node.feature, label: next.label, op: next.op});
        node = next.node;
        nodeIds.push(node.id);
    }
    return {
        prediction: node.prediction,
        confidence: node.confidence,
        nodeIds, path, unknown, missing
    };
}

/* ---------- 規則文字 ---------- */

/**
 * 把樹轉成「如果…就…」的規則文字，一片葉子一行。
 * @param {object} model
 * @param {object} w 文字：{if, and, then, always, rows}（rows 例如 '筆'）
 */
function rulesText (model, w) {
    const lines = [];
    (function walk (node, conds) {
        if (node.leaf) {
            const right = node.counts[node.prediction] || 0;
            const head = conds.length ? `${w.if} ${conds.join(` ${w.and} `)}` : w.always;
            lines.push(`${head} ${w.then} ${model.target} = ${node.prediction}（${right}/${node.n} ${w.rows}）`);
            return;
        }
        node.children.forEach(c => {
            const cond = c.op === '=' ? `${node.feature} = ${c.label}` : `${node.feature} ${c.label}`;
            walk(c.node, conds.concat(cond));
        });
    }(model.tree, []));
    return lines.join('\n');
}

module.exports = {
    parseData,
    parseCsv,
    yesNoValue,
    checkYesNo,
    columnIsNumeric,
    splitList,
    isAllKeyword,
    parseInputText,
    train,
    predict,
    rulesText,
    formatNumber,
    entropyOfCounts,
    _shuffled: shuffled
};
