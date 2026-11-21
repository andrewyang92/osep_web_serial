// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * YOLO 物件辨識的載入設定
 *
 * - onnxruntime-web 執行期從 jsDelivr 載入（不必改 package.json）
 *   先用純 wasm 版（CPU）馬上開始；有 WebGPU 的瀏覽器同時在背景準備 webgpu 版，好了就換成 GPU
 *   （第一次在某台電腦上用 GPU 要編譯 shader，約 20～30 秒；之後瀏覽器有快取，約 1 秒）
 * - YOLOX 模型（Megvii，Apache 2.0）只放一份在 repo 根目錄的 static/osep/yolox/：
 *   新版頁面在 /new/，'../static/' 就是 repo 根目錄的 static/（GitHub Pages 會直接提供）；
 *   舊版開發伺服器的頁面在 /，'../' 不會超過根目錄，一樣指到 /static/（webpack 會複製 static/）
 */
// 1.20.1 的 WebGPU 推論在部分 Intel 顯示卡上會一直不回來，1.23 以後正常（2026-11-21 測試）
const ORT_VERSION = '1.24.3';
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

module.exports = {
    ORT_VERSION,
    ORT_BASE,
    ORT_WEBGPU_URL: `${ORT_BASE}ort.webgpu.min.mjs`,
    ORT_WASM_URL: `${ORT_BASE}ort.wasm.min.mjs`,
    MODELS: {
        // 快速：視訊比較順（COCO AP 25.8）
        fast: {url: '../static/osep/yolox/yolox_nano.onnx', size: 416, name: 'YOLOX-Nano'},
        // 準確：比較準，但比較慢（COCO AP 32.8）
        accurate: {url: '../static/osep/yolox/yolox_tiny.onnx', size: 416, name: 'YOLOX-Tiny'}
    },
    DEFAULT_MODEL: 'fast'
};
