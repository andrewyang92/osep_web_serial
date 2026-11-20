// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/* 中英文字（CommonJS，可直接在 Node 測試） */
const t = (en, zh) => ({'en': en, 'zh-tw': zh});

module.exports = {
    title: t('Decision Tree', '決策樹'),

    // 積木：資料
    useSample: t('use sample data (play tennis)', '使用範例資料（打網球）'),
    setData: t('set data to [DATA]', '設定資料為 [DATA]'),
    setTarget: t('set column to predict to [COL]', '要預測的欄位設為 [COL]'),
    setFeatures: t('set columns used for deciding to [COLS]', '用來判斷的欄位設為 [COLS]'),
    columns: t('data columns', '資料的欄位'),
    rowCount: t('number of data rows', '資料筆數'),

    // 積木：訓練
    setTrainPercent: t('use [P] % of data for training (rest for testing)', '訓練資料佔 [P] %（其餘用來測試）'),
    setMaxDepth: t('set max tree depth to [D]', '樹的最大深度設為 [D]'),
    train: t('train decision tree', '訓練決策樹'),
    status: t('decision tree status', '決策樹狀態'),
    accuracy: t('accuracy (%)', '正確率 (%)'),
    info: t('decision tree [PROP]', '決策樹的 [PROP]'),
    rules: t('decision tree rules', '決策樹規則'),

    // 積木：圖
    showTree: t('show decision tree in new window', '在新視窗顯示決策樹'),
    closeTree: t('close decision tree window', '關閉決策樹視窗'),

    // 積木：預測
    setInput: t('set [COL] of input to [VAL]', '預測資料的 [COL] 設為 [VAL]'),
    clearInput: t('clear input', '清除預測資料'),
    predict: t('prediction', '預測結果'),
    predictText: t('predict with [TEXT]', '用 [TEXT] 預測'),
    confidence: t('prediction confidence (%)', '預測信心 (%)'),
    path: t('prediction path', '預測路徑'),

    // 預設值
    defData: t('Google data', 'Google 資料'),
    defTarget: t('Play', '打網球'),
    defFeatures: t('all', '全部'),
    defCol: t('Rainy', '下雨'),
    defVal: t('No', '否'),
    defText: t('Rainy=No, Humid=Yes', '下雨=否, 濕度高=是'),

    // 是非答案統一成的文字
    yes: t('Yes', '是'),
    no: t('No', '否'),

    // 選單
    prop_depth: t('depth', '深度'),
    prop_leaves: t('number of leaves', '葉子數'),
    prop_nTrain: t('training rows', '訓練筆數'),
    prop_nTest: t('testing rows', '測試筆數'),
    prop_features: t('columns used', '用到的欄位'),
    prop_target: t('column predicted', '預測的欄位'),

    // 規則文字
    rule_if: t('IF', '如果'),
    rule_and: t('AND', '且'),
    rule_then: t('THEN', '就'),
    rule_always: t('ALWAYS', '一律'),
    rule_rows: t('rows', '筆'),

    // 狀態
    st_noData: t('No data yet. Use "set data to" first.', '尚未設定資料，請先使用「設定資料為」'),
    st_dataEmpty: t('Data is empty. Make sure the Google Sheet has been read.', '資料是空的，請確認已讀到 Google 試算表的資料'),
    st_dataFormat: t('Data format not recognized. Put the Google Sheets data (JSON) here.', '看不懂這個資料，請放入 Google 試算表插件讀到的資料（JSON）'),
    st_dataNoRows: t('The data has no rows.', '資料裡沒有任何一筆資料'),
    st_dataReadyYN: t('Loaded {rows} rows, {cols} yes/no columns. (Training is turned off for now.)',
        '已讀入 {rows} 筆資料、{cols} 個是非欄位（訓練功能暫時關閉）'),
    st_notYesNo: t('Column "{col}", row {line}: "{val}" is not a yes/no answer. Use Yes/No or True/False (numbers are not accepted).',
        '「{col}」第 {line} 列的「{val}」不是是非答案，請填 是／否、有／沒有、會／不會、對／錯 或 yes／no（不接受數字）'),
    st_blankCell: t('Column "{col}", row {line} is blank. Every cell must be Yes or No.',
        '「{col}」第 {line} 列是空白，每一格都要填 是 或 否'),
    st_dataReadyTree: t('Loaded {rows} rows, {cols} yes/no columns. The decision tree is ready (built from all rows).',
        '已讀入 {rows} 筆資料、{cols} 個是非欄位，決策樹已建好（用全部資料）'),
    st_trainingOff: t('Training is turned off for now.', '訓練功能暫時關閉'),
    st_dataReady: t('Loaded {rows} rows, {cols} columns. Not trained yet.', '已讀入 {rows} 筆資料、{cols} 個欄位，尚未訓練'),
    st_badTarget: t('Column to predict "{col}" not found. Columns: {cols}', '找不到要預測的欄位「{col}」，資料的欄位有：{cols}'),
    st_badFeatures: t('Column(s) not found: {missing}. Columns: {cols}', '找不到欄位：{missing}，資料的欄位有：{cols}'),
    st_tooFewRows: t('Not enough rows with a value in "{col}" (need at least 2).', '「{col}」有填值的資料太少（至少要 2 筆）'),
    st_noFeatures: t('No usable columns for deciding.', '沒有可以用來判斷的欄位'),
    st_trained: t('Trained: {nTrain} training rows, {nTest} testing rows, accuracy {acc}%',
        '已訓練：訓練 {nTrain} 筆、測試 {nTest} 筆，正確率 {acc}%'),
    st_trainedNoTest: t('Trained on all {nTrain} rows (accuracy {acc}% on training data)',
        '已用全部 {nTrain} 筆資料訓練（訓練資料正確率 {acc}%）'),
    st_skipped: t('; skipped: {list}', '；已略過：{list}'),
    skip_unique: t('{col} (different in every row)', '{col}（每筆都不一樣）'),
    skip_constant: t('{col} (same in every row)', '{col}（每筆都一樣）'),
    st_noTree: t('Train the decision tree first.', '請先訓練決策樹'),
    st_popup: t('Pop-up was blocked by the browser, so the tree is shown on this page. Allow pop-ups for this site to use a new window.',
        '瀏覽器擋住了彈出視窗，已改在本頁顯示；若要用新視窗，請允許本網站的彈出式視窗'),
    st_unknownValue: t('{col} = "{val}" was not in the training data; used the majority at that point.',
        '訓練資料裡沒有 {col} =「{val}」，已用該處最多的答案'),
    st_missing: t('Input is missing: {list}', '預測資料缺少：{list}'),

    unknownMark: t('(not seen)', '（沒看過）')
};
