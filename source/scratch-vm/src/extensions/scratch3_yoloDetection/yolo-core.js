// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * YOLOX 物件辨識的純計算部分（不依賴 Scratch、瀏覽器，可在 Node 測試）
 *
 * YOLOX 官方 ONNX（0.1.1rc0）的前後處理（參考 YOLOX demo/ONNXRuntime/onnx_inference.py）：
 * - 輸入：1×3×S×S，BGR，0～255 不正規化；圖片等比例縮放後貼在左上角，其餘填 114
 * - 輸出：1×N×85（N = 各 stride 格點總數）；每列 [cx, cy, w, h, objectness, 80 類分數]
 *   cx、cy 是相對格點的位移、w、h 是 log 值，需要依 stride 8 / 16 / 32 解碼；
 *   objectness 與類別分數已經過 sigmoid
 */

const STAGE_WIDTH = 480;
const STAGE_HEIGHT = 360;
const PAD_VALUE = 114;
const STRIDES = [8, 16, 32];

// COCO 80 類（順序與模型輸出一致）
const CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
    'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
    'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
    'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
    'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant',
    'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
    'teddy bear', 'hair drier', 'toothbrush'
];

/**
 * 等比例縮放到 size×size（貼左上角）
 * @returns {{scale: number, width: number, height: number}} 縮放後圖片在輸入中的大小
 */
const letterbox = (srcWidth, srcHeight, size) => {
    const scale = Math.min(size / srcWidth, size / srcHeight);
    return {
        scale,
        width: Math.max(1, Math.round(srcWidth * scale)),
        height: Math.max(1, Math.round(srcHeight * scale))
    };
};

/**
 * RGBA 像素（size×size，已經 letterbox）轉成模型輸入：CHW、BGR、0～255
 * @param {Uint8ClampedArray|Uint8Array} rgba
 * @param {number} size
 * @returns {Float32Array}
 */
const rgbaToInput = (rgba, size) => {
    const area = size * size;
    const out = new Float32Array(3 * area);
    for (let i = 0; i < area; i++) {
        const p = i * 4;
        out[i] = rgba[p + 2]; // B
        out[area + i] = rgba[p + 1]; // G
        out[(2 * area) + i] = rgba[p]; // R
    }
    return out;
};

/** 各 stride 的格點數總和（416 → 3549） */
const anchorCount = size => STRIDES.reduce((n, s) => n + ((size / s) * (size / s)), 0);

/**
 * 解碼模型輸出成候選框（模型輸入座標，x1/y1/x2/y2）
 * @param {Float32Array} data 1×N×(5+C) 攤平
 * @param {number} size 模型輸入邊長
 * @param {number} numClasses
 * @param {number} minScore 低於這個分數的直接丟掉
 */
const decode = (data, size, numClasses, minScore) => {
    const stride = 5 + numClasses;
    const total = anchorCount(size);
    if (data.length < total * stride) throw new Error(`模型輸出長度不符：${data.length}`);
    const boxes = [];
    let row = 0;
    for (const s of STRIDES) {
        const g = size / s;
        for (let gy = 0; gy < g; gy++) {
            for (let gx = 0; gx < g; gx++, row++) {
                const o = row * stride;
                const obj = data[o + 4];
                if (obj < minScore) continue;
                let best = 0;
                let bestId = 0;
                for (let c = 0; c < numClasses; c++) {
                    const v = data[o + 5 + c];
                    if (v > best) {
                        best = v;
                        bestId = c;
                    }
                }
                const score = obj * best;
                if (score < minScore) continue;
                const cx = (data[o] + gx) * s;
                const cy = (data[o + 1] + gy) * s;
                const w = Math.exp(data[o + 2]) * s;
                const h = Math.exp(data[o + 3]) * s;
                boxes.push({
                    x1: cx - (w / 2), y1: cy - (h / 2), x2: cx + (w / 2), y2: cy + (h / 2),
                    score, classId: bestId
                });
            }
        }
    }
    return boxes;
};

const iou = (a, b) => {
    const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
    const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
    if (w <= 0 || h <= 0) return 0;
    const inter = w * h;
    const union = ((a.x2 - a.x1) * (a.y2 - a.y1)) + ((b.x2 - b.x1) * (b.y2 - b.y1)) - inter;
    return union > 0 ? inter / union : 0;
};

/** 同類別的 NMS（不同類別互不影響），結果依分數由高到低 */
const nms = (boxes, iouThreshold, maxCount) => {
    const sorted = boxes.slice().sort((a, b) => b.score - a.score);
    const kept = [];
    for (const b of sorted) {
        if (kept.length >= maxCount) break;
        if (!kept.some(k => k.classId === b.classId && iou(k, b) > iouThreshold)) kept.push(b);
    }
    return kept;
};

