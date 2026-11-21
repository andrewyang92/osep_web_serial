/*
 * QR Code 擴充功能說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從擴充功能原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個擴充功能的積木。
 */
OSEP.addPlugin({
  "id": "qrcode",
  "name": "QR Code",
  "nameEn": "QR Code",
  "author": "Sugiura Lab",
  "updated": "2026-11-22",
  "tags": [
    "影像",
    "攝影機"
  ],
  "needs": [
    "攝影機（掃相機時）"
  ],
  "color": {
    "primary": "#4C97FF",
    "secondary": "#4C97FF",
    "tertiary": "#3373CC"
  },
  "card": "images/qrcode/card.png",
  "icon": "images/qrcode/small.svg",
  "blockIcon": "images/qrcode/block-icon.svg",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_qrcode",
  "tagline": "用攝影機或舞台畫面掃描 QR Code，讀出裡面的文字或網址。",
  "overview": "把 QR Code 拿到攝影機前，擴充功能就會讀出裡面的內容（文字、網址、數字），並在舞台上用橘色框標出 QR Code 的位置。也可以掃描舞台畫面上的 QR Code。\n\n可以做的作品：尋寶遊戲（每個關卡貼一張 QR Code）、圖書借還、點名、用卡片控制角色等。\n\n> 掃描在你的瀏覽器裡進行，影像不會上傳。手機、平板可以切換前後鏡頭。\n\n> QR Code 是 DENSO WAVE 公司的註冊商標。\n\n擴充功能原始作者：Sugiura Lab；切換鏡頭的兩塊積木由 estea chen 加入。讀取 QR Code 使用 [jsQR](https://github.com/cozmo/jsQR)。",
  "groups": [
    {
      "name": "掃描",
      "intro": "用 [[qrStart]] 開始，擴充功能會每隔一段時間掃一次，直到 [[qrStop]] 或按下停止。",
      "blocks": [
        {
          "opcode": "qrStart",
          "type": "command",
          "text": "開始掃瞄[INPUT]",
          "textEn": "start scanning [INPUT]",
          "args": {
            "INPUT": {
              "type": "menu",
              "options": [
                "相機",
                "舞台"
              ],
              "value": "相機",
              "values": [
                "相機",
                "舞台"
              ],
              "optionsEn": [
                "camera",
                "stage"
              ],
              "valueEn": "camera",
              "desc": "「相機」掃攝影機畫面；「舞台」掃舞台上看到的畫面。"
            }
          },
          "summary": "開始掃描 QR Code。",
          "detail": "- **相機**：打開攝影機（畫面不鏡像，QR Code 才是正的），攝影機準備好就開始掃描\n- **舞台**：掃描整個舞台畫面，例如角色造型或背景上的 QR Code\n\n這塊積木不會等攝影機打開就繼續往下執行。已經在掃描時，再執行一次不會有作用。",
          "tips": "瀏覽器會詢問是否允許使用攝影機，要按「允許」。"
        },
        {
          "opcode": "changewebcam",
          "type": "command",
          "text": "切換鏡頭",
          "textEn": "use another camera",
          "summary": "換成電腦上的下一個鏡頭。",
          "detail": "接了好幾個攝影機（例如筆電內建鏡頭加上 USB 鏡頭）時使用。"
        },
        {
          "opcode": "ue_cam",
          "type": "command",
          "text": "使用[WEBCAM]鏡頭",
          "textEn": "use the [WEBCAM] camera",
          "args": {
            "WEBCAM": {
              "type": "menu",
              "options": [
                "後",
                "前"
              ],
              "value": "後",
              "values": [
                "後",
                "前"
              ],
              "optionsEn": [
                "back",
                "front"
              ],
              "valueEn": "back",
              "desc": "「後」是手機、平板背面的鏡頭；「前」是螢幕這一面的鏡頭。"
            }
          },
          "summary": "手機、平板切換前鏡頭或後鏡頭。",
          "detail": "掃 QR Code 通常用後鏡頭比較方便。電腦只有一個鏡頭時沒有差別。"
        },
        {
          "opcode": "qrStop",
          "type": "command",
          "text": "停止掃瞄",
          "textEn": "stop scanning",
          "summary": "停止掃描，關掉攝影機，清掉舞台上的框。",
          "detail": "按下 Scratch 的紅色停止鈕時也會自動停止。已經讀到的內容會留著，要清掉用 [[qrReset]]。"
        },
        {
          "opcode": "qrSetInterval",
          "type": "command",
          "text": "設定掃瞄間隔[INTERVAL]秒",
          "textEn": "set scan interval [INTERVAL] sec",
          "args": {
            "INTERVAL": {
              "type": "menu",
              "options": [
                "0.3",
                "0.5",
                "1"
              ],
              "value": "0.3",
              "values": [
                "0.3",
                "0.5",
                "1"
              ],
              "optionsEn": [
                "0.3",
                "0.5",
                "1"
              ],
              "desc": "0.3、0.5 或 1 秒。"
            }
          },
          "summary": "設定多久掃一次。",
          "detail": "預設 0.3 秒。間隔越長越省電腦效能，但反應會比較慢。"
        },
        {
          "opcode": "qrScanning",
          "type": "boolean",
          "text": "掃瞄中?",
          "textEn": "scanning?",
          "summary": "是否正在掃描。",
          "returns": "掃描中為 `true`，否則為 `false`。",
          "detail": ""
        }
      ]
    },
    {
      "name": "讀取內容",
      "intro": "",
      "blocks": [
        {
          "opcode": "qrData",
          "type": "reporter",
          "text": "條碼內容",
          "textEn": "data",
          "summary": "最近一次讀到的 QR Code 內容。",
          "detail": "QR Code 離開畫面後，內容**不會**自動清掉，還是上一次讀到的。要判斷「有沒有新的 QR Code」，可以讀到之後用 [[qrReset]] 清掉，再等下一次。",
          "returns": "文字（中文、日文也可以）。還沒讀到時是空的。",
          "example": [
            {
              "t": "等待直到 [C]",
              "cat": "control",
              "args": {
                "C": {
                  "t": "[A] > [B]",
                  "cat": "operators",
                  "type": "boolean",
                  "args": {
                    "A": {
                      "t": "[S] 的長度",
                      "cat": "operators",
                      "type": "reporter",
                      "args": {
                        "S": {
                          "use": "qrData"
                        }
                      }
                    },
                    "B": {
                      "num": "0"
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
                  "use": "qrData"
                }
              }
            },
            {
              "use": "qrReset"
            }
          ]
        },
        {
          "opcode": "qrASCII",
          "type": "reporter",
          "text": "文字[INDEX]的ASCII碼",
          "textEn": "letter [INDEX] ASCII code of data",
          "args": {
            "INDEX": {
              "type": "number",
              "value": "1",
              "desc": "第幾個字，從 1 開始。"
            }
          },
          "summary": "內容裡第幾個字的 ASCII 碼。",
          "returns": "0～127 的數字。不是英文、數字或符號（例如中文），或超出長度時是 0。",
          "tips": "可以把 QR Code 當成「編碼卡片」：例如讀第 1 個字的 ASCII 碼，A 是 65，B 是 66。",
          "detail": ""
        },
        {
          "opcode": "qrReset",
          "type": "command",
          "text": "清除資料",
          "textEn": "reset data",
          "summary": "清掉讀到的內容。",
          "detail": "清掉後 [[qrData]] 是空的，直到讀到下一個 QR Code。"
        }
      ]
    },
    {
      "name": "畫面",
      "intro": "",
      "blocks": [
        {
          "opcode": "qrSetCameraTransparency",
          "type": "command",
          "text": "相機透明度設定為[TRANSPARENCY]",
          "textEn": "set camera transparency to [TRANSPARENCY]",
          "args": {
            "TRANSPARENCY": {
              "type": "number",
              "value": "0",
              "desc": "0～100。0 是完全看得到，100 是完全看不到。"
            }
          },
          "summary": "設定舞台上攝影機畫面的透明度。",
          "detail": "調高透明度可以讓角色、背景比較清楚，攝影機照樣可以掃描。"
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "尋寶遊戲",
      "intro": "每個關卡貼一張 QR Code，裡面寫「寶箱1」「寶箱2」…。掃到就說出找到了哪一個。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "qrStart",
          "args": {
            "INPUT": {
              "v": "相機",
              "menu": true
            }
          }
        },
        {
          "t": "重複無限次",
          "cat": "control",
          "type": "c",
          "body": [
            {
              "t": "如果 [C] 那麼",
              "cat": "control",
              "type": "c",
              "args": {
                "C": {
                  "t": "[A] 包含 [B] ?",
                  "cat": "operators",
                  "type": "boolean",
                  "args": {
                    "A": {
                      "use": "qrData"
                    },
                    "B": "寶箱"
                  }
                }
              },
              "body": [
                {
                  "t": "說出 [M] 持續 [S] 秒",
                  "cat": "looks",
                  "args": {
                    "M": {
                      "t": "字串組合 [A] [B]",
                      "cat": "operators",
                      "type": "reporter",
                      "args": {
                        "A": "找到了：",
                        "B": {
                          "use": "qrData"
                        }
                      }
                    },
                    "S": {
                      "num": "2"
                    }
                  }
                },
                {
                  "t": "播放音效 [S]",
                  "cat": "sound",
                  "args": {
                    "S": {
                      "v": "Win",
                      "menu": true
                    }
                  }
                },
                {
                  "use": "qrReset"
                }
              ]
            }
          ]
        }
      ],
      "explain": "讀到後用「清除資料」，同一張卡片要拿開再掃一次才會再觸發。"
    },
    {
      "title": "用卡片控制角色",
      "intro": "做三張寫著「左」「右」「跳」的 QR Code，拿給攝影機看，角色就照著動。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "qrStart",
          "args": {
            "INPUT": {
              "v": "相機",
              "menu": true
            }
          }
        },
        {
          "use": "qrSetCameraTransparency",
          "args": {
            "TRANSPARENCY": {
              "num": "50"
            }
          }
        },
        {
          "t": "重複無限次",
          "cat": "control",
          "type": "c",
          "body": [
            {
              "t": "如果 [C] 那麼",
              "cat": "control",
              "type": "c",
              "args": {
                "C": {
                  "t": "[A] = [B]",
                  "cat": "operators",
                  "type": "boolean",
                  "args": {
                    "A": {
                      "use": "qrData"
                    },
                    "B": "左"
                  }
                }
              },
              "body": [
                {
                  "t": "x 改變 [N]",
                  "cat": "motion",
                  "args": {
                    "N": {
                      "num": "-10"
                    }
                  }
                }
              ]
            },
            {
              "t": "如果 [C] 那麼",
              "cat": "control",
              "type": "c",
              "args": {
                "C": {
                  "t": "[A] = [B]",
                  "cat": "operators",
                  "type": "boolean",
                  "args": {
                    "A": {
                      "use": "qrData"
                    },
                    "B": "右"
                  }
                }
              },
              "body": [
                {
                  "t": "x 改變 [N]",
                  "cat": "motion",
                  "args": {
                    "N": {
                      "num": "10"
                    }
                  }
                }
              ]
            }
          ]
        }
      ],
      "explain": "QR Code 可以用免費的「QR Code 產生器」網站製作，內容打一個字就好。"
    }
  ],
  "faq": [
    {
      "q": "攝影機打開了，卻一直掃不到？",
      "a": "- QR Code 要夠大、對準鏡頭，不要反光\n- 光線要充足\n- 白底黑點的一般 QR Code 才讀得到（顏色相反的 QR Code 讀不到）"
    },
    {
      "q": "為什麼畫面沒有像照鏡子？",
      "a": "掃描相機時擴充功能會把畫面改成不鏡像，QR Code 才會是正的，比較好對準。"
    },
    {
      "q": "拿開 QR Code 後「條碼內容」還在？",
      "a": "擴充功能會保留最後一次讀到的內容。需要時用「清除資料」清掉。"
    },
    {
      "q": "手機上怎麼用後鏡頭？",
      "a": "用「使用 後 鏡頭」積木。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    }
  ]
});
