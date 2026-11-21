// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/* 中英文字（CommonJS，可直接在 Node 測試） */
const t = (en, zh) => ({'en': en, 'zh-tw': zh});

// COCO 80 類的中文名稱（key 與 yolo-core.js 的 CLASSES 相同）
const CLASS_ZH = {
    'person': '人', 'bicycle': '腳踏車', 'car': '汽車', 'motorcycle': '機車', 'airplane': '飛機',
    'bus': '公車', 'train': '火車', 'truck': '卡車', 'boat': '船', 'traffic light': '紅綠燈',
    'fire hydrant': '消防栓', 'stop sign': '停車標誌', 'parking meter': '停車計時器', 'bench': '長椅',
    'bird': '鳥', 'cat': '貓', 'dog': '狗', 'horse': '馬', 'sheep': '羊', 'cow': '牛',
    'elephant': '大象', 'bear': '熊', 'zebra': '斑馬', 'giraffe': '長頸鹿', 'backpack': '背包',
    'umbrella': '雨傘', 'handbag': '手提包', 'tie': '領帶', 'suitcase': '行李箱', 'frisbee': '飛盤',
    'skis': '滑雪板', 'snowboard': '單板滑雪板', 'sports ball': '球', 'kite': '風箏',
    'baseball bat': '棒球棒', 'baseball glove': '棒球手套', 'skateboard': '滑板', 'surfboard': '衝浪板',
    'tennis racket': '網球拍', 'bottle': '瓶子', 'wine glass': '高腳杯', 'cup': '杯子', 'fork': '叉子',
    'knife': '刀子', 'spoon': '湯匙', 'bowl': '碗', 'banana': '香蕉', 'apple': '蘋果',
    'sandwich': '三明治', 'orange': '柳橙', 'broccoli': '花椰菜', 'carrot': '紅蘿蔔', 'hot dog': '熱狗',
    'pizza': '披薩', 'donut': '甜甜圈', 'cake': '蛋糕', 'chair': '椅子', 'couch': '沙發',
    'potted plant': '盆栽', 'bed': '床', 'dining table': '餐桌', 'toilet': '馬桶', 'tv': '電視',
    'laptop': '筆電', 'mouse': '滑鼠', 'remote': '遙控器', 'keyboard': '鍵盤', 'cell phone': '手機',
    'microwave': '微波爐', 'oven': '烤箱', 'toaster': '烤麵包機', 'sink': '水槽', 'refrigerator': '冰箱',
    'book': '書', 'clock': '時鐘', 'vase': '花瓶', 'scissors': '剪刀', 'teddy bear': '泰迪熊',
    'hair drier': '吹風機', 'toothbrush': '牙刷'
};

module.exports = {
    CLASS_ZH,

    title: t('YOLO Object Detection', 'YOLO 物件辨識'),

    // 積木：準備
    loadModel: t('load YOLO model [MODEL]', '載入 YOLO 模型 [MODEL]'),
    videoToggle: t('set video to [VIDEO_STATE]', '視訊設為 [VIDEO_STATE]'),
    startVideo: t('start video object detection', '開始視訊物件辨識'),
    stopVideo: t('stop video object detection', '停止視訊物件辨識'),
    detectStage: t('detect objects on stage', '辨識舞台畫面'),
    detectUrl: t('detect objects in image URL [URL]', '辨識圖片網址 [URL]'),
    detectFile: t('choose an image file to detect', '選擇圖片檔來辨識'),
    showBoxes: t('[STATE] detection boxes', '[STATE] 辨識框'),
    setThreshold: t('set confidence threshold to [VALUE] %', '信心門檻設為 [VALUE] %'),
    clearResults: t('clear detection results', '清除辨識結果'),
    status: t('detection status', '辨識狀態'),

    // 積木：結果
    whenDetected: t('when [CLASS] is detected', '當偵測到 [CLASS]'),
    isDetected: t('[CLASS] detected?', '偵測到 [CLASS]?'),
    count: t('number of objects', '物件數量'),
    classCount: t('number of [CLASS]', '[CLASS] 的數量'),
    objectProp: t('object [INDEX] [PROP]', '第 [INDEX] 個物件的 [PROP]'),
    classProp: t('[CLASS] [PROP]', '[CLASS] 的 [PROP]'),
    allLabels: t('all detected objects', '所有偵測到的物件'),

    // 選單
    model_fast: t('fast (Nano)', '快速 (Nano)'),
    model_accurate: t('accurate (Tiny)', '準確 (Tiny)'),
    off: t('off', '關閉'),
    on: t('on', '開啟'),
    onFlipped: t('on flipped', '左右翻轉'),
    show: t('show', '顯示'),
    hide: t('hide', '隱藏'),
    prop_name: t('name', '名稱'),
    prop_confidence: t('confidence', '信心度'),
    prop_x: t('x', 'x'),
    prop_y: t('y', 'y'),
    prop_width: t('width', '寬'),
    prop_height: t('height', '高'),

    // 狀態
    status_idle: t('Not started', '尚未開始'),
    status_loading: t('Loading YOLO model…', 'YOLO 模型載入中…'),
    status_ready: t('Ready', '已就緒'),
    status_camera: t('Opening camera…', '開啟攝影機中…'),
    status_running: t('Detecting video', '視訊辨識中'),
    status_detecting: t('Detecting image…', '圖片辨識中…'),
    status_done: t('Done', '辨識完成'),
    status_choosing: t('Choosing an image…', '選擇圖片中…'),
    status_cancelled: t('No image chosen', '沒有選擇圖片'),
    status_stopped: t('Stopped', '已停止'),
    status_videoOff: t('Video is off', '視訊已關閉'),
    status_errCamera: t('Error: cannot open the camera', '錯誤：無法開啟攝影機'),
    status_errLibrary: t('Error: cannot load onnxruntime (check the network)',
        '錯誤：無法載入 onnxruntime（請檢查網路）'),
    status_errDownload: t('Error: cannot download the model', '錯誤：無法下載模型'),
    status_errModel: t('Error: cannot start the model', '錯誤：模型無法啟動'),
    status_errImage: t('Error: cannot read the image (wrong URL, or the site does not allow it)',
        '錯誤：無法讀取圖片（網址錯誤，或該網站不允許讀取）'),
    status_errOther: t('Error', '錯誤'),

    // 選擇圖片的對話框（瀏覽器不允許直接開檔案視窗時才出現）
    pickTitle: t('Choose an image to detect', '選擇要辨識的圖片'),
    pickButton: t('Choose image…', '選擇圖片…'),
    pickCancel: t('Cancel', '取消')
};
