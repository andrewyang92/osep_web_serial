// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * OSEP Scratch「LASS」插件的空氣盒子資料中繼程式（Google Apps Script）
 *
 * 為什麼需要：LASS（pm25.lass-net.org）的空氣盒子資料 2026-09-01 起停止更新。
 * 這支程式定時從 Edimax 空氣盒子網站（airbox.edimaxcloud.com，地圖網頁自己用的資料）
 * 取得公開設備的最新數值，轉成和 LASS 一樣的格式，讓插件換網址就能繼續用。
 *
 * 提供的網址（部署後的網頁應用程式網址，以下稱 <網址>）：
 *   <網址>                      → 和 last-all-airbox.json 相同格式（全部近期有資料的設備）
 *   <網址>?device_id=74DA38xxxx → 和 last.php?device_id= 相同格式（單一設備，用 MAC 查）
 *   <網址>?status=1             → 最後更新時間、設備數量（確認排程有在跑）
 *
 * 第一次設定：
 *   1. 執行 setup()（會要求授權：連到外部網站、使用 Google 雲端硬碟、建立觸發條件）
 *      → 立刻抓一次資料，並建立「每 10 分鐘」的定時觸發
 *   2. 部署 → 新增部署作業 → 類型「網頁應用程式」
 *      執行身分：我　／　誰可以存取：任何人
 * 修改程式後要「管理部署作業 → 編輯 → 版本：新版本」，網址才會用到新程式。
 *
 * 注意：Edimax 沒有公開這個資料介面的文件，它改版時這裡可能要跟著改。
 */

var CONFIG = {
  SITE: 'https://airbox.edimaxcloud.com/',
  TOKEN_PATH: 'tk/webToken.json',
  DEVICES_PATH: 'fe/query_devices',
  // 和 Edimax 地圖網頁送出的清單相同
  ODM: ['acelink', 'edimax', 'sga', 'school', 'ntu', 'nctu', 'iis', 'none',
        'taiwan.epa', 'lass', 'taiwan.tciot.chinan', 'taiwan.tciot.epa',
        'taiwan.tciot.sinica', 'taiwan.tciot.most'],
  KEEP_HOURS: 3,            // 只保留這幾個小時內有回傳資料的設備（LASS 是 2 小時就算離線）
  UPDATE_MINUTES: 10,       // 定時觸發間隔（Apps Script 只接受 1、5、10、15、30）
  FILE_NAME: 'osep-lass-airbox.json',
  CACHE_SECONDS: 21600,     // 快取最多 6 小時（Apps Script 上限）
  CACHE_CHUNK: 30000,       // 每塊快取字元數（單一值上限 100KB）
  SOURCE: 'OSEP relay of airbox.edimaxcloud.com'
};

/* ============================ 設定與排程 ============================ */

/** 第一次使用時手動執行：抓一次資料，並建立定時觸發 */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'updateAirbox') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('updateAirbox').timeBased().everyMinutes(CONFIG.UPDATE_MINUTES).create();
  var data = updateAirbox();
  Logger.log('完成：' + data.num_of_records + ' 台設備，資料時間 ' + data.version);
}

/** 定時觸發執行：從 Edimax 抓資料 → 轉格式 → 存起來 */
function updateAirbox() {
  var devices = fetchEdimaxDevices_();
  var data = buildAllAirbox_(devices, new Date());
  saveData_(data);
  return data;
}

/* ============================ 網頁應用程式 ============================ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var data = loadData_();
  if (!data) {
    return json_({ source: CONFIG.SOURCE, error: 'no data yet, run setup() first', num_of_records: 0, feeds: [] });
  }
  if (p.status) {
    return json_({ source: data.source, version: data.version, updated: data.updated, num_of_records: data.num_of_records });
  }
  if (p.device_id) {
    return json_(buildDeviceResult_(data, p.device_id));
  }
  return json_(data);
}

/* ============================ 轉換（不依賴 Apps Script，可在 Node 測試） ============================ */

/** Edimax 的 "YYYY-MM-DD HH:MM:SS"（UTC）→ Date；格式不對回傳 null */
function parseUtc_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
}

function num_(v) {
  var n = Number(v);
  return isFinite(n) ? n : null;
}

/**
 * 設備編號：有 mac 就用 mac；沒有的話 Edimax 的 device_id 本身就是 12 碼 MAC
 * （2026-11-22 實測：在線 572 台裡 531 台 mac 是空的、device_id 是 12 碼；
 *   另一種 device_id 是 64 碼雜湊值，這種都有 mac）
 */
function deviceKey_(d) {
  if (d.mac) return String(d.mac).trim().toUpperCase();
  var id = String(d.device_id || '').trim();
  return /^[0-9A-Fa-f]{12}$/.test(id) ? id.toUpperCase() : '';
}

/** 一台 Edimax 設備 → LASS 格式的一筆資料；不要的設備回傳 null */
function toLassFeed_(d) {
  if (!d || d.hidden === 'Y') return null;
  var key = deviceKey_(d);
  if (!key) return null;
  var t = parseUtc_(d.utc_time);
  if (!t) return null;
  var iso = t.toISOString().replace(/\.\d{3}Z$/, 'Z');   // 2026-11-22T00:08:52Z
  return {
    device_id: key,
    name: d.device_name || '',
    SiteName: d.device_name || '',
    app: 'AirBox',
    model: d.model || '',
    odm: d.odm || '',
    status: d.status || '',
    s_d0: num_(d.pm25),     // PM2.5
    s_d1: num_(d.pm10),     // PM10
    s_d2: num_(d.pm1),      // PM1
    s_t0: num_(d.t),        // 溫度
    s_h0: num_(d.h),        // 濕度
    gps_lat: num_(d.gps_lat),
    gps_lon: num_(d.gps_lon),
    timestamp: iso,
    date: iso.substring(0, 10),
    time: iso.substring(11, 19)
  };
}

