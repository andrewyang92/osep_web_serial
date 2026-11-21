/*
 * TM2Scratch 擴充功能說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從擴充功能原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個擴充功能的積木。
 */
OSEP.addPlugin({
  "id": "tm2scratch",
  "name": "TM2Scratch",
  "nameEn": "TM2Scratch",
  "author": "Tsukurusha、YengawaLab、Google",
  "updated": "2026-11-22",
  "tags": [
    "人工智慧",
    "影像",
    "攝影機",
    "聲音"
  ],
  "needs": [
    "網路",
    "攝影機",
    "麥克風（聲音模型）"
  ],
  "color": {
    "primary": "#4C97FF",
    "secondary": "#4C97FF",
    "tertiary": "#3373CC"
  },
  "card": "images/tm2scratch/card.png",
  "icon": "images/tm2scratch/small.png",
  "blockIcon": "images/tm2scratch/block-icon.png",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_tm2scratch",
  "tagline": "把在 Teachable Machine 訓練好的圖像、聲音模型放進 Scratch，讓角色認得你教它的東西。",
  "overview": "Google 的 **Teachable Machine**（teachablemachine.withgoogle.com）可以不寫程式就訓練 AI：拍幾十張「剪刀」「石頭」「布」的照片，或錄幾段「拍手」「吹口哨」的聲音，它就學會分辨。這個擴充功能把訓練好的模型接到 Scratch。\n\n### 使用步驟\n- 到 Teachable Machine 建立 **Image Project**（圖像）或 **Audio Project**（聲音）\n- 每個類別（Class）取名字、拍照或錄音，按 **Train Model** 訓練\n- 按 **Export Model** → **Upload（shareable link）** 上傳，複製得到的網址（`https://teachablemachine.withgoogle.com/models/…/`）\n- 在 Scratch 用 [[setImageClassificationModelURL]] 或 [[setSoundClassificationModelURL]] 貼上網址\n\n模型載入後，擴充功能會一直用攝影機（或麥克風）辨識，標籤選單會出現你取的類別名稱。\n\n> 擴充功能一載入就會打開攝影機。辨識在你的瀏覽器裡進行，影像和聲音不會上傳；模型是從 Teachable Machine 下載的。\n\n擴充功能原始作者：Tsukurusha、YengawaLab、Google。",
  "groups": [
    {
      "name": "圖像辨識",
      "intro": "先用 [[setImageClassificationModelURL]] 載入圖像模型。之後擴充功能會自動、持續辨識攝影機畫面。",
      "blocks": [
        {
          "opcode": "whenReceived",
          "type": "hat",
          "text": "接收到影像標籤:[LABEL]時",
          "textEn": "when received image label:[LABEL]",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "任何",
              "valueEn": "any",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要等待的類別。「任何」代表辨識到任何一個類別都算。"
            }
          },
          "summary": "辨識結果「變成」這個類別時，執行底下的腳本。",
          "detail": "結果從別的類別變成這個類別的那一刻觸發一次；一直維持同一個類別不會重複觸發。"
        },
        {
          "opcode": "isImageLabelDetected",
          "type": "boolean",
          "text": "影像[LABEL]被偵測？",
          "textEn": "image [LABEL] detected",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "任何",
              "valueEn": "any",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要檢查的類別，或「任何」。"
            }
          },
          "summary": "目前的辨識結果是不是這個類別。",
          "returns": "是的話為 `true`，否則為 `false`。",
          "detail": ""
        },
        {
          "opcode": "imageLabelConfidence",
          "type": "reporter",
          "text": "影像置信度[LABEL]",
          "textEn": "confidence of image [LABEL]",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要查的類別。"
            }
          },
          "summary": "某個類別在最近一次辨識中的置信度。",
          "returns": "0～1 的數字，越接近 1 代表越像。兩次辨識之間有時會是 0。",
          "detail": ""
        },
        {
          "opcode": "setImageClassificationModelURL",
          "type": "command",
          "text": "影像分類模型網址[URL]",
          "textEn": "image classification model URL [URL]",
          "args": {
            "URL": {
              "type": "string",
              "value": "https://teachablemachine.withgoogle.com/models/QpU-E7V1C/",
              "desc": "Teachable Machine 上傳後得到的模型網址，結尾要有 `/`。預設是一個示範模型。"
            }
          },
          "summary": "載入 Teachable Machine 的圖像模型。",
          "detail": "這塊積木會**等模型載入完成**才往下執行。同一個網址、模型沒有更新時，不會重複下載。在 Teachable Machine 重新訓練、再上傳到同一個網址後，再執行一次就會換成新模型。",
          "tips": "網址錯誤時不會有任何提示，只是標籤選單不會出現你的類別。"
        },
        {
          "opcode": "classifyVideoImageBlock",
          "type": "command",
          "text": "影像分類",
          "textEn": "classify image",
          "summary": "馬上辨識一次攝影機畫面。",
          "detail": "用 [[toggleClassification]] 關掉自動辨識時，用這塊自己決定什麼時候辨識，例如按下空白鍵才辨識一次。"
        },
        {
          "opcode": "getImageLabel",
          "type": "reporter",
          "text": "影像標籤",
          "textEn": "image label",
          "summary": "圖像辨識的結果（最像的類別）。",
          "returns": "類別名稱。最像的類別置信度低於閾值時，是「低於置信度閥值」；還沒辨識過時是空的。",
          "detail": ""
        }
      ]
    },
    {
      "name": "聲音辨識",
      "intro": "先用 [[setSoundClassificationModelURL]] 載入聲音模型，擴充功能會開始用麥克風持續辨識。",
      "blocks": [
        {
          "opcode": "whenReceivedSoundLabel",
          "type": "hat",
          "text": "接收到聲音標籤[LABEL]時",
          "textEn": "when received sound label:[LABEL]",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "任何",
              "valueEn": "any",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要等待的類別，或「任何」。"
            }
          },
          "summary": "聲音辨識結果「變成」這個類別時，執行底下的腳本。",
          "detail": ""
        },
        {
          "opcode": "isSoundLabelDetected",
          "type": "boolean",
          "text": "聲音[LABEL]被偵測？",
          "textEn": "sound [LABEL] detected",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "任何",
              "valueEn": "any",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要檢查的類別，或「任何」。"
            }
          },
          "summary": "目前的聲音辨識結果是不是這個類別。",
          "returns": "是的話為 `true`，否則為 `false`。",
          "detail": ""
        },
        {
          "opcode": "soundLabelConfidence",
          "type": "reporter",
          "text": "聲音置信度[LABEL]",
          "textEn": "confidence of sound [LABEL]",
          "args": {
            "LABEL": {
              "type": "menu",
              "value": "",
              "dynamic": true,
              "acceptReporters": true,
              "desc": "要查的類別。"
            }
          },
          "summary": "某個聲音類別的置信度。",
          "returns": "0～1 的數字。",
          "detail": ""
        },
        {
          "opcode": "setSoundClassificationModelURL",
          "type": "command",
          "text": "聲音分類模型網址[URL]",
          "textEn": "sound classification model URL [URL]",
          "args": {
            "URL": {
              "type": "string",
              "value": "https://teachablemachine.withgoogle.com/models/RydwAtgBB/",
              "desc": "Teachable Machine 聲音模型的網址，結尾要有 `/`。預設是一個示範模型。"
            }
          },
          "summary": "載入 Teachable Machine 的聲音模型，開始聽。",
          "detail": "會等模型載入完成才往下執行。瀏覽器會詢問是否允許使用麥克風，要按「允許」。",
          "tips": "聲音模型的第一個類別是「背景噪音」（Background Noise），安靜時結果通常是它。"
        },
        {
          "opcode": "getSoundLabel",
          "type": "reporter",
          "text": "聲音標籤",
          "textEn": "sound label",
          "summary": "聲音辨識的結果（最像的類別）。",
          "returns": "類別名稱；置信度低於閾值時是「低於置信度閥值」。",
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
          "detail": "預設是**開啟**。關閉後圖像和聲音都不再自動辨識，可以用 [[classifyVideoImageBlock]] 自己辨識圖像。"
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
          "detail": "預設 1 秒。間隔越短反應越快，但電腦比較忙。"
        },
        {
          "opcode": "setConfidenceThreshold",
          "type": "command",
          "text": "設定置信度閾值[CONFIDENCE_THRESHOLD]",
          "textEn": "set confidence threshold [CONFIDENCE_THRESHOLD]",
          "args": {
            "CONFIDENCE_THRESHOLD": {
              "type": "number",
              "value": "0.5",
              "desc": "0～1，預設 0.5。"
            }
          },
          "summary": "設定置信度閾值：最像的類別要超過多少才算數。",
          "detail": "閾值越高越不容易認錯，但比較容易出現「低於置信度閥值」。"
        },
        {
          "opcode": "getConfidenceThreshold",
          "type": "reporter",
          "text": "置信度閾值",
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
                "翻轉"
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
              "desc": "「開啟」畫面像照鏡子；「翻轉」不鏡像；「關閉」不在舞台上顯示。"
            }
          },
          "summary": "設定舞台上要不要顯示攝影機畫面。",
          "detail": "只影響舞台上看不看得到。擴充功能自己另外開了攝影機做辨識，所以關閉後辨識照樣進行。"
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "剪刀石頭布",
      "intro": "在 Teachable Machine 訓練「剪刀」「石頭」「布」三個類別，角色出拳並判斷輸贏。",
      "script": [
        [
          {
            "t": "當 🏁 被點擊",
            "cat": "events",
            "type": "hat"
          },
          {
            "use": "setImageClassificationModelURL",
            "args": {
              "URL": "https://teachablemachine.withgoogle.com/models/你的模型/"
            }
          },
          {
            "use": "setConfidenceThreshold",
            "args": {
              "CONFIDENCE_THRESHOLD": {
                "num": "0.8"
              }
            }
          },
          {
            "t": "說出 [M]",
            "cat": "looks",
            "args": {
              "M": "準備好了，出拳吧！"
            }
          }
        ],
        [
          {
            "use": "whenReceived",
            "args": {
              "LABEL": {
                "v": "石頭",
                "menu": true
              }
            }
          },
          {
            "t": "造型換成 [X]",
            "cat": "looks",
            "args": {
              "X": {
                "v": "布",
                "menu": true
              }
            }
          },
          {
            "t": "說出 [M] 持續 [S] 秒",
            "cat": "looks",
            "args": {
              "M": "我出布，我贏了！",
              "S": {
                "num": "2"
              }
            }
          }
        ]
      ],
      "explain": "另外兩個類別照樣各寫一段。閾值調到 0.8，手還沒擺好時比較不會誤判。"
    },
    {
      "title": "拍手開燈",
      "intro": "聲音模型訓練「背景噪音」和「拍手」，拍手時舞台變亮。",
      "script": [
        [
          {
            "t": "當 🏁 被點擊",
            "cat": "events",
            "type": "hat"
          },
          {
            "use": "setSoundClassificationModelURL",
            "args": {
              "URL": "https://teachablemachine.withgoogle.com/models/你的模型/"
            }
          }
        ],
        [
          {
            "use": "whenReceivedSoundLabel",
            "args": {
              "LABEL": {
                "v": "拍手",
                "menu": true
              }
            }
          },
          {
            "t": "將 [E] 特效改變 [N]",
            "cat": "looks",
            "args": {
              "E": {
                "v": "亮度",
                "menu": true
              },
              "N": {
                "num": "20"
              }
            }
          }
        ]
      ]
    },
    {
      "title": "按空白鍵才辨識",
      "intro": "關掉自動辨識，按一次空白鍵辨識一次，並說出結果和置信度。",
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
          "use": "toggleClassification",
          "args": {
            "CLASSIFICATION_STATE": {
              "v": "關閉",
              "menu": true
            }
          }
        },
        {
          "use": "classifyVideoImageBlock"
        },
        {
          "t": "說出 [M]",
          "cat": "looks",
          "args": {
            "M": {
              "use": "getImageLabel"
            }
          }
        }
      ]
    }
  ],
  "faq": [
    {
      "q": "標籤選單裡沒有我的類別？",
      "a": "- 模型還沒載入完成，或網址錯誤（網址結尾要有 `/`）\n- 在 Teachable Machine 要按 Export Model → Upload，拿上傳後的網址，不是專案頁的網址\n- 載入後點開選單才會更新"
    },
    {
      "q": "辨識不準？",
      "a": "- 每個類別多拍一些、角度和光線多一點變化\n- 加一個「沒有東西」的類別，畫面空空時才不會亂猜\n- 用「設定置信度閾值」調高門檻"
    },
    {
      "q": "一直顯示「低於置信度閥值」？",
      "a": "最像的類別也沒有超過閾值。可以把閾值調低，或回 Teachable Machine 多收集一些資料再訓練。"
    },
    {
      "q": "和 TMPose2Scratch 有什麼不同？",
      "a": "TM2Scratch 是看整張圖像（和聲音），TMPose2Scratch 是看人的身體姿勢（骨架）。動作類的作品用 TMPose2Scratch 比較準。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-22",
      "text": "建立說明頁"
    }
  ]
});
