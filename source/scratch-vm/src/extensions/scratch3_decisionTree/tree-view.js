/**
 * 產生顯示決策樹的 HTML 頁面（給彈出視窗或頁面內浮動視窗使用）
 *
 * - 完全自己用 SVG 畫，不需要 CDN，離線也能用
 * - 可滾輪縮放、拖曳移動、符合視窗、下載 PNG
 * - 有預測結果時，把走過的節點與線標成橘色
 *
 * 頁面裡的程式寫在字串中，不會經過 babel，所以只用 ES5 寫法、
 * 不使用反引號與 ${}。
 */
'use strict';

// 類別顏色（不用橘色：橘色保留給預測路徑）
const PALETTE = ['#4C97FF', '#59C059', '#9966FF', '#FF6680', '#0FBD8C', '#5CB1D6', '#CF63CF', '#8C6239',
    '#3D5A80', '#7F8C8D'];

const TEXTS = {
    'en': {
        title: 'Decision Tree',
        predicting: 'Predicting',
        rows: 'rows',
        train: 'train',
        test: 'test',
        accuracyTest: 'Test accuracy',
        accuracyTrain: 'Training accuracy',
        depth: 'depth',
        leaves: 'leaves',
        fit: 'Fit',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        png: 'Download PNG',
        result: 'Prediction',
        confidence: 'confidence',
        via: 'Path',
        unknownValue: 'value not seen in training',
        missing: 'missing',
        hint: 'Scroll to zoom, drag to move',
        stopHere: 'stopped here',
        close: 'Close'
    },
    'zh-tw': {
        title: '決策樹',
        predicting: '預測',
        rows: '筆',
        train: '訓練',
        test: '測試',
        accuracyTest: '測試正確率',
        accuracyTrain: '訓練資料正確率',
        depth: '深度',
        leaves: '葉子',
        fit: '符合視窗',
        zoomIn: '放大',
        zoomOut: '縮小',
        png: '下載圖片',
        result: '預測結果',
        confidence: '信心',
        via: '路徑',
        unknownValue: '訓練資料裡沒有這個值',
        missing: '缺少',
        hint: '滾輪縮放、拖曳移動',
        stopHere: '停在這裡',
        close: '關閉'
    }
};

const PAGE_CSS = [
    '*{box-sizing:border-box}',
    'html,body{margin:0;height:100%;background:#F5F3FB;color:#2B2340;',
    'font-family:"Microsoft JhengHei","PingFang TC","Noto Sans TC","Helvetica Neue",Arial,sans-serif}',
    'body{display:flex;flex-direction:column}',
    'header{background:linear-gradient(90deg,#2E1A78,#8A2BE2);color:#fff;padding:10px 16px;',
    'display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}',
    'header h1{font-size:18px;margin:0;font-weight:700}',
    '.stats{font-size:13px;opacity:.92}',
    '.tools{margin-left:auto;display:flex;gap:6px}',
    'button{border:0;border-radius:16px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;',
    'background:rgba(255,255,255,.18);color:#fff}',
    'button:hover{background:rgba(255,255,255,.32)}',
    '.legend{display:flex;flex-wrap:wrap;gap:6px 14px;padding:8px 16px;font-size:13px;background:#fff;',
    'border-bottom:1px solid #E3DDF3}',
    '.chip{display:inline-flex;align-items:center;gap:5px}',
    '.chip i{width:12px;height:12px;border-radius:3px;display:inline-block}',
    '.result{padding:8px 16px;background:#FFF4E5;border-bottom:1px solid #FFD8A8;font-size:14px}',
    '.result b{font-size:16px}',
    '.result .warn{color:#C0392B}',
    '#stage{flex:1;position:relative;overflow:hidden;cursor:grab}',
    '#stage.drag{cursor:grabbing}',
    '#stage svg{width:100%;height:100%;display:block}',
    '.hint{position:absolute;right:12px;bottom:8px;font-size:12px;color:#8A80A8;pointer-events:none}'
].join('');

