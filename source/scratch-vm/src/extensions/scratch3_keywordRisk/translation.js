// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/* 中英文字（CommonJS，可直接在 Node 測試）；{risk}、{safe} 會換成目前的標記名稱 */
const t = (en, zh) => ({'en': en, 'zh-tw': zh});

module.exports = {
    title: t('Keyword Risk Detector', '關鍵字風險偵測'),

    // 積木：特徵設定
    loadSample: t('load sample: scam messages', '載入範例：防詐簡訊'),
    clearFeatures: t('clear all features', '清除所有特徵'),
    setFeature: t('set feature [FEAT] name [NAME] keywords [KEYWORDS]', '設定特徵 [FEAT] 名稱 [NAME] 關鍵字 [KEYWORDS]'),
    setReminder: t('set reminder of feature [FEAT] to [TEXT]', '設定特徵 [FEAT] 的提醒 [TEXT]'),
    setLabels: t('set labels: risky [RISK] normal [SAFE]', '標記名稱設為 有風險 [RISK] 正常 [SAFE]'),
    setThreshold: t('set threshold to [T]', '判斷門檻設為 [T]'),

    // 積木：訓練資料
    clearData: t('clear training data', '清除訓練資料'),
    addMessage: t('add training message [TEXT] label [LABEL]', '加入訓練訊息 [TEXT] 標記 [LABEL]'),
    loadFromLists: t('load training data from list [TEXTS] with labels in list [LABELS]',
        '從清單 [TEXTS] 和標記清單 [LABELS] 讀入訓練資料'),
    train: t('calculate risk values', '計算風險值'),
    dataCount: t('number of training messages', '訓練訊息數量'),
    dataProp: t('training message [N] [PROP]', '第 [N] 則訓練訊息的 [PROP]'),
    riskValue: t('risk value of feature [FEAT]', '特徵 [FEAT] 的風險值'),
    featureInfo: t('feature [FEAT] [INFO]', '特徵 [FEAT] 的 [INFO]'),

    // 積木：判斷新訊息
    featureOf: t('[TEXT] feature [FEAT]', '[TEXT] 的特徵 [FEAT]'),
    matchedFeatures: t('features matched by [TEXT]', '[TEXT] 符合的特徵'),
    riskScore: t('risk score of [TEXT]', '[TEXT] 的風險分數'),
    verdict: t('result of [TEXT]', '[TEXT] 的判斷結果'),
    isRisky: t('[TEXT] is likely {risk}?', '[TEXT] 疑似{risk}？'),
    reminders: t('reminders for [TEXT]', '[TEXT] 的提醒'),

    // 積木：工具
    containsAny: t('[TEXT] contains any of [KEYWORDS]?', '[TEXT] 包含 [KEYWORDS] 其中一個？'),
    keywordsFound: t('keywords found in [TEXT] for feature [FEAT]', '[TEXT] 中特徵 [FEAT] 找到的關鍵字'),
    showTable: t('show risk table', '顯示風險值表'),
    closeTable: t('close risk table', '關閉風險值表'),
    status: t('detector status', '偵測狀態'),

    // 預設值
    defText: t('Click the link now', '請立即點擊連結'),
    defName: t('links / URLs', '連結／網址'),
    defKeywords: t('連結、網址、點擊', '連結、網址、點擊'),
    defReminder: t('Do not click unknown links.', '不要點擊不明的連結或網址。'),
    defRisk: t('scam', '詐騙'),
    defSafe: t('normal', '正常'),
    textsList: t('messages', '訊息'),
    labelsList: t('labels', '標記'),

    // 選單
    prop_text: t('text', '內容'),
    prop_label: t('label', '標記'),
    info_name: t('name', '名稱'),
    info_keywords: t('keywords', '關鍵字'),
    info_reminder: t('reminder', '提醒'),
    info_hit: t('number of matching messages', '符合則數'),
    info_risky: t('number of matching {risk} messages', '符合且{risk}的則數'),
    noList: t('(no list)', '（沒有清單）'),

    // 結果
    verdictRisk: t('likely {risk}', '疑似{risk}'),

    // 狀態
    st_ready: t('ready', '準備好了'),
    st_sample: t('sample loaded: {f} features, {n} messages', '已載入範例：{f} 個特徵、{n} 則訊息'),
    st_trained: t('risk values calculated from {n} messages', '已用 {n} 則訊息計算風險值'),
    st_noFeature: t('no features yet: set a feature first', '還沒有特徵：請先設定特徵'),
    st_noData: t('no training data yet', '還沒有訓練資料'),
    st_loaded: t('loaded {n} training messages from lists', '從清單讀入 {n} 則訓練訊息'),
    st_noList: t('cannot find list "{name}"', '找不到清單「{name}」'),
    st_judged: t('{verdict} (risk score {score})', '{verdict}（風險分數 {score}）'),
    st_popup: t('pop-up blocked: showing the table on this page', '彈出視窗被擋住，改在本頁顯示'),

    // 風險值表視窗
    tbl_title: t('Risk table', '風險值表'),
    tbl_features: t('Features and risk values', '特徵與風險值'),
    tbl_formula: t('risk value = matching {risk} messages ÷ matching messages',
        '風險值 ＝ 符合且{risk}的則數 ÷ 符合的總則數'),
    tbl_feature: t('Feature', '特徵'),
    tbl_name: t('Name', '名稱'),
    tbl_keywords: t('Keywords', '關鍵字'),
    tbl_hit: t('Matching', '符合則數'),
    tbl_risky: t('{risk}', '{risk}則數'),
    tbl_value: t('Risk value', '風險值'),
    tbl_data: t('Training messages', '訓練訊息'),
    tbl_no: t('No.', '編號'),
    tbl_text: t('Message', '簡訊內容'),
    tbl_label: t('Label', '標記'),
    tbl_last: t('Last judged message', '最後判斷的訊息'),
    tbl_score: t('Risk score', '風險分數'),
    tbl_result: t('Result', '判斷結果'),
    tbl_threshold: t('Threshold: risk score ≥ {t} → {risk}', '判斷門檻：風險分數 ≥ {t} → 疑似{risk}'),
    tbl_none: t('(none)', '（沒有）'),
    tbl_noMatch: t('no feature matched: risk score 0', '沒有符合任何特徵：風險分數 0'),
    close: t('Close', '關閉')
};
