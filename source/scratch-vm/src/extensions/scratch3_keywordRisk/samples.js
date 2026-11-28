// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 範例：防詐簡訊（116 年度新北市貓咪盃 國中生活 AI 互動組初賽題目「智慧防詐訊息偵測員」的設定）
 * 特徵 F1～F4 的關鍵字與 10 則已標記的訓練簡訊；提醒文字是本插件自己寫的
 */
'use strict';

const RISK = '詐騙';
const SAFE = '正常';

const FEATURES = [
    {
        id: 'F1', name: '連結／網址', keywords: ['連結', '網址', '點擊'],
        reminder: '不要點擊不明的連結或網址，可以先向官方管道確認。'
    },
    {
        id: 'F2', name: '要求提供個資或金錢', keywords: ['密碼', '帳號', '身分證字號', '匯款', '轉帳'],
        reminder: '切勿提供密碼、帳號、身分證字號，也不要依照訊息匯款或轉帳。'
    },
    {
        id: 'F3', name: '緊急／威脅語氣', keywords: ['立即', '否則', '逾期', '盡快'],
        reminder: '遇到催促或威脅的語氣先冷靜下來，不要急著照做。'
    },
    {
        id: 'F4', name: '自稱機構／權威身分', keywords: ['銀行', '客服中心', '警察局', '法院'],
        reminder: '自稱銀行、客服、警察或法院時，請自己撥打官方電話查證，或撥 165 反詐騙專線。'
    }
];

const MESSAGES = [
    ['銀行客服中心通知：您的帳戶異常，請立即點擊連結並提供密碼，否則帳戶將被凍結。', RISK],
    ['警察局來電通知您涉入刑案，要求立即匯款以撤銷通緝，否則將依法逮捕。', RISK],
    ['法院通知您的罰單已逾期，請立即點擊連結繳納，否則將強制執行。', RISK],
    ['您的網路帳單已逾期，請盡快提供身分證字號以核對身分。', RISK],
    ['提醒您，圖書館借閱的書籍已逾期，請盡快歸還。', SAFE],
    ['媽，我今天晚上會晚點回家，先跟妳說一聲，晚餐不用等我。', SAFE],
    ['這是我最近發現的好康連結，點擊連結看看吧，你一定會喜歡！', RISK],
    ['同學會的活動相簿連結在這裡，點擊連結就能看到大家的照片。', SAFE],
    ['老師說明天要交作業，記得先把作業寫完再出門喔。', SAFE],
    ['銀行APP更新通知：新版介面上線，操作更方便，歡迎多加使用。', SAFE]
];

/** 每次回傳新的複本（插件會修改） */
const scam = () => ({
    riskLabel: RISK,
    safeLabel: SAFE,
    threshold: 0.5,
    features: FEATURES.map(f => Object.assign({}, f, {keywords: f.keywords.slice()})),
    data: MESSAGES.map(m => ({text: m[0], label: m[1]}))
});

module.exports = {scam};
