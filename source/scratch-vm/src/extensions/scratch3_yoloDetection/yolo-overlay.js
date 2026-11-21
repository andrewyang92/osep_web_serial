// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/**
 * 在舞台上畫辨識框（和上傳的圖片）
 *
 * 用 Scratch renderer 的 bitmap skin，放在畫筆圖層（在視訊之上、角色之下），
 * 不會動到畫筆插件畫的東西。畫布是舞台的 2 倍解析度，文字比較清楚。
 */
const STAGE_WIDTH = 480;
const STAGE_HEIGHT = 360;
const RESOLUTION = 2;
const PEN_LAYER = 'pen';

// 依類別編號輪流使用的框線顏色
const COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#32ADE6', '#007AFF',
    '#5856D6', '#AF52DE', '#FF2D55'];
// 淺色底用黑字，其他用白字
const DARK_TEXT = ['#FFCC00', '#34C759', '#00C7BE', '#32ADE6'];

class YoloOverlay {
    /**
     * @param {object} renderer Scratch RenderWebGL
     */
    constructor (renderer) {
        this._renderer = renderer;
        this._skinId = -1;
        this._drawableId = -1;
        this._visible = false;
        this._canvas = document.createElement('canvas');
        this._canvas.width = STAGE_WIDTH * RESOLUTION;
        this._canvas.height = STAGE_HEIGHT * RESOLUTION;
        this._ctx = this._canvas.getContext('2d');
    }

    _ensure () {
        if (this._drawableId !== -1 || !this._renderer) return;
        this._skinId = this._renderer.createBitmapSkin(this._canvas, RESOLUTION);
        this._drawableId = this._renderer.createDrawable(PEN_LAYER);
        this._renderer.updateDrawableSkinId(this._drawableId, this._skinId);
        this._renderer.updateDrawableVisible(this._drawableId, this._visible);
    }

    _commit () {
        this._ensure();
        if (this._skinId === -1) return;
        this._renderer.updateBitmapSkin(this._skinId, this._canvas, RESOLUTION);
    }

    /** 拍舞台畫面時暫時藏起來，免得把自己的框也拍進去 */
    setVisible (visible) {
        this._visible = visible;
        if (this._drawableId !== -1) this._renderer.updateDrawableVisible(this._drawableId, visible);
    }

    clear () {
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._commit();
    }

    /**
     * @param {object} opts
     * @param {Array} opts.objects toStageObjects 的結果（left/top/right/bottom 是舞台像素）
     * @param {function} opts.labelOf 物件 → 顯示文字
     * @param {CanvasImageSource} [opts.image] 要一起顯示的圖片（上傳、網址）
     * @param {object} [opts.fit] stageFit 的結果（有圖片時用）
     */
    draw (opts) {
        const ctx = this._ctx;
        ctx.save();
        ctx.setTransform(RESOLUTION, 0, 0, RESOLUTION, 0, 0);
        ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        if (opts.image && opts.fit) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
            const w = (opts.image.naturalWidth || opts.image.width) * opts.fit.sx;
            const h = (opts.image.naturalHeight || opts.image.height) * opts.fit.sy;
            ctx.drawImage(opts.image, opts.fit.ox, opts.fit.oy, w, h);
        }
        ctx.font = 'bold 12px "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
        ctx.textBaseline = 'top';
        ctx.lineWidth = 2;
        // 低分的先畫，高分的蓋在上面
        const list = opts.objects.slice().reverse();
        for (const o of list) {
            const color = COLORS[o.classId % COLORS.length];
            ctx.strokeStyle = color;
            ctx.strokeRect(o.left, o.top, o.right - o.left, o.bottom - o.top);
            const text = opts.labelOf(o);
            const tw = ctx.measureText(text).width + 8;
            const th = 16;
            const ty = o.top >= th ? o.top - th : o.top;
            const tx = Math.min(Math.max(o.left - 1, 0), STAGE_WIDTH - tw);
            ctx.fillStyle = color;
            ctx.fillRect(tx, ty, tw, th);
            ctx.fillStyle = DARK_TEXT.indexOf(color) >= 0 ? '#000000' : '#FFFFFF';
            ctx.fillText(text, tx + 4, ty + 2);
        }
        ctx.restore();
        this._commit();
    }

    dispose () {
        if (this._drawableId !== -1) {
            this._renderer.destroyDrawable(this._drawableId, PEN_LAYER);
            this._renderer.destroySkin(this._skinId);
        }
        this._drawableId = -1;
        this._skinId = -1;
    }
}

module.exports = YoloOverlay;
