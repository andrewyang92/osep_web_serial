// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * Claude 插件設定
 *
 * PROXY_URL：Google Apps Script 中繼的網址（部署成網頁應用程式後取得，
 *            長得像 https://script.google.com/macros/s/xxxxxxxx/exec）。
 *            設定後，使用者不需要自己的 Claude 金鑰就能使用（目前留空，不提供）。
 *            這個網址不是金鑰；真正的金鑰存在 GAS 的「指令碼屬性」裡，不會出現在網頁中。
 *            設定方式見 gas/README.md。
 *
 * 不要把 Anthropic API 金鑰（sk-ant-...）寫在這個檔案或任何插件程式裡：
 * 網站是公開的，金鑰會被打包進 lib.min.js，任何人都看得到。
 */
module.exports = {
    // 2026-11-21 起不提供預設中繼：使用者要用「Claude金鑰」積木輸入自己的 API 金鑰
    PROXY_URL: ''
};