/* 以下是頁面裡執行的程式（ES5） */
const PAGE_SCRIPT = [
    '(function(){',
    'var D=window.__DT__,M=D.model,T=D.texts,H=D.highlight;',
    'var FONT=\'"Microsoft JhengHei","PingFang TC","Noto Sans TC","Helvetica Neue",Arial,sans-serif\';',
    'var NS="http://www.w3.org/2000/svg";',
    'var color={};M.classes.forEach(function(c,i){color[c]=D.palette[i%D.palette.length];});',
    'function tint(hex,a){var n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;',
    '  r=Math.round(r+(255-r)*a);g=Math.round(g+(255-g)*a);b=Math.round(b+(255-b)*a);',
    '  return "rgb("+r+","+g+","+b+")";}',
    'function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);',
    '  for(var k in attrs){if(attrs.hasOwnProperty(k))e.setAttribute(k,attrs[k]);}',
    '  if(parent)parent.appendChild(e);return e;}',
    'var ctx=document.createElement("canvas").getContext("2d");',
    'function tw(text,size,bold){ctx.font=(bold?"700 ":"400 ")+size+"px "+FONT;return ctx.measureText(String(text)).width;}',
    'function pct(x){return Math.round(x*1000)/10+"%";}',
    'var hl={};if(H){H.nodeIds.forEach(function(id){hl[id]=true;});}',
    'var lastId=H?H.nodeIds[H.nodeIds.length-1]:-1;',
    // 標題列
    'document.getElementById("ttl").textContent=T.title+"："+T.predicting+"「"+M.target+"」";',
    'var acc=(M.accuracyOn==="test"?T.accuracyTest:T.accuracyTrain)+" "+pct(M.accuracy)+" ("+M.correct+"/"+M.nEval+")";',
    'document.getElementById("stats").textContent=T.train+" "+M.nTrain+" "+T.rows+"、"+T.test+" "+M.nTest+" "+T.rows+"｜"+acc+"｜"+T.depth+" "+M.depth+"、"+T.leaves+" "+M.leaves;',
    'var lg=document.getElementById("legend");M.classes.forEach(function(c){',
    '  var s=document.createElement("span");s.className="chip";var i=document.createElement("i");',
    '  i.style.background=color[c];s.appendChild(i);s.appendChild(document.createTextNode(M.target+" = "+c));lg.appendChild(s);});',
    // 預測結果列
    'if(H){var r=document.getElementById("result");r.style.display="block";',
    '  var html="<b>"+T.result+"："+esc(H.prediction)+"</b>（"+T.confidence+" "+pct(H.confidence)+"）";',
    '  if(H.path.length){html+="　"+T.via+"："+H.path.map(function(p){return esc(p.feature+" "+(p.op==="="?"= ":"")+p.label);}).join(" → ");}',
    '  if(H.unknown){html+="　<span class=warn>"+esc(H.unknown.feature+" = "+H.unknown.value)+"："+T.unknownValue+"，"+T.stopHere+"</span>";}',
    '  if(H.missing&&H.missing.length){html+="　<span class=warn>"+T.missing+"："+esc(H.missing.join("、"))+"</span>";}',
    '  r.innerHTML=html;}',
    'function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});}',
    // 量尺寸
    'var GAP=26,LEVEL=128;',
    'function measure(n){',
    '  if(n.leaf){n.l1=String(n.prediction);n.l2=(n.counts[n.prediction]||0)+"/"+n.n+" "+T.rows+" · "+pct(n.confidence);',
    '    n.w=Math.max(96,tw(n.l1,17,true)+30,tw(n.l2,12,false)+24);}',
    '  else{n.l1=String(n.feature);n.l2=n.n+" "+T.rows;',
    '    n.w=Math.max(110,tw(n.l1,16,true)+30,tw(n.l2,12,false)+24);',
    '    n.children.forEach(function(c){c.lw=tw(c.label,13,true)+18;measure(c.node);});}',
    '  n.h=60;}',
    'function span(n){',
    '  if(n.leaf){n.sw=n.w;return n.sw;}',
    '  var s=0;n.children.forEach(function(c,i){s+=Math.max(span(c.node),c.lw+8)+(i?GAP:0);});',
    '  n.sw=Math.max(n.w,s);return n.sw;}',
    'function place(n,left,depth){',
    '  n.y=depth*LEVEL;',
    '  if(n.leaf){n.x=left+n.sw/2;return;}',
    '  var total=0;n.children.forEach(function(c,i){total+=Math.max(c.node.sw,c.lw+8)+(i?GAP:0);});',
    '  var x=left+(n.sw-total)/2;',
    '  n.children.forEach(function(c){var w=Math.max(c.node.sw,c.lw+8);place(c.node,x+(w-c.node.sw)/2,depth+1);x+=w+GAP;});',
    '  n.x=(n.children[0].node.x+n.children[n.children.length-1].node.x)/2;}',
    'measure(M.tree);span(M.tree);place(M.tree,0,0);',
    'var W=M.tree.sw,Hh=0;(function f(n){Hh=Math.max(Hh,n.y+n.h);if(!n.leaf)n.children.forEach(function(c){f(c.node);});})(M.tree);',
    // 畫圖
    'var svg=el("svg",{xmlns:NS,"font-family":FONT});',
    'document.getElementById("stage").appendChild(svg);',
    'var view=el("g",{},svg);var gl=el("g",{},view),gn=el("g",{},view),gt=el("g",{},view);',
    'function draw(n){',
    '  if(!n.leaf){n.children.forEach(function(c){',
    '    var on=hl[n.id]&&hl[c.node.id];',
    '    var x1=n.x,y1=n.y+n.h,x2=c.node.x,y2=c.node.y,my=(y1+y2)/2;',
    '    el("path",{d:"M"+x1+","+y1+" C"+x1+","+my+" "+x2+","+my+" "+x2+","+y2,fill:"none",',
    '      stroke:on?"#FF8C1A":"#B9AEDA","stroke-width":on?5:2.2},gl);',
    '    var lx=x1+(x2-x1)*0.5,ly=my;',
    '    el("rect",{x:lx-c.lw/2,y:ly-12,width:c.lw,height:24,rx:12,fill:on?"#FF8C1A":"#FFFFFF",',
    '      stroke:on?"#FF8C1A":"#B9AEDA","stroke-width":1.5},gt);',
    '    var t=el("text",{x:lx,y:ly+4.5,"text-anchor":"middle","font-size":13,"font-weight":700,fill:on?"#FFFFFF":"#4B3F72"},gt);',
    '    t.textContent=c.label;draw(c.node);});}',
    '  var on=hl[n.id];var x=n.x-n.w/2,y=n.y;',
    '  var main=n.leaf?color[n.prediction]:"#5B3FB8";',
    '  if(on)el("rect",{x:x-5,y:y-5,width:n.w+10,height:n.h+10,rx:16,fill:"none",stroke:"#FF8C1A","stroke-width":4},gn);',
    '  el("rect",{x:x,y:y,width:n.w,height:n.h,rx:12,fill:n.leaf?tint(main,0.82):"#FFFFFF",stroke:main,"stroke-width":n.leaf?2.5:2},gn);',
    '  var t1=el("text",{x:n.x,y:y+24,"text-anchor":"middle","font-size":n.leaf?17:16,"font-weight":700,fill:n.leaf?main:"#2B2340"},gn);',
    '  t1.textContent=n.l1;',
    '  if(n.leaf){var t2=el("text",{x:n.x,y:y+45,"text-anchor":"middle","font-size":12,fill:"#5A5172"},gn);t2.textContent=n.l2;}',
    '  else{',
    // 類別比例條
    '    var bx=x+12,bw=n.w-24,by=y+36,acc0=0;',
    '    M.classes.forEach(function(c){var k=n.counts[c]||0;if(!k)return;var w=bw*k/n.n;',
    '      el("rect",{x:bx+acc0,y:by,width:w,height:7,fill:color[c]},gn);acc0+=w;});',
    '    el("rect",{x:bx,y:by,width:bw,height:7,rx:2,fill:"none",stroke:"#D8D0EE","stroke-width":1},gn);',
    '    var t3=el("text",{x:n.x,y:y+55,"text-anchor":"middle","font-size":11,fill:"#7A7096"},gn);t3.textContent=n.l2;}',
    '  if(n.id===lastId&&H&&H.unknown){var q=el("text",{x:x+n.w-4,y:y+4,"font-size":18,"font-weight":700,fill:"#C0392B"},gn);q.textContent="?";}',
    '}',
    'draw(M.tree);',
    // 縮放與移動
    'var stage=document.getElementById("stage"),s=1,tx=0,ty=0,PAD=30;',
    'function apply(){view.setAttribute("transform","translate("+tx+","+ty+") scale("+s+")");}',
    'function fit(){var w=stage.clientWidth,h=stage.clientHeight;',
    '  s=Math.min((w-PAD*2)/W,(h-PAD*2)/Hh,1.6);if(!(s>0))s=1;',
    '  tx=(w-W*s)/2;ty=Math.max(PAD,(h-Hh*s)/2);apply();}',
    'function zoomAt(f,cx,cy){var ns=Math.max(0.1,Math.min(6,s*f));tx=cx-(cx-tx)*ns/s;ty=cy-(cy-ty)*ns/s;s=ns;apply();}',
    'stage.addEventListener("wheel",function(e){e.preventDefault();var r=stage.getBoundingClientRect();',
    '  zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top);},{passive:false});',
    'var drag=null;',
    'stage.addEventListener("mousedown",function(e){drag={x:e.clientX,y:e.clientY,tx:tx,ty:ty};stage.className="drag";});',
    'window.addEventListener("mousemove",function(e){if(!drag)return;tx=drag.tx+e.clientX-drag.x;ty=drag.ty+e.clientY-drag.y;apply();});',
    'window.addEventListener("mouseup",function(){drag=null;stage.className="";});',
    'document.getElementById("fit").onclick=fit;',
    'document.getElementById("zin").onclick=function(){zoomAt(1.25,stage.clientWidth/2,stage.clientHeight/2);};',
    'document.getElementById("zout").onclick=function(){zoomAt(0.8,stage.clientWidth/2,stage.clientHeight/2);};',
    'window.addEventListener("resize",fit);fit();',
    // 下載 PNG
    'document.getElementById("png").onclick=function(){',
    '  var P=24,sc=2,ex=svg.cloneNode(true);ex.setAttribute("width",(W+P*2)*sc);ex.setAttribute("height",(Hh+P*2)*sc);',
    '  ex.setAttribute("viewBox",(-P)+" "+(-P)+" "+(W+P*2)+" "+(Hh+P*2));ex.firstChild.setAttribute("transform","");',
    '  var bg=document.createElementNS(NS,"rect");bg.setAttribute("x",-P);bg.setAttribute("y",-P);',
    '  bg.setAttribute("width",W+P*2);bg.setAttribute("height",Hh+P*2);bg.setAttribute("fill","#FFFFFF");ex.insertBefore(bg,ex.firstChild);',
    '  var xml=new XMLSerializer().serializeToString(ex);var img=new Image();',
    '  img.onload=function(){var cv=document.createElement("canvas");cv.width=(W+P*2)*sc;cv.height=(Hh+P*2)*sc;',
    '    cv.getContext("2d").drawImage(img,0,0);var a=document.createElement("a");a.href=cv.toDataURL("image/png");',
    '    a.download="decision-tree.png";document.body.appendChild(a);a.click();document.body.removeChild(a);};',
    '  img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(xml);};',
    'window.__DT_READY__=true;',
    '})();'
].join('\n');

