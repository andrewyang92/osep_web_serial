/*
 * Claude AI 插件說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個插件的積木。
 */
OSEP.addPlugin({
  "id": "claude",
  "name": "Claude AI",
  "nameEn": "Claude",
  "author": "Andrew Yang",
  "updated": "2026-11-17",
  "tags": [
    "人工智慧",
    "語言",
    "聊天機器人"
  ],
  "needs": [
    "網路"
  ],
  "color": {
    "primary": "#D97757",
    "secondary": "#C2603F",
    "tertiary": "#A84E31"
  },
  "card": "images/claude/card.png",
  "icon": "images/claude/small.svg",
  "blockIcon": "images/claude/block-icon.svg",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_claude",
  "tagline": "讓角色跟 Claude AI 對話，還能讓 Claude 看舞台畫面回答問題。",
  "overview": "這個插件把 Anthropic 的 **Claude** 人工智慧放進 Scratch。角色可以把問題丟給 Claude、拿到回答後說出來，做成聊天機器人、問答遊戲、故事接龍、作業小幫手等作品。\n\n除了文字，Claude 也能「看」舞台：[[askStage]] 會把當下的舞台畫面一起送出，讓 Claude 描述畫面、猜你畫了什麼，或幫你檢查作品。\n\n> 不需要任何設定就能使用。插件預設會透過 OSEP 的中繼伺服器連線，所有使用者共用每日次數上限。\n\n### 兩種連線方式\n| 方式 | 怎麼用 | 適合 |\n|---|---|---|\n| OSEP 中繼（預設） | 什麼都不用設定；老師有設使用密碼時，用 [[setAccessCode]] 填入 | 上課、一般使用 |\n| 自己的 API 金鑰 | 用 [[setApiKey]] 填入 `sk-ant-` 開頭的金鑰，直接連到 Anthropic | 需要大量使用、或想用其他模型 |",
  "highlights": [
    {
      "icon": "💬",
      "title": "一塊積木就能發問",
      "text": "「聊天內容」送出問題，「Claude 回應訊息」拿回答，積木會自動等 Claude 回覆。"
    },
    {
      "icon": "🖼️",
      "title": "看得懂舞台",
      "text": "把舞台畫面截圖送給 Claude，讓它描述、評分或猜謎。"
    },
    {
      "icon": "🧠",
      "title": "可以記得前文",
      "text": "開啟對話記憶後，Claude 會記得最近 10 輪對話，能接著聊下去。"
    },
    {
      "icon": "🎭",
      "title": "自訂 AI 身份",
      "text": "用「設定AI身份」讓 Claude 扮演老師、故事角色或遊戲關主。"
    }
  ],
  "groups": [
    {
      "name": "連線設定",
      "intro": "大部分情況下**不需要**用到這一組。只有老師設了使用密碼、或要改用自己的金鑰／自己的中繼時才需要。",
      "blocks": [
        {
          "opcode": "setAccessCode",
          "type": "command",
          "text": "設定使用密碼 [CODE]",
          "textEn": "set class access code [CODE]",
          "args": {
            "CODE": {
              "type": "string",
              "value": " ",
              "desc": "老師提供的使用密碼。前後的空白會自動去掉。"
            }
          },
          "summary": "填入中繼伺服器的使用密碼。",
          "detail": "如果中繼伺服器有設定使用密碼（`ACCESS_CODE`），每次發問都要附上正確的密碼才會被接受。把這塊放在綠旗腳本的最前面即可，整個專案只要設定一次。\n\n沒有設定使用密碼的中繼，不需要用這塊積木。",
          "tips": "密碼錯誤時，[[getStatus]] 會顯示「錯誤：使用密碼錯誤」。"
        },
        {
          "opcode": "setApiKey",
          "type": "command",
          "text": "Claude金鑰 [KEY]",
          "textEn": "Claude API key [KEY]",
          "args": {
            "KEY": {
              "type": "string",
              "value": "sk-ant-...",
              "desc": "自己的 Anthropic API 金鑰（`sk-ant-` 開頭）。保留預設的 `sk-ant-...` 或清空，代表不使用金鑰、改回中繼。"
            }
          },
          "summary": "改用自己的 API 金鑰，直接連到 Anthropic。",
          "detail": "填入金鑰後，插件會直接呼叫 Anthropic 的 API，不再經過中繼，因此**不受中繼的每日次數與模型限制**，費用算在金鑰所屬的帳號。\n\n金鑰可以到 Anthropic 的 Claude Console 申請。",
          "tips": "> ! 金鑰如果直接打在積木裡，會跟著 .sb3 專案檔一起儲存。分享或上傳專案前，記得把金鑰刪掉。"
        },
        {
          "opcode": "setProxyUrl",
          "type": "command",
          "text": "設定中繼(GAS)網址 [URL]",
          "textEn": "set relay (GAS) URL [URL]",
          "args": {
            "URL": {
              "type": "string",
              "value": "https://script.google.com/macros/s/.../exec",
              "desc": "自己部署的 Google Apps Script 網址（`/exec` 結尾）。保留預設文字不會有任何改變；清空則回到 OSEP 預設的中繼。"
            }
          },
          "summary": "改用另一個中繼伺服器（Google Apps Script）。",
          "detail": "插件已經內建 OSEP 的中繼網址，一般不用設定。如果學校想用自己的 Google 帳號架一個中繼（例如要有獨立的次數上限），可以照插件資料夾裡 `gas/README.md` 的步驟部署，再用這塊積木填入網址。"
        }
      ]
    },
    {
      "name": "開頭設定",
      "intro": "決定 Claude 的角色、使用的模型，以及要不要記得前面的對話。通常放在綠旗腳本的開頭。",
      "blocks": [
        {
          "opcode": "setSystem",
          "type": "command",
          "text": "設定AI身份為[SYSTEM]",
          "textEn": "configure system of[SYSTEM]",
          "args": {
            "SYSTEM": {
              "type": "string",
              "value": "你是親切的助教，請用繁體中文簡短回答。",
              "valueEn": "You are a friendly assistant. Answer briefly.",
              "desc": "對 Claude 的角色說明與規則，例如身份、說話方式、回答長度、要用什麼語言。"
            }
          },
          "summary": "告訴 Claude 它要扮演誰、要怎麼回答。",
          "detail": "這段文字是「系統提示（system prompt）」：每次發問都會一起送給 Claude，但不算在對話內容裡。好的寫法是把**身份**、**對象**和**規則**寫清楚，例如：\n\n- 你是一隻住在海底的章魚老師，回答小學生的問題，每次不超過 50 個字。\n- 你是猜謎遊戲的關主。我會猜一種動物，你只能回答「是」或「不是」。\n- 請用繁體中文回答。\n\n沒有用這塊積木時，Claude 不會收到任何角色設定。",
          "tips": "如果 Claude 用簡體字回答，在身份裡加上「請用繁體中文回答」。"
        },
        {
          "opcode": "setModel",
          "type": "command",
          "text": "設定AI模型為[MODEL]",
          "textEn": "configure modle of[MODEL]",
          "args": {
            "MODEL": {
              "type": "menu",
              "options": [
                "claude-haiku-5-5",
                "claude-sonnet-5-5"
              ],
              "value": "claude-haiku-5-5",
              "values": [
                "claude-haiku-5-5",
                "claude-sonnet-5-5"
              ],
              "optionsEn": [
                "claude-haiku-5-5",
                "claude-sonnet-5-5"
              ],
              "acceptReporters": true,
              "desc": "要使用的 Claude 模型。可以從選單選，也可以放變數或直接打模型名稱。"
            }
          },
          "summary": "選擇要用哪一個 Claude 模型。",
          "detail": "| 模型 | 特色 |\n|---|---|\n| `claude-haiku-5-5`（預設） | 回答快、適合大部分課堂活動 |\n| `claude-sonnet-5-5` | 比較聰明，適合需要推理、寫程式或較長的回答；速度較慢 |\n\n透過 OSEP 中繼時只能用這兩個模型；選其他名稱會出現「錯誤：中繼不允許使用這個模型」。用自己的金鑰時則可以填入任何 Claude 模型名稱。"
        },
        {
          "opcode": "setMemory",
          "type": "command",
          "text": "對話記憶 [ONOFF]",
          "textEn": "turn conversation memory [ONOFF]",
          "args": {
            "ONOFF": {
              "type": "menu",
              "options": [
                "開啟",
                "關閉"
              ],
              "value": "開啟",
              "values": [
                "on",
                "off"
              ],
              "optionsEn": [
                "on",
                "off"
              ],
              "valueEn": "on",
              "acceptReporters": true,
              "desc": "開啟或關閉對話記憶。"
            }
          },
          "summary": "讓 Claude 記得（或忘記）前面聊過的內容。",
          "detail": "插件一開始是**關閉**的：每個問題都是獨立的，Claude 不知道你上一句問了什麼。\n\n開啟後，Claude 會記得最近 **10 輪**（10 個問題＋10 個回答），可以接著前面的內容聊，例如故事接龍、多輪問答。超過 10 輪時，最舊的會先被忘掉。\n\n關閉記憶時，已記住的內容也會一起清除。",
          "tips": "記憶越多，每次送出的內容越長、回答也會稍微變慢。想開始新話題時，用 [[clearHistory]]。發問失敗的那一輪不會被記住。"
        }
      ]
    },
    {
      "name": "微調",
      "intro": "調整回答的風格與長度。不設定也可以，會使用預設值。",
      "blocks": [
        {
          "opcode": "setTemperature",
          "type": "command",
          "text": "輸出溫度(0真實與1創意)[TEMP]",
          "textEn": "configure temperature of[TEMP]",
          "args": {
            "TEMP": {
              "type": "number",
              "value": "0.7",
              "desc": "0～1 之間的數字。超出範圍會自動調整成 0 或 1；清空代表使用模型預設值。"
            }
          },
          "summary": "控制回答要穩定一致，還是有創意、多變化。",
          "detail": "- **接近 0**：每次回答都差不多、比較保守，適合問答、翻譯、計算。\n- **接近 1**：每次回答變化較大、比較有想像力，適合寫故事、取名字、想點子。\n\n沒有用這塊積木時，使用模型自己的預設值。"
        },
        {
          "opcode": "setMaxTokens",
          "type": "command",
          "text": "設定最大代幣[TOKENS]",
          "textEn": "configure max token of[TOKENS]",
          "args": {
            "TOKENS": {
              "type": "number",
              "value": "1024",
              "desc": "回答最多可以多長，範圍 1～16000（預設 1024）。透過 OSEP 中繼時最多 2048。"
            }
          },
          "summary": "限制回答的最大長度。",
          "detail": "「代幣（token）」是 AI 計算文字長度的單位，大約一個中文字是 1～2 個代幣。數字越小，回答越短、也越快。\n\n如果回答寫到一半就停了，[[getStatus]] 會顯示「完成（回應被截斷，可調高最大長度）」，這時把數字調大即可。",
          "tips": "想要短回答，比起把代幣調很小，更好的做法是在 [[setSystem]] 寫「每次回答不超過 30 個字」，才不會被硬切在句子中間。"
        }
      ]
    },
    {
      "name": "發問",
      "intro": "三種發問方式。三塊積木都會**等 Claude 回答完**才繼續執行下一塊。",
      "blocks": [
        {
          "opcode": "ask",
          "type": "command",
          "text": "聊天內容[QUESTION]",
          "textEn": "talk text of [QUESTION]",
          "args": {
            "QUESTION": {
              "type": "string",
              "value": "你好！用一句話介紹你自己。",
              "valueEn": "Hello! Introduce yourself in one sentence.",
              "desc": "要問 Claude 的話。可以放「詢問的答案」、變數或字串組合。"
            }
          },
          "summary": "把問題送給 Claude，等它回答。",
          "detail": "送出問題後，這塊積木會等到 Claude 回答（或發生錯誤）才往下執行。回答會存在 [[getAnswer]]，之後可以拿來說出、存進變數或再做判斷。\n\n問題是空的時候不會送出，狀態會顯示「錯誤：問題不能是空的」。",
          "example": [
            {
              "use": "ask",
              "args": {
                "QUESTION": "幫我想一個貓咪的名字"
              }
            },
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "getAnswer"
                }
              }
            }
          ]
        },
        {
          "opcode": "askReporter",
          "type": "reporter",
          "text": "Claude 對 [QUESTION] 的回答",
          "textEn": "answer from Claude to [QUESTION]",
          "args": {
            "QUESTION": {
              "type": "string",
              "value": "你好！用一句話介紹你自己。",
              "valueEn": "Hello! Introduce yourself in one sentence.",
              "desc": "要問 Claude 的話。"
            }
          },
          "summary": "發問並直接把回答當成值使用。",
          "detail": "跟 [[ask]] 一樣會送出問題並等待，差別是這塊是圓角的數值積木，可以直接放進「說出」「變數設為」等積木的空格裡，少寫一塊積木。\n\n回答同時也會存在 [[getAnswer]]。",
          "returns": "Claude 的回答文字；發生錯誤時回傳錯誤訊息（以「錯誤：」開頭）。",
          "example": [
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "askReporter",
                  "args": {
                    "QUESTION": "用一句話說明為什麼天空是藍色的"
                  }
                }
              }
            }
          ]
        },
        {
          "opcode": "askStage",
          "type": "command",
          "text": "讓 Claude 看舞台並問 [QUESTION] 並等待",
          "textEn": "show stage to Claude and ask [QUESTION] and wait",
          "args": {
            "QUESTION": {
              "type": "string",
              "value": "舞台上有什麼？",
              "valueEn": "What do you see on the stage?",
              "desc": "關於舞台畫面的問題。"
            }
          },
          "summary": "把舞台截圖跟問題一起送給 Claude。",
          "detail": "按下的那一刻，插件會擷取整個舞台畫面（包含背景、角色、畫筆畫的線），連同問題一起送出。可以用來：\n\n- 讓 Claude 描述畫面：「舞台上有幾個角色？」\n- 畫圖猜謎：用畫筆畫一張圖，問「我畫的是什麼？只回答一個詞」\n- 作品回饋：「這個遊戲畫面哪裡可以更好？」\n\n回答一樣存在 [[getAnswer]]。",
          "tips": "視訊畫面也會被拍進去，所以搭配「視訊設為開啟」可以讓 Claude 看攝影機畫面。"
        }
      ]
    },
    {
      "name": "結果與後續",
      "intro": "讀取回答與狀態，以及複製、清除等收尾動作。",
      "blocks": [
        {
          "opcode": "getAnswer",
          "type": "reporter",
          "text": "Claude 回應訊息",
          "textEn": "Claude answer",
          "summary": "最近一次 Claude 的回答。",
          "detail": "勾選積木旁的方框，可以在舞台上直接顯示回答。",
          "returns": "最近一次的回答文字。還沒發問過時是空的；發問失敗時是錯誤訊息。"
        },
        {
          "opcode": "isBusy",
          "type": "boolean",
          "text": "Claude 思考中?",
          "textEn": "Claude is thinking?",
          "summary": "是否還有問題在等 Claude 回答。",
          "detail": "適合用來做「思考中」的動畫或提示，例如在另一段腳本中：Claude 思考中時讓角色換成思考的造型。",
          "returns": "有問題正在等待回答時為 `true`，否則為 `false`。",
          "example": [
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
                      "use": "isBusy"
                    }
                  },
                  "body": [
                    {
                      "t": "造型換成 [X]",
                      "cat": "looks",
                      "args": {
                        "X": {
                          "v": "思考中",
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
                          "v": "一般",
                          "menu": true
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "opcode": "getStatus",
          "type": "reporter",
          "text": "Claude 狀態",
          "textEn": "Claude status",
          "summary": "目前的狀態，或最近一次的錯誤原因。",
          "detail": "| 狀態 | 意思 |\n|---|---|\n| 待命 | 還沒發問 |\n| 思考中… | 正在等 Claude 回答 |\n| 完成 | 回答成功 |\n| 完成（回應被截斷，可調高最大長度） | 回答太長被切掉，用 [[setMaxTokens]] 調大 |\n| 錯誤：… | 發問失敗，冒號後面是原因（見下方「常見問題」） |",
          "returns": "狀態文字。"
        },
        {
          "opcode": "copyText",
          "type": "command",
          "text": "複製 [TEXT] 到剪貼簿",
          "textEn": "copy [TEXT] to clipboard",
          "args": {
            "TEXT": {
              "type": "string",
              "value": " ",
              "desc": "要複製的文字，常放 [[getAnswer]]。"
            }
          },
          "summary": "把文字複製到電腦的剪貼簿。",
          "detail": "複製後可以在其他程式按 Ctrl＋V 貼上，例如把 Claude 寫的故事貼到文件裡。",
          "tips": "瀏覽器只允許在使用者有操作（例如點擊角色、按鍵）之後複製，所以建議放在「當角色被點擊」底下。"
        },
        {
          "opcode": "clearHistory",
          "type": "command",
          "text": "清除對話紀錄",
          "textEn": "clear conversation history",
          "summary": "忘掉目前記住的對話，開始新話題。",
          "detail": "只在開啟 [[setMemory]] 時有作用。清除後，下一個問題對 Claude 來說就像第一次見面。對話記憶的開關不會改變。"
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "最簡單的聊天機器人",
      "intro": "角色問你想聊什麼，再把 Claude 的回答說出來，一直重複。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "setSystem",
          "args": {
            "SYSTEM": "你是親切的助教，請用繁體中文簡短回答。"
          }
        },
        {
          "t": "重複無限次",
          "cat": "control",
          "type": "c",
          "body": [
            {
              "t": "詢問 [Q] 並等待",
              "cat": "sensing",
              "args": {
                "Q": "想問 Claude 什麼？"
              }
            },
            {
              "use": "ask",
              "args": {
                "QUESTION": {
                  "t": "詢問的答案",
                  "cat": "sensing",
                  "type": "reporter"
                }
              }
            },
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "getAnswer"
                }
              }
            }
          ]
        }
      ],
      "explain": "因為 [[ask]] 會等待回答，所以「說出」一定會拿到這次的回答，不需要另外加「等待」。"
    },
    {
      "title": "會記得前文的角色扮演",
      "intro": "讓 Claude 扮演一個角色，並開啟對話記憶，就能連續對話。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "setSystem",
          "args": {
            "SYSTEM": "你是一隻住在海底的章魚老師，用小學生聽得懂的話回答，每次不超過50個字。"
          }
        },
        {
          "use": "setMemory",
          "args": {
            "ONOFF": {
              "v": "開啟",
              "menu": true
            }
          }
        },
        {
          "use": "clearHistory"
        },
        {
          "t": "重複無限次",
          "cat": "control",
          "type": "c",
          "body": [
            {
              "t": "詢問 [Q] 並等待",
              "cat": "sensing",
              "args": {
                "Q": "想跟章魚老師聊什麼？"
              }
            },
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "askReporter",
                  "args": {
                    "QUESTION": {
                      "t": "詢問的答案",
                      "cat": "sensing",
                      "type": "reporter"
                    }
                  }
                }
              }
            }
          ]
        }
      ],
      "explain": "開頭先 [[clearHistory]]，按綠旗重新開始時，章魚老師就不會記得上一次的對話。"
    },
    {
      "title": "畫圖讓 Claude 猜",
      "intro": "用畫筆在舞台上畫圖，按空白鍵讓 Claude 猜你畫了什麼。",
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
          "t": "說出 [M]",
          "cat": "looks",
          "args": {
            "M": "讓我看看…"
          }
        },
        {
          "use": "askStage",
          "args": {
            "QUESTION": "我在舞台上畫了一樣東西，請猜是什麼，只回答一個詞。"
          }
        },
        {
          "t": "說出 [M]",
          "cat": "looks",
          "args": {
            "M": {
              "use": "getAnswer"
            }
          }
        }
      ],
      "explain": "問題寫得越具體（例如「只回答一個詞」），回答越容易拿來做遊戲判斷。"
    }
  ],
  "faq": [
    {
      "q": "Claude 用簡體字回答怎麼辦？",
      "a": "用 [[setSystem]]，在身份說明裡加上「請用繁體中文回答」。預設的身份文字已經包含這句，只要記得把那塊積木放進腳本。"
    },
    {
      "q": "出現「錯誤：今天的使用次數已達上限」？",
      "a": "OSEP 中繼有每日次數上限（所有使用者共用）。可以等明天再試，或改用自己的金鑰（[[setApiKey]]）。"
    },
    {
      "q": "各種錯誤訊息是什麼意思？",
      "a": "| 訊息 | 原因與解決方法 |\n|---|---|\n| 請先設定 Claude API 金鑰或中繼網址 | 中繼網址被清空了。重新整理頁面，或用 [[setProxyUrl]] 填回網址 |\n| 使用密碼錯誤 | 用 [[setAccessCode]] 填入老師給的正確密碼 |\n| 中繼不允許使用這個模型 | 中繼只開放選單裡的兩個模型 |\n| 連不到中繼 | 網路斷線，或自己部署的 GAS 存取權不是「任何人」 |\n| API 金鑰錯誤或已失效 | 檢查自己填的金鑰 |\n| 請求太頻繁或額度不足 | 等一下再試；用自己的金鑰時，檢查帳號額度 |\n| Claude 伺服器忙碌中 | Claude 那邊暫時太忙，稍後再試 |\n| 等待逾時 | 超過 90 秒沒有回應。可換成 haiku 模型或把最大代幣調小 |\n| 無法擷取舞台畫面 | 舞台截圖失敗，重新整理頁面再試 |"
    },
    {
      "q": "可以用 Opus 或其他模型嗎？",
      "a": "OSEP 中繼只開放 `claude-haiku-5-5` 與 `claude-sonnet-5-5`。用自己的金鑰時，可以在 [[setModel]] 直接輸入其他模型名稱。"
    },
    {
      "q": "回答要等很久？",
      "a": "- 改用 `claude-haiku-5-5`（預設）\n- 用 [[setMaxTokens]] 或在身份裡要求簡短回答\n- 對話記憶開太久，送出的內容會越來越長，可以用 [[clearHistory]] 清掉"
    },
    {
      "q": "學生的問題會被存起來嗎？",
      "a": "問題會經由中繼送到 Anthropic 產生回答。插件本身不會另外儲存對話；開啟記憶時，對話只暫存在瀏覽器裡，重新整理頁面就會消失。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-11",
      "text": "建立插件，支援 OSEP 中繼與自己的金鑰兩種連線方式"
    },
    {
      "date": "2026-11-14",
      "text": "積木文字改成跟 OpenAI 插件相近的說法"
    },
    {
      "date": "2026-11-17",
      "text": "積木重新分成五組；卡片改為紫色星空風格"
    }
  ]
});
