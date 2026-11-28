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
  "updated": "2026-11-28",
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
  "tagline": "把數值存到 ThingSpeak 物聯網平台畫成圖表，也能把資料讀回 Scratch、取出欄位的值或交給圖表擴充功能畫折線圖。",
  "overview": "ThingSpeak 是 MathWorks 的物聯網資料平台：把感測器或遊戲的數值送上去，網站會自動畫成折線圖，也可以讓別的程式讀回來。\n\nThingSpeak 的資料放在「頻道（channel）」裡，一個頻道有 8 個欄位（field1～field8）。這個擴充功能可以：\n\n- **寫入**：設定寫入 key → 填好要送的欄位 → 送出，再用 [[TS_writeResult]] 看有沒有成功\n- **讀取**：用頻道 ID（私人頻道再加讀取 key）下載最近 100 筆資料，用 [[TS_lastValue]]、[[TS_valueAt]] 直接取出欄位的值，或把 [[TS_JSON]] 交給「圖表」擴充功能畫折線圖\n\n### 要用哪一張卡片？\n原作者版本的寫入、讀取積木一執行就會出錯（程式裡用了沒有宣告的變數），完全不能用。OSEP 修好後放在新版的另一張卡片：\n\n| OSEP 版本 | 擴充功能卡片 | 狀態 |\n|---|---|---|\n| 新版 | **ThingSpeak 物聯網**（積木分類「ThingSpeak IoT」） | 正常，本頁介紹的 9 塊積木 |\n| 新版 | ThingSpeak（原作者版） | 寫入、讀取都會出錯 |\n| 舊版 | ThingSpeak | 寫入、讀取都會出錯（舊版還沒更新） |\n\n> ! 請在 OSEP **新版**加入「**ThingSpeak 物聯網**」。原本 5 塊積木的用法不變，舊專案換到新卡片時要把積木重新拖一次。\n\n### 事前準備（在 [ThingSpeak 網站](https://thingspeak.mathworks.com/)）\n- 按 **Sign Up** 註冊 MathWorks 帳號（免費），收到驗證信後啟用、登入\n- 到 [My Channels](https://thingspeak.mathworks.com/channels) 按 **New Channel**：填 Name，勾選要用的欄位（Field 1～8，可以取名，例如「溫度」），最下面按 **Save Channel**\n- 頻道頁面上方的 **Channel ID** 是頻道 ID；**API Keys** 分頁有 **Write API Key** 和 **Read API Keys**\n- **Sharing** 分頁：預設是私人頻道（讀取要 Read API Key）；選 **Share channel view with everyone** 變成公開頻道，讀取 key 可以留空。寫入一定要 Write API Key\n\n> 免費帳號同一個頻道大約每 15 秒才能寫入一次，送太快會失敗（[[TS_writeResult]] 是 0）。限制以 ThingSpeak 網站目前的規定為準。\n\n> ! Write API Key 等於寫入權限，不要放在公開分享的專案裡（可以用「詢問並等待」讓使用的人自己貼上）。不小心外流時，在 API Keys 分頁按 **Generate New Write API Key** 換一把。\n\n### 沒有帳號也能先試讀取\nThingSpeak 官方的示範頻道 **9**（my_house，欄位1＝光線、欄位2＝室外溫度）是公開的，頻道 ID 填 9、讀取 key 留空就能讀，見範例 2～4。\n\n### 相關網站\n- [ThingSpeak 首頁](https://thingspeak.mathworks.com/)：註冊、登入\n- [My Channels](https://thingspeak.mathworks.com/channels)：自己的頻道清單，點進頻道可以看圖表和 API Keys（要先登入）\n- [建立新頻道](https://thingspeak.mathworks.com/channels/new)（要先登入）\n- [示範頻道 9](https://thingspeak.mathworks.com/channels/9)：公開頻道的圖表\n\n擴充功能原始作者：gasolin（[scratch3-internet](https://github.com/gasolin/scratch3-internet)），OSEP 修正讀寫錯誤並加上取值積木。",
  "groups": [
    {
      "name": "寫入",
      "intro": "寫入的順序一定是：[[TS_Writekey]] → 一個或多個 [[TS_col]] → [[Write_TS]]，最後可以用 [[TS_writeResult]] 確認。",
      "blocks": [
        {
          "opcode": "TS_Writekey",
          "type": "command",
          "text": "設定 ThingSpeak 寫入 api key [KEY]",
          "textEn": "set ThingSpeak write API key [KEY]",
          "args": {
            "KEY": {
              "type": "string",
              "value": " ",
              "desc": "頻道的 Write API Key（API Keys 分頁）。"
            }
          },
          "summary": "設定寫入用的 key，同時清空準備送出的欄位。",
          "detail": "開始填一組新的資料前先執行這塊：它會把之前用 [[TS_col]] 填的欄位清掉。key 前後的空白會自動去掉。",
          "tips": "key 會跟著專案存起來，分享專案前記得刪掉，或改用「詢問並等待」讓使用的人自己貼上。"
        },
        {
          "opcode": "TS_col",
          "type": "command",
          "text": "欄位名稱[COLUMN] 值[VALUE]",
          "textEn": "set field [COLUMN] to [VALUE]",
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
              "desc": "欄位 1～8，對應頻道的 Field 1～Field 8（要在頻道設定裡勾選）。"
            },
            "VALUE": {
              "type": "string",
              "value": " ",
              "desc": "要存的值，通常是數字。"
            }
          },
          "summary": "填一個要送出的欄位和值。",
          "detail": "要送幾個欄位就用幾塊。同一個欄位填兩次時，只會送最後一次的值。這時候還沒有送出，要等 [[Write_TS]]。\n\n值會自動做網址編碼，可以放中文、空白、`&`、`#`。"
        },
        {
          "opcode": "Write_TS",
          "type": "command",
          "text": "送出 ThingSpeak 的資料",
          "textEn": "send ThingSpeak data",
          "summary": "把填好的欄位送到 ThingSpeak，等到 ThingSpeak 回應才往下執行。",
          "detail": "送出的網址是 `https://api.thingspeak.com/update?api_key=…&field1=…`。送完可以用 [[TS_writeResult]] 看結果。\n\n還沒設定 key 或沒有填任何欄位時不會送出，[[TS_writeResult]] 會是 0。\n\n送出後填好的欄位不會清掉；下一輪要送新的資料時，先執行 [[TS_Writekey]]。",
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
            },
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "t": "字串組合 [A] [B]",
                  "cat": "operators",
                  "type": "reporter",
                  "args": {
                    "A": "寫入筆數：",
                    "B": {
                      "use": "TS_writeResult"
                    }
                  }
                }
              }
            }
          ]
        },
        {
          "opcode": "TS_writeResult",
          "type": "reporter",
          "text": "ThingSpeak 寫入筆數",
          "textEn": "ThingSpeak entries written",
          "summary": "最近一次 [[Write_TS]] 寫入的是頻道的第幾筆資料。",
          "detail": "",
          "returns": "成功時是這筆資料的編號，也就是頻道裡目前共有幾筆（1、2、3…）；失敗時是 0（key 錯了、離上次寫入不到 15 秒、網路斷線，或沒有欄位）。還沒送過時是空的。",
          "tips": "用「[[TS_writeResult]] > 0」判斷有沒有寫入成功。勾選積木旁的方框，舞台上會顯示「ThingSpeak 寫入筆數」。"
        }
      ]
    },
    {
      "name": "讀取",
      "intro": "先用 [[TS_Read]] 下載資料，再用 [[TS_lastValue]]、[[TS_valueAt]]、[[TS_count]] 取值；要畫折線圖時把 [[TS_JSON]] 交給圖表擴充功能。[[TS_Read]] 會等資料下載完才往下執行，後面不用加等待。",
      "blocks": [
        {
          "opcode": "TS_Read",
          "type": "command",
          "text": "讀取 ThingSpeak 頻道 ID [CHANNEL] 讀取 api key [KEY]",
          "textEn": "read ThingSpeak channel ID [CHANNEL] read API key [KEY]",
          "args": {
            "KEY": {
              "type": "string",
              "value": " ",
              "desc": "頻道的 Read API Key；公開頻道可以留空白。"
            },
            "CHANNEL": {
              "type": "string",
              "value": " ",
              "desc": "頻道 ID（數字，頻道頁面上方的 Channel ID）。"
            }
          },
          "summary": "下載頻道最近 100 筆資料，下載完才往下執行。",
          "detail": "下載完成後，用 [[TS_lastValue]]、[[TS_valueAt]] 取值，[[TS_count]] 是筆數；[[TS_JSON]] 可以交給圖表擴充功能畫折線圖。\n\n下載失敗時（頻道 ID 錯、私人頻道沒給讀取 key、網路斷線），之前讀到的資料會清掉，[[TS_count]] 變成 0。\n\n讀取的網址是 `https://api.thingspeak.com/channels/<頻道 ID>/feeds.json`，可以直接用瀏覽器打開看。",
          "example": [
            {
              "use": "TS_Read",
              "args": {
                "CHANNEL": "9",
                "KEY": " "
              }
            },
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "TS_lastValue",
                  "args": {
                    "COLUMN": {
                      "v": "欄位1",
                      "menu": true
                    }
                  }
                }
              }
            }
          ]
        },
        {
          "opcode": "TS_lastValue",
          "type": "reporter",
          "text": "最新一筆的 [COLUMN]",
          "textEn": "latest [COLUMN] value",
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
                "欄位8",
                "時間"
              ],
              "value": "欄位1",
              "values": [
                "field1",
                "field2",
                "field3",
                "field4",
                "field5",
                "field6",
                "field7",
                "field8",
                "created_at"
              ],
              "optionsEn": [
                "field1",
                "field2",
                "field3",
                "field4",
                "field5",
                "field6",
                "field7",
                "field8",
                "time"
              ],
              "valueEn": "field1",
              "acceptReporters": true,
              "desc": "欄位1～欄位8，或「時間」。"
            }
          },
          "summary": "最新一筆資料的某個欄位。",
          "detail": "",
          "returns": "欄位的值（文字，例如 \"25\"，可以直接拿來計算）。選「時間」會得到這筆資料上傳的時間，例如 `2026-11-28 10:32:25`（已換成電腦所在的時區）。還沒讀取、讀取失敗或這筆的欄位是空的時，回傳空的。"
        },
        {
          "opcode": "TS_valueAt",
          "type": "reporter",
          "text": "第 [N] 筆的 [COLUMN]",
          "textEn": "[COLUMN] of entry [N]",
          "args": {
            "N": {
              "type": "number",
              "value": "1",
              "desc": "第幾筆，1 是最舊的。"
            },
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
                "欄位8",
                "時間"
              ],
              "value": "欄位1",
              "values": [
                "field1",
                "field2",
                "field3",
                "field4",
                "field5",
                "field6",
                "field7",
                "field8",
                "created_at"
              ],
              "optionsEn": [
                "field1",
                "field2",
                "field3",
                "field4",
                "field5",
                "field6",
                "field7",
                "field8",
                "time"
              ],
              "valueEn": "field1",
              "acceptReporters": true,
              "desc": "欄位1～欄位8，或「時間」。"
            }
          },
          "summary": "第 N 筆資料的某個欄位。",
          "detail": "第 1 筆是最舊的，第 [[TS_count]] 筆是最新的。用「重複 [[TS_count]] 次」配合變數，就能把每一筆放進清單，見範例 3。",
          "returns": "和 [[TS_lastValue]] 一樣。超出範圍（小於 1 或大於筆數）時回傳空的。"
        },
        {
          "opcode": "TS_count",
          "type": "reporter",
          "text": "ThingSpeak 資料筆數",
          "textEn": "number of ThingSpeak entries",
          "summary": "讀到幾筆資料。",
          "detail": "",
          "returns": "數字，最多 100。還沒讀取或讀取失敗時是 0。"
        },
        {
          "opcode": "TS_JSON",
          "type": "reporter",
          "text": "讀取的 ThingSpeak 資料",
          "textEn": "ThingSpeak data",
          "summary": "把最近一次 [[TS_Read]] 讀到的資料，整理成「圖表」擴充功能可以畫折線圖的格式。",
          "detail": "每一筆資料是一個物件：\n\n- 第一個是「時間」（電腦所在時區的 月-日 時:分），當 X 軸\n- 後面是頻道啟用的每個欄位，名稱用頻道設定（Channel Settings）裡的欄位名稱，例如 `Light`；沒有取名時是「欄位1」。每個欄位畫一條線\n- 值都是文字；那一筆沒有值時是空的（折線會斷開）\n\n把這塊放進圖表擴充功能的「讀取資料 [data] 顯示 [折線圖]」就能畫圖，見範例 4。也可以選長條圖。",
          "returns": "JSON 文字，例如 `[{\"時間\":\"11-28 10:32\",\"Light\":\"240\",\"Outside Temperature\":\"38\"}, …]`。還沒讀取或讀取失敗時是「錯誤：ThingSpeak 資料不存在」。",
          "tips": "想讓圖例顯示中文，就在 ThingSpeak 的 Channel Settings 把欄位名稱改成中文（例如「溫度」）。",
          "example": [
            {
              "use": "TS_Read",
              "args": {
                "CHANNEL": "9",
                "KEY": " "
              }
            },
            {
              "t": "讀取資料 [D] 顯示 [C]",
              "color": "#83251B",
              "args": {
                "D": {
                  "use": "TS_JSON"
                },
                "C": {
                  "v": "折線圖",
                  "menu": true
                }
              }
            }
          ]
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "每 20 秒上傳一次溫度",
      "intro": "把變數「溫度」（例如從感測器讀到的值）定時送到欄位 1，ThingSpeak 會畫出折線圖。角色會說出每次寫入的結果。",
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
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "t": "字串組合 [A] [B]",
                  "cat": "operators",
                  "type": "reporter",
                  "args": {
                    "A": "寫入筆數：",
                    "B": {
                      "use": "TS_writeResult"
                    }
                  }
                }
              }
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
      "explain": "寫入筆數是數字（這筆是頻道的第幾筆）表示成功，0 表示失敗。免費帳號約 15 秒才能寫一次，所以等 20 秒比較保險。"
    },
    {
      "title": "讀回最新一筆資料",
      "intro": "讀 ThingSpeak 官方的公開示範頻道 9，說出最新的光線（欄位1）和時間。不需要帳號。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "TS_Read",
          "args": {
            "CHANNEL": "9",
            "KEY": " "
          }
        },
        {
          "t": "說出 [M] 持續 [S] 秒",
          "cat": "looks",
          "args": {
            "M": {
              "t": "字串組合 [A] [B]",
              "cat": "operators",
              "type": "reporter",
              "args": {
                "A": "最新光線：",
                "B": {
                  "use": "TS_lastValue",
                  "args": {
                    "COLUMN": {
                      "v": "欄位1",
                      "menu": true
                    }
                  }
                }
              }
            },
            "S": {
              "num": "3"
            }
          }
        },
        {
          "t": "說出 [M]",
          "cat": "looks",
          "args": {
            "M": {
              "t": "字串組合 [A] [B]",
              "cat": "operators",
              "type": "reporter",
              "args": {
                "A": "時間：",
                "B": {
                  "use": "TS_lastValue",
                  "args": {
                    "COLUMN": {
                      "v": "時間",
                      "menu": true
                    }
                  }
                }
              }
            }
          }
        }
      ],
      "explain": "要讀自己的頻道，把 9 改成自己的頻道 ID；私人頻道還要填 Read API Key。"
    },
    {
      "title": "把每一筆資料放進清單",
      "intro": "讀示範頻道 9，把最近 100 筆的光線依序放進清單「光線紀錄」，可以在舞台上捲動查看。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "TS_Read",
          "args": {
            "CHANNEL": "9",
            "KEY": " "
          }
        },
        {
          "t": "刪除 [L] 的所有項目",
          "cat": "data",
          "args": {
            "L": {
              "v": "光線紀錄",
              "menu": true
            }
          }
        },
        {
          "t": "變數 [V] 設為 [N]",
          "cat": "data",
          "args": {
            "V": {
              "v": "i",
              "menu": true
            },
            "N": "1"
          }
        },
        {
          "t": "重複 [N] 次",
          "cat": "control",
          "type": "c",
          "args": {
            "N": {
              "use": "TS_count"
            }
          },
          "body": [
            {
              "t": "添加 [X] 到 [L]",
              "cat": "data",
              "args": {
                "X": {
                  "use": "TS_valueAt",
                  "args": {
                    "N": {
                      "t": "i",
                      "cat": "data",
                      "type": "reporter"
                    },
                    "COLUMN": {
                      "v": "欄位1",
                      "menu": true
                    }
                  }
                },
                "L": {
                  "v": "光線紀錄",
                  "menu": true
                }
              }
            },
            {
              "t": "變數 [V] 改變 [N]",
              "cat": "data",
              "args": {
                "V": {
                  "v": "i",
                  "menu": true
                },
                "N": {
                  "num": "1"
                }
              }
            }
          ]
        }
      ],
      "explain": "第 1 筆是最舊的，最後一筆（第「資料筆數」筆）是最新的。"
    },
    {
      "title": "用折線圖看頻道資料",
      "intro": "讀示範頻道 9，用「圖表」擴充功能畫出光線和室外溫度的折線圖（會開一個新視窗）。要另外加入「圖表」擴充功能。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "TS_Read",
          "args": {
            "CHANNEL": "9",
            "KEY": " "
          }
        },
        {
          "t": "圖表標題 [T]",
          "color": "#83251B",
          "args": {
            "T": "ThingSpeak 頻道 9"
          }
        },
        {
          "t": "座標軸標題：X軸 [X] Y軸 [Y]",
          "color": "#83251B",
          "args": {
            "X": "時間",
            "Y": "數值"
          }
        },
        {
          "t": "讀取資料 [D] 顯示 [C]",
          "color": "#83251B",
          "args": {
            "D": {
              "use": "TS_JSON"
            },
            "C": {
              "v": "折線圖",
              "menu": true
            }
          }
        }
      ],
      "explain": "每個欄位一條線，線的名稱是頻道設定的欄位名稱（頻道 9 是 Light、Outside Temperature）。換成自己的頻道 ID 就能畫自己的資料。"
    }
  ],
  "faq": [
    {
      "q": "加入「ThingSpeak」卡片後，積木一執行就沒反應？",
      "a": "那是原作者版本，寫入、讀取積木都會出錯。請在 OSEP **新版**加入「**ThingSpeak 物聯網**」卡片（見概述的「要用哪一張卡片？」）。"
    },
    {
      "q": "寫入結果是 0？",
      "a": "- 確認用的是 **Write** API Key，不是 Read\n- 離上次寫入不到 15 秒（免費帳號的限制），加長等待時間\n- 先執行 [[TS_Writekey]]、至少填一個 [[TS_col]]，再 [[Write_TS]]"
    },
    {
      "q": "寫入成功，圖表卻沒有那個欄位？",
      "a": "欄位要在頻道設定（Channel Settings）裡勾選啟用，圖表才會顯示。"
    },
    {
      "q": "讀到的值為什麼是文字？",
      "a": "ThingSpeak 回傳的欄位值都是文字（例如 \"25\"）。Scratch 拿來計算時會自動轉成數字，不用另外處理。"
    },
    {
      "q": "資料筆數是 0，或讀回來是「錯誤：ThingSpeak 資料不存在」？",
      "a": "下載失敗了。檢查頻道 ID（要是數字）；私人頻道要填 Read API Key，或在 Sharing 分頁改成公開。可以先用示範頻道 9 確認網路正常。"
    },
    {
      "q": "時間跟 ThingSpeak 網站上的差 8 小時？",
      "a": "積木回傳的時間（[[TS_lastValue]]、[[TS_valueAt]] 的「時間」和 [[TS_JSON]]）已經換成電腦所在的時區（台灣時間）；ThingSpeak 網址直接看到的 `created_at` 是 UTC，差 8 小時。"
    },
    {
      "q": "折線圖沒有出現，或跳出「資料格式錯誤」？",
      "a": "- 先確認 [[TS_count]] 不是 0（讀取成功了）\n- 圖表會開一個新視窗，瀏覽器擋下彈出視窗時，在網址列旁允許這個網站顯示彈出視窗\n- 「讀取資料」裡要放 [[TS_JSON]]，不是 [[TS_count]]"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-28",
      "text": "修正版：寫入、讀取積木不再出錯；讀取、寫入都等完成才往下執行；值自動網址編碼；新增寫入結果、最新一筆、第 N 筆、資料筆數積木。新版 OSEP 的卡片是「ThingSpeak 物聯網」。「讀取的 ThingSpeak 資料」改成圖表擴充功能可以畫折線圖的格式；「寫入結果」改名「寫入筆數」"
    },
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    }
  ]
});
