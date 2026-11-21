/*
 * 臉部表情辨識 (MediaPipe) 插件說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個插件的積木。
 */
OSEP.addPlugin({
  "id": "faceExpressionMediapipe",
  "name": "臉部表情辨識 (MediaPipe)",
  "nameEn": "Face Expression (MediaPipe)",
  "author": "Andrew Yang",
  "updated": "2026-11-17",
  "tags": [
    "人工智慧",
    "影像",
    "攝影機"
  ],
  "needs": [
    "攝影機",
    "網路"
  ],
  "color": {
    "primary": "#1E9E8F",
    "secondary": "#17857A",
    "tertiary": "#126B62"
  },
  "card": "images/faceExpressionMediapipe/card.png",
  "icon": "images/faceExpressionMediapipe/small.svg",
  "blockIcon": "images/faceExpressionMediapipe/block-icon.svg",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_faceExpressionMediapipe",
  "tagline": "用攝影機辨識表情、臉部動作和頭部角度，做出「看臉色」的互動作品。",
  "overview": "這個插件使用 Google 的 **MediaPipe** 臉部模型，從攝影機畫面找出臉上的 478 個特徵點，再算出：\n\n- **情緒**：平靜、開心、難過、生氣、害怕、厭惡、驚訝，共 7 種\n- **臉部動作**：微笑、張嘴、眨眼、挑眉、嘟嘴、鼓臉頰…等 11 種，每種 0～100\n- **位置與角度**：臉在舞台上的位置、大小，以及左右轉、抬頭、歪頭的角度\n\n可以做表情遊戲、用臉控制角色、眨眼開關、張嘴吃東西、表情計分板等作品。\n\n> 影像只在你的電腦上處理，**不會**上傳。第一次使用需要網路下載模型（約 3.6 MB）。\n\n> ! 情緒是用臉部動作的組合推算出來的，表情做得明顯一點比較容易辨識。光線充足、正對鏡頭效果最好。",
  "highlights": [
    {
      "icon": "😀",
      "title": "7 種情緒",
      "text": "還有「當臉部情緒變成」事件積木，表情一變就觸發。"
    },
    {
      "icon": "😉",
      "title": "11 種臉部動作",
      "text": "眨眼、張嘴、挑眉都有 0～100 的程度，適合做控制器。"
    },
    {
      "icon": "🧭",
      "title": "位置與角度",
      "text": "臉的 x、y 已經換成舞台座標，可以直接讓角色跟著臉移動。"
    },
    {
      "icon": "⚡",
      "title": "用 GPU 加速",
      "text": "支援的電腦會用顯示卡運算，比較順暢；不支援時自動改用 CPU。"
    }
  ],
  "groups": [
    {
      "name": "啟動",
      "intro": "一般只要一塊「開始臉部表情辨識」就能開始，攝影機會自動打開。",
      "blocks": [
        {
          "opcode": "videoToggle",
          "type": "command",
          "text": "視訊設為 [VIDEO_STATE]",
          "textEn": "set video to [VIDEO_STATE]",
          "args": {
            "VIDEO_STATE": {
              "type": "menu",
              "options": [
                "關閉",
                "開啟",
                "翻轉"
              ],
              "value": "開啟",
              "values": [
                "off",
                "on",
                "on-flipped"
              ],
              "optionsEn": [
                "off",
                "on",
                "on flipped"
              ],
              "valueEn": "on",
              "desc": "「開啟」畫面像照鏡子；「翻轉」畫面左右不鏡像；「關閉」關掉攝影機。"
            }
          },
          "summary": "打開、關閉或翻轉攝影機畫面。",
          "detail": "用法和 Scratch 內建「視訊偵測」的同名積木一樣。\n\n不一定要用這塊：[[startRecognition]] 發現視訊沒開時會自動打開。差別是：**自己用這塊打開的視訊**，停止辨識時不會被關掉；由「開始」自動打開的，停止時會一起關掉。",
          "tips": "辨識中把視訊關掉，[[getStatus]] 會顯示「視訊已關閉」；再打開就會自動繼續辨識。"
        },
        {
          "opcode": "startRecognition",
          "type": "command",
          "text": "開始臉部表情辨識",
          "textEn": "start face expression recognition",
          "summary": "載入模型、打開攝影機，開始持續辨識。",
          "detail": "依序做三件事：載入 MediaPipe 模型 → 打開攝影機 → 每一個畫面都辨識一次。\n\n這塊積木會**等到準備好（或失敗）**才往下執行，所以下一塊就能讀到正確的 [[getStatus]]。第一次載入模型大約需要 10 秒。\n\n瀏覽器會詢問是否允許使用攝影機，要按「允許」。",
          "tips": "重複按不會重複載入模型。失敗之後再按一次會重試。"
        },
        {
          "opcode": "getStatus",
          "type": "reporter",
          "text": "辨識狀態",
          "textEn": "recognition status",
          "summary": "目前進行到哪一步，或錯誤原因。",
          "detail": "| 狀態 | 意思 |\n|---|---|\n| 尚未開始 | 還沒按「開始」 |\n| MediaPipe 模型載入中… | 正在下載、準備模型 |\n| 開啟攝影機中… | 等攝影機打開 |\n| 辨識中（GPU）／（CPU） | 正在辨識，括號是使用的運算方式 |\n| 已停止 | 用了 [[stopRecognition]] |\n| 視訊已關閉，請把視訊設為開啟 | 辨識中但攝影機被關掉 |\n| 錯誤：無法開啟攝影機… | 沒有允許攝影機權限，或攝影機被其他程式占用 |\n| 錯誤：無法載入 MediaPipe 程式庫 | 網路問題 |\n| 錯誤：無法載入臉部模型 | 網路問題或模型網址被擋 |",
          "returns": "狀態文字。錯誤時括號內會附上詳細原因。",
          "example": [
            {
              "use": "startRecognition"
            },
            {
              "t": "說出 [M] 持續 [S] 秒",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "getStatus"
                },
                "S": {
                  "num": "2"
                }
              }
            }
          ]
        },
        {
          "opcode": "isFaceDetected",
          "type": "boolean",
          "text": "偵測到臉部?",
          "textEn": "face detected?",
          "summary": "畫面中現在有沒有臉。",
          "detail": "只會辨識**一張臉**。畫面中有好幾個人時，會取模型最先找到的那張。",
          "returns": "有偵測到臉時為 `true`；沒有臉、尚未開始或已停止時為 `false`。"
        }
      ]
    },
    {
      "name": "情緒",
      "intro": "7 種情緒：平靜、開心、難過、生氣、害怕、厭惡、驚訝。選單也可以放變數，填「開心」或英文「happy」都可以。",
      "blocks": [
        {
          "opcode": "whenEmotion",
          "type": "hat",
          "text": "當臉部情緒變成 [EMOTION]",
          "textEn": "when facial emotion becomes [EMOTION]",
          "args": {
            "EMOTION": {
              "type": "menu",
              "options": [
                "平靜",
                "開心",
                "難過",
                "生氣",
                "害怕",
                "厭惡",
                "驚訝"
              ],
              "value": "開心",
              "values": [
                "neutral",
                "happy",
                "sad",
                "angry",
                "fearful",
                "disgusted",
                "surprised"
              ],
              "optionsEn": [
                "neutral",
                "happy",
                "sad",
                "angry",
                "fearful",
                "disgusted",
                "surprised"
              ],
              "valueEn": "happy",
              "acceptReporters": true,
              "desc": "要等待的情緒。"
            }
          },
          "edgeActivated": true,
          "summary": "情緒「變成」選定的那一種時，執行底下的腳本。",
          "detail": "只在情緒**剛變成**這一種的那一刻觸發一次；一直維持同一個表情不會重複觸發。換成別的表情、再變回來，才會再觸發。\n\n要先執行 [[startRecognition]]，這塊才會有作用。"
        },
        {
          "opcode": "isEmotion",
          "type": "boolean",
          "text": "臉部情緒是 [EMOTION]?",
          "textEn": "facial emotion is [EMOTION]?",
          "args": {
            "EMOTION": {
              "type": "menu",
              "options": [
                "平靜",
                "開心",
                "難過",
                "生氣",
                "害怕",
                "厭惡",
                "驚訝"
              ],
              "value": "開心",
              "values": [
                "neutral",
                "happy",
                "sad",
                "angry",
                "fearful",
                "disgusted",
                "surprised"
              ],
              "optionsEn": [
                "neutral",
                "happy",
                "sad",
                "angry",
                "fearful",
                "disgusted",
                "surprised"
              ],
              "valueEn": "happy",
              "acceptReporters": true,
              "desc": "要比較的情緒。"
            }
          },
          "summary": "目前的情緒是不是選定的那一種。",
          "detail": "適合放在「如果」或「等待直到」裡，例如「等待直到 <臉部情緒是 開心?>」。",
          "returns": "是的話為 `true`；不是、或沒有偵測到臉時為 `false`。"
        },
        {
          "opcode": "getEmotion",
          "type": "reporter",
          "text": "臉部情緒",
          "textEn": "facial emotion",
          "summary": "目前分數最高的情緒。",
          "detail": "當其他 6 種情緒都不明顯時，結果是「平靜」。",
          "returns": "情緒名稱，例如「開心」；沒有臉時為「無法偵測到臉部」；尚未開始或已停止時是空的。"
        },
        {
          "opcode": "getConfidence",
          "type": "reporter",
          "text": "臉部表情置信度",
          "textEn": "facial expression confidence",
          "summary": "目前情緒的分數有多高（0～1）。",
          "detail": "就是 [[getEmotion]] 那種情緒的分數。數字越大，代表表情越明顯。",
          "returns": "0～1 的數字，取到小數第二位；沒有臉時為 0。"
        },
        {
          "opcode": "getEmotionScore",
          "type": "reporter",
          "text": "[EMOTION] 的分數",
          "textEn": "score of [EMOTION]",
          "args": {
            "EMOTION": {
              "type": "menu",
              "options": [
                "平靜",
                "開心",
                "難過",
                "生氣",
                "害怕",
                "厭惡",
                "驚訝"
              ],
              "value": "開心",
              "values": [
                "neutral",
                "happy",
                "sad",
                "angry",
                "fearful",
                "disgusted",
                "surprised"
              ],
              "optionsEn": [
                "neutral",
                "happy",
                "sad",
                "angry",
                "fearful",
                "disgusted",
                "surprised"
              ],
              "valueEn": "happy",
              "acceptReporters": true,
              "desc": "要查分數的情緒。"
            }
          },
          "summary": "某一種情緒的分數（0～100）。",
          "detail": "每一種情緒都有自己的分數，可以拿來做「表情量表」、比較兩種情緒，或用分數門檻自己決定何時觸發（例如「開心的分數 > 80」才算大笑）。",
          "returns": "0～100 的整數；沒有臉時為 0。"
        }
      ]
    },
    {
      "name": "臉部動作與位置",
      "intro": "不判斷情緒，直接讀臉部各部位的動作程度、位置和角度。很適合拿來做「用臉玩的遊戲」。",
      "blocks": [
        {
          "opcode": "getAction",
          "type": "reporter",
          "text": "[ACTION] 的程度",
          "textEn": "[ACTION] amount",
          "args": {
            "ACTION": {
              "type": "menu",
              "options": [
                "微笑",
                "張嘴",
                "閉左眼",
                "閉右眼",
                "挑眉",
                "皺眉",
                "嘟嘴",
                "鼓臉頰",
                "皺鼻子",
                "嘴角下垂",
                "眼睛睜大"
              ],
              "value": "微笑",
              "values": [
                "smile",
                "mouthOpen",
                "leftEyeClosed",
                "rightEyeClosed",
                "browUp",
                "browDown",
                "pucker",
                "cheekPuff",
                "noseSneer",
                "mouthFrown",
                "eyeWide"
              ],
              "optionsEn": [
                "smile",
                "mouth open",
                "left eye closed",
                "right eye closed",
                "eyebrows raised",
                "eyebrows lowered",
                "pucker lips",
                "cheek puff",
                "nose wrinkle",
                "mouth corners down",
                "eyes wide open"
              ],
              "valueEn": "smile",
              "acceptReporters": true,
              "desc": "要讀取的臉部動作。"
            }
          },
          "summary": "某個臉部動作做得多明顯（0～100）。",
          "detail": "0 代表完全沒有做這個動作，100 代表做到最大。常見用法：\n\n- 張嘴的程度 > 50 → 角色吃東西\n- 閉左眼、閉右眼 → 眨眼控制開關\n- 挑眉的程度 → 控制角色跳多高",
          "returns": "0～100 的整數；沒有臉時為 0。",
          "tips": "「左眼」「右眼」是**被拍的人自己的**左右，不是畫面上的左右。",
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
                      "t": "[A] > [B]",
                      "cat": "operators",
                      "type": "boolean",
                      "args": {
                        "A": {
                          "use": "getAction",
                          "args": {
                            "ACTION": {
                              "v": "張嘴",
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
                      "t": "造型換成 [X]",
                      "cat": "looks",
                      "args": {
                        "X": {
                          "v": "張嘴",
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
                          "v": "閉嘴",
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
          "opcode": "getFaceProp",
          "type": "reporter",
          "text": "臉部 [PROP]",
          "textEn": "face [PROP]",
          "args": {
            "PROP": {
              "type": "menu",
              "options": [
                "x 座標",
                "y 座標",
                "寬度",
                "高度",
                "左右轉角度",
                "上下抬頭角度",
                "歪頭角度"
              ],
              "value": "x 座標",
              "values": [
                "x",
                "y",
                "width",
                "height",
                "yaw",
                "pitch",
                "roll"
              ],
              "optionsEn": [
                "x",
                "y",
                "width",
                "height",
                "turn left/right (°)",
                "look up/down (°)",
                "tilt (°)"
              ],
              "valueEn": "x",
              "acceptReporters": true,
              "desc": "要讀取的位置或角度。"
            }
          },
          "summary": "臉在舞台上的位置、大小與頭部角度。",
          "detail": "| 選項 | 範圍與單位 |\n|---|---|\n| x 座標、y 座標 | 臉的中心點，已換成舞台座標（x：-240～240，y：-180～180） |\n| 寬度、高度 | 臉在舞台上的大小。離鏡頭越近越大 |\n| 左右轉角度 | 頭往左右轉的角度（度），正面約 0 |\n| 上下抬頭角度 | 抬頭為正、低頭為負（度） |\n| 歪頭角度 | 頭往左右肩膀傾斜的角度（度） |\n\nx 座標和角度會配合視訊是否鏡像，和舞台上看到的畫面一致。角度是用特徵點估算的大約值。",
          "returns": "數字；沒有臉時為 0。",
          "tips": "每個人、每台攝影機的數字不太一樣，建議先用「說出」看看自己轉頭時的數值，再決定要用多少當門檻。"
        },
        {
          "opcode": "getBlendshape",
          "type": "reporter",
          "text": "表情係數 [NAME] 的值",
          "textEn": "blendshape [NAME] value",
          "args": {
            "NAME": {
              "type": "string",
              "value": "jawOpen",
              "desc": "MediaPipe 的係數名稱，例如 `jawOpen`、`mouthSmileLeft`、`eyeBlinkRight`、`browInnerUp`。大小寫要完全正確。"
            }
          },
          "hidden": true,
          "summary": "進階：讀取 MediaPipe 原始的 52 個表情係數。",
          "detail": "這塊積木**已在積木區隱藏**（2026-11-17），但功能保留，用過它的舊專案仍然可以執行。\n\n大部分情況用 [[getAction]] 就夠了。這塊給想研究原始數據的進階使用者。",
          "returns": "0～1 的數字（小數第三位）；名稱打錯或沒有臉時為 0。"
        }
      ]
    },
    {
      "name": "結束",
      "intro": "",
      "blocks": [
        {
          "opcode": "stopRecognition",
          "type": "command",
          "text": "停止臉部表情辨識",
          "textEn": "stop face expression recognition",
          "summary": "停止辨識，所有數值歸零。",
          "detail": "停止後 [[getStatus]] 顯示「已停止」，情緒、動作、位置都回到 0 或空白。如果攝影機是 [[startRecognition]] 自動打開的，會一起關掉；自己用 [[videoToggle]] 打開的則保持開啟。"
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "表情變變變",
      "intro": "角色跟著你的表情換造型。三段腳本放在同一個角色裡。",
      "script": [
        [
          {
            "t": "當 🏁 被點擊",
            "cat": "events",
            "type": "hat"
          },
          {
            "use": "startRecognition"
          }
        ],
        [
          {
            "use": "whenEmotion",
            "args": {
              "EMOTION": {
                "v": "開心",
                "menu": true
              }
            }
          },
          {
            "t": "造型換成 [X]",
            "cat": "looks",
            "args": {
              "X": {
                "v": "笑臉",
                "menu": true
              }
            }
          }
        ],
        [
          {
            "use": "whenEmotion",
            "args": {
              "EMOTION": {
                "v": "驚訝",
                "menu": true
              }
            }
          },
          {
            "t": "造型換成 [X]",
            "cat": "looks",
            "args": {
              "X": {
                "v": "嚇一跳",
                "menu": true
              }
            }
          },
          {
            "t": "播放音效 [S]",
            "cat": "sound",
            "args": {
              "S": {
                "v": "哇",
                "menu": true
              }
            }
          }
        ]
      ]
    },
    {
      "title": "用臉控制角色",
      "intro": "角色跟著臉移動，歪頭時角色也跟著轉。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "startRecognition"
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
                  "use": "isFaceDetected"
                }
              },
              "body": [
                {
                  "t": "定位到 x: [X] y: [Y]",
                  "cat": "motion",
                  "args": {
                    "X": {
                      "use": "getFaceProp",
                      "args": {
                        "PROP": {
                          "v": "x 座標",
                          "menu": true
                        }
                      }
                    },
                    "Y": {
                      "use": "getFaceProp",
                      "args": {
                        "PROP": {
                          "v": "y 座標",
                          "menu": true
                        }
                      }
                    }
                  }
                },
                {
                  "t": "面朝 [D] 度",
                  "cat": "motion",
                  "args": {
                    "D": {
                      "t": "[A] + [B]",
                      "cat": "operators",
                      "type": "reporter",
                      "args": {
                        "A": {
                          "num": "90"
                        },
                        "B": {
                          "use": "getFaceProp",
                          "args": {
                            "PROP": {
                              "v": "歪頭角度",
                              "menu": true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ],
      "explain": "加上「如果 <偵測到臉部?>」，臉離開畫面時角色會停在原地，而不是跳回中心 (0, 0)。"
    },
    {
      "title": "眨眼拍照計分",
      "intro": "每閉一次右眼得 1 分；用「等待直到」確保要睜開眼才算下一次。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "t": "變數 [V] 設為 [N]",
          "cat": "data",
          "args": {
            "V": {
              "v": "分數",
              "menu": true
            },
            "N": {
              "num": "0"
            }
          }
        },
        {
          "use": "startRecognition"
        },
        {
          "t": "重複無限次",
          "cat": "control",
          "type": "c",
          "body": [
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
                      "use": "getAction",
                      "args": {
                        "ACTION": {
                          "v": "閉右眼",
                          "menu": true
                        }
                      }
                    },
                    "B": {
                      "num": "60"
                    }
                  }
                }
              }
            },
            {
              "t": "變數 [V] 改變 [N]",
              "cat": "data",
              "args": {
                "V": {
                  "v": "分數",
                  "menu": true
                },
                "N": {
                  "num": "1"
                }
              }
            },
            {
              "t": "等待直到 [C]",
              "cat": "control",
              "args": {
                "C": {
                  "t": "[A] < [B]",
                  "cat": "operators",
                  "type": "boolean",
                  "args": {
                    "A": {
                      "use": "getAction",
                      "args": {
                        "ACTION": {
                          "v": "閉右眼",
                          "menu": true
                        }
                      }
                    },
                    "B": {
                      "num": "30"
                    }
                  }
                }
              }
            }
          ]
        }
      ],
      "explain": "用 60 和 30 兩個不同門檻，可以避免數值在門檻附近跳動時被重複計分。"
    }
  ],
  "faq": [
    {
      "q": "出現「錯誤：無法開啟攝影機」？",
      "a": "- 網址列旁的攝影機圖示，改成「允許」後重新整理\n- 關掉其他正在使用攝影機的程式（視訊會議、相機 App）\n- 電腦有多個攝影機時，在 OSEP 介面選擇要用的攝影機"
    },
    {
      "q": "表情辨識不準？",
      "a": "- 光線要充足，臉不要背光\n- 正對鏡頭，臉不要太小（離鏡頭近一點）\n- 表情做明顯一點\n- 需要精準判斷時，改用 [[getEmotionScore]] 或 [[getAction]] 搭配自己訂的門檻"
    },
    {
      "q": "和舊的「臉部表情辨識」插件有什麼不同？",
      "a": "舊插件使用 face-api.js，只有情緒和置信度。這個新插件使用 MediaPipe，多了事件積木、各情緒分數、11 種臉部動作、臉部位置與頭部角度。兩個插件可以同時存在，舊作品不受影響。"
    },
    {
      "q": "可以同時辨識好幾個人嗎？",
      "a": "目前只辨識一張臉。"
    },
    {
      "q": "需要網路嗎？",
      "a": "需要。程式庫從 jsDelivr 下載、模型從 Google 下載（約 3.6 MB）。影像本身不會上傳。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-12",
      "text": "建立插件（MediaPipe Face Landmarker）"
    },
    {
      "date": "2026-11-17",
      "text": "積木依使用流程分成四組；隱藏「表情係數」積木；卡片改為紫色星空風格"
    }
  ]
});
