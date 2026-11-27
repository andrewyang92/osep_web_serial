// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 「[欄位] 為 [值]」後面的「值」格子（只在 Scratch 編輯器裡有作用）
 *
 * - 用 scratch-blocks 內建的 FieldTextDropdown：可以打字，旁邊也有下拉箭頭
 * - 前面選的是文字欄位 → 箭頭列出這一欄出現過的值；數字欄位 → 不顯示箭頭，直接打數字
 * - 換了前面的欄位時，值自動換成新欄位的第一個選項（數字欄位清成空白）
 *
 * Scratch GUI 不會幫擴充註冊自訂欄位（customFieldTypes），所以這裡從畫面上任一個欄位
 * 往上找到 Blockly.Field，自己註冊。找不到時（例如在 Node 測試、編輯器還沒載入）回傳 false，
 * 插件改用一般文字格。
 */
'use strict';

const KEY = 'value'; // getInfo 的 customFieldTypes 名稱
const SHADOW_TYPE = 'decisionTree_value';
const FIELD_TYPE = 'field_decisionTree_value';
const COLUMN_MENU = 'decisionTree_menu_columns';
const VALUE_INPUTS = ['VAL', 'YN'];

let registered = false;
let source = null; // 提供選項的插件物件：{valueOptions(col) → string[]}

function workspaces (win) {
    const B = win && win.Blockly;
    if (!B || typeof B.getMainWorkspace !== 'function') return [];
    let ws = null;
    try {
        ws = B.getMainWorkspace();
    } catch (e) {
        return [];
    }
    if (!ws) return [];
    const list = [ws];
    const fly = typeof ws.getFlyout === 'function' ? ws.getFlyout() : null;
    if (fly && typeof fly.getWorkspace === 'function' && fly.getWorkspace()) list.push(fly.getWorkspace());
    return list;
}

/** 從畫面上的積木欄位往上找 Blockly.Field（有 register 和 TYPE_MAP_ 的那個類別） */
function findFieldClass (list) {
    for (const ws of list) {
        const blocks = typeof ws.getAllBlocks === 'function' ? ws.getAllBlocks() : [];
        for (const b of blocks) {
            for (const input of b.inputList || []) {
                for (const f of input.fieldRow || []) {
                    let C = f && f.constructor;
                    while (C) {
                        if (typeof C.register === 'function' && C.TYPE_MAP_) return C;
                        C = C.superClass_ && C.superClass_.constructor;
                    }
                }
            }
        }
    }
    return null;
}

/** 這個「值」格子前面選的欄位；前面放的不是欄位選單（例如放了變數）時回傳 null */
function columnOf (field) {
    const block = field && field.sourceBlock_;
    const parent = block && typeof block.getParent === 'function' ? block.getParent() : null;
    if (!parent || typeof parent.getInputTargetBlock !== 'function') return null;
    const colBlock = parent.getInputTargetBlock('COL');
    if (!colBlock || colBlock.type !== COLUMN_MENU) return null;
    return colBlock.getFieldValue('columns');
}

function optionsFor (field) {
    const col = columnOf(field);
    if (col === null || !source) return [];
    return source.valueOptions(col).map(v => [v, v]);
}

function makeField (TextDropdown) {
    const f = new TextDropdown('', function () {
        return optionsFor(this);
    });
    // scratch-blocks 的 FieldTextDropdown 少了這兩個方法（按箭頭時會用到），在這裡補上
    f.getOptions = function () {
        return optionsFor(this);
    };
    f.onItemSelected = function (menu, menuItem) {
        let value = menuItem.getValue();
        if (this.sourceBlock_) value = this.callValidator(value);
        if (value !== null) this.setValue(value);
    };
    // 外觀和一般的白色輸入格一樣（VM 給自訂格子的是插件的紫色）
    const init = f.init;
    f.init = function () {
        init.call(this);
        const b = this.sourceBlock_;
        if (b && typeof b.setColour === 'function' && b.isShadow && b.isShadow()) {
            b.setColour('#FFFFFF', '#FFFFFF', '#FFFFFF');
        }
    };
    const position = f.positionArrow;
    // 沒有選項（數字欄位）就不顯示箭頭
    f.positionArrow = function (x) {
        const has = optionsFor(this).length > 0;
        if (this.arrow_) this.arrow_.style.display = has ? '' : 'none';
        return has ? position.call(this, x) : 0;
    };
    return f;
}

function rerender (block) {
    if (block && typeof block.render === 'function') {
        try {
            block.render();
        } catch (e) { /* 積木還沒放到畫面上 */ }
    }
}

/** 換了欄位 → 值換成新欄位的選項 */
function onChange (ws, e) {
    if (!e || e.type !== 'change' || e.element !== 'field') return;
    const block = ws.getBlockById(e.blockId);
    if (!block || block.type !== COLUMN_MENU) return;
    const parent = block.getParent();
    if (!parent) return;
    VALUE_INPUTS.forEach(name => {
        const vb = parent.getInput(name) ? parent.getInputTargetBlock(name) : null;
        if (!vb || vb.type !== SHADOW_TYPE) return;
        const field = vb.getField(FIELD_TYPE);
        if (!field) return;
        const opts = optionsFor(field);
        const cur = field.getValue();
        if (opts.length) {
            if (!opts.some(o => o[1] === cur)) field.setValue(opts[0][1]);
        } else if (!/^\s*(>=|<=|>|<|=)?\s*-?\d/.test(String(cur))) {
            field.setValue('');
        }
        rerender(vb);
    });
}

function listen (list) {
    list.forEach(ws => {
        if (ws.__osepDecisionTreeValue || typeof ws.addChangeListener !== 'function') return;
        ws.__osepDecisionTreeValue = true;
        ws.addChangeListener(e => onChange(ws, e));
    });
}

/**
 * 註冊「值」格子。
 * @param {object} ext 插件物件（要有 valueOptions(col)）
 * @param {object} win window
 * @returns {boolean} 可以用自訂格子了
 */
function setup (ext, win) {
    source = ext;
    const list = workspaces(win);
    if (registered) {
        listen(list);
        return true;
    }
    const Field = findFieldClass(list);
    const TextDropdown = Field && Field.TYPE_MAP_.field_textdropdown;
    if (!TextDropdown) return false;
    Field.register(FIELD_TYPE, {fromJson: () => makeField(TextDropdown)});
    registered = true;
    listen(list);
    return true;
}

/** 資料換了：畫面上的值格子重畫（箭頭有沒有要跟著變） */
function refresh (win) {
    workspaces(win).forEach(ws => {
        (ws.getAllBlocks ? ws.getAllBlocks() : []).forEach(b => {
            if (b.type === SHADOW_TYPE) rerender(b);
        });
    });
}

module.exports = {setup, refresh, KEY, SHADOW_TYPE, FIELD_TYPE};