function escapeHtml (s) {
    return String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
}

/** JSON 放進 <script> 時避免 </script> 提早結束 */
function safeJson (obj) {
    return JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

/**
 * @param {object} model dt-core.train() 的結果
 * @param {object} [opts] {locale: 'zh-tw'|'en', highlight: predict() 的結果（另加 prediction）}
 * @returns {string} 完整 HTML
 */
function buildHtml (model, opts) {
    opts = opts || {};
    const locale = opts.locale === 'zh-tw' ? 'zh-tw' : 'en';
    const texts = TEXTS[locale];
    const highlight = opts.highlight ? {
        nodeIds: opts.highlight.nodeIds,
        prediction: opts.highlight.prediction,
        confidence: opts.highlight.confidence,
        path: opts.highlight.path.map(p => ({feature: p.feature, label: p.label, op: p.op})),
        unknown: opts.highlight.unknown,
        missing: opts.highlight.missing
    } : null;
    const data = {
        model: {
            target: model.target, classes: model.classes, tree: model.tree,
            nTrain: model.nTrain, nTest: model.nTest, accuracy: model.accuracy, accuracyOn: model.accuracyOn,
            correct: model.correct, nEval: model.nEval, depth: model.depth, leaves: model.leaves
        },
        texts,
        highlight,
        palette: PALETTE
    };
    const title = `${texts.title} - ${model.target}`;
    return [
        '<!DOCTYPE html>',
        `<html lang="${locale === 'zh-tw' ? 'zh-Hant-TW' : 'en'}"><head><meta charset="UTF-8">`,
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${escapeHtml(title)}</title><style>${PAGE_CSS}</style></head><body>`,
        '<header><h1 id="ttl"></h1><span class="stats" id="stats"></span><span class="tools">',
        `<button id="zout">${texts.zoomOut}</button><button id="zin">${texts.zoomIn}</button>`,
        `<button id="fit">${texts.fit}</button><button id="png">${texts.png}</button></span></header>`,
        '<div class="legend" id="legend"></div>',
        '<div class="result" id="result" style="display:none"></div>',
        `<div id="stage"><span class="hint">${texts.hint}</span></div>`,
        `<script>window.__DT__=${safeJson(data)};</script>`,
        `<script>${PAGE_SCRIPT}</script>`,
        '</body></html>'
    ].join('\n');
}

module.exports = {buildHtml, PALETTE, TEXTS};
