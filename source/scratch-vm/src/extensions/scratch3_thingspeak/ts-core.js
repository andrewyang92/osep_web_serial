// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
// ThingSpeak 擴充功能的計算部分（不依賴 Scratch，可以用 node 測）。
// 插件原作者：gasolin（https://github.com/gasolin/scratch3-internet），estea8968 修改；2026-11-28 改寫修正。

const API = 'https://api.thingspeak.com';

// 寫入時可用的欄位：field1～field8，以及 ThingSpeak update API 的其他參數
const EXTRA_PARAMS = ['lat', 'long', 'elevation', 'status', 'created_at'];

/**
 * 把使用者給的欄位名稱轉成 ThingSpeak 的名稱。
 * 接受「欄位1」「field1」「Field 1」「1」；時間 → created_at、編號 → entry_id。
 * @param {*} column 欄位
 * @returns {string|null} 名稱；不認得時回傳 null
 */
const fieldName = function (column) {
    const s = String(column === undefined || column === null ? '' : column).trim();
    if (!s) return null;
    let m = s.match(/^(?:欄位|field)?\s*([1-8])$/i);
    if (m) return 'field' + m[1];
    if (s === '時間' || /^time$/i.test(s)) return 'created_at';
    if (s === '編號' || /^entry[ _]?id$/i.test(s)) return 'entry_id';
    const lower = s.toLowerCase();
    if (EXTRA_PARAMS.indexOf(lower) >= 0) return lower;
    return null;
};

/**
 * 寫入網址：https://api.thingspeak.com/update?api_key=…&field1=…
 * @param {string} key 寫入 API Key
 * @param {Array<Array<string>>} fields [[名稱, 值], …]
 * @returns {string} 網址
 */
const updateUrl = function (key, fields) {
    let url = API + '/update?api_key=' + encodeURIComponent(String(key).trim());
    fields.forEach(f => {
        url += '&' + f[0] + '=' + encodeURIComponent(String(f[1]).trim());
    });
    return url;
};

/**
 * 讀取網址：https://api.thingspeak.com/channels/<頻道>/feeds.json[?api_key=…]
 * 讀取 key 空白時不帶（公開頻道不需要 key）。
 * @param {string} channel 頻道 ID
 * @param {string} key 讀取 API Key
 * @returns {string|null} 網址；頻道 ID 不是數字時回傳 null
 */
const feedsUrl = function (channel, key) {
    const ch = String(channel === undefined || channel === null ? '' : channel).trim();
    if (!/^\d+$/.test(ch)) return null;
    const k = String(key === undefined || key === null ? '' : key).trim();
    return API + '/channels/' + ch + '/feeds.json' + (k ? '?api_key=' + encodeURIComponent(k) : '');
};

/**
 * update API 的回應：成功是新資料的編號（1、2、3…），失敗是 0。
 * @param {string} text 回應文字
 * @returns {number} 編號或 0
 */
const parseUpdate = function (text) {
    const n = parseInt(String(text).trim(), 10);
    return isNaN(n) || n < 0 ? 0 : n;
};

/**
 * 從 feeds.json 的回應取出資料陣列。
 * 私人頻道 key 錯誤時 ThingSpeak 回傳 -1。
 * @param {*} json 回應
 * @returns {Array|null} feeds；格式不對時回傳 null
 */
const parseFeeds = function (json) {
    if (!json || typeof json !== 'object' || !Array.isArray(json.feeds)) return null;
    return json.feeds;
};

const pad = function (n) {
    return (n < 10 ? '0' : '') + n;
};

/**
 * ThingSpeak 的時間是 UTC（2026-11-28T02:32:25Z），轉成電腦所在時區的「YYYY-MM-DD HH:MM:SS」。
 * @param {string} s 時間
 * @returns {string} 本地時間；看不懂時原樣回傳
 */
const localTime = function (s) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
};

/**
 * 取第 n 筆（1 = 最舊；n = 筆數 = 最新）的某個欄位。
 * @param {Array} feeds 資料
 * @param {number} n 第幾筆
 * @param {*} column 欄位
 * @returns {string} 值；沒有資料、超出範圍或欄位是空的時回傳空字串
 */
const valueAt = function (feeds, n, column) {
    if (!Array.isArray(feeds)) return '';
    const i = Math.round(Number(n)) - 1;
    if (!(i >= 0 && i < feeds.length)) return '';
    const name = fieldName(column);
    if (!name) return '';
    const v = feeds[i][name];
    if (v === undefined || v === null) return '';
    return name === 'created_at' ? localTime(v) : String(v);
};

module.exports = {
    API,
    fieldName,
    updateUrl,
    feedsUrl,
    parseUpdate,
    parseFeeds,
    localTime,
    valueAt
};