/** 模型輸入座標 → 原圖像素座標（並裁切在圖內） */
const toImageBoxes = (boxes, scale, imgWidth, imgHeight) => {
    const clip = (v, max) => Math.min(Math.max(v, 0), max);
    return boxes.map(b => ({
        x1: clip(b.x1 / scale, imgWidth),
        y1: clip(b.y1 / scale, imgHeight),
        x2: clip(b.x2 / scale, imgWidth),
        y2: clip(b.y2 / scale, imgHeight),
        score: b.score,
        classId: b.classId
    })).filter(b => b.x2 - b.x1 >= 1 && b.y2 - b.y1 >= 1);
};

/**
 * 原圖怎麼放到舞台（480×360）上
 * - 'contain'：等比例縮放、置中（上傳圖片、網址圖片）
 * - 'stretch'：拉滿舞台（視訊、舞台畫面，和 Scratch 顯示的一樣）
 * @returns {{sx: number, sy: number, ox: number, oy: number}} 舞台像素 = 原圖像素 × s + o
 */
const stageFit = (imgWidth, imgHeight, mode) => {
    if (mode === 'stretch') {
        return {sx: STAGE_WIDTH / imgWidth, sy: STAGE_HEIGHT / imgHeight, ox: 0, oy: 0};
    }
    const s = Math.min(STAGE_WIDTH / imgWidth, STAGE_HEIGHT / imgHeight);
    return {
        sx: s, sy: s,
        ox: (STAGE_WIDTH - (imgWidth * s)) / 2,
        oy: (STAGE_HEIGHT - (imgHeight * s)) / 2
    };
};

const round1 = v => Math.round(v * 10) / 10;

/**
 * 原圖框 → 舞台結果
 * left/top/right/bottom 是舞台畫布像素（左上角 0,0，畫框用）；
 * x、y 是 Scratch 座標（中心 0,0、y 向上）；mirror 時左右翻轉（和鏡像的視訊畫面一致）
 */
const toStageObjects = (boxes, fit, mirror) => boxes.map(b => {
    let left = (b.x1 * fit.sx) + fit.ox;
    let right = (b.x2 * fit.sx) + fit.ox;
    if (mirror) {
        const l = STAGE_WIDTH - right;
        right = STAGE_WIDTH - left;
        left = l;
    }
    const top = (b.y1 * fit.sy) + fit.oy;
    const bottom = (b.y2 * fit.sy) + fit.oy;
    return {
        classId: b.classId,
        label: CLASSES[b.classId],
        score: b.score,
        left, top, right, bottom,
        x: round1(((left + right) / 2) - (STAGE_WIDTH / 2)),
        y: round1((STAGE_HEIGHT / 2) - ((top + bottom) / 2)),
        width: round1(right - left),
        height: round1(bottom - top)
    };
});

/**
 * 從模型輸出到舞台結果的完整流程
 * @param {Float32Array} data 模型輸出
 * @param {object} info {size, scale, imgWidth, imgHeight, fit: 'contain'|'stretch', mirror}
 * @param {object} [opts] {minScore, iouThreshold, maxCount}
 */
const postprocess = (data, info, opts = {}) => {
    const minScore = typeof opts.minScore === 'number' ? opts.minScore : 0.1;
    const iouThreshold = typeof opts.iouThreshold === 'number' ? opts.iouThreshold : 0.45;
    const maxCount = opts.maxCount || 100;
    const raw = decode(data, info.size, CLASSES.length, minScore);
    const kept = nms(raw, iouThreshold, maxCount);
    const imgBoxes = toImageBoxes(kept, info.scale, info.imgWidth, info.imgHeight);
    return toStageObjects(imgBoxes, stageFit(info.imgWidth, info.imgHeight, info.fit), Boolean(info.mirror));
};

/** 依信心門檻（0～1）篩選，保持分數由高到低 */
const filterByScore = (objects, threshold) => objects.filter(o => o.score >= threshold);

/**
 * 選單或變數的值 → 類別索引；接受英文（大小寫不拘）或中文名稱
 * @param {*} value
 * @param {object} [zhNames] {英文: 中文}
 * @returns {number} 找不到回傳 -1
 */
const classIdOf = (value, zhNames) => {
    const s = String(value).trim();
    const lower = s.toLowerCase();
    const i = CLASSES.indexOf(lower);
    if (i >= 0) return i;
    if (zhNames) {
        for (let c = 0; c < CLASSES.length; c++) {
            if (zhNames[CLASSES[c]] === s) return c;
        }
    }
    return -1;
};

module.exports = {
    STAGE_WIDTH,
    STAGE_HEIGHT,
    PAD_VALUE,
    STRIDES,
    CLASSES,
    letterbox,
    rgbaToInput,
    anchorCount,
    decode,
    iou,
    nms,
    toImageBoxes,
    stageFit,
    toStageObjects,
    postprocess,
    filterByScore,
    classIdOf
};
