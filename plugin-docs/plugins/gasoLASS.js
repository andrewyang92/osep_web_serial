/*
 * LASS 擴充功能說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從擴充功能原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個擴充功能的積木。
 */
OSEP.addPlugin({
  "id": "gasoLASS",
  "name": "LASS",
  "nameEn": "LASS",
  "author": "gasolin",
  "updated": "2026-11-22",
  "tags": [
    "物聯網",
    "環境",
    "開放資料"
  ],
  "needs": [
    "網路"
  ],
  "color": {
    "primary": "#4a90e2",
    "secondary": "#4a90e2",
    "tertiary": "#4a90e2"
  },
  "card": "images/gasoLASS/card.png",
  "icon": "images/gasoLASS/small.png",
  "blockIcon": "",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_lass",
  "tagline": "讀取台灣的空氣品質與天氣資料：空氣盒子、環境部測站、氣象署天氣預報。",
  "overview": "這個擴充功能把台灣常用的三種開放資料帶進 Scratch，可以做空氣品質看板、出門提醒、天氣播報員等作品：\n\n| 資料 | 來源 | 需要 |\n|---|---|---|\n| 空氣盒子的 PM2.5、溫度、濕度 | LASS 開源公益環境感測網路 | 空氣盒子的設備編號 |\n| 測站的 AQI、PM2.5、PM10、臭氧 | 環境部空氣品質監測網 | 不用設定 |\n| 各縣市 36 小時天氣預報 | 中央氣象署開放資料平臺 | 自己的授權碼 |\n\n> 資料都是即時從網路下載的，網路不通或資料來源網站維修時就讀不到。\n\n> ! 2026-11-22 檢查時，LASS 的空氣盒子資料停在 **2026-09-01**，之後沒有再更新，所以「LASS 空氣盒子」這一組積木目前讀不到資料（會是空的）。EdiGreen 地圖上的數值還有更新，但那是 Edimax 網站自己的資料，擴充功能讀不到。環境部測站、氣象署的積木不受影響。\n\n### 相關網站\n- [LASS 開源公益環境感測網路](https://pm25.lass-net.org/)\n- [EdiGreen 空氣盒子地圖](https://airbox.edimaxcloud.com/)：找附近的空氣盒子、看站名\n- [全部空氣盒子的資料（JSON）](https://pm25.lass-net.org/data/last-all-airbox.json)：用站名查設備編號\n- [環境部空氣品質監測網](https://airtw.moenv.gov.tw/)：測站位置與即時 AQI\n- [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/)：註冊會員；登入後到 [取得授權碼](https://opendata.cwa.gov.tw/user/authkey) 頁面拿授權碼\n\n擴充功能原始作者：gasolin（[scratch3-internet](https://github.com/gasolin/scratch3-internet)）。",
  "groups": [
    {
      "name": "LASS 空氣盒子",
      "intro": "讀取一台空氣盒子最新的感測值。先用 [[fetchLASS]] 下載，收到後 [[onLASSReceived]] 會觸發，再用 [[parseAttrFromLASS]] 讀值。\n\n> ! 目前 LASS 的空氣盒子資料停在 2026-09-01（2026-11-22 檢查），這一組積木暫時讀不到資料。",
      "blocks": [
        {
          "opcode": "openEdiGreen",
          "type": "command",
          "text": "開啟 EdiGreen 空氣盒子網站",
          "textEn": "Open the EdiGreen AirBox website",
          "summary": "在新分頁開啟 Edimax 的空氣盒子網站。",
          "detail": "在地圖上點一個空氣盒子（圓形的圖示），會跳出它的**站名**（例如「明利國小」）、經緯度、PM2.5、溫度和濕度。\n\n> EdiGreen 網站**不會顯示設備編號**。記下站名，再用 [[openAirBoxDeviceData]] 查出設備編號。\n\n菱形的圖示是環境部的測站，要用 [[getEPAData]] 讀，不需要設備編號。"
        },
        {
          "opcode": "openAirBoxDeviceData",
          "type": "command",
          "text": "開啟空氣盒子設備資料",
          "textEn": "Open the AirBox device data",
          "summary": "在新分頁開啟所有空氣盒子的最新資料（JSON）。",
          "detail": "打開的是 LASS 上所有空氣盒子的資料，每一台一筆。用站名查設備編號的步驟：\n\n- 先在 [[openEdiGreen]] 的地圖上點選想用的空氣盒子，記下站名（例如「明利國小」）\n- 用這塊積木打開資料（或直接開 [這個網址](https://pm25.lass-net.org/data/last-all-airbox.json)）\n- 按 **Ctrl＋F**（Mac 是 ⌘＋F）搜尋站名，找到 `\"name\": \"明利國小\"` 那一筆\n- 同一筆裡的 `\"device_id\"` 就是設備編號，例如 `\"device_id\": \"74DA38ED059C\"`\n\n同一筆裡還有 `SiteName`（完整名稱，例如「花蓮縣立明利國小」）、`gps_lat`、`gps_lon`（緯度、經度），可以和地圖上的經緯度對照，確認是同一台。\n\n> 瀏覽器顯示的資料很長。Chrome、Edge 可以勾選畫面上方的「美化排版」（Pretty-print），一筆一筆比較好看。"
        },
        {
          "opcode": "fetchLASS",
          "type": "command",
          "text": "LASS 設備編號 [id]",
          "textEn": "LASS Device [id]",
          "args": {
            "id": {
              "type": "string",
              "value": "74DA38F208E2",
              "desc": "空氣盒子的設備編號（12 個英文字母或數字，例如 `74DA38ED059C`）。找法見 [[openAirBoxDeviceData]]。"
            }
          },
          "summary": "下載這台空氣盒子最新的資料。",
          "detail": "資料下載完成時，[[onLASSReceived]] 會觸發一次。\n\n> 積木結束時資料可能還沒下載完，所以讀值的積木最好放在 [[onLASSReceived]] 底下。設備編號錯誤時，讀到的值會是空的。"
        },
        {
          "opcode": "onLASSReceived",
          "type": "hat",
          "text": "當收到 LASS 資料時",
          "textEn": "When data is received from LASS",
          "summary": "空氣盒子的資料下載完成時，執行底下的腳本。",
          "detail": "每次 [[fetchLASS]] 下載完成都會觸發一次。"
        },
        {
          "opcode": "parseAttrFromLASS",
          "type": "reporter",
          "text": "LASS 讀取 [attr]",
          "textEn": "LASS read [attr]",
          "args": {
            "attr": {
              "type": "menu",
              "options": [
                "PM2.5",
                "溫度 °C",
                "濕度 %",
                "日期與時間"
              ],
              "value": "PM2.5",
              "values": [
                "PM2.5",
                "溫度 °C",
                "濕度 %",
                "日期與時間"
              ],
              "optionsEn": [
                "PM2.5",
                "Temperature (°C)",
                "Humidity (%)",
                "Date and Time"
              ],
              "acceptReporters": true,
              "desc": "PM2.5、溫度、濕度或資料的日期時間。"
            }
          },
          "summary": "讀取空氣盒子的 PM2.5、溫度、濕度或時間。",
          "returns": "數值，例如 PM2.5 `12`（µg/m³）、溫度 `26.5`（°C）、濕度 `70`（%）；日期與時間是 `2026-11-22 08:30:00` 這樣的文字。還沒下載資料時是「錯誤： 資料不存在」。",
          "detail": ""
        }
      ]
    },
    {
      "name": "環境部空品測站",
      "intro": "環境部空氣品質監測站的資料，全台約 80 個測站，不需要任何設定。",
      "blocks": [
        {
          "opcode": "getEPAData",
          "type": "reporter",
          "text": "環保署測站 [siteName] 讀取 [attr]",
          "textEn": "LASS AQI city [siteName] read [attr]",
          "args": {
            "siteName": {
              "type": "menu",
              "value": "基隆",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "測站名稱，例如「基隆」「中山」「臺南」。選單會在擴充功能載入後自動抓到所有測站。"
            },
            "attr": {
              "type": "menu",
              "options": [
                "AQI",
                "PM2.5",
                "PM10",
                "O3",
                "發佈時間"
              ],
              "value": "AQI",
              "values": [
                "aqi",
                "pm2.5",
                "pm10",
                "o3",
                "publishtime"
              ],
              "optionsEn": [
                "AQI",
                "PM2.5",
                "PM10",
                "O3",
                "Publish Time"
              ],
              "acceptReporters": true,
              "desc": "AQI、PM2.5、PM10、O3（臭氧）或發佈時間。"
            }
          },
          "summary": "讀取某個測站的空氣品質。",
          "detail": "每次執行都會重新下載資料，所以會等一下才拿到值。\n\n| 項目 | 說明 |\n|---|---|\n| AQI | 空氣品質指標，0～50 良好、51～100 普通、101 以上對敏感族群不健康 |\n| PM2.5、PM10 | 細懸浮微粒、懸浮微粒濃度（µg/m³） |\n| O3 | 臭氧濃度（ppb） |\n| 發佈時間 | 這筆資料的時間，例如 `2026/11/22 08:00:00` |",
          "returns": "文字或數字。測站名稱打錯時是空的。",
          "tips": "選單一開始只有「基隆」，擴充功能從網路抓到測站清單後才會出現其他測站。"
        },
        {
          "opcode": "EPAStation",
          "type": "reporter",
          "text": "環保署測站",
          "textEn": "EPA Station",
          "summary": "所有測站的名稱。",
          "returns": "用「, 」分隔的測站名稱，例如 `基隆, 汐止, 萬里, …`。",
          "detail": ""
        }
      ]
    },
    {
      "name": "氣象署天氣預報",
      "intro": "中央氣象署「一般天氣預報：今明 36 小時天氣預報」。要先到氣象署開放資料平臺註冊會員，取得自己的授權碼。",
      "blocks": [
        {
          "opcode": "authorization",
          "type": "command",
          "text": "氣象開放資料平臺的授權碼[apiKey]",
          "textEn": "Open weather data platform authorization key[apiKey]",
          "args": {
            "apiKey": {
              "type": "string",
              "value": "API Key",
              "desc": "氣象署開放資料平臺的授權碼（CWA- 開頭）。"
            }
          },
          "summary": "用授權碼下載全台各縣市的天氣預報。",
          "detail": "授權碼要到中央氣象署開放資料平臺（opendata.cwa.gov.tw）登入後，在會員資訊裡取得。\n\n> 這塊積木不會等下載完成就結束，請在後面加「等待 2 秒」再用 [[getWeatherData]]。",
          "tips": "授權碼會跟著專案存起來，分享專案前記得刪掉。"
        },
        {
          "opcode": "getWeatherData",
          "type": "reporter",
          "text": "查詢[locationName] 未來 [forecastTime] 小時 [weatherAttrs] 的天氣預報",
          "textEn": "Query the weather forecast for [locationName] in the next [forecastTime] hours with [weatherAttrs]",
          "args": {
            "locationName": {
              "type": "menu",
              "options": [
                "臺北市",
                "新北市",
                "桃園市",
                "臺中市",
                "臺南市",
                "高雄市",
                "基隆市",
                "新竹縣",
                "新竹市",
                "苗栗縣",
                "彰化縣",
                "南投縣",
                "雲林縣",
                "嘉義縣",
                "嘉義市",
                "屏東縣",
                "宜蘭縣",
                "花蓮縣",
                "臺東縣",
                "澎湖縣",
                "金門縣",
                "連江縣"
              ],
              "value": "臺北市",
              "values": [
                "臺北市",
                "新北市",
                "桃園市",
                "臺中市",
                "臺南市",
                "高雄市",
                "基隆市",
                "新竹縣",
                "新竹市",
                "苗栗縣",
                "彰化縣",
                "南投縣",
                "雲林縣",
                "嘉義縣",
                "嘉義市",
                "屏東縣",
                "宜蘭縣",
                "花蓮縣",
                "臺東縣",
                "澎湖縣",
                "金門縣",
                "連江縣"
              ],
              "optionsEn": [
                "Taipei City",
                "New Taipei City",
                "Taoyuan City",
                "Taichung City",
                "Tainan City",
                "Kaohsiung City",
                "Keelung City",
                "Hsinchu County",
                "Hsinchu City",
                "Miaoli County",
                "Changhua County",
                "Nantou County",
                "Yunlin County",
                "Chiayi County",
                "Chiayi City",
                "Pingtung County",
                "Yilan County",
                "Hualien County",
                "Taitung County",
                "Penghu County",
                "Kinmen County",
                "Lienchiang County"
              ],
              "valueEn": "Taipei City",
              "acceptReporters": true,
              "desc": "22 個縣市。"
            },
            "forecastTime": {
              "type": "menu",
              "options": [
                "12",
                "24",
                "36"
              ],
              "value": "12",
              "values": [
                "12",
                "24",
                "36"
              ],
              "optionsEn": [
                "12",
                "24",
                "36"
              ],
              "acceptReporters": true,
              "desc": "12、24、36：今明 36 小時裡的第 1、2、3 個 12 小時時段。"
            },
            "weatherAttrs": {
              "type": "menu",
              "options": [
                "天氣現象",
                "最高溫度",
                "最低溫度",
                "舒適度",
                "降雨機率"
              ],
              "value": "天氣現象",
              "values": [
                "天氣現象",
                "最高溫度",
                "最低溫度",
                "舒適度",
                "降雨機率"
              ],
              "optionsEn": [
                "Weather Phenomenon",
                "\tMaximum Temperature",
                "Minimum Temperature",
                "Comfort",
                "Rainfall Probability"
              ],
              "valueEn": "Weather Phenomenon",
              "acceptReporters": true,
              "desc": "天氣現象、最高溫度、最低溫度、舒適度或降雨機率。"
            }
          },
          "summary": "讀取某個縣市某個時段的天氣預報。",
          "detail": "| 項目 | 例子 |\n|---|---|\n| 天氣現象 | 多雲時晴 |\n| 最高溫度、最低溫度 | 28（°C） |\n| 舒適度 | 舒適至悶熱 |\n| 降雨機率 | 20（%） |\n\n天氣現象和舒適度是氣象署提供的中文文字，英文介面也一樣是中文。",
          "returns": "文字或數字。還沒用 [[authorization]] 下載資料時拿不到值。"
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "空氣盒子看板",
      "intro": "每分鐘更新一次附近空氣盒子的 PM2.5，數值太高時換成戴口罩的造型。",
      "script": [
        [
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
                "use": "fetchLASS",
                "args": {
                  "id": "74DA38F208E2"
                }
              },
              {
                "t": "等待 [S] 秒",
                "cat": "control",
                "args": {
                  "S": {
                    "num": "60"
                  }
                }
              }
            ]
          }
        ],
        [
          {
            "use": "onLASSReceived"
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
                  "A": "PM2.5：",
                  "B": {
                    "use": "parseAttrFromLASS",
                    "args": {
                      "attr": {
                        "v": "PM2.5",
                        "menu": true
                      }
                    }
                  }
                }
              }
            }
          },
          {
            "t": "如果 [C] 那麼",
            "cat": "control",
            "type": "c",
            "args": {
              "C": {
                "t": "[A] > [B]",
                "cat": "operators",
                "type": "boolean",
                "args": {
                  "A": {
                    "use": "parseAttrFromLASS",
                    "args": {
                      "attr": {
                        "v": "PM2.5",
                        "menu": true
                      }
                    }
                  },
                  "B": {
                    "num": "35"
                  }
                }
              }
            },
            "body": [
              {
                "t": "造型換成 [X]",
                "cat": "looks",
                "args": {
                  "X": {
                    "v": "戴口罩",
                    "menu": true
                  }
                }
              }
            ],
            "else": [
              {
                "t": "造型換成 [X]",
                "cat": "looks",
                "args": {
                  "X": {
                    "v": "微笑",
                    "menu": true
                  }
                }
              }
            ]
          }
        ]
      ]
    },
    {
      "title": "今天要帶傘嗎？",
      "intro": "用氣象署資料查臺北市第一個 12 小時的降雨機率，超過 50% 就提醒帶傘。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "authorization",
          "args": {
            "apiKey": "CWA-你的授權碼"
          }
        },
        {
          "t": "等待 [S] 秒",
          "cat": "control",
          "args": {
            "S": {
              "num": "2"
            }
          }
        },
        {
          "t": "如果 [C] 那麼",
          "cat": "control",
          "type": "c",
          "args": {
            "C": {
              "t": "[A] > [B]",
              "cat": "operators",
              "type": "boolean",
              "args": {
                "A": {
                  "use": "getWeatherData",
                  "args": {
                    "locationName": {
                      "v": "臺北市",
                      "menu": true
                    },
                    "forecastTime": {
                      "v": "12",
                      "menu": true
                    },
                    "weatherAttrs": {
                      "v": "降雨機率",
                      "menu": true
                    }
                  }
                },
                "B": {
                  "num": "50"
                }
              }
            }
          },
          "body": [
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": "記得帶傘！"
              }
            }
          ],
          "else": [
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "getWeatherData",
                  "args": {
                    "locationName": {
                      "v": "臺北市",
                      "menu": true
                    },
                    "forecastTime": {
                      "v": "12",
                      "menu": true
                    },
                    "weatherAttrs": {
                      "v": "天氣現象",
                      "menu": true
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    },
    {
      "title": "測站 AQI 播報",
      "intro": "問使用者想查哪個測站，說出 AQI 和發佈時間。",
      "script": [
        {
          "t": "詢問 [Q] 並等待",
          "cat": "sensing",
          "args": {
            "Q": "想查哪個測站？（例如：中山）"
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
                "A": "AQI：",
                "B": {
                  "use": "getEPAData",
                  "args": {
                    "siteName": {
                      "t": "詢問的答案",
                      "cat": "sensing",
                      "type": "reporter"
                    },
                    "attr": {
                      "v": "AQI",
                      "menu": true
                    }
                  }
                }
              }
            },
            "S": {
              "num": "2"
            }
          }
        },
        {
          "t": "說出 [M]",
          "cat": "looks",
          "args": {
            "M": {
              "use": "getEPAData",
              "args": {
                "siteName": {
                  "t": "詢問的答案",
                  "cat": "sensing",
                  "type": "reporter"
                },
                "attr": {
                  "v": "發佈時間",
                  "menu": true
                }
              }
            }
          }
        }
      ],
      "explain": "測站名稱可以先用 [[EPAStation]] 列出來看。"
    }
  ],
  "faq": [
    {
      "q": "空氣盒子讀到的值是空的？",
      "a": "- 2026-11-22 檢查時，LASS 的空氣盒子資料停在 2026-09-01 沒有更新，所有空氣盒子都讀不到。可以打開 [全部空氣盒子的資料](https://pm25.lass-net.org/data/last-all-airbox.json) 看最後的 `version` 日期，確認資料有沒有恢復\n- 設備編號打錯，或那台空氣盒子已經很久沒有上傳資料\n- 讀值時資料還沒下載完：把讀值的積木放在「當收到 LASS 資料時」底下"
    },
    {
      "q": "在 EdiGreen 地圖上找不到設備編號（MAC 位址）？",
      "a": "EdiGreen 地圖只顯示站名，不顯示設備編號。記下站名，再到 [全部空氣盒子的資料](https://pm25.lass-net.org/data/last-all-airbox.json) 用 Ctrl＋F 搜尋站名，同一筆的 `device_id` 就是設備編號。詳細步驟見 [[openAirBoxDeviceData]]。"
    },
    {
      "q": "天氣預報讀不到？",
      "a": "- 授權碼要用自己在氣象署開放資料平臺申請的\n- [[authorization]] 之後要等一下（約 2 秒）才能讀\n- 網路要能連到 opendata.cwa.gov.tw"
    },
    {
      "q": "測站選單只有「基隆」？",
      "a": "擴充功能剛載入時還沒抓到測站清單。等幾秒後再點開選單；網路不通時就只有「基隆」。也可以直接在選單位置放文字或變數。"
    },
    {
      "q": "「未來 12／24／36 小時」是什麼意思？",
      "a": "氣象署的 36 小時預報分成 3 個 12 小時的時段。選 12 是第 1 個時段（現在起的 12 小時），24 是第 2 個，36 是第 3 個。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    },
    {
      "date": "2026-11-22",
      "text": "加上相關網站連結、用站名查設備編號的步驟；註明 LASS 空氣盒子資料自 2026-09-01 起沒有更新"
    }
  ]
});
