/*
 * 決策樹 插件說明資料
 * 積木文字、參數、類型由 tools/extract-plugin.js 從插件原始碼同步；說明文字是手寫的，重新同步時會保留。
 * 說明文字可用簡單格式：空一行=新段落、**粗體**、`程式碼`、開頭「- 」=清單、「> 」=提醒、「> !」=警告、| 表格 |、[[opcode]]=連到這個插件的積木。
 */
OSEP.addPlugin({
  id: 'decisionTree',
  name: '決策樹',
  nameEn: 'Decision Tree',
  author: 'Andrew Yang',
  updated: '2026-11-21',
  tags: ['人工智慧', '資料分析'],
  needs: ['Google 試算表插件（用自己的資料時）'],
  color: {primary: '#7B3FD9', secondary: '#6230B8', tertiary: '#4E2696'},
  card: 'images/decisionTree/card.png',
  icon: 'images/decisionTree/small.svg',
  blockIcon: 'images/decisionTree/block-icon.svg',
  source: '../node_modules/scratch-vm/src/extensions/scratch3_decisionTree',

  tagline: '把 Google 試算表裡的是非題資料變成一棵決策樹，在新視窗畫出來。',

  overview: `決策樹是一種很好懂的人工智慧：它從資料裡找出「先問哪個問題、再問哪個問題」，最後得到答案。例如從過去 14 天的天氣紀錄，找出「濕度高嗎？→ 是晴天嗎？→ 不去打網球」這樣的規則。

把資料讀進來，插件就會**自動建好決策樹**，再用 [[showTree]] 在新視窗看樹狀圖。資料可以用內建的範例「打網球」，也可以用 Google 試算表插件讀自己的試算表。

> 目前插件**只收是非資料**，而且**訓練、預測功能暫時關閉**：讀入資料後一律用全部資料建樹，只開放「看圖」。訓練與預測的積木先隱藏起來，之後會再開放。

### 試算表要怎麼填
第 1 列是欄位名稱，**最後一欄是答案**（要讓樹判斷的欄位），其他欄是判斷用的問題。每一格都要填是非答案：

| 晴天 | 下雨 | 濕度高 | 有風 | 打網球 |
|---|---|---|---|---|
| 是 | 否 | 是 | 否 | 否 |
| 否 | 是 | 否 | 是 | 否 |
| 否 | 否 | 是 | 否 | 是 |

可以填的說法（不分大小寫，前後空白不影響）：

| 算「是」 | 算「否」 |
|---|---|
| 是、有、會、對、要、真、yes、y、true | 否、不是、沒有、沒、無、不會、不對、錯、不要、假、no、n、false |

> ! **數字不算**（1、0 也不行），空白格也不行。只要有一格不符合，整批資料都不會讀入，[[getStatus]] 會說是哪一欄、第幾列。整列都空白的列會自動略過。`,

  highlights: [
    {icon: '🌳', title: '讀入就建好', text: '資料讀進來就自動建樹，不用調任何參數。'},
    {icon: '🖼️', title: '新視窗看大圖', text: '可以縮放、拖曳、下載成 PNG；瀏覽器擋彈出視窗時會改在本頁顯示。'},
    {icon: '✅', title: '是非題資料', text: '是／否、有／沒有、yes／no 都能用，讀入時統一成「是」「否」，「是」的分支固定在左邊。'},
    {icon: '🔎', title: '錯在哪裡說清楚', text: '資料有問題時，狀態會指出是哪一欄、試算表第幾列。'}
  ],

  groups: [
    {
      name: '讀入資料',
      intro: '先用 [[useSample]] 或 [[setData]] 讀入資料。讀入成功就會自動用全部資料建好決策樹，[[getStatus]] 會顯示結果。',
      blocks: [
        {
          opcode: 'useSample',
          type: 'command',
          text: '使用範例資料（打網球）',
          textEn: 'use sample data (play tennis)',
          summary: '讀入內建的範例資料「打網球」，並建好決策樹。',
          detail: `範例是決策樹的經典教材：14 天的天氣紀錄，以及那天有沒有去打網球。改成是非題版，共 6 個欄位：

| 晴天 | 下雨 | 天氣熱 | 濕度高 | 有風 | 打網球 |
|---|---|---|---|---|---|

答案欄是「打網球」。建好的樹深度 4、有 7 片葉子，第一個問題是「濕度高」。

不需要網路，也不需要 Google 試算表插件，適合第一次試用或上課示範。`,
          tips: '先用範例資料、再用 [[setData]] 讀自己的資料也沒問題，答案欄會改回用自己資料的最後一欄。'
        },
        {
          opcode: 'setData',
          type: 'command',
          text: '設定資料為 [DATA]',
          textEn: 'set data to [DATA]',
          args: {DATA: {type: 'string', value: 'Google 資料', desc: '放入 Google 試算表插件的「讀取的 Google 資料」積木。也可以直接放 JSON 文字或 CSV 文字（第一列是欄位名稱）。'}},
          summary: '讀入自己的資料，並建好決策樹。',
          detail: `讀入時會檢查每一格是不是是非答案（可以填的說法見本頁上方），通過後統一成「是」「否」，再用**全部資料**建樹。

- **最後一欄**是答案欄，其他欄都拿來判斷
- 每一筆都一樣的欄位沒辦法用來判斷，會自動略過，狀態會列出來
- 有任何一格不符合（數字、空白、其他文字），整批都不讀入，之前讀的資料也會清掉

成功時 [[getStatus]] 會顯示「已讀入 N 筆資料、M 個是非欄位，決策樹已建好（用全部資料）」。`,
          tips: '狀態裡的「第幾列」是試算表上的列號（第 1 列是欄位名稱），可以直接到試算表找那一格。',
          example: [
            {t: '取得 Google 試算表共用連結 [U]', color: '#08086E', args: {U: 'https://docs.google.com/spreadsheets/d/…/edit?usp=sharing'}},
            {use: 'setData', args: {DATA: {t: '讀取的 Google 資料', color: '#08086E', type: 'reporter'}}},
            {t: '說出 [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
          ]
        },
        {
          opcode: 'setTarget',
          type: 'command',
          text: '要預測的欄位設為 [COL]',
          textEn: 'set column to predict to [COL]',
          args: {COL: {type: 'string', value: '打網球', desc: '答案欄的欄位名稱，要和試算表第 1 列的文字完全一樣。'}},
          hidden: true,
          summary: '（暫時隱藏）指定哪一欄是答案。',
          detail: `目前隱藏，答案欄一律是**最後一欄**。舊專案裡用到這塊仍可執行：設定後要再讀入一次資料才會用新的答案欄建樹。`
        },
        {
          opcode: 'setFeatures',
          type: 'command',
          text: '用來判斷的欄位設為 [COLS]',
          textEn: 'set columns used for deciding to [COLS]',
          args: {COLS: {type: 'string', value: '全部', desc: '「全部」，或用逗號、頓號分隔的欄位名稱，例如 `晴天、濕度高`。'}},
          hidden: true,
          summary: '（暫時隱藏）只用部分欄位來判斷。',
          detail: `目前隱藏，預設用答案欄以外的全部欄位。舊專案裡用到這塊仍可執行：設定後要再讀入一次資料才會生效。`
        },
        {
          opcode: 'getColumns',
          type: 'reporter',
          text: '資料的欄位',
          textEn: 'data columns',
          summary: '讀入的資料有哪些欄位。',
          returns: '欄位名稱，用「, 」分隔，例如 `晴天, 下雨, 天氣熱, 濕度高, 有風, 打網球`。還沒讀入資料（或讀入失敗）時是空白。'
        },
        {
          opcode: 'getRowCount',
          type: 'reporter',
          text: '資料筆數',
          textEn: 'number of data rows',
          summary: '讀入的資料有幾筆。',
          returns: '筆數（不含欄位名稱那一列、也不含整列空白的列）。還沒讀入或讀入失敗時是 0。',
          tips: '可以用「資料筆數 = 0」判斷讀入是否成功。'
        },
        {
          opcode: 'getStatus',
          type: 'reporter',
          text: '決策樹狀態',
          textEn: 'decision tree status',
          summary: '目前的狀態，或最近一次出錯的原因。',
          detail: `常見的狀態：

| 狀態 | 意思 |
|---|---|
| 尚未設定資料，請先使用「設定資料為」 | 還沒讀入資料 |
| 已讀入 N 筆資料、M 個是非欄位，決策樹已建好（用全部資料） | 成功，可以看圖 |
| …；已略過：有風（每筆都一樣） | 成功，但有欄位每筆都一樣，沒拿來判斷 |
| 「濕度」第 3 列的「85」不是是非答案… | 那一格不是是非答案（例如數字） |
| 「下雨」第 5 列是空白，每一格都要填 是 或 否 | 那一格沒填 |
| 資料是空的，請確認已讀到 Google 試算表的資料 | 放進來的是空白，通常是試算表還沒讀完或讀取失敗 |
| 看不懂這個資料… | 放進來的不是試算表資料 |
| 瀏覽器擋住了彈出視窗，已改在本頁顯示… | 見 [[showTree]] |
| 訓練功能暫時關閉 | 執行了舊專案裡的「訓練決策樹」 |`,
          returns: '一段文字。'
        }
      ]
    },
    {
      name: '看決策樹',
      intro: '讀入資料後就能看圖。',
      blocks: [
        {
          opcode: 'showTree',
          type: 'command',
          text: '在新視窗顯示決策樹',
          textEn: 'show decision tree in new window',
          summary: '開一個新視窗，畫出決策樹。',
          detail: `每個方框是一個問題，往下的線寫著「是」或「否」（「是」固定在左邊），最下面的葉子是答案。方框裡的色條是那裡各種答案的比例。

在視窗裡可以：
- 滾輪縮放、拖曳移動
- 「符合視窗」回到整棵樹
- 下載 PNG 圖片（2 倍解析度，可以放進報告）

再按一次會重複使用同一個視窗；視窗開著時重新讀入資料，圖會自動更新。

> 瀏覽器擋住彈出視窗時，會改在**本頁**用浮動視窗顯示（點外面或「✕ 關閉」關掉），狀態會提示。要用新視窗，請在網址列允許這個網站的彈出式視窗。

> 標題列會寫「訓練 N 筆、測試 0 筆」，這是因為目前一律用全部資料建樹。`,
          tips: '彈出視窗通常要「使用者剛點過」才不會被擋。建議放在「當角色被點擊」或按鍵事件裡；綠旗腳本前面等太久（例如先讀試算表）再開，比較容易被擋。'
        },
        {
          opcode: 'closeTree',
          type: 'command',
          text: '關閉決策樹視窗',
          textEn: 'close decision tree window',
          summary: '關掉決策樹視窗（或本頁的浮動視窗）。',
          detail: '沒開視窗時執行也不會出錯。'
        },
        {
          opcode: 'setTrainPercent',
          type: 'command',
          text: '訓練資料佔 [P] %（其餘用來測試）',
          textEn: 'use [P] % of data for training (rest for testing)',
          args: {P: {type: 'number', value: '70', desc: '1～100。'}},
          hidden: true,
          summary: '（暫時關閉）設定多少資料拿來訓練、多少拿來測試。',
          detail: '訓練功能關閉時沒有作用：讀入資料一律用全部資料建樹。'
        },
        {
          opcode: 'setMaxDepth',
          type: 'command',
          text: '樹的最大深度設為 [D]',
          textEn: 'set max tree depth to [D]',
          args: {D: {type: 'number', value: '5', desc: '1～20，預設 5。'}},
          hidden: true,
          summary: '（暫時隱藏）限制樹最多問幾層問題。',
          detail: '仍有作用，在**下一次讀入資料**時生效。'
        },
        {
          opcode: 'train',
          type: 'command',
          text: '訓練決策樹',
          textEn: 'train decision tree',
          hidden: true,
          summary: '（暫時關閉）用目前的設定重新訓練。',
          detail: '訓練功能關閉時，只會把狀態設成「訓練功能暫時關閉」，已經建好的樹不受影響。'
        },
        {
          opcode: 'getAccuracy',
          type: 'reporter',
          text: '正確率 (%)',
          textEn: 'accuracy (%)',
          hidden: true,
          summary: '（暫時隱藏）決策樹的正確率。',
          returns: '0～100 的數字。目前沒有測試資料，這是樹在訓練資料上的正確率。沒有樹時是空白。'
        },
        {
          opcode: 'getTreeInfo',
          type: 'reporter',
          text: '決策樹的 [PROP]',
          textEn: 'decision tree [PROP]',
          args: {PROP: {type: 'menu', options: ['深度', '葉子數', '訓練筆數', '測試筆數', '用到的欄位', '預測的欄位'], value: '深度', values: ['depth', 'leaves', 'nTrain', 'nTest', 'features', 'target'], desc: '要查的資訊。'}},
          hidden: true,
          summary: '（暫時隱藏）查樹的深度、葉子數、用到哪些欄位等。',
          returns: '數字或文字（欄位用「, 」分隔）。沒有樹時是空白。'
        },
        {
          opcode: 'getRules',
          type: 'reporter',
          text: '決策樹規則',
          textEn: 'decision tree rules',
          hidden: true,
          summary: '（暫時隱藏）把決策樹寫成「如果…且…就…」的文字。',
          returns: '每片葉子一行，例如 `如果 濕度高 = 是 且 晴天 = 是 就 打網球 = 否（3/3 筆）`。沒有樹時是空白。'
        },
        {
          opcode: 'setInput',
          type: 'command',
          text: '預測資料的 [COL] 設為 [VAL]',
          textEn: 'set [COL] of input to [VAL]',
          args: {
            COL: {type: 'string', value: '下雨', desc: '欄位名稱。'},
            VAL: {type: 'string', value: '否', desc: '是非答案，可用的說法和試算表相同。'}
          },
          hidden: true,
          summary: '（暫時隱藏）填一個要預測的情況。'
        },
        {
          opcode: 'clearInput',
          type: 'command',
          text: '清除預測資料',
          textEn: 'clear input',
          hidden: true,
          summary: '（暫時隱藏）清掉用 [[setInput]] 填的資料。'
        },
        {
          opcode: 'predict',
          type: 'reporter',
          text: '預測結果',
          textEn: 'prediction',
          hidden: true,
          summary: '（暫時隱藏）用 [[setInput]] 填的資料，問決策樹答案是什麼。',
          returns: '答案（例如 `是`）。視窗開著時，走過的路徑會標成橘色。'
        },
        {
          opcode: 'predictText',
          type: 'reporter',
          text: '用 [TEXT] 預測',
          textEn: 'predict with [TEXT]',
          args: {TEXT: {type: 'string', value: '下雨=否, 濕度高=是', desc: '用「欄位=值」，以逗號分隔。'}},
          hidden: true,
          summary: '（暫時隱藏）一次填好資料並預測。',
          returns: '答案。'
        },
        {
          opcode: 'getConfidence',
          type: 'reporter',
          text: '預測信心 (%)',
          textEn: 'prediction confidence (%)',
          hidden: true,
          summary: '（暫時隱藏）最後一次預測，那片葉子裡和答案相同的資料佔幾 %。',
          returns: '0～100 的數字。'
        },
        {
          opcode: 'getPath',
          type: 'reporter',
          text: '預測路徑',
          textEn: 'prediction path',
          hidden: true,
          summary: '（暫時隱藏）最後一次預測經過了哪些問題。',
          returns: '例如 `濕度高 = 是 → 晴天 = 是 → 打網球 = 否`。'
        }
      ]
    }
  ],

  examples: [
    {
      title: '看範例的決策樹',
      intro: '不用準備任何資料：點角色就讀入「打網球」範例，並在新視窗畫出決策樹。',
      script: [
        {t: '當角色被點擊', cat: 'events', type: 'hat'},
        {use: 'useSample'},
        {t: '說出 [M] 持續 [S] 秒', cat: 'looks', args: {M: {use: 'getStatus'}, S: {num: '2'}}},
        {use: 'showTree'}
      ],
      explain: '試著回答：濕度高、又是晴天時，會去打網球嗎？從樹的最上面往下走就知道答案。'
    },
    {
      title: '用自己的 Google 試算表',
      intro: '綠旗先讀試算表並建樹；資料沒問題，再點角色看圖（點擊開視窗比較不會被瀏覽器擋）。',
      script: [
        [
          {t: '當 🏁 被點擊', cat: 'events', type: 'hat'},
          {t: '取得 Google 試算表共用連結 [U]', color: '#08086E', args: {U: 'https://docs.google.com/spreadsheets/d/…/edit?usp=sharing'}},
          {use: 'setData', args: {DATA: {t: '讀取的 Google 資料', color: '#08086E', type: 'reporter'}}},
          {t: '說出 [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
        ],
        [
          {t: '當角色被點擊', cat: 'events', type: 'hat'},
          {use: 'showTree'}
        ]
      ],
      explain: '試算表要在「共用」設成「知道連結的任何人都能檢視」，插件會讀第一個工作表。'
    },
    {
      title: '先檢查資料再看圖',
      intro: '資料有錯時讓角色說出錯在哪裡；沒錯才開視窗。',
      script: [
        {t: '當 [K] 鍵被按下', cat: 'events', type: 'hat', args: {K: {v: '空白', menu: true}}},
        {use: 'setData', args: {DATA: {t: '讀取的 Google 資料', color: '#08086E', type: 'reporter'}}},
        {t: '如果 [C] 那麼', cat: 'control', type: 'c', args: {C: {t: '[A] = [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getRowCount'}, B: {num: '0'}}}}, body: [
          {t: '說出 [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
        ], else: [
          {t: '說出 [M] 持續 [S] 秒', cat: 'looks', args: {M: {t: '字串組合 [A] [B]', cat: 'operators', type: 'reporter', args: {A: '欄位：', B: {use: 'getColumns'}}}, S: {num: '2'}}},
          {use: 'showTree'}
        ]}
      ],
      explain: '讀入失敗時「資料筆數」是 0，「決策樹狀態」會說是哪一欄、第幾列有問題。'
    }
  ],

  faq: [
    {q: '為什麼不能填數字？', a: '目前先限定是非資料，讓樹上的每個問題都是「是／否」，最容易看懂。有數字（包括 1、0）的欄位請先改成是非題，例如把「濕度 85」改成「濕度高 = 是」。'},
    {q: '狀態說「第 N 列」，是哪一列？', a: '是試算表左邊的列號。第 1 列是欄位名稱，所以第一筆資料是第 2 列。整列空白的列會略過，但不影響列號。'},
    {q: '哪一欄是答案？', a: '**最後一欄**。請把要讓樹判斷的欄位（例如「打網球」）放在試算表的最右邊。'},
    {q: '按了沒有跳出新視窗？', a: '瀏覽器擋住了彈出視窗，插件會改在本頁顯示決策樹。要用新視窗，請在網址列右邊允許這個網站的彈出式視窗，並把 [[showTree]] 放在「當角色被點擊」之類的事件裡。'},
    {q: '樹裡沒有出現某個欄位？', a: '每筆都一樣的欄位沒辦法用來判斷，會被略過（狀態會列出）。另外，如果某個欄位對分出答案沒有幫助，樹也不會用到它。'},
    {q: '訓練、預測的積木去哪了？', a: '訓練功能暫時關閉，這些積木先在積木區隱藏，之後會再開放。用過它們的舊專案仍可以載入、執行。'},
    {q: '資料會傳到別的地方嗎？', a: '建樹和畫圖都在你的瀏覽器裡完成，不會上傳。讀 Google 試算表時，是由 Google 試算表插件向 Google 下載資料。'}
  ],

  changelog: [
    {date: '2026-11-18', text: '新增決策樹插件：用 Google 試算表的資料訓練決策樹、新視窗畫圖、預測'},
    {date: '2026-11-21', text: '改成只接受是非資料（每一格都要是是非答案，錯誤時指出欄位與列號）；訓練、預測暫時關閉，讀入資料就自動用全部資料建樹，只開放看圖；「是」的分支固定在左邊'},
    {date: '2026-11-21', text: '建立說明頁'}
  ]
});