/** 全部設備 → last-all-airbox.json 格式（只留 KEEP_HOURS 內有資料的，同一個 MAC 留最新的） */
function buildAllAirbox_(devices, now) {
  var limit = now.getTime() - CONFIG.KEEP_HOURS * 3600 * 1000;
  var byMac = {};
  (devices || []).forEach(function (d) {
    var f = toLassFeed_(d);
    if (!f || Date.parse(f.timestamp) < limit) return;
    var old = byMac[f.device_id];
    if (!old || old.timestamp < f.timestamp) byMac[f.device_id] = f;
  });
  var feeds = Object.keys(byMac).map(function (k) { return byMac[k]; });
  feeds.sort(function (a, b) { return a.device_id < b.device_id ? -1 : 1; });
  var version = feeds.reduce(function (m, f) { return f.timestamp > m ? f.timestamp : m; }, '');
  return {
    source: CONFIG.SOURCE,
    num_of_records: feeds.length,
    feeds: feeds,
    version: version,
    updated: now.toISOString().replace(/\.\d{3}Z$/, 'Z')
  };
}

/** 單一設備 → last.php?device_id= 格式：{device_id, num_of_records, feeds:[{AirBox:{...}}]} */
function buildDeviceResult_(data, id) {
  var key = String(id || '').trim().toUpperCase();
  var found = null;
  for (var i = 0; i < data.feeds.length; i++) {
    if (data.feeds[i].device_id === key) { found = data.feeds[i]; break; }
  }
  return {
    source: data.source,
    device_id: key,
    num_of_records: found ? 1 : 0,
    feeds: found ? [{ AirBox: found }] : [],
    version: data.version
  };
}

/* ============================ 抓資料 ============================ */

function fetchEdimaxDevices_() {
  var headers = {
    'Referer': CONFIG.SITE,
    'Origin': CONFIG.SITE.replace(/\/$/, '')
  };

  var tokenRes = UrlFetchApp.fetch(CONFIG.SITE + CONFIG.TOKEN_PATH, { headers: headers, muteHttpExceptions: true });
  if (tokenRes.getResponseCode() !== 200) {
    throw new Error('webToken HTTP ' + tokenRes.getResponseCode());
  }
  var token = JSON.parse(tokenRes.getContentText()).token;
  if (!token) throw new Error('webToken 沒有 token');

  // 網頁用 withCredentials，所以把拿 token 時收到的 cookie 一起帶上
  var cookie = cookiesFrom_(tokenRes);
  if (cookie) headers['Cookie'] = cookie;

  var res = UrlFetchApp.fetch(CONFIG.SITE + CONFIG.DEVICES_PATH, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify({
      type: ['airbox', 'public'],
      request_type: 'alldevices',
      odm: CONFIG.ODM,
      token: token
    }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('query_devices HTTP ' + res.getResponseCode() + ': ' + res.getContentText().substring(0, 200));
  }
  var body = JSON.parse(res.getContentText());
  if (!body || !Array.isArray(body.devices)) {
    throw new Error('query_devices 回傳格式不同：' + res.getContentText().substring(0, 200));
  }
  return body.devices;
}

function cookiesFrom_(res) {
  var h = res.getAllHeaders()['Set-Cookie'];
  if (!h) return '';
  var list = Array.isArray(h) ? h : [h];
  return list.map(function (c) { return String(c).split(';')[0]; }).join('; ');
}

/* ============================ 儲存（雲端硬碟檔案＋快取） ============================ */

function saveData_(data) {
  var text = JSON.stringify(data);
  var files = DriveApp.getFilesByName(CONFIG.FILE_NAME);
  if (files.hasNext()) {
    files.next().setContent(text);
  } else {
    DriveApp.createFile(CONFIG.FILE_NAME, text, 'application/json');
  }
  putCache_(text);
}

function loadData_() {
  var text = getCache_();
  if (!text) {
    var files = DriveApp.getFilesByName(CONFIG.FILE_NAME);
    if (!files.hasNext()) return null;
    text = files.next().getBlob().getDataAsString('UTF-8');
    putCache_(text);
  }
  return JSON.parse(text);
}

function putCache_(text) {
  var cache = CacheService.getScriptCache();
  var parts = {};
  var n = Math.ceil(text.length / CONFIG.CACHE_CHUNK);
  for (var i = 0; i < n; i++) {
    parts['airbox_' + i] = text.substring(i * CONFIG.CACHE_CHUNK, (i + 1) * CONFIG.CACHE_CHUNK);
  }
  parts['airbox_n'] = String(n);
  cache.putAll(parts, CONFIG.CACHE_SECONDS);
}

function getCache_() {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get('airbox_n'));
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push('airbox_' + i);
  var got = cache.getAll(keys);
  var text = '';
  for (var j = 0; j < n; j++) {
    if (got[keys[j]] == null) return null;   // 有一塊過期就整份重讀
    text += got[keys[j]];
  }
  return text;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
