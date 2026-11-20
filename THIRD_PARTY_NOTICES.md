# 第三方套件與模型授權（OSEP 自製插件）

本檔列出 Andrew Yang 製作的 OSEP 插件（`claude`、`textSentiment`、`faceExpressionMediapipe`、
`decisionTree`）與插件說明網站 `plugin-docs/` 用到的第三方套件、資料與模型。

插件本身的程式碼依本 repo 的授權（BSD-3-Clause，見 `LICENSE`）。各檔開頭有著作權與
`SPDX-License-Identifier` 標註。

授權資訊於 2026-11-21 依各專案的 GitHub／Hugging Face 頁面核對。

## 包含在本 repo 內的第三方資料

| 名稱 | 用在 | 授權 | 來源 |
|---|---|---|---|
| OpenCC 字典（TSCharacters、TWVariantsRev） | `textSentiment/t2s.js`：繁體轉簡體對照表，由 opencc-js 1.4.2 產生 | Apache License 2.0 | https://github.com/BYVoid/OpenCC |

## 執行時從網路載入（不包含在本 repo 內）

這些檔案在使用者的瀏覽器執行插件時才從 CDN 或模型網站下載，本 repo 沒有重新散布。

| 名稱 | 用在 | 授權 | 來源 |
|---|---|---|---|
| Transformers.js 4.3.2（`@huggingface/transformers`） | textSentiment | Apache License 2.0 | https://github.com/huggingface/transformers.js |
| Erlangshen-Roberta-110M-Sentiment（中文情緒模型） | textSentiment | Apache License 2.0 | 原始模型：https://huggingface.co/IDEA-CCNL/Erlangshen-Roberta-110M-Sentiment<br>實際下載的 ONNX 轉換版：https://huggingface.co/onnx-community/Erlangshen-Roberta-110M-Sentiment-ONNX（頁面未標示授權，依原始模型） |
| DistilBERT base uncased fine-tuned SST-2（英文情緒模型） | textSentiment | Apache License 2.0 | 原始模型：https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english<br>實際下載的 ONNX 轉換版：https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-sst-2-english |
| MediaPipe Tasks Vision 1.2.2（`@mediapipe/tasks-vision`） | faceExpressionMediapipe | Apache License 2.0 | https://github.com/google-ai-edge/mediapipe |
| MediaPipe Face Landmarker 模型（`face_landmarker.task`） | faceExpressionMediapipe | Apache License 2.0 | https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker<br>模型卡：https://huggingface.co/litert-community/MediaPipe-FaceLandmarker |
| Noto Sans TC 字型（Google Fonts） | plugin-docs 網站 | SIL Open Font License 1.1 | https://fonts.google.com/noto/specimen/Noto+Sans+TC |

## 其他說明

- **claude**：透過 Anthropic Messages API（經 Google Apps Script 中繼）連線，沒有包含 Anthropic 的程式碼；使用時須遵守 Anthropic 的使用條款。
- **decisionTree**：沒有使用第三方套件。範例資料「打網球」是 Quinlan 的經典決策樹教材資料。
- **卡片圖**：由 `osep_new_patch/card_art/` 的自製腳本產生，依本 repo 的授權。
