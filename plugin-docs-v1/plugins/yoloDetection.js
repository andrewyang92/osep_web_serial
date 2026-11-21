/*
 * YOLO 物件辨識 插件說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、[[opcode]]=連到這個插件的積木。
 */
OSEP.addPlugin({
  "id": "yoloDetection",
  "name": "YOLO 物件辨識",
  "nameEn": "YOLO Object Detection",
  "author": "Andrew Yang",
  "updated": "2026-11-21",
  "tags": [
    "人工智慧",
    "影像",
    "攝影機"
  ],
  "needs": [
    "網路",
    "攝影機（辨識視訊時）"
  ],
  "color": {
    "primary": "#6A35D9",
    "secondary": "#5A2CBA",
    "tertiary": "#4A249A"
  },
  "card": "images/yoloDetection/card.png",
  "icon": "images/yoloDetection/small.svg",
  "blockIcon": "images/yoloDetection/block-icon.svg",
  "source": "../node_modules/scratch-vm/src/extensions/scratch3_yoloDetection",
  "tagline": "用 YOLO 找出圖片、舞台或攝影機畫面裡的人、動物和物品，還能知道它們在哪裡。",
  "overview": "YOLO（You Only Look Once）是一種很快的物件辨識 AI：看一眼畫面，就把裡面的東西一個一個框出來，告訴你**是什麼**、**有多確定**、**在哪裡**。\n\n這個插件用的是 **YOLOX** 模型，認得 80 種常見的東西，例如人、貓、狗、汽車、腳踏車、杯子、手機、香蕉。可以辨識四種來源：\n\n- 攝影機視訊（一直辨識）：[[startVideo]]\n- 舞台畫面：[[detectStage]]\n- 網路上的圖片：[[detectUrl]]\n- 電腦裡的圖片檔：[[detectFile]]\n\n辨識到的東西會在舞台上畫框，座標已經換成舞台座標，可以直接讓角色跑到物件的位置。適合做「找到貓就叫一聲」、數人數、整理物品清單、躲貓貓遊戲等作品。\n\n> 辨識在你的瀏覽器裡進行，影像**不會**上傳。第一次使用要下載模型（快速 3.7 MB、準確 20.2 MB）和執行程式庫。\n\n### 兩種模型\n| 模型 | 大小 | 適合 |\n|---|---|---|\n| 快速（YOLOX-Nano，預設） | 3.7 MB | 視訊辨識，畫面比較順 |\n| 準確（YOLOX-Tiny） | 20.2 MB | 圖片辨識，找得比較準、小東西比較抓得到 |\n\n### 會用顯示卡加速\n插件會先用 CPU 開始辨識，馬上就能用；瀏覽器支援 WebGPU 時，同時在背景準備顯示卡（GPU）版，好了就自動換過去，[[getStatus]] 的括號會從「CPU」變成「GPU」。第一次在一台電腦上準備 GPU 大約要 20～30 秒，之後只要約 1 秒。",
  "highlights": [
    {
      "icon": "🎯",
      "title": "80 種物件",
      "text": "人、動物、交通工具、食物、家具、文具…選單裡都有中文名稱。"
    },
    {
      "icon": "📷",
      "title": "四種來源",
      "text": "攝影機、舞台、圖片網址、上傳圖片檔都能辨識。"
    },
    {
      "icon": "🟪",
      "title": "舞台上畫框",
      "text": "辨識框畫在舞台上，x、y 是舞台座標，角色可以直接跟過去。"
    },
    {
      "icon": "⚡",
      "title": "自動用 GPU",
      "text": "先用 CPU 馬上開始，顯示卡準備好就自動換過去。"
    }
  ],
  "groups": [
    {
      "name": "準備與辨識",
      "intro": "先決定要辨識什麼：攝影機視訊用 [[startVideo]]，舞台、網路圖片、圖片檔各有一塊積木。模型會在第一次辨識時自動載入，不一定要先用 [[loadModel]]。\n\n辨識舞台、圖片網址或圖片檔時，會先停止視訊辨識，不然下一個畫面會把結果蓋掉。",
      "blocks": [
        {
          "opcode": "loadModel",
          "type": "command",
          "text": "載入 YOLO 模型 [MODEL]",
          "textEn": "load YOLO model [MODEL]",
          "args": {
            "MODEL": {
              "type": "menu",
              "options": [
                "快速 (Nano)",
                "準確 (Tiny)"
              ],
              "value": "快速 (Nano)",
              "values": [
                "fast",
                "accurate"
              ],
              "optionsEn": [
                "fast (Nano)",
                "accurate (Tiny)"
              ],
              "valueEn": "fast (Nano)",
              "desc": "「快速」適合視訊；「準確」比較準但比較慢，適合圖片。"
            }
          },
          "summary": "選擇並載入 YOLO 模型。",
          "detail": "這塊會**等到模型可以使用**（或載入失敗）才往下執行，適合放在綠旗一開始，學生開始操作時模型已經準備好。\n\n不用這塊也可以：第一次辨識時會自動載入「快速」模型，只是那一次要等比較久。換模型之後，下一次辨識就用新的模型。",
          "tips": "載入時 [[getStatus]] 會顯示「YOLO 模型載入中… 45%」這樣的下載進度。"
        },
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
                "左右翻轉"
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
              "desc": "「開啟」畫面像照鏡子；「左右翻轉」畫面不鏡像；「關閉」關掉攝影機。"
            }
          },
          "summary": "打開、關閉或翻轉攝影機畫面。",
          "detail": "用法和 Scratch 內建「視訊偵測」的同名積木一樣。\n\n不一定要用這塊：[[startVideo]] 發現視訊沒開時會自動打開（鏡像）。差別是：**自己用這塊打開的視訊**，停止辨識時不會被關掉；由「開始」自動打開的，停止時會一起關掉。",
          "tips": "辨識結果的 x 座標會跟著鏡像翻轉，和舞台上看到的畫面一致。"
        },
        {
          "opcode": "startVideo",
          "type": "command",
          "text": "開始視訊物件辨識",
          "textEn": "start video object detection",
          "summary": "打開攝影機，開始一直辨識視訊畫面。",
          "detail": "依序載入模型、打開攝影機，然後持續辨識每一個畫面，結果會一直更新。這塊會**等到準備好（或失敗）**才往下執行。\n\n瀏覽器會詢問是否允許使用攝影機，要按「允許」。用 CPU 辨識時，每辨識一次會休息一下，避免 Scratch 變卡；換成 GPU 後會辨識得比較頻繁。",
          "tips": "重複執行不會重複開始。辨識中把視訊關掉，狀態會顯示「視訊已關閉」，再打開就會繼續。"
        },
        {
          "opcode": "stopVideo",
          "type": "command",
          "text": "停止視訊物件辨識",
          "textEn": "stop video object detection",
          "summary": "停止視訊辨識，清除結果。",
          "detail": "停止後狀態顯示「已停止」，物件數量歸零、舞台上的框消失。攝影機如果是 [[startVideo]] 自動打開的，會一起關掉；自己用 [[videoToggle]] 打開的則保持開啟。"
        },
        {
          "opcode": "detectStage",
          "type": "command",
          "text": "辨識舞台畫面",
          "textEn": "detect objects on stage",
          "summary": "辨識現在的舞台畫面（背景、角色、畫筆、視訊都算）。",
          "detail": "拍下舞台畫面來辨識一次，辨識完才往下執行。舞台上原本的辨識框不會被拍進去。\n\n可以用來辨識角色造型裡的圖片、畫筆畫的東西，或是先開視訊、在需要的時候才辨識一張。"
        },
        {
          "opcode": "detectUrl",
          "type": "command",
          "text": "辨識圖片網址 [URL]",
          "textEn": "detect objects in image URL [URL]",
          "args": {
            "URL": {
              "type": "string",
              "value": "https://",
              "desc": "圖片的網址（`https://` 開頭，網址要直接指到圖片）。"
            }
          },
          "summary": "辨識網路上的一張圖片。",
          "detail": "圖片會等比例顯示在舞台上（周圍黑底），並畫上辨識框。辨識完才往下執行。\n\n> 有些網站不允許別的網頁讀取它的圖片，這時狀態會顯示「錯誤：無法讀取圖片（網址錯誤，或該網站不允許讀取）」。換一張圖片，或把圖片下載後用 [[detectFile]]。"
        },
        {
          "opcode": "detectFile",
          "type": "command",
          "text": "選擇圖片檔來辨識",
          "textEn": "choose an image file to detect",
          "summary": "從電腦選一張圖片來辨識。",
          "detail": "會打開選擇檔案的視窗。選好之後，圖片等比例顯示在舞台上並畫上辨識框，辨識完才往下執行；按取消時狀態顯示「沒有選擇圖片」。\n\n瀏覽器只允許「使用者剛點過」才打開選檔視窗。如果腳本是自己跑到這裡（例如綠旗之後等了一陣子），舞台上會跳出一個小對話框，按「選擇圖片…」才會打開。",
          "tips": "放在「當角色被點擊」底下，點了角色就會直接打開選檔視窗。"
        }
      ]
    },
    {
      "name": "顯示與狀態",
      "intro": "控制舞台上的辨識框、篩掉不確定的結果，以及查看目前的狀態。",
      "blocks": [
        {
          "opcode": "showBoxes",
          "type": "command",
          "text": "[STATE] 辨識框",
          "textEn": "[STATE] detection boxes",
          "args": {
            "STATE": {
              "type": "menu",
              "options": [
                "顯示",
                "隱藏"
              ],
              "value": "顯示",
              "values": [
                "show",
                "hide"
              ],
              "optionsEn": [
                "show",
                "hide"
              ],
              "valueEn": "show",
              "desc": "顯示或隱藏。"
            }
          },
          "summary": "在舞台上顯示或隱藏辨識框。",
          "detail": "辨識框畫在視訊之上、角色之下，每個框上面寫著名稱和信心度。隱藏框不會影響辨識結果，只是看不到。"
        },
        {
          "opcode": "setThreshold",
          "type": "command",
          "text": "信心門檻設為 [VALUE] %",
          "textEn": "set confidence threshold to [VALUE] %",
          "args": {
            "VALUE": {
              "type": "number",
              "value": "50",
              "desc": "10～100，預設 50。超出範圍會自動調整。"
            }
          },
          "summary": "信心度低於這個 % 的物件不算。",
          "detail": "門檻越高，結果越少但越可靠；門檻越低，找到的東西越多，但比較容易認錯。\n\n改門檻**馬上生效**，不用重新辨識：物件數量、框、各種結果積木都會立刻更新。"
        },
        {
          "opcode": "clearResults",
          "type": "command",
          "text": "清除辨識結果",
          "textEn": "clear detection results",
          "summary": "清除目前的辨識結果和舞台上的框（圖片也會清掉）。",
          "detail": "視訊辨識還在進行時，下一個畫面又會產生新的結果。要完全停下來用 [[stopVideo]]。"
        },
        {
          "opcode": "getStatus",
          "type": "reporter",
          "text": "辨識狀態",
          "textEn": "detection status",
          "summary": "目前進行到哪一步，或錯誤原因。",
          "detail": "| 狀態 | 意思 |\n|---|---|\n| 尚未開始 | 還沒載入模型 |\n| YOLO 模型載入中… 45% | 正在下載模型 |\n| 已就緒（YOLOX-Nano，CPU） | 模型可以用了，括號是模型和運算方式 |\n| 開啟攝影機中… | 等攝影機打開 |\n| 視訊辨識中（YOLOX-Nano，GPU） | 正在辨識視訊 |\n| 圖片辨識中… | 正在辨識圖片或舞台 |\n| 辨識完成（YOLOX-Tiny，CPU） | 圖片或舞台辨識完成 |\n| 選擇圖片中…／沒有選擇圖片 | [[detectFile]] 等待選檔／按了取消 |\n| 已停止 | 用了 [[stopVideo]] |\n| 視訊已關閉 | 視訊辨識中但攝影機被關掉 |\n| 錯誤：無法開啟攝影機 | 沒有允許攝影機權限，或攝影機被其他程式占用 |\n| 錯誤：無法載入 onnxruntime（請檢查網路） | 執行程式庫下載失敗 |\n| 錯誤：無法下載模型 | 網路問題 |\n| 錯誤：模型無法啟動 | 模型下載不完整或瀏覽器無法執行；重新整理頁面，或換最新版的 Chrome／Edge 再試 |\n| 錯誤：無法讀取圖片… | 圖片網址錯誤，或該網站不允許讀取 |",
          "returns": "狀態文字。錯誤時括號內可能附上詳細原因。"
        }
      ]
    },
    {
      "name": "結果",
      "intro": "讀取辨識到的物件。只有信心度達到門檻（[[setThreshold]]）的物件才會算進來，而且**依信心度由高到低排序**。\n\n選物件種類的選單有 80 種，也可以放變數，填中文（「狗」）或英文（「dog」）都可以。",
      "blocks": [
        {
          "opcode": "whenDetected",
          "type": "hat",
          "text": "當偵測到 [CLASS]",
          "textEn": "when [CLASS] is detected",
          "args": {
            "CLASS": {
              "type": "menu",
              "options": [
                "人",
                "腳踏車",
                "汽車",
                "機車",
                "飛機",
                "公車",
                "火車",
                "卡車",
                "船",
                "紅綠燈",
                "消防栓",
                "停車標誌",
                "停車計時器",
                "長椅",
                "鳥",
                "貓",
                "狗",
                "馬",
                "羊",
                "牛",
                "大象",
                "熊",
                "斑馬",
                "長頸鹿",
                "背包",
                "雨傘",
                "手提包",
                "領帶",
                "行李箱",
                "飛盤",
                "滑雪板",
                "單板滑雪板",
                "球",
                "風箏",
                "棒球棒",
                "棒球手套",
                "滑板",
                "衝浪板",
                "網球拍",
                "瓶子",
                "高腳杯",
                "杯子",
                "叉子",
                "刀子",
                "湯匙",
                "碗",
                "香蕉",
                "蘋果",
                "三明治",
                "柳橙",
                "花椰菜",
                "紅蘿蔔",
                "熱狗",
                "披薩",
                "甜甜圈",
                "蛋糕",
                "椅子",
                "沙發",
                "盆栽",
                "床",
                "餐桌",
                "馬桶",
                "電視",
                "筆電",
                "滑鼠",
                "遙控器",
                "鍵盤",
                "手機",
                "微波爐",
                "烤箱",
                "烤麵包機",
                "水槽",
                "冰箱",
                "書",
                "時鐘",
                "花瓶",
                "剪刀",
                "泰迪熊",
                "吹風機",
                "牙刷"
              ],
              "value": "人",
              "values": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "optionsEn": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "valueEn": "person",
              "acceptReporters": true,
              "desc": "要等待的物件種類。"
            }
          },
          "edgeActivated": true,
          "summary": "畫面中「開始出現」這種物件時，執行底下的腳本。",
          "detail": "只在**從沒有變成有**的那一刻觸發一次；物件一直在畫面裡不會重複觸發。離開畫面、再出現，才會再觸發。最適合搭配視訊辨識。"
        },
        {
          "opcode": "isDetected",
          "type": "boolean",
          "text": "偵測到 [CLASS]?",
          "textEn": "[CLASS] detected?",
          "args": {
            "CLASS": {
              "type": "menu",
              "options": [
                "人",
                "腳踏車",
                "汽車",
                "機車",
                "飛機",
                "公車",
                "火車",
                "卡車",
                "船",
                "紅綠燈",
                "消防栓",
                "停車標誌",
                "停車計時器",
                "長椅",
                "鳥",
                "貓",
                "狗",
                "馬",
                "羊",
                "牛",
                "大象",
                "熊",
                "斑馬",
                "長頸鹿",
                "背包",
                "雨傘",
                "手提包",
                "領帶",
                "行李箱",
                "飛盤",
                "滑雪板",
                "單板滑雪板",
                "球",
                "風箏",
                "棒球棒",
                "棒球手套",
                "滑板",
                "衝浪板",
                "網球拍",
                "瓶子",
                "高腳杯",
                "杯子",
                "叉子",
                "刀子",
                "湯匙",
                "碗",
                "香蕉",
                "蘋果",
                "三明治",
                "柳橙",
                "花椰菜",
                "紅蘿蔔",
                "熱狗",
                "披薩",
                "甜甜圈",
                "蛋糕",
                "椅子",
                "沙發",
                "盆栽",
                "床",
                "餐桌",
                "馬桶",
                "電視",
                "筆電",
                "滑鼠",
                "遙控器",
                "鍵盤",
                "手機",
                "微波爐",
                "烤箱",
                "烤麵包機",
                "水槽",
                "冰箱",
                "書",
                "時鐘",
                "花瓶",
                "剪刀",
                "泰迪熊",
                "吹風機",
                "牙刷"
              ],
              "value": "人",
              "values": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "optionsEn": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "valueEn": "person",
              "acceptReporters": true,
              "desc": "要檢查的物件種類。"
            }
          },
          "summary": "目前的結果裡有沒有這種物件。",
          "returns": "有的話為 `true`，沒有為 `false`。",
          "example": [
            {
              "t": "如果 [C] 那麼",
              "cat": "control",
              "type": "c",
              "args": {
                "C": {
                  "use": "isDetected",
                  "args": {
                    "CLASS": {
                      "v": "貓",
                      "menu": true
                    }
                  }
                }
              },
              "body": [
                {
                  "t": "播放音效 [S]",
                  "cat": "sound",
                  "args": {
                    "S": {
                      "v": "喵",
                      "menu": true
                    }
                  }
                }
              ]
            }
          ],
          "detail": ""
        },
        {
          "opcode": "getCount",
          "type": "reporter",
          "text": "物件數量",
          "textEn": "number of objects",
          "summary": "一共找到幾個物件（所有種類加起來）。",
          "returns": "數字；沒有結果時為 0。",
          "detail": ""
        },
        {
          "opcode": "getClassCount",
          "type": "reporter",
          "text": "[CLASS] 的數量",
          "textEn": "number of [CLASS]",
          "args": {
            "CLASS": {
              "type": "menu",
              "options": [
                "人",
                "腳踏車",
                "汽車",
                "機車",
                "飛機",
                "公車",
                "火車",
                "卡車",
                "船",
                "紅綠燈",
                "消防栓",
                "停車標誌",
                "停車計時器",
                "長椅",
                "鳥",
                "貓",
                "狗",
                "馬",
                "羊",
                "牛",
                "大象",
                "熊",
                "斑馬",
                "長頸鹿",
                "背包",
                "雨傘",
                "手提包",
                "領帶",
                "行李箱",
                "飛盤",
                "滑雪板",
                "單板滑雪板",
                "球",
                "風箏",
                "棒球棒",
                "棒球手套",
                "滑板",
                "衝浪板",
                "網球拍",
                "瓶子",
                "高腳杯",
                "杯子",
                "叉子",
                "刀子",
                "湯匙",
                "碗",
                "香蕉",
                "蘋果",
                "三明治",
                "柳橙",
                "花椰菜",
                "紅蘿蔔",
                "熱狗",
                "披薩",
                "甜甜圈",
                "蛋糕",
                "椅子",
                "沙發",
                "盆栽",
                "床",
                "餐桌",
                "馬桶",
                "電視",
                "筆電",
                "滑鼠",
                "遙控器",
                "鍵盤",
                "手機",
                "微波爐",
                "烤箱",
                "烤麵包機",
                "水槽",
                "冰箱",
                "書",
                "時鐘",
                "花瓶",
                "剪刀",
                "泰迪熊",
                "吹風機",
                "牙刷"
              ],
              "value": "人",
              "values": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "optionsEn": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "valueEn": "person",
              "acceptReporters": true,
              "desc": "要數的物件種類。"
            }
          },
          "summary": "某一種物件有幾個，例如畫面裡有幾個人。",
          "returns": "數字；沒有時為 0。",
          "detail": ""
        },
        {
          "opcode": "getObjectProp",
          "type": "reporter",
          "text": "第 [INDEX] 個物件的 [PROP]",
          "textEn": "object [INDEX] [PROP]",
          "args": {
            "INDEX": {
              "type": "number",
              "value": "1",
              "desc": "第幾個，從 1 開始。第 1 個是信心度最高的。"
            },
            "PROP": {
              "type": "menu",
              "options": [
                "名稱",
                "信心度",
                "x",
                "y",
                "寬",
                "高"
              ],
              "value": "名稱",
              "values": [
                "name",
                "confidence",
                "x",
                "y",
                "width",
                "height"
              ],
              "optionsEn": [
                "name",
                "confidence",
                "x",
                "y",
                "width",
                "height"
              ],
              "valueEn": "name",
              "acceptReporters": true,
              "desc": "要讀取的資訊。"
            }
          },
          "summary": "讀取第幾個物件的名稱、信心度、位置或大小。",
          "detail": "| 選項 | 內容 |\n|---|---|\n| 名稱 | 物件的名稱，例如「狗」（英文介面是 dog） |\n| 信心度 | 0～100 |\n| x、y | 框的中心點，舞台座標（x：-240～240，y：-180～180） |\n| 寬、高 | 框在舞台上的大小 |\n\n配合 [[getCount]] 和「重複」積木，可以一個一個讀出所有物件。",
          "returns": "文字或數字。第幾個超出範圍時，名稱是空的、其他是 0。",
          "example": [
            {
              "t": "變數 [V] 設為 [N]",
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
            },
            {
              "t": "重複 [N] 次",
              "cat": "control",
              "type": "c",
              "args": {
                "N": {
                  "use": "getCount"
                }
              },
              "body": [
                {
                  "t": "說出 [M] 持續 [S] 秒",
                  "cat": "looks",
                  "args": {
                    "M": {
                      "use": "getObjectProp",
                      "args": {
                        "INDEX": {
                          "t": "i",
                          "cat": "data",
                          "type": "reporter"
                        },
                        "PROP": {
                          "v": "名稱",
                          "menu": true
                        }
                      }
                    },
                    "S": {
                      "num": "1"
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
          ]
        },
        {
          "opcode": "getClassProp",
          "type": "reporter",
          "text": "[CLASS] 的 [PROP]",
          "textEn": "[CLASS] [PROP]",
          "args": {
            "CLASS": {
              "type": "menu",
              "options": [
                "人",
                "腳踏車",
                "汽車",
                "機車",
                "飛機",
                "公車",
                "火車",
                "卡車",
                "船",
                "紅綠燈",
                "消防栓",
                "停車標誌",
                "停車計時器",
                "長椅",
                "鳥",
                "貓",
                "狗",
                "馬",
                "羊",
                "牛",
                "大象",
                "熊",
                "斑馬",
                "長頸鹿",
                "背包",
                "雨傘",
                "手提包",
                "領帶",
                "行李箱",
                "飛盤",
                "滑雪板",
                "單板滑雪板",
                "球",
                "風箏",
                "棒球棒",
                "棒球手套",
                "滑板",
                "衝浪板",
                "網球拍",
                "瓶子",
                "高腳杯",
                "杯子",
                "叉子",
                "刀子",
                "湯匙",
                "碗",
                "香蕉",
                "蘋果",
                "三明治",
                "柳橙",
                "花椰菜",
                "紅蘿蔔",
                "熱狗",
                "披薩",
                "甜甜圈",
                "蛋糕",
                "椅子",
                "沙發",
                "盆栽",
                "床",
                "餐桌",
                "馬桶",
                "電視",
                "筆電",
                "滑鼠",
                "遙控器",
                "鍵盤",
                "手機",
                "微波爐",
                "烤箱",
                "烤麵包機",
                "水槽",
                "冰箱",
                "書",
                "時鐘",
                "花瓶",
                "剪刀",
                "泰迪熊",
                "吹風機",
                "牙刷"
              ],
              "value": "人",
              "values": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "optionsEn": [
                "person",
                "bicycle",
                "car",
                "motorcycle",
                "airplane",
                "bus",
                "train",
                "truck",
                "boat",
                "traffic light",
                "fire hydrant",
                "stop sign",
                "parking meter",
                "bench",
                "bird",
                "cat",
                "dog",
                "horse",
                "sheep",
                "cow",
                "elephant",
                "bear",
                "zebra",
                "giraffe",
                "backpack",
                "umbrella",
                "handbag",
                "tie",
                "suitcase",
                "frisbee",
                "skis",
                "snowboard",
                "sports ball",
                "kite",
                "baseball bat",
                "baseball glove",
                "skateboard",
                "surfboard",
                "tennis racket",
                "bottle",
                "wine glass",
                "cup",
                "fork",
                "knife",
                "spoon",
                "bowl",
                "banana",
                "apple",
                "sandwich",
                "orange",
                "broccoli",
                "carrot",
                "hot dog",
                "pizza",
                "donut",
                "cake",
                "chair",
                "couch",
                "potted plant",
                "bed",
                "dining table",
                "toilet",
                "tv",
                "laptop",
                "mouse",
                "remote",
                "keyboard",
                "cell phone",
                "microwave",
                "oven",
                "toaster",
                "sink",
                "refrigerator",
                "book",
                "clock",
                "vase",
                "scissors",
                "teddy bear",
                "hair drier",
                "toothbrush"
              ],
              "valueEn": "person",
              "acceptReporters": true,
              "desc": "物件種類。"
            },
            "PROP": {
              "type": "menu",
              "options": [
                "x",
                "y",
                "寬",
                "高",
                "信心度"
              ],
              "value": "x",
              "values": [
                "x",
                "y",
                "width",
                "height",
                "confidence"
              ],
              "optionsEn": [
                "x",
                "y",
                "width",
                "height",
                "confidence"
              ],
              "acceptReporters": true,
              "desc": "要讀取的資訊。"
            }
          },
          "summary": "某一種物件的位置、大小或信心度。",
          "detail": "同一種物件有好幾個時，讀的是**信心度最高**的那一個。最常用來讓角色跟著某個東西移動。",
          "returns": "數字；沒有這種物件時為 0。",
          "example": [
            {
              "t": "如果 [C] 那麼",
              "cat": "control",
              "type": "c",
              "args": {
                "C": {
                  "use": "isDetected",
                  "args": {
                    "CLASS": {
                      "v": "杯子",
                      "menu": true
                    }
                  }
                }
              },
              "body": [
                {
                  "t": "滑行 [S] 秒到 x: [X] y: [Y]",
                  "cat": "motion",
                  "args": {
                    "S": {
                      "num": "0.3"
                    },
                    "X": {
                      "use": "getClassProp",
                      "args": {
                        "CLASS": {
                          "v": "杯子",
                          "menu": true
                        },
                        "PROP": {
                          "v": "x",
                          "menu": true
                        }
                      }
                    },
                    "Y": {
                      "use": "getClassProp",
                      "args": {
                        "CLASS": {
                          "v": "杯子",
                          "menu": true
                        },
                        "PROP": {
                          "v": "y",
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
          "opcode": "getAllLabels",
          "type": "reporter",
          "text": "所有偵測到的物件",
          "textEn": "all detected objects",
          "summary": "找到的物件種類清單（不重複）。",
          "returns": "例如 `狗、腳踏車、汽車`（英文介面用逗號：`dog, bicycle, car`），依信心度由高到低；沒有結果時是空的。",
          "detail": ""
        }
      ]
    }
  ],
  "examples": [
    {
      "title": "攝影機看到什麼？",
      "intro": "打開視訊辨識，角色一直說出畫面中有哪些東西。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "loadModel",
          "args": {
            "MODEL": {
              "v": "快速 (Nano)",
              "menu": true
            }
          }
        },
        {
          "use": "startVideo"
        },
        {
          "t": "重複無限次",
          "cat": "control",
          "type": "c",
          "body": [
            {
              "t": "說出 [M]",
              "cat": "looks",
              "args": {
                "M": {
                  "use": "getAllLabels"
                }
              }
            }
          ]
        }
      ]
    },
    {
      "title": "看到貓就叫",
      "intro": "貓一出現在鏡頭前，角色就喵一聲並說出有幾隻。",
      "script": [
        [
          {
            "t": "當 🏁 被點擊",
            "cat": "events",
            "type": "hat"
          },
          {
            "use": "startVideo"
          }
        ],
        [
          {
            "use": "whenDetected",
            "args": {
              "CLASS": {
                "v": "貓",
                "menu": true
              }
            }
          },
          {
            "t": "播放音效 [S]",
            "cat": "sound",
            "args": {
              "S": {
                "v": "喵",
                "menu": true
              }
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
                  "A": "我看到貓了！共 ",
                  "B": {
                    "t": "字串組合 [A] [B]",
                    "cat": "operators",
                    "type": "reporter",
                    "args": {
                      "A": {
                        "use": "getClassCount",
                        "args": {
                          "CLASS": {
                            "v": "貓",
                            "menu": true
                          }
                        }
                      },
                      "B": " 隻"
                    }
                  }
                }
              },
              "S": {
                "num": "2"
              }
            }
          }
        ]
      ],
      "explain": "家裡沒有貓時，可以拿手機開貓的照片給鏡頭看。"
    },
    {
      "title": "辨識一張照片",
      "intro": "點角色選一張照片，用準確模型辨識，說出找到幾個東西和信心度最高的是什麼。",
      "script": [
        {
          "t": "當角色被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "loadModel",
          "args": {
            "MODEL": {
              "v": "準確 (Tiny)",
              "menu": true
            }
          }
        },
        {
          "use": "detectFile"
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
                "A": {
                  "t": "字串組合 [A] [B]",
                  "cat": "operators",
                  "type": "reporter",
                  "args": {
                    "A": "找到 ",
                    "B": {
                      "use": "getCount"
                    }
                  }
                },
                "B": {
                  "t": "字串組合 [A] [B]",
                  "cat": "operators",
                  "type": "reporter",
                  "args": {
                    "A": " 個，最有把握的是：",
                    "B": {
                      "use": "getObjectProp",
                      "args": {
                        "INDEX": {
                          "num": "1"
                        },
                        "PROP": {
                          "v": "名稱",
                          "menu": true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ],
      "explain": "放在「當角色被點擊」底下，點了角色就會直接打開選檔視窗。"
    },
    {
      "title": "數人數",
      "intro": "畫面中的人數超過 3 個時提醒一下；門檻調高一點，避免把別的東西認成人。",
      "script": [
        {
          "t": "當 🏁 被點擊",
          "cat": "events",
          "type": "hat"
        },
        {
          "use": "setThreshold",
          "args": {
            "VALUE": {
              "num": "60"
            }
          }
        },
        {
          "use": "startVideo"
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
                  "t": "[A] > [B]",
                  "cat": "operators",
                  "type": "boolean",
                  "args": {
                    "A": {
                      "use": "getClassCount",
                      "args": {
                        "CLASS": {
                          "v": "人",
                          "menu": true
                        }
                      }
                    },
                    "B": {
                      "num": "3"
                    }
                  }
                }
              },
              "body": [
                {
                  "t": "說出 [M]",
                  "cat": "looks",
                  "args": {
                    "M": "人太多了！"
                  }
                }
              ],
              "else": [
                {
                  "t": "說出 [M]",
                  "cat": "looks",
                  "args": {
                    "M": {
                      "use": "getClassCount",
                      "args": {
                        "CLASS": {
                          "v": "人",
                          "menu": true
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "faq": [
    {
      "q": "可以辨識哪些東西？",
      "a": "80 種常見物件（COCO 資料集）：人、交通工具、動物、運動用品、食物、餐具、家具、電器、文具等，完整清單看 [[isDetected]] 的選單。不在清單裡的東西（例如鉛筆、樹）認不出來，可能會被認成相近的東西。"
    },
    {
      "q": "第一次很久才開始？",
      "a": "第一次要下載模型（快速 3.7 MB、準確 20.2 MB）和執行程式庫。之後瀏覽器會記住，下次就快。上課前可以先在每台電腦開一次。"
    },
    {
      "q": "狀態一開始是 CPU，後來變成 GPU？",
      "a": "這是正常的。插件先用 CPU 馬上開始，同時在背景準備顯示卡版本，準備好就換過去。第一次在一台電腦上準備 GPU 要 20～30 秒；不支援 WebGPU 的瀏覽器會一直用 CPU，一樣能用，只是比較慢。"
    },
    {
      "q": "辨識不準、常認錯？",
      "a": "- 光線充足，物件不要太小、不要被擋住\n- 改用「準確 (Tiny)」模型\n- 用 [[setThreshold]] 把門檻調高，例如 60～70\n- 用信心度（[[getClassProp]] 的信心度）自己再判斷一次"
    },
    {
      "q": "圖片網址出現「無法讀取圖片」？",
      "a": "有些網站不允許別的網頁讀取它的圖片。換一張圖片（例如 Wikimedia Commons 的圖片通常可以），或把圖片下載到電腦，再用 [[detectFile]]。"
    },
    {
      "q": "出現「錯誤：無法開啟攝影機」？",
      "a": "- 網址列旁的攝影機圖示，改成「允許」後重新整理\n- 關掉其他正在使用攝影機的程式（視訊會議、相機 App）"
    },
    {
      "q": "和「臉部表情辨識」插件可以一起用嗎？",
      "a": "可以，兩個插件共用同一個攝影機畫面。不過同時跑兩個 AI 會比較慢。"
    },
    {
      "q": "影像會上傳嗎？",
      "a": "不會。模型和程式庫是從網路下載的，但辨識是在你的瀏覽器裡做，影像不會離開你的電腦。"
    }
  ],
  "changelog": [
    {
      "date": "2026-11-21",
      "text": "新增 YOLO 物件辨識插件（YOLOX-Nano／Tiny，80 種物件；視訊、舞台、圖片網址、圖片檔四種來源；CPU 先用、GPU 背景升級）"
    }
  ]
});
