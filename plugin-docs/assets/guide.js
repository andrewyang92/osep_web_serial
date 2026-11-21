// Copyright (c) 2026 Andrew Yang
// SPDX-License-Identifier: BSD-3-Clause
/* 「新增插件」頁面的內容（純 HTML）：OSEP_GUIDE_HTML 中文、OSEP_GUIDE_HTML_EN 英文 */
window.OSEP_GUIDE_HTML = `
<h1>新增插件說明</h1>
<p class="lead">每個插件就是 <code>plugins/</code> 資料夾裡的<b>一個檔案</b>（英文說明另外一個檔案）。積木的文字、參數、選單可以用工具從插件原始碼自動產生，你只需要補上說明文字。</p>

<div class="step"><div class="step-n">1</div><div>
<h3>從插件原始碼產生資料檔</h3>
<p>在 <code>osep_web_serial/plugin-docs</code> 資料夾開啟命令列，執行（把最後的資料夾換成你的插件）：</p>
<pre><code>node tools/extract-plugin.js ../node_modules/scratch-vm/src/extensions/scratch3_你的插件</code></pre>
<p>工具會自動：</p>
<ul>
<li>產生 <code>plugins/&lt;插件id&gt;.js</code>：每塊積木的中英文文字、類型、參數、預設值、選單選項（中英文）、分組（依原始碼中的 <code>'---'</code> 分組）、顏色</li>
<li>把積木上的小圖示存成 <code>images/&lt;插件id&gt;/block-icon.svg</code>（或 .png）</li>
<li>把插件加進 <code>plugins/list.js</code></li>
</ul>
<div class="note">插件更新後（例如新增積木、改積木文字），<b>再執行一次同樣的指令</b>即可同步。你寫的說明會保留；程式碼中已刪除的積木會移到檔案最後的 <code>removedBlocks</code>，讓你決定要不要留著。在積木區隱藏的積木（<code>hideFromPalette</code>）不會顯示在網站上。</div>
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
<tr><td><code>args.名稱.desc</code></td><td>每個參數空格要填什麼（手寫時可以簡寫成 <code>args: {名稱: '說明'}</code>，同步後會補上其他欄位）</td></tr>
<tr><td><code>returns</code></td><td>數值／布林積木的回傳值</td></tr>
<tr><td><code>tips</code></td><td>小提醒</td></tr>
<tr><td><code>example</code></td><td>這塊積木的小範例（寫法同下方「範例腳本」）</td></tr>
</tbody></table></div>
<p>積木文字、<code>type</code>、<code>args</code> 的類型與預設值是工具產生的，不用手改，下次同步會被覆蓋。</p>
</div></div>

<div class="step"><div class="step-n">4</div><div>
<h3>寫英文說明</h3>
<p>新增 <code>plugins/&lt;插件id&gt;.en.js</code>，內容是中文說明的英文版（積木文字、英文選單由工具從插件的英文翻譯產生，不用寫）：</p>
<pre><code>OSEP.addText('插件id', 'en', {
  tagline: '…', tags: ['AI'], needs: ['Internet'],
  overview: \`…\`, highlights: [...],
  groups: [{name: '…', intro: '…'}, ...],   // 順序和中文的組別一樣
  blocks: {
    ask: {summary: '…', detail: '…', returns: '…', tips: '…',
          args: {QUESTION: '…'}, example: [...]}
  },
  examples: [...], faq: [...], changelog: [...]
});</code></pre>
<p>範例腳本裡的內建積木要寫英文（例如 <code>{t: 'say [M]', cat: 'looks'}</code>）。英文沒寫的部分會顯示中文，頁面上方會提示「尚未完整翻譯」；英文沒寫範例的積木，英文頁不顯示範例。</p>
</div></div>

<div class="step"><div class="step-n">5</div><div>
<h3>打開網站檢查</h3>
<p>直接雙擊 <code>index.html</code> 就能看（不需要伺服器）。右上角的按鈕可以切換中文、English，網址加 <code>?lang=en</code> 也可以。資料檔有錯時，頁面最上方會出現紅色提示，告訴你哪個檔案第幾行有問題。</p>
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
<p>編輯 <code>plugins/list.js</code>：網站依這裡的順序顯示；把某一行刪掉（或在前面加 <code>//</code>）就不會顯示那個插件。</p>

<h2>放到網路上</h2>
<p>整個 <code>plugin-docs</code> 資料夾都是靜態檔案，跟著 <code>osep-plugins</code> 分支推到 GitHub，就會出現在 GitHub Pages。<code>tools/</code> 只在你自己的電腦上用，放上去也沒關係。檔名不要用底線開頭（GitHub Pages 會略過）。</p>
`;

