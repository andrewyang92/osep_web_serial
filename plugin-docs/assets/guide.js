/* 「新增插件」頁面的內容（純 HTML） */
window.OSEP_GUIDE_HTML = `
<h1>新增插件說明</h1>
<p class="lead">每個插件就是 <code>plugins/</code> 資料夾裡的<b>一個檔案</b>。積木的文字、參數、選單可以用工具從插件原始碼自動產生，你只需要補上說明文字。</p>

<div class="step"><div class="step-n">1</div><div>
<h3>從插件原始碼產生資料檔</h3>
<p>在 <code>osep_plugin_docs</code> 資料夾開啟命令列，執行（把最後的資料夾換成你的插件）：</p>
<pre><code>node tools/extract-plugin.js ../osep_web_serial/node_modules/scratch-vm/src/extensions/scratch3_你的插件</code></pre>
<p>工具會自動：</p>
<ul>
<li>產生 <code>plugins/&lt;插件id&gt;.js</code>：每塊積木的中英文文字、類型、參數、預設值、選單選項、分組（依原始碼中的 <code>'---'</code> 分組）、顏色</li>
<li>把積木上的小圖示存成 <code>images/&lt;插件id&gt;/block-icon.svg</code>（或 .png）</li>
<li>把插件加進 <code>plugins/_list.js</code></li>
</ul>
<div class="note">插件更新後（例如新增積木、改積木文字），<b>再執行一次同樣的指令</b>即可同步。你寫的說明會保留；程式碼中已刪除的積木會移到檔案最後的 <code>removedBlocks</code>，讓你決定要不要留著。</div>
</div></div>

<div class="step"><div class="step-n">2</div><div>
<h3>放卡片圖片</h3>
<p>把擴充庫卡片用的圖片複製到 <code>images/&lt;插件id&gt;/</code>：</p>
<ul>
<li><code>card.png</code>：卡片大圖（600×372）</li>
<li><code>small.svg</code>（或 small.png）：卡片左下角的小圖示</li>
</ul>
<p>檔名不同也可以，在資料檔的 <code>card</code>、<code>icon</code> 欄位改成對應的路徑即可。</p>
</div></div>

<div class="step"><div class="step-n">3</div><div>
<h3>填寫說明</h3>
<p>打開 <code>plugins/&lt;插件id&gt;.js</code>，把所有 <code>TODO</code> 換成說明。可以參考現有的 <code>claude.js</code>。</p>
<h3>插件層級的欄位</h3>
<div class="prose"><table>
<thead><tr><th>欄位</th><th>說明</th></tr></thead><tbody>
<tr><td><code>tagline</code></td><td>一句話介紹，顯示在卡片和插件頁最上方</td></tr>
<tr><td><code>tags</code></td><td>分類標籤，例如 <code>['人工智慧', '影像']</code>，首頁可以用標籤篩選</td></tr>
<tr><td><code>needs</code></td><td>使用需求，例如 <code>['網路', '攝影機']</code></td></tr>
<tr><td><code>overview</code></td><td>「這個插件可以做什麼？」的內容</td></tr>
<tr><td><code>highlights</code></td><td>重點卡片：<code>{icon: '💬', title: '…', text: '…'}</code></td></tr>
<tr><td><code>groups[].name / intro</code></td><td>每一組積木的名稱與說明</td></tr>
<tr><td><code>examples</code></td><td>範例作品：<code>{title, intro, script, explain}</code></td></tr>
<tr><td><code>faq</code></td><td>常見問題：<code>{q: '問題', a: '回答'}</code></td></tr>
<tr><td><code>changelog</code></td><td>更新紀錄：<code>{date: '2026-11-18', text: '…'}</code></td></tr>
</tbody></table></div>
<h3>每塊積木的欄位</h3>
<div class="prose"><table>
<thead><tr><th>欄位</th><th>說明</th></tr></thead><tbody>
<tr><td><code>summary</code></td><td>一句話說明（粗體顯示，也會出現在搜尋與速查）</td></tr>
<tr><td><code>detail</code></td><td>詳細說明</td></tr>
<tr><td><code>args.名稱.desc</code></td><td>每個參數空格要填什麼</td></tr>
<tr><td><code>returns</code></td><td>數值／布林積木的回傳值</td></tr>
<tr><td><code>tips</code></td><td>小提醒</td></tr>
<tr><td><code>example</code></td><td>這塊積木的小範例（寫法同下方「範例腳本」）</td></tr>
</tbody></table></div>
<p>積木文字、<code>type</code>、<code>args</code> 的類型與預設值是工具產生的，不用手改，下次同步會被覆蓋。</p>
</div></div>

<div class="step"><div class="step-n">4</div><div>
<h3>打開網站檢查</h3>
<p>直接雙擊 <code>index.html</code> 就能看（不需要伺服器）。資料檔有錯時，頁面最上方會出現紅色提示，告訴你哪個檔案第幾行有問題。</p>
</div></div>

<h2>說明文字的格式</h2>
<div class="prose"><table>
<thead><tr><th>寫法</th><th>效果</th></tr></thead><tbody>
<tr><td>空一行</td><td>新段落</td></tr>
<tr><td><code>**文字**</code></td><td><strong>粗體</strong></td></tr>
<tr><td><code>\`文字\`</code></td><td><code>程式碼</code></td></tr>
<tr><td>每行開頭 <code>- </code></td><td>項目清單</td></tr>
<tr><td>開頭 <code>&gt; </code></td><td>黃色提醒框</td></tr>
<tr><td>開頭 <code>&gt; !</code></td><td>紅色警告框</td></tr>
<tr><td><code>| 欄 | 欄 |</code></td><td>表格（第一列是標題）</td></tr>
<tr><td><code>### 標題</code></td><td>小標題</td></tr>
<tr><td><code>[[opcode]]</code></td><td>連到這個插件的某塊積木，例如 <code>[[ask]]</code>；其他插件用 <code>[[claude.ask]]</code></td></tr>
<tr><td><code>[文字](https://…)</code></td><td>超連結</td></tr>
</tbody></table></div>
<p>說明文字很長時，可以用反引號 <code>\`…\`</code> 包起來，就能直接換行。</p>

<h2>範例腳本的寫法</h2>
<p>範例是一個陣列，由上往下每一個項目就是一塊積木：</p>
<pre><code>script: [
  {t: '當 🏁 被點擊', cat: 'events', type: 'hat'},
  {use: 'setSystem', args: {SYSTEM: '你是親切的助教'}},
  {t: '重複無限次', cat: 'control', type: 'c', body: [
    {t: '詢問 [Q] 並等待', cat: 'sensing', args: {Q: '想問什麼？'}},
    {use: 'ask', args: {QUESTION: {t: '詢問的答案', cat: 'sensing', type: 'reporter'}}},
    {t: '說出 [M]', cat: 'looks', args: {M: {use: 'getAnswer'}}}
  ]}
]</code></pre>
<div data-demo-script='[{"t":"當 🏁 被點擊","cat":"events","type":"hat"},{"use":"setSystem","args":{"SYSTEM":"你是親切的助教"}},{"t":"重複無限次","cat":"control","type":"c","body":[{"t":"詢問 [Q] 並等待","cat":"sensing","args":{"Q":"想問什麼？"}},{"use":"ask","args":{"QUESTION":{"t":"詢問的答案","cat":"sensing","type":"reporter"}}},{"t":"說出 [M]","cat":"looks","args":{"M":{"use":"getAnswer"}}}]}]' data-plugin="claude"></div>

<h3>兩種積木</h3>
<ul>
<li><b>這個插件的積木</b>：<code>{use: 'opcode'}</code>，會自動用插件的顏色、圖示和預設值。別的插件的積木寫 <code>{use: '插件id.opcode'}</code>。</li>
<li><b>Scratch 內建積木</b>：<code>{t: '文字', cat: '分類'}</code>。文字裡的 <code>[名稱]</code> 是空格，內容寫在 <code>args</code>。</li>
</ul>
<h3>cat（分類顏色）</h3>
<p><code>motion</code> 動作、<code>looks</code> 外觀、<code>sound</code> 音效、<code>events</code> 事件、<code>control</code> 控制、<code>sensing</code> 偵測、<code>operators</code> 運算、<code>data</code> 變數、<code>list</code> 清單、<code>pen</code> 畫筆、<code>myblocks</code> 函式積木。也可以用 <code>color: '#FF6680'</code> 自訂顏色。</p>
<h3>type（形狀）</h3>
<p><code>command</code> 一般積木（預設）、<code>hat</code> 事件帽子、<code>reporter</code> 圓角數值、<code>boolean</code> 六角形、<code>c</code> 包住其他積木（裡面放 <code>body</code>，有「否則」時再加 <code>else</code>）。</p>
<h3>args（空格的內容）</h3>
<div class="prose"><table>
<thead><tr><th>寫法</th><th>畫出來</th></tr></thead><tbody>
<tr><td><code>'你好'</code></td><td>白色文字空格</td></tr>
<tr><td><code>{num: '10'}</code></td><td>數字空格</td></tr>
<tr><td><code>{v: '空白', menu: true}</code></td><td>下拉選單</td></tr>
<tr><td><code>{bool: true}</code></td><td>空的六角形空格</td></tr>
<tr><td><code>{use: 'getAnswer'}</code> 或 <code>{t: '…', type: 'reporter'}</code></td><td>放進一塊積木</td></tr>
</tbody></table></div>
<p>想讓好幾段腳本並排（例如兩段同時開始的綠旗腳本），把 <code>script</code> 寫成陣列的陣列：<code>script: [[…第一段…], […第二段…]]</code>。</p>

<h2>調整插件的順序或暫時隱藏</h2>
<p>編輯 <code>plugins/_list.js</code>：網站依這裡的順序顯示；把某一行刪掉（或在前面加 <code>//</code>）就不會顯示那個插件。</p>

<h2>放到網路上</h2>
<p>整個 <code>osep_plugin_docs</code> 資料夾都是靜態檔案，可以直接放到 GitHub Pages 或任何網頁空間。<code>tools/</code> 只在你自己的電腦上用，放上去也沒關係。</p>
`;
