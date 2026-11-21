/*
 * IFTTT 插件說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個插件的積木。
 */
OSEP.addPlugin({
  "id": "gasoIFTTT",
  "name": "IFTTT",
  "nameEn": "IFTTT",
  "author": "gasolin",
  "updated": "2026-11-22",
  "tags": [
    "物聯網",
    "網路服務"
  ],
  "needs": [
    "網路",
    "IFTTT 帳號"
  ],
  "color": {
    "primary": "#4a90e2",
    "secondary": "#4a90e2",
    "tertiary": "#4a90e2"
  },
  "card": "images/gasoIFTTT/card.png",
  "icon": "images/gasoIFTTT/small.png",
  "blockIcon": "",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_ifttt",
  "tagline": "從 Scratch 觸發 IFTTT：寄信、傳通知、記到試算表、控制智慧家電。",
  "overview": "IFTTT（If This Then That，「如果這樣，就那樣」）是一個把各種網路服務串起來的平台。這個插件只有一塊積木：送出一個「事件」給 IFTTT 的 **Webhooks** 服務，IFTTT 收到後就會執行你設定好的動作，例如：\n\n- 寄一封 Email 或手機通知給自己\n- 把分數、感測器數值記到 Google 試算表\n- 開關支援 IFTTT 的智慧燈泡、插座\n\n每個事件可以帶 3 個參數（value1～value3），在 IFTTT 的動作裡用 `{{Value1}}` 這樣的寫法放進信件或試算表。\n\n> 插件只負責「送出」，看不到 IFTTT 有沒有成功執行。要確認，請到 IFTTT 網站的活動紀錄（Activity）查看。\n\n### 事前準備（在 IFTTT 網站）\n- 註冊 IFTTT 帳號，建立一個 Applet\n- 「If This」選 **Webhooks** 的「Receive a web request」，填一個事件名稱，例如 `scratch_score`\n- 「Then That」選要執行的動作（Email、Google Sheets…）\n- 到 Webhooks 服務的設定頁（Documentation）找到自己的 **key**\n\n> Webhooks 是否需要付費方案、能用哪些動作，依 IFTTT 網站目前的規定為準。\n\n插件原始作者：gasolin（[scratch3-internet](https://github.com/gasolin/scratch3-internet)）。",
  "groups": [
    {
      "name": "傳送事件",
      "intro": "",
      "blocks": [
        {
          "opcode": "fetchIFTTT",
          "type": "command",
          "text": "IFTTT key [key] 傳送事件 [event] 參數1 [value1] 參數2 [value2] 參數3 [value3]",
          "textEn": "IFTTT key [key] send event [event] value1 [value1] value2 [value2] value3 [value3]",
          "args": {
            "key": {
              "type": "string",
              "value": "key",
              "desc": "自己的 Webhooks key（在 IFTTT 的 Webhooks 設定頁可以找到）。"
            },
            "event": {
              "type": "string",
              "value": "event",
              "desc": "事件名稱，要和 Applet 裡「Receive a web request」填的一模一樣。"
            },
            "value1": {
              "type": "string",
              "value": " ",
              "desc": "要傳的第 1 個值，在 IFTTT 動作裡寫 `{{Value1}}` 取用。不需要可以留空白。"
            },
            "value2": {
              "type": "string",
              "value": " ",
              "desc": "第 2 個值（`{{Value2}}`）。"
            },
            "value3": {
              "type": "string",
              "value": " ",
              "desc": "第 3 個值（`{{Value3}}`）。"
            }
          },
          "summary": "送出一個事件給 IFTTT，帶上最多 3 個值。",
          "detail": "插件會送出 `https://maker.ifttt.com/trigger/事件名稱/with/key/你的key?value1=…&value2=…&value3=…`。IFTTT 收到後，執行這個事件對應的 Applet。\n\n- 值裡面不要放 `&`、`#`、`?` 這些符號，會讓網址被切斷，IFTTT 收到的值就不完整\n- 瀏覽器看不到 IFTTT 的回應，所以積木不會告訴你成功或失敗\n- 不要在「重複無限次」裡一直送，IFTTT 有使用次數限制",
          "tips": "key 等於你的 IFTTT 密碼，專案分享出去別人就能用你的帳號觸發事件。分享前把 key 刪掉。",
          "example": [
            {
              "t": "當 [K] 鍵被按下",
              "cat": "events",
              "type": "hat",
              "args": {
                "K": {
                  "v": "空白",
                  "menu": true
                }
              }
            },
            {
              "use": "fetchIFTTT",
              "args": {
                "key": "你的key",
                "event": "scratch_score",
                "value1": {
                  "t": "分數",
                  "cat": "data",
                  "type": "reporter"
                },
                "value2": " ",
                "value3": " "
              }
            }
          ]
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "遊戲結束時把分數記到試算表",
      "intro": "IFTTT 裡建立「Webhooks（事件 game_over）→ Google Sheets 新增一列」的 Applet，Value1 放名字、Value2 放分數。",
      "script": [
        {
          "t": "當收到訊息 [M]",
          "cat": "events",
          "type": "hat",
          "args": {
            "M": {
              "v": "遊戲結束",
              "menu": true
            }
          }
        },
        {
          "t": "詢問 [Q] 並等待",
          "cat": "sensing",
          "args": {
            "Q": "你的名字是？"
          }
        },
        {
          "use": "fetchIFTTT",
          "args": {
            "key": "你的key",
            "event": "game_over",
            "value1": {
              "t": "詢問的答案",
              "cat": "sensing",
              "type": "reporter"
            },
            "value2": {
              "t": "分數",
              "cat": "data",
              "type": "reporter"
            },
            "value3": " "
          }
        },
        {
          "t": "說出 [M] 持續 [S] 秒",
          "cat": "looks",
          "args": {
            "M": "已送出成績！",
            "S": {
              "num": "2"
            }
          }
        }
      ],
      "explain": "名字裡如果有 & 或 #，試算表收到的會不完整。"
    }
  ],
  "faq": [
    {
      "q": "按了積木，IFTTT 沒有反應？",
      "a": "- 事件名稱和 Applet 裡填的要完全一樣（大小寫也一樣）\n- key 要是自己帳號的 Webhooks key\n- 到 IFTTT 網站的 Activity 看有沒有收到\n- 確認 Applet 是開啟狀態"
    },
    {
      "q": "可以從 IFTTT 傳資料回 Scratch 嗎？",
      "a": "這個插件不行，只能從 Scratch 送出去。要讀網路上的資料，可以用 JSON 插件。"
    },
    {
      "q": "為什麼一次只能傳 3 個值？",
      "a": "IFTTT Webhooks 的「Receive a web request」只提供 Value1～Value3 三個欄位。要傳更多，可以用「字串組合」把幾個值接成一個，例如用逗號分隔。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    }
  ]
});
