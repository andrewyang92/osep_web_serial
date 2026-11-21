/*
 * ThingSpeak 擴充功能說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從擴充功能原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個擴充功能的積木。
 */
OSEP.addPlugin({
  "id": "gasoThingSpeak",
  "name": "ThingSpeak",
  "nameEn": "ThingSpeak",
  "author": "gasolin",
  "updated": "2026-11-22",
  "tags": [
    "物聯網",
    "網路服務"
  ],
  "needs": [
    "網路",
    "ThingSpeak 帳號"
  ],
  "color": {
    "primary": "#4a90e2",
    "secondary": "#4a90e2",
    "tertiary": "#4a90e2"
  },
  "card": "images/gasoThingSpeak/card.png",
  "icon": "images/gasoThingSpeak/small.png",
  "blockIcon": "",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_thingspeak",
  "tagline": "把數值存到 ThingSpeak 物聯網平台畫成圖表，也能把資料讀回 Scratch。",
  "overview": "ThingSpeak 是 MathWorks 的物聯網資料平台：把感測器或遊戲的數值送上去，網站會自動畫成折線圖，也可以讓別的程式讀回來。\n\nThingSpeak 的資料放在「頻道（channel）」裡，一個頻道有 8 個欄位（field1～field8）。這個擴充功能可以：\n\n- **寫入**：設定寫入 key → 填好要送的欄位 → 送出\n- **讀取**：用讀取 key 和頻道 ID 下載資料，再用 JSON 擴充功能拆開來看\n\n### 事前準備（在 [ThingSpeak 網站](https://thingspeak.mathworks.com/)）\n- 註冊 MathWorks 帳號並登入，到 [My Channels](https://thingspeak.mathworks.com/channels) 按 **New Channel** 建立頻道，勾選要用的欄位（Field 1～8）\n- 在頻道的「API Keys」頁面可以找到 **Write API Key**、**Read API Key** 和 **Channel ID**\n\n> 免費帳號送出資料有時間間隔限制（大約每 15 秒一次），送太快的資料會被丟掉。限制以 ThingSpeak 網站目前的規定為準。\n\n### 相關網站\n- [ThingSpeak 首頁](https://thingspeak.mathworks.com/)：註冊、登入\n- [My Channels](https://thingspeak.mathworks.com/channels)：自己的頻道清單，點進頻道可以看圖表和 API Keys（要先登入）\n- [建立新頻道](https://thingspeak.mathworks.com/channels/new)（要先登入）\n\n擴充功能原始作者：gasolin（[scratch3-internet](https://github.com/gasolin/scratch3-internet)）。",
  "groups": [
    {
      "name": "寫入與讀取",
      "intro": "寫入的順序一定是：[[TS_Writekey]] → 一個或多個 [[TS_col]] → [[Write_TS]]。\n\n讀取用 [[TS_Read]]，再用 [[TS_JSON]] 拿到資料。",
      "blocks": [
        {
          "opcode": "TS_Writekey",
          "type": "command",
          "text": "取得 ThingSpeak 寫入 api key [KEY]",
          "textEn": "obtain ThingSpeak write api key [KEY] ",
          "args": {
            "KEY": {
              "type": "string",
              "value": " ",
              "desc": "頻道的 Write API Key。"
            }
          },
          "summary": "設定寫入用的 key，同時清空準備送出的欄位。",
          "detail": "每次要送一組新的資料前都要先執行這塊：它會把之前用 [[TS_col]] 填的欄位清掉。沒有清掉的話，舊的欄位會跟著一起送出。",
          "tips": "key 會跟著專案存起來，分享專案前記得刪掉。"
        },
        {
          "opcode": "TS_col",
          "type": "command",
          "text": "欄位名稱[COLUMN] 值[VALUE]",
          "textEn": "column name[COLUMN] value [VALUE]",
          "args": {
            "COLUMN": {
              "type": "menu",
              "options": [
                "欄位1",
                "欄位2",
                "欄位3",
                "欄位4",
                "欄位5",
                "欄位6",
                "欄位7",
                "欄位8"
              ],
              "value": "欄位1",
              "values": [
                "欄位1",
                "欄位2",
                "欄位3",
                "欄位4",
                "欄位5",
                "欄位6",
                "欄位7",
                "欄位8"
              ],
              "optionsEn": [
                "field1",
                "field2",
                "field3",
                "field4",
                "field5",
                "field6",
                "field7",
                "field8"
              ],
              "valueEn": "field1",
              "acceptReporters": true,
              "desc": "欄位 1～8，對應頻道的 field1～field8。"
            },
            "VALUE": {
              "type": "string",
              "value": " ",
              "desc": "要存的值，通常是數字。"
            }
          },
          "summary": "填一個要送出的欄位和值。",
          "detail": "要送幾個欄位就用幾塊。這時候還沒有送出，要等 [[Write_TS]]。",
          "tips": "值裡面不要放 `&`、`#`，會讓網址被切斷。"
        },
        {
          "opcode": "Write_TS",
          "type": "command",
          "text": "送出 ThingSpeak 的資料",
          "textEn": "send ThingSpeak data",
          "summary": "把填好的欄位送到 ThingSpeak。",
          "detail": "送出的網址是 `https://api.thingspeak.com/update?api_key=…&field1=…`。積木不會告訴你成功或失敗，可以到 ThingSpeak 頻道的圖表確認。",
          "example": [
            {
              "use": "TS_Writekey",
              "args": {
                "KEY": "你的寫入key"
              }
            },
            {
              "use": "TS_col",
              "args": {
                "COLUMN": {
                  "v": "欄位1",
                  "menu": true
                },
                "VALUE": {
                  "t": "溫度",
                  "cat": "data",
                  "type": "reporter"
                }
              }
            },
            {
              "use": "TS_col",
              "args": {
                "COLUMN": {
                  "v": "欄位2",
                  "menu": true
                },
                "VALUE": {
                  "t": "濕度",
                  "cat": "data",
                  "type": "reporter"
                }
              }
            },
            {
              "use": "Write_TS"
            }
          ]
        },
        {
          "opcode": "TS_Read",
          "type": "command",
          "text": "取得 ThingSpeak 讀取 api key [KEY] 頻道 ID [CHANNEL]",
          "textEn": "obtain ThingSpeak read data api key [KEY] channel ID [CHANNEL]",
          "args": {
            "KEY": {
              "type": "string",
              "value": " ",
              "desc": "頻道的 Read API Key（公開頻道可以留空白）。"
            },
            "CHANNEL": {
              "type": "string",
              "value": " ",
              "desc": "頻道 ID（數字）。"
            }
          },
          "summary": "下載頻道裡的資料。",
          "detail": "下載完成後，[[TS_JSON]] 會是一串 JSON 文字：每一筆資料是一個物件，有 `created_at`（時間）、`entry_id`（編號）和 `field1`～`field8`。\n\n> 積木結束時資料**可能還沒下載完**。在後面加「等待 1 秒」再讀，比較保險。"
        },
        {
          "opcode": "TS_JSON",
          "type": "reporter",
          "text": "讀取的 ThingSpeak 資料",
          "textEn": "ThingSpeak data",
          "args": {
            "id": {
              "type": "string",
              "value": "id",
              "desc": "積木上沒有這個空格（程式裡留下來的設定），不用理會。"
            }
          },
          "summary": "最近一次 [[TS_Read]] 下載的資料。",
          "returns": "JSON 文字，例如 `[{\"created_at\":\"…\",\"entry_id\":1,\"field1\":\"25\"}, …]`。還沒讀過時是「錯誤：ThingSpeak 資料不存在」。",
          "tips": "用 JSON 擴充功能的「JSON 資料的第幾筆」「參數對應的值」就能取出某一筆的某個欄位，見範例 2。",
          "detail": ""
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "每 20 秒上傳一次溫度",
      "intro": "把變數「溫度」（例如從感測器讀到的值）定時送到欄位 1，ThingSpeak 會畫出折線圖。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "t": "重複無限次",
          "cat": "control",
          "type": "c",
          "body": [
            {
              "use": "TS_Writekey",
              "args": {
                "KEY": "你的寫入key"
              }
            },
            {
              "use": "TS_col",
              "args": {
                "COLUMN": {
                  "v": "欄位1",
                  "menu": true
                },
                "VALUE": {
                  "t": "溫度",
                  "cat": "data",
                  "type": "reporter"
                }
              }
            },
            {
              "use": "Write_TS"
            },
            {
              "t": "等待 [S] 秒",
              "cat": "control",
              "args": {
                "S": {
                  "num": "20"
                }
              }
            }
          ]
        }
      ],
      "explain": "迴圈裡每次都先執行「取得寫入 api key」，才不會把上一次的欄位重複送出。"
    },
    {
      "title": "讀回最新一筆資料",
      "intro": "下載頻道資料，取出最後一筆的欄位 1。要搭配 JSON 擴充功能。",
      "script": [
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
          "use": "TS_Read",
          "args": {
            "KEY": "你的讀取key",
            "CHANNEL": "1234567"
          }
        },
        {
          "t": "等待 [S] 秒",
          "cat": "control",
          "args": {
            "S": {
              "num": "1"
            }
          }
        },
        {
          "t": "變數 [V] 設為 [N]",
          "cat": "data",
          "args": {
            "V": {
              "v": "全部",
              "menu": true
            },
            "N": {
              "use": "TS_JSON"
            }
          }
        },
        {
          "t": "變數 [V] 設為 [N]",
          "cat": "data",
          "args": {
            "V": {
              "v": "最新",
              "menu": true
            },
            "N": {
              "use": "gasoJSON.readEntryFromJSON",
              "args": {
                "variable": {
                  "t": "全部",
                  "cat": "data",
                  "type": "reporter"
                },
                "n": {
                  "use": "gasoJSON.getJsonAllNum",
                  "args": {
                    "variable": {
                      "t": "全部",
                      "cat": "data",
                      "type": "reporter"
                    }
                  }
                }
              }
            }
          }
        },
        {
          "t": "說出 [M]",
          "cat": "looks",
          "args": {
            "M": {
              "use": "gasoJSON.readAttrFromJSON",
              "args": {
                "variable": {
                  "t": "最新",
                  "cat": "data",
                  "type": "reporter"
                },
                "attr": "field1"
              }
            }
          }
        }
      ],
      "explain": "「資料筆數」就是最後一筆的編號，所以拿它當「第幾筆」就能取到最新的一筆。"
    }
  ],
  "faq": [
    {
      "q": "送出了，圖表卻沒有新的點？",
      "a": "- 確認用的是 **Write** API Key，不是 Read\n- 送太快（間隔太短）的資料會被丟掉，加長等待時間\n- 欄位要在頻道設定裡勾選啟用"
    },
    {
      "q": "讀到的值為什麼是文字？",
      "a": "ThingSpeak 回傳的欄位值都是文字（例如 \"25\"）。Scratch 拿來計算時會自動轉成數字，不用另外處理。"
    },
    {
      "q": "讀回來是「錯誤：ThingSpeak 資料不存在」？",
      "a": "代表還沒下載完或下載失敗。檢查頻道 ID、讀取 key，並在 [[TS_Read]] 後面加一點等待時間。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    }
  ]
});
