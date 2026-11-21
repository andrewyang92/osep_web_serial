# OSEP 插件說明網站

介紹 OSEP Scratch 插件的功能，以及每一塊積木的用法。

- 打開：直接雙擊 `index.html`（不需要伺服器），或放到 GitHub Pages
- 網站內的「新增插件」頁面有完整的圖文步驟
- 中文／English：右上角的按鈕切換，或網址加 `?lang=en`（選過的語言會記住）

## 資料夾

```
index.html              網站入口
assets/                 網站程式（一般不用改）
  app.js                頁面、搜尋、路由
  blocks.js             Scratch 風格積木繪製
  guide.js              「新增插件」頁面內容
  style.css             樣式
plugins/
  list.js              要顯示哪些插件、順序
  claude.js             一個插件一個檔案（積木資料＋中文說明）
  claude.en.js          英文說明（OSEP.addText），沒有就顯示中文
  textSentiment.js / .en.js
  faceExpressionMediapipe.js / .en.js
  decisionTree.js / .en.js
images/<插件id>/        card.png、small.svg、block-icon.svg
tools/extract-plugin.js 從插件原始碼產生／同步資料檔
tools/make-examples.js  把範例轉成可下載的 .sb3（examples/<插件id>/zh-1.sb3、en-1.sb3…，清單在 plugins/examples.js）
examples/               範例檔（工具產生）
```

## 新增一個插件（3 步）

```bash
# 1. 從原始碼產生資料檔（也會存好積木圖示、加進 list.js）
node tools/extract-plugin.js ../node_modules/scratch-vm/src/extensions/scratch3_你的插件

# 2. 把卡片圖複製到 images/<插件id>/card.png 與 small.svg

# 3. 打開 plugins/<插件id>.js，把 TODO 換成說明

# 4. 新增 plugins/<插件id>.en.js 寫英文說明（格式見「新增插件」頁），雙擊 index.html 檢查
```

插件更新後再執行一次第 1 步，就能同步積木文字與參數，已寫好的說明會保留。

需要 Node.js，而且插件資料夾要在 `osep_web_serial` 專案的 `node_modules` 裡（工具會用到專案的 `format-message` 套件）。

## 授權

網站程式依 `osep_web_serial` 的授權（BSD-3-Clause，見 repo 根目錄的 `LICENSE`），
Copyright (c) 2026 Andrew Yang。用到的字型與各插件的第三方套件、模型，見 repo 根目錄的
`THIRD_PARTY_NOTICES.md`。