window.OSEP_GUIDE_HTML_EN = `
<h1>Add a plugin page</h1>
<p class="lead">Each plugin is <b>one file</b> in the <code>plugins/</code> folder, plus one more file for the English text. A tool reads the block text, inputs and menus from the plugin source code. You only write the descriptions.</p>

<div class="step"><div class="step-n">1</div><div>
<h3>Generate the data file from the plugin source</h3>
<p>Open a terminal in <code>osep_web_serial/plugin-docs</code> and run (replace the last folder with your plugin):</p>
<pre><code>node tools/extract-plugin.js ../node_modules/scratch-vm/src/extensions/scratch3_yourPlugin</code></pre>
<p>The tool will:</p>
<ul>
<li>Create <code>plugins/&lt;plugin id&gt;.js</code> with each block's Chinese and English text, type, inputs, default values, menu options (both languages), groups (split by <code>'---'</code> in the source) and colors</li>
<li>Save the block icon as <code>images/&lt;plugin id&gt;/block-icon.svg</code> (or .png)</li>
<li>Add the plugin to <code>plugins/list.js</code></li>
</ul>
<div class="note">When the plugin changes (new blocks, new block text), <b>run the same command again</b>. Your descriptions are kept. Blocks removed from the code move to <code>removedBlocks</code> at the end of the file so you can decide whether to keep them. Blocks hidden from the palette (<code>hideFromPalette</code>) are not shown on the site.</div>
</div></div>

<div class="step"><div class="step-n">2</div><div>
<h3>Add the card images</h3>
<p>Copy the extension library card images to <code>images/&lt;plugin id&gt;/</code>:</p>
<ul>
<li><code>card.png</code>: the large card image (600×372)</li>
<li><code>small.svg</code> (or small.png): the small icon on the card</li>
</ul>
<p>Other file names work too. Change the <code>card</code> and <code>icon</code> fields in the data file to match.</p>
</div></div>

<div class="step"><div class="step-n">3</div><div>
<h3>Write the Chinese descriptions</h3>
<p>Open <code>plugins/&lt;plugin id&gt;.js</code> and replace every <code>TODO</code>. <code>claude.js</code> is a good reference.</p>
<h3>Plugin fields</h3>
<div class="prose"><table>
<thead><tr><th>Field</th><th>Meaning</th></tr></thead><tbody>
<tr><td><code>tagline</code></td><td>One sentence shown on the card and at the top of the plugin page</td></tr>
<tr><td><code>tags</code></td><td>Category tags. The home page can filter by tag</td></tr>
<tr><td><code>needs</code></td><td>What the plugin needs, for example internet or a camera</td></tr>
<tr><td><code>overview</code></td><td>The "What does this plugin do?" section</td></tr>
<tr><td><code>highlights</code></td><td>Feature cards: <code>{icon: '💬', title: '…', text: '…'}</code></td></tr>
<tr><td><code>groups[].name / intro</code></td><td>Name and introduction of each block group</td></tr>
<tr><td><code>examples</code></td><td>Example projects: <code>{title, intro, script, explain}</code></td></tr>
<tr><td><code>faq</code></td><td>Questions and answers: <code>{q, a}</code></td></tr>
<tr><td><code>changelog</code></td><td>Changes: <code>{date: '2026-11-18', text: '…'}</code></td></tr>
</tbody></table></div>
<h3>Block fields</h3>
<div class="prose"><table>
<thead><tr><th>Field</th><th>Meaning</th></tr></thead><tbody>
<tr><td><code>summary</code></td><td>One sentence. Also used in search and the cheat sheet</td></tr>
<tr><td><code>detail</code></td><td>Full description</td></tr>
<tr><td><code>args.NAME.desc</code></td><td>What to put in each input. You can write <code>args: {NAME: '…'}</code> and the tool fills in the rest</td></tr>
<tr><td><code>returns</code></td><td>What a reporter or Boolean block gives back</td></tr>
<tr><td><code>tips</code></td><td>A short tip</td></tr>
<tr><td><code>example</code></td><td>A small example script (see "Example scripts" below)</td></tr>
</tbody></table></div>
<p>Block text, <code>type</code>, and input types and defaults come from the tool. Do not edit them by hand: the next sync overwrites them.</p>
</div></div>

<div class="step"><div class="step-n">4</div><div>
<h3>Write the English descriptions</h3>
<p>Create <code>plugins/&lt;plugin id&gt;.en.js</code>. The English block text and menus come from the plugin's own English translation, so you only write the descriptions:</p>
<pre><code>OSEP.addText('pluginId', 'en', {
  tagline: '…', tags: ['AI'], needs: ['Internet'],
  overview: \`…\`, highlights: [...],
  groups: [{name: '…', intro: '…'}, ...],   // same order as the Chinese groups
  blocks: {
    ask: {summary: '…', detail: '…', returns: '…', tips: '…',
          args: {QUESTION: '…'}, example: [...]}
  },
  examples: [...], faq: [...], changelog: [...]
});</code></pre>
<p>Write built-in Scratch blocks in English in example scripts, for example <code>{t: 'say [M]', cat: 'looks'}</code>. Anything missing in English is shown in Chinese, with a note at the top of the page. A block with no English example shows no example on the English page.</p>
</div></div>

<div class="step"><div class="step-n">5</div><div>
<h3>Check the site</h3>
<p>Double-click <code>index.html</code>. No server is needed. The button at the top right switches between 中文 and English; adding <code>?lang=en</code> to the address works too. If a data file has an error, a red note at the top of the page shows the file and line number.</p>
</div></div>

<h2>Text formatting</h2>
<div class="prose"><table>
<thead><tr><th>Write</th><th>Result</th></tr></thead><tbody>
<tr><td>A blank line</td><td>New paragraph</td></tr>
<tr><td><code>**text**</code></td><td><strong>Bold</strong></td></tr>
<tr><td><code>\`text\`</code></td><td><code>Code</code></td></tr>
<tr><td><code>- </code> at the start of each line</td><td>Bulleted list</td></tr>
<tr><td><code>&gt; </code> at the start</td><td>Yellow note</td></tr>
<tr><td><code>&gt; !</code> at the start</td><td>Red warning</td></tr>
<tr><td><code>| cell | cell |</code></td><td>Table (first row is the header)</td></tr>
<tr><td><code>### Title</code></td><td>Subheading</td></tr>
<tr><td><code>[[opcode]]</code></td><td>Link to a block in this plugin, e.g. <code>[[ask]]</code>. For other plugins: <code>[[claude.ask]]</code></td></tr>
<tr><td><code>[text](https://…)</code></td><td>Link</td></tr>
</tbody></table></div>
<p>For long text, wrap it in backticks <code>\`…\`</code> so you can use line breaks.</p>

<h2>Example scripts</h2>
<p>An example is an array. Each item, from top to bottom, is one block:</p>
<pre><code>script: [
  {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
  {use: 'setSystem', args: {SYSTEM: 'You are a friendly tutor'}},
  {t: 'forever', cat: 'control', type: 'c', body: [
    {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'What do you want to ask?'}},
    {use: 'ask', args: {QUESTION: {t: 'answer', cat: 'sensing', type: 'reporter'}}},
    {t: 'say [M]', cat: 'looks', args: {M: {use: 'getAnswer'}}}
  ]}
]</code></pre>
<div data-demo-script='[{"t":"when 🏁 clicked","cat":"events","type":"hat"},{"use":"setSystem","args":{"SYSTEM":"You are a friendly tutor"}},{"t":"forever","cat":"control","type":"c","body":[{"t":"ask [Q] and wait","cat":"sensing","args":{"Q":"What do you want to ask?"}},{"use":"ask","args":{"QUESTION":{"t":"answer","cat":"sensing","type":"reporter"}}},{"t":"say [M]","cat":"looks","args":{"M":{"use":"getAnswer"}}}]}]' data-plugin="claude"></div>

<h3>Two kinds of blocks</h3>
<ul>
<li><b>Blocks from this plugin</b>: <code>{use: 'opcode'}</code>. The plugin's color, icon and default values are used. For another plugin's block: <code>{use: 'pluginId.opcode'}</code>.</li>
<li><b>Built-in Scratch blocks</b>: <code>{t: 'text', cat: 'category'}</code>. <code>[NAME]</code> in the text is an input; put its content in <code>args</code>.</li>
</ul>
<h3>cat (category color)</h3>
<p><code>motion</code>, <code>looks</code>, <code>sound</code>, <code>events</code>, <code>control</code>, <code>sensing</code>, <code>operators</code>, <code>data</code> (variables), <code>list</code>, <code>pen</code>, <code>myblocks</code>. Or set your own color with <code>color: '#FF6680'</code>.</p>
<h3>type (shape)</h3>
<p><code>command</code> (default), <code>hat</code>, <code>reporter</code> (rounded), <code>boolean</code> (hexagon), <code>c</code> (wraps other blocks: put them in <code>body</code>, and in <code>else</code> for an if-else).</p>
<h3>args (input content)</h3>
<div class="prose"><table>
<thead><tr><th>Write</th><th>Draws</th></tr></thead><tbody>
<tr><td><code>'hello'</code></td><td>White text input</td></tr>
<tr><td><code>{num: '10'}</code></td><td>Number input</td></tr>
<tr><td><code>{v: 'space', menu: true}</code></td><td>Dropdown menu</td></tr>
<tr><td><code>{bool: true}</code></td><td>Empty hexagon input</td></tr>
<tr><td><code>{use: 'getAnswer'}</code> or <code>{t: '…', type: 'reporter'}</code></td><td>A block inside the input</td></tr>
</tbody></table></div>
<p>To show several scripts side by side (for example two green-flag scripts that start together), make <code>script</code> an array of arrays: <code>script: [[…first…], […second…]]</code>.</p>

<h2>Change the plugin order or hide a plugin</h2>
<p>Edit <code>plugins/list.js</code>. The site follows this order. Delete a line (or put <code>//</code> in front of it) to hide that plugin.</p>

<h2>Publishing</h2>
<p>The whole <code>plugin-docs</code> folder is static files. Push it with the <code>osep-plugins</code> branch and it appears on GitHub Pages. <code>tools/</code> is only used on your own computer, but uploading it does no harm. Do not start file names with an underscore: GitHub Pages skips them.</p>
`;
