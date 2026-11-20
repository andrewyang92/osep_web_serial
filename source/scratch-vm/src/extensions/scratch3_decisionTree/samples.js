/**
 * 範例資料：打網球（Quinlan 的經典決策樹教材資料，14 筆）
 * 天氣、風是文字欄位；溫度（華氏）、濕度（%）是數字欄位
 */
'use strict';

const OUTLOOK = ['sunny', 'sunny', 'overcast', 'rain', 'rain', 'rain', 'overcast', 'sunny', 'sunny', 'rain', 'sunny',
    'overcast', 'overcast', 'rain'];
const TEMP = [85, 80, 83, 70, 68, 65, 64, 72, 69, 75, 75, 72, 81, 71];
const HUMIDITY = [85, 90, 86, 96, 80, 70, 65, 95, 70, 80, 70, 90, 75, 91];
const WINDY = [0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1];
const PLAY = [0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0];

const WORDS = {
    'zh-tw': {
        cols: ['天氣', '溫度', '濕度', '風', '打網球'],
        sunny: '晴', overcast: '陰', rain: '雨',
        windy: ['無', '有'], play: ['否', '是']
    },
    'en': {
        cols: ['Outlook', 'Temperature', 'Humidity', 'Wind', 'Play'],
        sunny: 'Sunny', overcast: 'Overcast', rain: 'Rain',
        windy: ['Weak', 'Strong'], play: ['No', 'Yes']
    }
};

/** @returns {{rows: object[], target: string}} 值都是字串，跟 Google 試算表的 JSON 一樣 */
function tennis (locale) {
    const w = WORDS[locale] || WORDS.en;
    const c = w.cols;
    const rows = OUTLOOK.map((o, i) => {
        const r = {};
        r[c[0]] = w[o];
        r[c[1]] = String(TEMP[i]);
        r[c[2]] = String(HUMIDITY[i]);
        r[c[3]] = w.windy[WINDY[i]];
        r[c[4]] = w.play[PLAY[i]];
        return r;
    });
    return {rows, target: c[4]};
}

module.exports = {tennis};
