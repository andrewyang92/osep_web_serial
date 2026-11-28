// ThingSpeak 擴充功能
// 原作者：gasolin（https://github.com/gasolin/scratch3-internet），estea8968 修改。
// 2026-11-28 Andrew Yang 修正：寫入積木用了沒宣告的 ts_key、讀取積木用了沒宣告的 parsed（class 裡是嚴格模式，
// 兩塊一執行就出錯）；讀取改成等資料下載完才結束；值做網址編碼；新增寫入結果、取欄位值等積木。
// 2026-11-28：「讀取的 ThingSpeak 資料」改成輸出圖表擴充功能可以畫折線圖的格式（原作者版從來沒成功回傳過，沒有舊專案依賴原格式）。
// 舊積木的 opcode、參數都沒改。不用 async/await（見 claude-notes/extensions-regeneratorRuntime-調查.md）。
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const msg = require('./translation');
const formatMessage = require('format-message');
const core = require('./ts-core');

const menuIconURI = null;
const blockIconURI = null;

let theLocale = null;

class gasoThingSpeak {
    constructor (runtime) {
        theLocale = this._setLocale();
        this.runtime = runtime;
        this.writeKey = '';
        // 要寫入的欄位：[[名稱, 值], …]，同一個欄位只留最後一次的值
        this.writeFields = [];
        // 最近一次寫入的結果：新資料的編號，失敗是 0；還沒寫過是空字串
        this.writeResult = '';
        // 最近一次讀到的 feeds（陣列）與頻道資訊（欄位名稱）
        this.feeds = null;
        this.channel = null;
    }

    _setLocale () {
        let nowLocale = '';
        switch (formatMessage.setup().locale) {
        case 'zh-tw':
            nowLocale = 'zh-tw';
            break;
        default:
            nowLocale = 'en';
            break;
        }
        return nowLocale;
    }

    getInfo () {
        theLocale = this._setLocale();

        return {
            id: 'gasoThingSpeak',
            name: msg.name[theLocale],
            color1: '#4a90e2',
            color2: '#4a90e2',
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'TS_Writekey',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    },
                    text: msg.TS_Writekey[theLocale]
                },
                {
                    opcode: 'TS_col',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        COLUMN: {
                            type: ArgumentType.STRING,
                            defaultValue: msg.field[theLocale][0],
                            menu: 'field'
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    },
                    text: msg.TS_col[theLocale]
                },
                {
                    opcode: 'Write_TS',
                    blockType: BlockType.COMMAND,
                    text: msg.Write_TS[theLocale]
                },
                {
                    opcode: 'TS_writeResult',
                    blockType: BlockType.REPORTER,
                    text: msg.TS_writeResult[theLocale]
                },
                '---',
                {
                    opcode: 'TS_Read',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        },
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    },
                    text: msg.TS_Read[theLocale]
                },
                {
                    opcode: 'TS_lastValue',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        COLUMN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'field1',
                            menu: 'readField'
                        }
                    },
                    text: msg.TS_lastValue[theLocale]
                },
                {
                    opcode: 'TS_valueAt',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        COLUMN: {
                            type: ArgumentType.STRING,
                            defaultValue: 'field1',
                            menu: 'readField'
                        }
                    },
                    text: msg.TS_valueAt[theLocale]
                },
                {
                    opcode: 'TS_count',
                    blockType: BlockType.REPORTER,
                    text: msg.TS_count[theLocale]
                },
                {
                    opcode: 'TS_JSON',
                    blockType: BlockType.REPORTER,
                    text: msg.readJSON[theLocale]
                }
            ],
            menus: {
                field: {
                    acceptReporters: true,
                    items: msg.field[theLocale]
                },
                readField: {
                    acceptReporters: true,
                    items: msg.field[theLocale].map((text, i) => ({text, value: 'field' + (i + 1)}))
                        .concat([{text: msg.timeField[theLocale], value: 'created_at'}])
                }
            }
        };
    }

    // 設定寫入 key，並清掉之前填的欄位
    TS_Writekey (args) {
        this.writeKey = String(args.KEY).trim();
        this.writeFields = [];
    }

    TS_col (args) {
        const name = core.fieldName(args.COLUMN);
        if (!name || name === 'entry_id') {
            console.warn('ThingSpeak: 不認得的欄位', args.COLUMN);
            return;
        }
        this.writeFields = this.writeFields.filter(f => f[0] !== name);
        this.writeFields.push([name, args.VALUE]);
    }

    // 送出；等 ThingSpeak 回應才結束（免費帳號同一頻道約 15 秒才能寫一次，太快會回 0）
    Write_TS () {
        if (!this.writeKey || this.writeFields.length === 0) {
            console.warn('ThingSpeak: 沒有寫入 key 或沒有欄位');
            this.writeResult = 0;
            return;
        }
        const url = core.updateUrl(this.writeKey, this.writeFields);
        return fetch(url)
            .then(res => res.text())
            .then(text => {
                this.writeResult = core.parseUpdate(text);
            })
            .catch(error => {
                console.error('ThingSpeak:', error);
                this.writeResult = 0;
            });
    }

    TS_writeResult () {
        return this.writeResult;
    }

    // 讀取頻道資料（最多 100 筆）；等資料下載完才結束
    TS_Read (args) {
        const url = core.feedsUrl(args.CHANNEL, args.KEY);
        if (!url) {
            console.warn('ThingSpeak: 頻道 ID 要是數字', args.CHANNEL);
            this.feeds = null;
            this.channel = null;
            return;
        }
        return fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(json => {
                this.feeds = core.parseFeeds(json);
                this.channel = this.feeds && json.channel ? json.channel : null;
                if (!this.feeds) console.warn('ThingSpeak: 讀不到資料（私人頻道要填讀取 key）', json);
            })
            .catch(error => {
                console.error('ThingSpeak:', error);
                this.feeds = null;
                this.channel = null;
            });
    }

    TS_lastValue (args) {
        return this.feeds ? core.valueAt(this.feeds, this.feeds.length, args.COLUMN) : '';
    }

    TS_valueAt (args) {
        return core.valueAt(this.feeds, args.N, args.COLUMN);
    }

    TS_count () {
        return this.feeds ? this.feeds.length : 0;
    }

    // 圖表擴充功能可以用的 JSON 文字：[{"時間":"11-28 10:32","Light":"240"}, …]
    TS_JSON () {
        if (this.feeds) return JSON.stringify(core.chartRows(this.feeds, this.channel, theLocale));
        return msg.readJSONErr[theLocale];
    }
}

module.exports = gasoThingSpeak;
