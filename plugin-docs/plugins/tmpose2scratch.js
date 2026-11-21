/*
 * TMPose2Scratch 擴充功能說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從擴充功能原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個擴充功能的積木。
 */
OSEP.addPlugin({
  "id": "tmpose2scratch",
  "name": "TMPose2Scratch",
  "nameEn": "TMPose2Scratch",
  "author": "Tsukurusha、YengawaLab、Google",
  "updated": "2026-11-22",
  "tags": [
    "人工智慧",
    "影像",
    "攝影機"
  ],
  "needs": [
    "網路",
    "攝影機"
  ],
  "color": {
    "primary": "#4C97FF",
    "secondary": "#4C97FF",
    "tertiary": "#3373CC"
  },
  "card": "images/tmpose2scratch/card.png",
  "icon": "images/tmpose2scratch/small.png",
  "blockIcon": "images/tmpose2scratch/block-icon.png",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_tmpose2scratch",
  "tagline": "把在 Teachable Machine 訓練好的姿勢模型放進 Scratch，用身體動作控制作品。",
  "overview": "Google 的 **Teachable Machine** 可以訓練「姿勢」模型：對著攝影機擺幾個動作（例如舉左手、舉右手、蹲下），每個動作拍一些樣本，它就學會分辨。這個擴充功能把訓練好的姿勢模型接到 Scratch。\n\n和看整張畫面的圖像模型（TM2Scratch）不同，姿勢模型只看身體骨架的位置，比較不受背景和衣服影響。\n\n### 使用步驟\n- 到 Teachable Machine 建立 **Pose Project**\n- 每個類別取名字、對著攝影機擺動作收集樣本，按 **Train Model** 訓練\n- 按 **Export Model** → **Upload（shareable link）**，複製得到的網址\n- 在 Scratch 用 [[setPoseClassificationModelURL]] 貼上網址\n\n> 擴充功能一載入就會打開攝影機（鏡像）。辨識在你的瀏覽器裡進行，影像不會上傳；模型與程式庫是從網路下載的。\n\n擴充功能原始作者：Tsukurusha、YengawaLab、Google。",
  "groups": [
    {
      "name": "姿勢辨識",
      "intro": "先用 [[setPoseClassificationModelURL]] 載入模型。之後擴充功能會自動、持續辨識攝影機畫面中的姿勢。",
      "blocks": [
        {
          "opcode": "whenPoseLabelReceived",
          "type": "hat",
          "text": "接收到姿勢標籤[LABEL]時",
          "textEn": "when received pose label:[LABEL]",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "任何",
              "valueEn": "any",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要等待的姿勢類別。「任何」代表辨識到任何一個類別都算。"
            }
          },
          "summary": "辨識到這個姿勢時，執行底下的腳本。",
          "detail": "每次辨識之間結果會短暫清空，所以一直維持同一個姿勢時，大約每個辨識間隔（預設 1 秒）會再觸發一次。"
        },
        {
          "opcode": "isPoseLabelDetected",
          "type": "boolean",
          "text": "姿勢[LABEL]被偵測？",
          "textEn": "pose [LABEL] detected",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "任何",
              "valueEn": "any",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要檢查的姿勢類別，或「任何」。"
            }
          },
          "summary": "目前辨識到的是不是這個姿勢。",
          "returns": "是的話為 `true`，否則為 `false`。",
          "detail": ""
        },
        {
          "opcode": "poseLabelConfidence",
          "type": "reporter",
          "text": "姿勢[LABEL]置信度",
          "textEn": "confidence of pose [LABEL]",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要查的姿勢類別。"
            }
          },
          "summary": "某個姿勢在最近一次辨識中的置信度。",
          "returns": "0～1 的數字。兩次辨識之間有時會是 0。",
          "detail": ""
        },
        {
          "opcode": "setPoseClassificationModelURL",
          "type": "command",
          "text": "姿勢分類模型網址[URL]",
          "textEn": "pose classification model URL [URL]",
          "args": {
            "URL": {
              "type": "string",
              "value": "https://teachablemachine.withgoogle.com/models/aqQcgCOtq/",
              "valueEn": " ",
              "desc": "Teachable Machine 上傳後得到的姿勢模型網址，結尾要有 `/`。中文介面預設是一個示範模型。"
            }
          },
          "summary": "載入 Teachable Machine 的姿勢模型。",
          "detail": "會等模型載入完成才往下執行。同一個網址、模型沒有更新時不會重複下載。",
          "tips": "網址錯誤時不會有提示，只是標籤選單不會出現你的類別。"
        },
        {
          "opcode": "classifyVideoPoseBlock",
          "type": "command",
          "text": "判斷姿勢",
          "textEn": "estimate pose",
          "summary": "馬上辨識一次攝影機畫面中的姿勢。",
          "detail": "用 [[toggleClassification]] 關掉自動辨識時，用這塊自己決定什麼時候辨識。"
        },
        {
          "opcode": "getPoseLabel",
          "type": "reporter",
          "text": "姿勢標籤",
          "textEn": "pose label",
          "summary": "辨識到的姿勢（最像的類別）。",
          "returns": "類別名稱。置信度低於閾值、還沒辨識或兩次辨識之間時是空的。",
          "detail": ""
        }
      ]
    },
    {
      "name": "設定",
      "intro": "",
      "blocks": [
        {
          "opcode": "toggleClassification",
          "type": "command",
          "text": "[CLASSIFICATION_STATE]分類",
          "textEn": "turn classification [CLASSIFICATION_STATE]",
          "args": {
            "CLASSIFICATION_STATE": {
              "type": "menu",
              "options": [
                "關閉",
                "開啟"
              ],
              "value": "關閉",
              "values": [
                "off",
                "on"
              ],
              "optionsEn": [
                "off",
                "on"
              ],
              "valueEn": "off",
              "desc": "開啟或關閉自動辨識。"
            }
          },
          "summary": "開啟或關閉自動辨識。",
          "detail": "預設是**開啟**。"
        },
        {
          "opcode": "setClassificationInterval",
          "type": "command",
          "text": "每隔[CLASSIFICATION_INTERVAL]秒標記一次",
          "textEn": "Label once every [CLASSIFICATION_INTERVAL] seconds",
          "args": {
            "CLASSIFICATION_INTERVAL": {
              "type": "menu",
              "options": [
                "1",
                "0.5",
                "0.2",
                "0.1"
              ],
              "value": "1",
              "values": [
                "1",
                "0.5",
                "0.2",
                "0.1"
              ],
              "optionsEn": [
                "1",
                "0.5",
                "0.2",
                "0.1"
              ],
              "acceptReporters": true,
              "desc": "1、0.5、0.2 或 0.1 秒。"
            }
          },
          "summary": "設定多久辨識一次。",
          "detail": "預設 1 秒。做動作遊戲時調到 0.2 秒，反應比較快。"
        },
        {
          "opcode": "setConfidenceThreshold",
          "type": "command",
          "text": "設定置信度閥值 [CONFIDENCE_THRESHOLD]",
          "textEn": "set confidence threshold [CONFIDENCE_THRESHOLD]",
          "args": {
            "CONFIDENCE_THRESHOLD": {
              "type": "number",
              "value": "0.5",
              "desc": "0～1，預設 0.5。"
            }
          },
          "summary": "設定置信度閾值：最像的姿勢要超過多少才算數。",
          "detail": ""
        },
        {
          "opcode": "getConfidenceThreshold",
          "type": "reporter",
          "text": "置信度閥值",
          "textEn": "confidence threshold",
          "summary": "目前的置信度閾值。",
          "returns": "0～1 的數字。",
          "detail": ""
        },
        {
          "opcode": "videoToggle",
          "type": "command",
          "text": "視訊設為[VIDEO_STATE]",
          "textEn": "turn video [VIDEO_STATE]",
          "args": {
            "VIDEO_STATE": {
              "type": "menu",
              "options": [
                "關閉",
                "開啟",
                "左右反轉"
              ],
              "value": "關閉",
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
              "valueEn": "off",
              "desc": "「開啟」畫面像照鏡子；「左右反轉」不鏡像；「關閉」讓攝影機畫面變透明。"
            }
          },
          "summary": "設定舞台上攝影機畫面的顯示方式。",
          "detail": "「關閉」只是把畫面變成完全透明，攝影機還開著，辨識照樣進行。"
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "舉手控制角色",
      "intro": "訓練「舉左手」「舉右手」「站好」三個姿勢，角色跟著左右移動。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "setPoseClassificationModelURL",
          "args": {
            "URL": "https://teachablemachine.withgoogle.com/models/你的模型/"
          }
        },
        {
          "use": "setClassificationInterval",
          "args": {
            "CLASSIFICATION_INTERVAL": {
              "v": "0.2",
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
                  "use": "isPoseLabelDetected",
                  "args": {
                    "LABEL": {
                      "v": "舉左手",
                      "menu": true
                    }
                  }
                }
              },
              "body": [
                {
                  "t": "x 改變 [N]",
                  "cat": "motion",
                  "args": {
                    "N": {
                      "num": "-5"
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
                  "use": "isPoseLabelDetected",
                  "args": {
                    "LABEL": {
                      "v": "舉右手",
                      "menu": true
                    }
                  }
                }
              },
              "body": [
                {
                  "t": "x 改變 [N]",
                  "cat": "motion",
                  "args": {
                    "N": {
                      "num": "5"
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
      "title": "深蹲計數",
      "intro": "訓練「站」「蹲」兩個姿勢；從蹲變回站算一下。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "setPoseClassificationModelURL",
          "args": {
            "URL": "https://teachablemachine.withgoogle.com/models/你的模型/"
          }
        },
        {
          "t": "變數 [V] 設為 [N]",
          "cat": "data",
          "args": {
            "V": {
              "v": "次數",
              "menu": true
            },
            "N": {
              "num": "0"
            }
          }
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
                  "use": "isPoseLabelDetected",
                  "args": {
                    "LABEL": {
                      "v": "蹲",
                      "menu": true
                    }
                  }
                }
              }
            },
            {
              "t": "等待直到 [C]",
              "cat": "control",
              "args": {
                "C": {
                  "use": "isPoseLabelDetected",
                  "args": {
                    "LABEL": {
                      "v": "站",
                      "menu": true
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
                  "v": "次數",
                  "menu": true
                },
                "N": {
                  "num": "1"
                }
              }
            },
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "t": "次數",
                  "cat": "data",
                  "type": "reporter"
                }
              }
            }
          ]
        }
      ],
      "explain": "用兩個「等待直到」，一定要先蹲下再站起來才算一次。"
    }
  ],
  "faq": [
    {
      "q": "標籤選單裡沒有我的類別？",
      "a": "- 模型還沒載入完成，或網址錯誤（結尾要有 `/`）\n- 要用 Export Model → Upload 之後得到的網址\n- 載入後點開選單才會更新"
    },
    {
      "q": "辨識不準？",
      "a": "- 全身（至少上半身）要在畫面內\n- 每個姿勢多收集一些樣本，站的位置、距離多一點變化\n- 用「設定置信度閾值」調高門檻"
    },
    {
      "q": "一開始很慢、或沒有反應？",
      "a": "擴充功能載入時要從網路下載 TensorFlow 和 Teachable Machine 的程式庫，網路慢時要等比較久。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    }
  ]
});
