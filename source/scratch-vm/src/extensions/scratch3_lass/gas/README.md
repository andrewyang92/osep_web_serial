# LASS 插件：空氣盒子資料中繼程式（Google Apps Script）

LASS（pm25.lass-net.org）的空氣盒子資料 2026-09-01 起停止更新。這支程式每 10 分鐘從
Edimax 空氣盒子網站（airbox.edimaxcloud.com，地圖網頁自己用的資料）抓一次公開設備的最新數值，
轉成和 LASS 相同的格式，存在你的 Google 雲端硬碟（`osep-lass-airbox.json`），再用網頁應用程式提供出去。

## 部署
1. 到 https://script.google.com 新增專案，把 `Code.gs` 的內容整個貼上、存檔
2. 上方函式選單選 `setup` → 執行，依畫面允許權限
   （連到外部網站、雲端硬碟、觸發條件）。執行紀錄出現「完成：xxx 台設備」就成功了
3. 部署 → 新增部署作業 → 類型選「網頁應用程式」
   - 執行身分：**我**
   - 誰可以存取：**任何人**
4. 複製網頁應用程式網址（`https://script.google.com/macros/s/.../exec`）

修改程式後要「管理部署作業 → 編輯 → 版本：新版本」，網址才會換成新程式。

## 網址怎麼用
| 網址 | 回傳 | 對應原本的 LASS |
|---|---|---|
| `<網址>` | 全部近 3 小時有資料的設備 | `last-all-airbox.json` |
| `<網址>?device_id=74DA3895DDDC` | 單一設備（`feeds[0].AirBox`），不分大小寫 | `last.php?device_id=` |
| `<網址>?status=1` | 最後更新時間、設備數量 | － |

每筆欄位：`device_id`（MAC，12 碼）、`name`、`SiteName`、`s_d0`（PM2.5）、`s_d1`（PM10）、
`s_d2`（PM1）、`s_t0`（溫度）、`s_h0`（濕度）、`gps_lat`、`gps_lon`、`timestamp`／`date`／`time`（UTC）、
`model`、`odm`、`status`。

## 設定（`Code.gs` 最上面的 `CONFIG`）
- `KEEP_HOURS`：只保留幾小時內有回傳的設備（預設 3）
- `UPDATE_MINUTES`：多久抓一次（1、5、10、15、30，預設 10；改了要重新執行 `setup`）

## 注意
- Edimax 沒有公開這個資料介面的文件，網站改版時可能要跟著改
- 抓不到資料時（Edimax 故障），網址會繼續回傳上一次成功的資料；用 `?status=1` 看 `updated` 時間
- 執行紀錄可在 Apps Script 左邊「執行項目」查看
