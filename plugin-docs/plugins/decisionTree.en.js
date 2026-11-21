/*
 * Decision Tree plugin: English descriptions.
 * Block text, menus and defaults come from plugins/decisionTree.js (synced from the plugin source).
 * Blocks hidden from the palette (training and prediction) are not shown on the site, so they have no English text here.
 */
OSEP.addText('decisionTree', 'en', {
  tagline: 'Turn yes/no data from a Google Sheet into a decision tree, draw it in a new window, and work out chances.',
  tags: ['AI', 'Data analysis'],
  needs: ['Google Sheets plugin (for your own data)'],

  overview: `A decision tree is an easy-to-understand kind of AI: it finds from the data "which question to ask first, which next", until it reaches an answer. For example, from 14 days of weather records it finds a rule like "Humid? Yes. Sunny? Yes. Then no tennis".

Load the data and the plugin **builds the tree automatically**. Then use [[showTree]] to see it in a new window. You can use the built-in sample "play tennis", or read your own sheet with the Google Sheets plugin.

- Let the plugin choose the question for each layer, or **choose them yourself** with [[setLayer]] and compare the two trees
- Use [[probability]] to count chances straight from the data, for example "the chance of playing tennis when it is sunny and windy"

> For now the plugin **only accepts yes/no data**, and **training and prediction are turned off**: the tree is always built from all the rows.

### How to fill in the sheet
Row 1 holds the column names. **The last column is the answer** (what the tree should decide); the other columns are the questions. Every cell must be a yes/no answer:

| Sunny | Rainy | Humid | Windy | Play |
|---|---|---|---|---|
| Yes | No | Yes | No | No |
| No | Yes | No | Yes | No |
| No | No | Yes | No | Yes |

Accepted words (upper or lower case, spaces at the ends are ignored):

| Counts as "Yes" | Counts as "No" |
|---|---|
| yes, y, true, 是, 有, 會, 對, 要, 真 | no, n, false, 否, 不是, 沒有, 沒, 無, 不會, 不對, 錯, 不要, 假 |

> ! **Numbers do not count** (not even 1 and 0), and blank cells are not allowed either. If even one cell is wrong, none of the data is loaded, and [[getStatus]] tells you the column and row. Completely blank rows are skipped.`,

  highlights: [
    {icon: '🌳', title: 'Built on load', text: 'The tree is built as soon as the data is loaded. No settings to tune.'},
    {icon: '🪜', title: 'Choose each layer', text: 'Pick the question for layer 1, layer 2 and so on from dropdown menus, and compare with the automatic tree.'},
    {icon: '🎲', title: 'Work out chances', text: '"The chance of playing tennis when it is sunny and windy" is counted straight from the data.'},
    {icon: '🖼️', title: 'Big picture in a new window', text: 'Zoom, drag and download as PNG. If the browser blocks pop-ups, the tree is shown on the same page.'}
  ],

  groups: [
    {name: 'Load data', intro: 'Load data with [[useSample]] or [[setData]] first. Once it loads, a tree is built from all the rows and [[getStatus]] shows the result.'},
    {name: 'Choose each layer', intro: `Normally the plugin chooses the column for each layer (the one that best separates the answers). This group lets you **decide yourself** what layer 1, layer 2 and so on ask. Compare with the automatic tree to see which questions matter most.

You can set the order before or after loading the data. If data is already loaded, changing the order rebuilds the tree at once, and an open window updates too.`},
    {name: 'See the tree', intro: 'Once data is loaded you can look at the tree.'},
    {name: 'Work out chances', intro: 'Count straight from the data: among the rows that match the conditions, what percentage have the answer "Yes". This does not depend on the tree.'}
  ],

  blocks: {
    useSample: {
      summary: 'Load the built-in "play tennis" sample data and build the tree.',
      detail: `The sample is a classic decision tree example: 14 days of weather and whether tennis was played that day. It is a yes/no version with 6 columns:

| Sunny | Rainy | Hot | Humid | Windy | Play |
|---|---|---|---|---|---|

The answer column is "Play". The automatic tree is 4 layers deep with 7 leaves, and its first question is "Humid".

It needs no internet and no Google Sheets plugin, so it is good for a first try or a class demo. In the Chinese interface the column names are in Chinese (晴天, 下雨, 天氣熱, 濕度高, 有風, 打網球).`,
      tips: 'You can load the sample first and then your own data with [[setData]]. The answer column switches back to the last column of your data.'
    },
    setData: {
      args: {DATA: 'Put in the "Google data" block from the Google Sheets plugin. JSON text or CSV text (first row = column names) also works.'},
      summary: 'Load your own data and build the tree.',
      detail: `Every cell is checked to be a yes/no answer (see the accepted words at the top of this page). Answers are turned into "Yes" and "No", and the tree is built from **all the rows**.

- The **last column** is the answer; all other columns are used as questions
- A column that is the same in every row cannot help decide, so it is skipped and listed in the status
- If any cell is wrong (a number, a blank, other text), nothing is loaded and data loaded before is cleared
- After loading, the column dropdown menus on the blocks switch to the columns of this data

On success, [[getStatus]] shows "Loaded N rows, M yes/no columns. The decision tree is ready (built from all rows)."`,
      tips: 'The row number in the status is the row number in the sheet (row 1 is the column names), so you can go straight to that cell.',
      example: [
        {t: 'get data from Google Sheet URL [U]', color: '#08086E', args: {U: 'https://docs.google.com/spreadsheets/d/…/edit?usp=sharing'}},
        {use: 'setData', args: {DATA: {t: 'Google data', color: '#08086E', type: 'reporter'}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
      ]
    },
    getColumns: {
      summary: 'The columns of the loaded data.',
      returns: 'Column names separated by ", ", for example `Sunny, Rainy, Hot, Humid, Windy, Play`. Empty before data is loaded (or if loading failed).'
    },
    getRowCount: {
      summary: 'How many rows the loaded data has.',
      returns: 'The number of rows (not counting the column-name row or blank rows). 0 before data is loaded or if loading failed.',
      tips: 'Check "number of data rows = 0" to see whether loading worked.'
    },
    getStatus: {
      summary: 'The current status, or the reason for the latest error.',
      detail: `Common messages:

| Status | Meaning |
|---|---|
| No data yet. Use "set data to" first. | No data loaded |
| Loaded N rows, M yes/no columns. The decision tree is ready (built from all rows). | Success; you can look at the tree |
| Loaded N rows. The decision tree follows your layer order: Sunny → Windy | Success, using your own order |
| …; skipped: Windy (same in every row) | Success, but a column was the same in every row and was not used |
| Column "Humidity", row 3: "85" is not a yes/no answer… | That cell is not a yes/no answer (a number, for example) |
| Column "Rainy", row 5 is blank. Every cell must be Yes or No. | That cell is empty |
| Data is empty. Make sure the Google Sheet has been read. | The input was empty; usually the sheet was not read yet, or reading failed |
| Data format not recognized… | The input is not sheet data |
| Layer 3 has no column yet. | A layer was skipped in your order |
| "Sunny" is used in more than one layer. | The same column is in two layers |
| "Play" is the answer column, so it cannot be a layer. | The answer cannot be a question |
| Layer order has column(s) not in the data… | You changed data, and a column in the order is not in the new data |
| 2 row(s) match Sunny=Yes, Windy=Yes; 1 of them have Play = Yes. Chance: 50% | How [[probability]] worked it out |
| No rows match …, so the chance cannot be calculated. | No rows match the conditions |
| Column "Stormy" not found… | A column name in the condition is misspelled |
| Pop-up was blocked by the browser, so the tree is shown on this page… | See [[showTree]] |`,
      returns: 'Text.'
    },
    setLayer: {
      args: {
        LAYER: 'Which layer, starting from 1. The menu goes up to at least 5, or to the number of columns when there are more.',
        COL: 'The column this layer asks about. The menu lists the columns of the current data (not the answer). Before data is loaded, it lists the sample data columns.'
      },
      summary: 'Choose which column a layer of the tree asks about.',
      detail: `Set the layers one by one, for example layer 1 uses "Sunny" and layer 2 uses "Windy". You can set just the first few layers; the number of layers you set is the depth of the tree.

A tree with your own order differs from the automatic one:
- Each layer always asks the column you chose; a branch stops as soon as all its answers are the same
- Branches with the same answer are **not merged**, so you can see every layer
- When a group of rows has only one value left, there is only one branch

To start over, clear the order with [[useAutoOrder]] and set layer 1 again.`,
      tips: 'A column cannot be in two layers, and you cannot skip a layer. These are checked when the tree is built, so a duplicate halfway through a script is fine as long as the final order is right.',
      example: [
        {use: 'useAutoOrder'},
        {use: 'setLayer', args: {LAYER: {v: '1', menu: true}, COL: {v: 'Sunny', menu: true}}},
        {use: 'setLayer', args: {LAYER: {v: '2', menu: true}, COL: {v: 'Windy', menu: true}}}
      ]
    },
    setLayerOrder: {
      args: {COLS: 'Column names separated by commas, for example `Sunny, Windy`. "all" or empty means back to automatic.'},
      summary: 'Type the order of all layers at once.',
      detail: 'Same as [[setLayer]], written in one go: the first column is layer 1, the second is layer 2, and so on. Repeated columns are removed. Useful when a variable or a join block builds the order.'
    },
    useAutoOrder: {
      summary: 'Drop your own order and let the plugin choose each layer again.',
      detail: 'This is the default. If data is already loaded, the tree is rebuilt at once.'
    },
    showTree: {
      summary: 'Open a new window and draw the decision tree.',
      detail: `Each box is a question. The lines below it are labelled "Yes" or "No" ("Yes" is always on the left), and the leaves at the bottom are answers. The colored bar in a box shows the share of each answer there.

In the window you can:
- Zoom with the mouse wheel and drag to move
- Click "Fit" to see the whole tree again
- Download a PNG image (2× resolution, good for reports)

Running it again reuses the same window. While the window is open, loading new data or changing the layer order updates the picture. With your own order, the title shows it, for example "(custom order: Sunny → Windy)".

> If the browser blocks the pop-up, the tree is shown **on this page** in a floating panel instead (click outside it or "✕ Close" to close), and the status says so. To get a new window, allow pop-ups for this site in the address bar.

> The bar under the title says "train N rows, test 0 rows" because the tree is currently always built from all the rows.`,
      tips: 'Pop-ups are usually only allowed right after the user clicks. Put this block under "when this sprite clicked" or a key press. If a green flag script waits a long time first (for example to read a sheet), the pop-up is more likely to be blocked.'
    },
    closeTree: {
      summary: 'Close the decision tree window (or the floating panel on this page).',
      detail: 'Nothing goes wrong if no window is open.'
    },
    condition: {
      args: {COL: 'A column. The menu lists the columns of the current data (not the answer).', YN: 'Yes or No.'},
      summary: 'Build one condition, for example "Sunny=Yes".',
      returns: 'Text like `Sunny=Yes` or `Sunny=No`, to put into [[probability]] or [[condAnd]].'
    },
    condAnd: {
      args: {A: 'A condition, usually [[condition]].', B: 'Another condition.'},
      summary: 'Join two conditions; both must match.',
      returns: 'For example `Sunny=Yes, Windy=Yes`. Empty inputs are skipped. For three or more conditions, put a [[condAnd]] inside another [[condAnd]].'
    },
    probability: {
      args: {COND: 'Conditions, for example `Sunny=Yes, Windy=Yes`. Type them, or put in [[condition]] or [[condAnd]].'},
      summary: 'The chance that the answer is "Yes" under some conditions.',
      detail: `How it is worked out: find every row that matches the conditions, then see what percentage of them have "Yes" in the answer column. In the sample data, "Sunny=Yes, Windy=Yes" matches 2 rows and tennis was played on 1 of them, so the result is 50.

- Separate conditions with commas; all of them must match
- A column name alone (for example \`Sunny, Windy\`) means "Yes"
- Values can be Yes/No, True/False, Y/N and the other accepted words
- With no condition (empty), it uses all the rows

[[getStatus]] shows the working: "2 row(s) match Sunny=Yes, Windy=Yes; 1 of them have Play = Yes. Chance: 50%".`,
      returns: 'A number from 0 to 100 (one decimal place). Empty when no rows match, a column name is wrong, or no data is loaded; [[getStatus]] says why.',
      tips: 'With your own tree order (layer 1 Sunny, layer 2 Windy), the "Sunny=Yes, Windy=Yes" leaf also shows 1/2, so you can check the chance against the tree.',
      example: [
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'probability', args: {COND: {use: 'condAnd', args: {
          A: {use: 'condition', args: {COL: {v: 'Sunny', menu: true}, YN: {v: 'Yes', menu: true}}},
          B: {use: 'condition', args: {COL: {v: 'Windy', menu: true}, YN: {v: 'Yes', menu: true}}}
        }}}}}}
      ]
    }
  },

  examples: [
    {
      title: 'Look at the sample tree',
      intro: 'No data needed: click the sprite to load the "play tennis" sample and draw the tree in a new window.',
      script: [
        {t: 'when this sprite clicked', cat: 'events', type: 'hat'},
        {use: 'useSample'},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {use: 'getStatus'}, S: {num: '2'}}},
        {use: 'showTree'}
      ],
      explain: 'Try answering: when it is humid and sunny, is tennis played? Follow the tree from the top to find out.'
    },
    {
      title: 'Your own order vs. the automatic tree',
      intro: 'Press 1 for the automatic tree, press 2 for a tree that asks "Sunny" first and then "Windy". With the window open, the picture changes too.',
      script: [
        [
          {t: 'when [K] key pressed', cat: 'events', type: 'hat', args: {K: {v: '1', menu: true}}},
          {use: 'useSample'},
          {use: 'useAutoOrder'},
          {use: 'showTree'}
        ],
        [
          {t: 'when [K] key pressed', cat: 'events', type: 'hat', args: {K: {v: '2', menu: true}}},
          {use: 'useSample'},
          {use: 'useAutoOrder'},
          {use: 'setLayer', args: {LAYER: {v: '1', menu: true}, COL: {v: 'Sunny', menu: true}}},
          {use: 'setLayer', args: {LAYER: {v: '2', menu: true}, COL: {v: 'Windy', menu: true}}},
          {use: 'showTree'}
        ]
      ],
      explain: 'The automatic tree asks "Humid" first because it best separates "play" from "don\'t play". In your own tree every layer is visible, so the class can discuss which one is more useful.'
    },
    {
      title: 'Ask the sprite for a chance',
      intro: 'Type some conditions; the sprite says the chance of playing tennis under them, and how it was worked out.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'useSample'},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'Type conditions, e.g. Sunny=Yes, Windy=Yes'}},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: {use: 'probability', args: {COND: {t: 'answer', cat: 'sensing', type: 'reporter'}}}, B: ' %'}}, S: {num: '2'}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
      ],
      explain: 'Typing "Sunny, Windy" works too: a column name alone means "Yes".'
    },
    {
      title: 'Use your own Google Sheet',
      intro: 'The green flag reads the sheet and builds the tree. If the data is fine, click the sprite to see the tree (opening a window on a click is less likely to be blocked).',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {t: 'get data from Google Sheet URL [U]', color: '#08086E', args: {U: 'https://docs.google.com/spreadsheets/d/…/edit?usp=sharing'}},
          {use: 'setData', args: {DATA: {t: 'Google data', color: '#08086E', type: 'reporter'}}},
          {t: 'say [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
        ],
        [
          {t: 'when this sprite clicked', cat: 'events', type: 'hat'},
          {use: 'showTree'}
        ]
      ],
      explain: 'In the sheet\'s "Share" settings, choose "Anyone with the link can view". The plugin reads the first sheet tab.'
    }
  ],

  faq: [
    {q: 'Why can\'t I use numbers?', a: 'For now the data is limited to yes/no, so every question in the tree is a simple Yes/No and easy to read. Turn number columns (including 1 and 0) into yes/no questions first, for example change "Humidity 85" into "Humid = Yes".'},
    {q: 'The status says "row N". Which row is that?', a: 'The row number on the left of the sheet. Row 1 is the column names, so the first data row is row 2. Blank rows are skipped but do not change the numbering.'},
    {q: 'Which column is the answer?', a: '**The last one.** Put the column the tree should decide (for example "Play") at the far right of the sheet.'},
    {q: 'The columns in the dropdown are wrong?', a: 'Before any data is loaded, the menu lists the sample data columns. After you load your own data the menu changes; blocks already in the code area read the list again when you open the menu.'},
    {q: 'My tree and the automatic tree differ. Which is right?', a: 'Both come from the same data. The automatic tree picks the question that best separates the answers at each layer, so it is usually shorter. Your own tree asks in your order all the way down, which is useful for comparing how much each question matters.'},
    {q: 'The chance does not match the numbers on the tree?', a: '[[probability]] counts straight from the data and does not depend on the tree. The automatic tree may not use the columns in your condition. Build your own tree in the order of the condition columns, and the counts on the leaf will match the chance.'},
    {q: 'No new window opens?', a: 'The browser blocked the pop-up, so the tree is shown on the same page. To get a new window, allow pop-ups for this site in the address bar, and put [[showTree]] under an event like "when this sprite clicked".'},
    {q: 'A column is missing from the tree?', a: 'A column that is the same in every row cannot help decide, so it is skipped (the status lists it). Also, if a column does not help separate the answers, the automatic tree will not use it.'},
    {q: 'Where are the training and prediction blocks?', a: 'Training is turned off for now, so those blocks are hidden from the palette. They will come back later. Old projects that use them still load and run.'},
    {q: 'Is my data sent anywhere?', a: 'Building and drawing the tree happen in your browser; nothing is uploaded. When reading a Google Sheet, the Google Sheets plugin downloads the data from Google.'}
  ],

  changelog: [
    {date: '2026-11-18', text: 'Decision Tree plugin added: train a tree on Google Sheets data, draw it in a new window, and predict'},
    {date: '2026-11-21', text: 'Only yes/no data is accepted (every cell must be a yes/no answer; errors give the column and row). Training and prediction turned off for now: loading data builds the tree from all rows, and only viewing is available. "Yes" branches are always on the left'},
    {date: '2026-11-21', text: 'Added blocks to choose each layer yourself (columns from a dropdown menu) and a block to work out chances'}
  ]
});
