/*
 * 文字情緒辨識 插件說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個插件的積木。
 */
OSEP.addPlugin({
  "id": "textSentiment",
  "name": "文字情緒辨識",
  "nameEn": "Text Sentiment",
  "author": "Andrew Yang",
  "updated": "2026-11-17",
  "tags": [
    "人工智慧",
    "語言"
  ],
  "needs": [
    "網路（第一次下載模型）"
  ],
  "color": {
    "primary": "#3AACFD",
    "secondary": "#3AACFD",
    "tertiary": "#3AACFD"
  },
  "card": "images/textSentiment/card.png",
  "icon": "images/textSentiment/small.png",
  "blockIcon": "images/textSentiment/block-icon.png",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_textSentiment",
  "tagline": "判斷一句話是正面還是負面情緒，中文、英文都能用。",
  "overview": "輸入一句話，AI 模型會判斷它的情緒是**正面**還是**負面**，並給出一個 0～1 的分數。可以做心情日記、會看你心情回應的角色、留言分類、情緒溫度計等作品。\n\n插件會自動判斷文字是中文還是英文，選用對應的模型。繁體中文也可以直接輸入。\n\n> 模型是在你的瀏覽器裡執行的，要分析的文字**不會**傳到其他伺服器。第一次使用需要下載模型（中文約 103 MB、英文約 67 MB），之後瀏覽器會記住，下次就很快。\n\n### 準確度（實際測試）\n| 測試內容 | 正確率 |\n|---|---|\n| 繁體中文短句 50 句 | 96% |\n| 中文評論 400 句 | 96% |\n| 英文短句 30 句 | 100% |\n| 英文影評 400 句 | 約 90% |",
  "highlights": [
    {
      "icon": "🌏",
      "title": "自動判斷語言",
      "text": "含中文用中文模型，英文用英文模型，不需要切換。"
    },
    {
      "icon": "🔒",
      "title": "在電腦上執行",
      "text": "模型在瀏覽器裡跑，文字不會上傳。"
    },
    {
      "icon": "📊",
      "title": "看得到進度",
      "text": "「模型狀態」顯示下載百分比與初始化，學生知道還要等多久。"
    },
    {
      "icon": "⏳",
      "title": "會等模型準備好",
      "text": "預先載入與分析積木都會等完成才往下，不用自己算等待時間。"
    }
  ],
  "groups": [
    {
      "name": "準備模型",
      "intro": "模型第一次使用時需要下載。建議在綠旗一開始就預先載入，學生打字時模型已經準備好了。",
      "blocks": [
        {
          "opcode": "preloadModel",
          "type": "command",
          "text": "預先載入[LANG]模型",
          "textEn": "Preload [LANG] model",
          "args": {
            "LANG": {
              "type": "menu",
              "options": [
                "全部",
                "中文",
                "英文"
              ],
              "value": "全部",
              "values": [
                "all",
                "zh",
                "en"
              ],
              "desc": "要載入哪個語言的模型。只會用到中文的作品選「中文」，下載量比較少。"
            }
          },
          "summary": "先把模型下載並準備好。",
          "detail": "這塊積木會**等到模型可以使用**（或載入失敗）才繼續執行下一塊。\n\n不用這塊也可以：第一次 [[startTextSentiment]] 時會自動載入，只是那一次要等比較久。\n\n載入的過程可以用 [[getModelStatus]] 看到：下載中會顯示百分比，下載完後還會「初始化中」一段時間（第一次大約 20 秒），然後變成「就緒」。",
          "tips": "如果想在載入時同時做別的事（例如顯示進度），把這塊放在另一段綠旗腳本，再用 [[isModelReady]] 判斷是否完成，見範例 3。"
        },
        {
          "opcode": "isModelReady",
          "type": "boolean",
          "text": "[LANG]模型已就緒？",
          "textEn": "[LANG] model ready?",
          "args": {
            "LANG": {
              "type": "menu",
              "options": [
                "全部",
                "中文",
                "英文"
              ],
              "value": "全部",
              "values": [
                "all",
                "zh",
                "en"
              ],
              "desc": "要檢查的模型。「全部」代表中文和英文都要就緒。"
            }
          },
          "summary": "模型是否已經可以使用。",
          "detail": "只查詢、**不會**開始載入模型。最常搭配「等待直到」使用，讓別的腳本等模型準備好再開始。",
          "returns": "模型已就緒時為 `true`，否則為 `false`。",
          "example": [
            {
              "t": "等待直到 [C]",
              "cat": "control",
              "args": {
                "C": {
                  "use": "isModelReady",
                  "args": {
                    "LANG": {
                      "v": "中文",
                      "menu": true
                    }
                  }
                }
              }
            },
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": "我準備好了！"
              }
            }
          ]
        },
        {
          "opcode": "getModelStatus",
          "type": "reporter",
          "text": "模型狀態",
          "textEn": "Model status",
          "summary": "模型目前的載入狀態。",
          "detail": "| 顯示 | 意思 |\n|---|---|\n| 未載入 | 還沒開始下載 |\n| 載入中 56% | 下載中（百分比只會增加，不會倒退） |\n| 初始化中 | 下載完成，正在準備模型 |\n| 就緒 | 可以使用了 |\n| 載入失敗 | 通常是網路問題，重新整理頁面再試 |\n\n會顯示最近一次用到的語言，例如「中文:就緒」；預先載入「全部」時會同時顯示兩個，例如「中文:載入中 32% / 英文:就緒」。",
          "returns": "狀態文字。"
        }
      ]
    },
    {
      "name": "分析文字",
      "intro": "先用「輸入文字情緒」放入要分析的文字，再用「開始文字情緒辨識」分析。",
      "blocks": [
        {
          "opcode": "inputText",
          "type": "command",
          "text": "輸入文字情緒[defaultText]",
          "textEn": "Enter text sentiment[defaultText]",
          "args": {
            "defaultText": {
              "type": "string",
              "value": "請輸入文字",
              "desc": "要分析的文字，常放「詢問的答案」或變數。超過 500 個字只會分析前 500 個字。"
            }
          },
          "summary": "設定要分析的文字。",
          "detail": "這塊只是把文字記下來，**還沒有分析**。要接著用 [[startTextSentiment]] 才會得到結果。"
        },
        {
          "opcode": "startTextSentiment",
          "type": "command",
          "text": "開始文字情緒辨識",
          "textEn": "Start Text Emotion Recognition",
          "summary": "分析目前的文字，結果會更新到下面三塊數值積木。",
          "detail": "這塊會等分析完成才繼續執行，所以下一塊就可以直接讀 [[getSentiment]]、[[getConfidence]]、[[getLanguage]]。\n\n模型還沒載入時會先自動載入（第一次會等比較久）。如果文字是空的、或沒有中英文字（例如只有數字和符號），結果會是「中性」，不會呼叫模型。",
          "tips": "同時有好幾段腳本在分析時，只會保留最後一次的結果，不會被比較慢的舊結果蓋掉。"
        }
      ]
    },
    {
      "name": "結果",
      "intro": "分析完成後讀取結果。",
      "blocks": [
        {
          "opcode": "getSentiment",
          "type": "reporter",
          "text": "情緒結果",
          "textEn": "Sentiment result",
          "summary": "「正面」或「負面」。",
          "detail": "模型只學過正面與負面兩類，所以一般句子一定會被分成其中一類。想判斷「中性」，可以用 [[getConfidence]] 的分數自己訂範圍，見常見問題。",
          "returns": "「正面」、「負面」；文字是空的時為「中性」；還沒分析過時是空的。英文介面會回傳 positive / negative / neutral。",
          "example": [
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
                      "use": "getSentiment"
                    },
                    "B": "正面"
                  }
                }
              },
              "body": [
                {
                  "t": "造型換成 [X]",
                  "cat": "looks",
                  "args": {
                    "X": {
                      "v": "開心",
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
                      "v": "難過",
                      "menu": true
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "opcode": "getConfidence",
          "type": "reporter",
          "text": "文字情緒置信度",
          "textEn": "Text Emotion Confidence",
          "summary": "這句話有多「正面」，0～1 的分數。",
          "detail": "> 注意：這個數字是「**正面的程度**」，不是「AI 有多確定」。\n\n- 接近 **1**：非常正面（例如「我今天考了一百分，好開心！」約 0.98）\n- 接近 **0**：非常負面\n- **0.5 左右**：模型也不太確定，可以當作中性\n\n這個設計是為了和舊版插件的專案相容。",
          "returns": "0～1 的數字，取到小數第二位。還沒分析過時是 0。"
        },
        {
          "opcode": "getLanguage",
          "type": "reporter",
          "text": "偵測到的語言",
          "textEn": "Detected language",
          "summary": "這次分析用的是中文還是英文模型。",
          "detail": "只要文字中含有中文就會用中文模型。中英夾雜時，比較中文字數和英文單字數，多的那一種勝出。",
          "returns": "「中文」或「英文」；沒有中英文字時是空的。"
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "心情日記",
      "intro": "問今天的心情，角色依照情緒換造型並回應。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "preloadModel",
          "args": {
            "LANG": {
              "v": "中文",
              "menu": true
            }
          }
        },
        {
          "t": "詢問 [Q] 並等待",
          "cat": "sensing",
          "args": {
            "Q": "今天過得怎麼樣？"
          }
        },
        {
          "use": "inputText",
          "args": {
            "defaultText": {
              "t": "詢問的答案",
              "cat": "sensing",
              "type": "reporter"
            }
          }
        },
        {
          "use": "startTextSentiment"
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
                  "use": "getSentiment"
                },
                "B": "正面"
              }
            }
          },
          "body": [
            {
              "t": "造型換成 [X]",
              "cat": "looks",
              "args": {
                "X": {
                  "v": "開心",
                  "menu": true
                }
              }
            },
            {
              "t": "說出 [M] 持續 [S] 秒",
              "cat": "looks",
              "args": {
                "M": "太好了，替你開心！",
                "S": {
                  "num": "2"
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
                  "v": "安慰",
                  "menu": true
                }
              }
            },
            {
              "t": "說出 [M] 持續 [S] 秒",
              "cat": "looks",
              "args": {
                "M": "辛苦了，抱抱你。",
                "S": {
                  "num": "2"
                }
              }
            }
          ]
        }
      ]
    },
    {
      "title": "情緒溫度計",
      "intro": "把分數換成高度：越正面，指針越高。",
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
          "t": "詢問 [Q] 並等待",
          "cat": "sensing",
          "args": {
            "Q": "說一句話"
          }
        },
        {
          "use": "inputText",
          "args": {
            "defaultText": {
              "t": "詢問的答案",
              "cat": "sensing",
              "type": "reporter"
            }
          }
        },
        {
          "use": "startTextSentiment"
        },
        {
          "t": "滑行 [S] 秒到 x: [X] y: [Y]",
          "cat": "motion",
          "args": {
            "S": {
              "num": "1"
            },
            "X": {
              "num": "0"
            },
            "Y": {
              "t": "[A] - [B]",
              "cat": "operators",
              "type": "reporter",
              "args": {
                "A": {
                  "t": "[A] * [B]",
                  "cat": "operators",
                  "type": "reporter",
                  "args": {
                    "A": {
                      "use": "getConfidence"
                    },
                    "B": {
                      "num": "300"
                    }
                  }
                },
                "B": {
                  "num": "150"
                }
              }
            }
          }
        }
      ],
      "explain": "分數 0～1 乘以 300 再減 150，就變成舞台上 -150～150 的 y 座標。"
    },
    {
      "title": "一邊載入、一邊顯示進度",
      "intro": "兩段同時開始的綠旗腳本：一段負責載入，另一段顯示進度，準備好才讓學生輸入。",
      "script": [
        [
          {
            "t": "當 🏁 被點擊",
            "cat": "events",
            "type": "hat"
          },
          {
            "use": "preloadModel",
            "args": {
              "LANG": {
                "v": "全部",
                "menu": true
              }
            }
          }
        ],
        [
          {
            "t": "當 🏁 被點擊",
            "cat": "events",
            "type": "hat"
          },
          {
            "t": "重複直到 [C]",
            "cat": "control",
            "type": "c",
            "args": {
              "C": {
                "use": "isModelReady",
                "args": {
                  "LANG": {
                    "v": "全部",
                    "menu": true
                  }
                }
              }
            },
            "body": [
              {
                "t": "說出 [M]",
                "cat": "looks",
                "args": {
                  "M": {
                    "use": "getModelStatus"
                  }
                }
              }
            ]
          },
          {
            "t": "說出 [M] 持續 [S] 秒",
            "cat": "looks",
            "args": {
              "M": "準備好了！",
              "S": {
                "num": "1"
              }
            }
          },
          {
            "t": "詢問 [Q] 並等待",
            "cat": "sensing",
            "args": {
              "Q": "請輸入一句話"
            }
          }
        ]
      ]
    }
  ],
  "faq": [
    {
      "q": "第一次按下去等很久？",
      "a": "第一次要下載模型（中文約 103 MB、英文約 67 MB），下載完還要初始化約 20 秒。之後瀏覽器會把模型存起來，下次開啟就很快。上課前可以先在每台電腦開一次。"
    },
    {
      "q": "為什麼沒有「中性」？",
      "a": "目前的模型只學過正面和負面。可以自己用分數判斷，例如 [[getConfidence]] 在 0.4～0.6 之間就當作中性：\n\n- 大於 0.6 → 正面\n- 小於 0.4 → 負面\n- 其他 → 中性"
    },
    {
      "q": "進度一下 99%、一下又變少？",
      "a": "舊版會這樣，已在 2026-11-17 修正：現在百分比只會增加，下載完成後會顯示「初始化中」。"
    },
    {
      "q": "可以離線使用嗎？",
      "a": "目前需要網路（程式庫來自 jsDelivr，模型來自 Hugging Face）。已經下載過的電腦，模型會留在瀏覽器快取裡。"
    },
    {
      "q": "舊版作品還能用嗎？",
      "a": "可以。舊版的積木都保留下來了；舊版是把中文翻譯成英文再分析，新版直接用中文模型，不再經過翻譯。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-09",
      "text": "改用中文、英文兩個新模型，不再需要翻譯；新增情緒結果、偵測到的語言、預先載入模型、模型狀態積木"
    },
    {
      "date": "2026-11-17",
      "text": "新增「模型已就緒？」積木；進度改為只增不減，並顯示「初始化中」；卡片改為紫色星空風格"
    }
  ]
});
