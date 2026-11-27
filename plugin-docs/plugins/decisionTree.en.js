/*
 * Decision Tree extension: English descriptions.
 * Block text, menus and defaults come from plugins/decisionTree.js (synced from the extension source).
 * Blocks hidden from the palette (training settings, accuracy, rules) are not shown on the site, so they have no English text here.
 */
OSEP.addText('decisionTree', 'en', {
  tagline: 'Turn Google Sheets data (text or numbers) into a decision tree, draw it in a new window, predict answers and work out chances.',
  tags: ['AI', 'Data analysis'],
  needs: ['Google Sheets extension (for your own data)'],

  overview: `A decision tree is an easy-to-understand kind of AI: it finds from the data "which question to ask first, which next", until it reaches an answer. For example, from 14 days of weather records it finds a rule like "Sunny? Yes. Humidity above 77.5? Yes. Then no tennis".

Load the data and the extension **builds the tree automatically**. Then use [[showTree]] to see it in a new window. You can use the built-in sample "play tennis", or read your own sheet with the Google Sheets extension.

- Let the extension choose the question for each layer, or **choose them yourself** with [[setLayer]] and compare the two trees
- **Predict** with [[predictText]] or [[setInput]]: give a new case and ask the tree for the answer, with its confidence and the path it took
- Use [[probability]] to count chances straight from the data, for example "the chance of playing tennis when it is sunny and the humidity is above 75"

> **Training settings are turned off for now**: the tree is always built from all the rows, with no split into training and testing data.

### How to fill in the sheet
Row 1 holds the column names. **The last column is the answer** (what the tree should decide); the other columns are the questions. Cells can hold text or numbers:

| Outlook | Temperature | Humidity | Wind | Play |
|---|---|---|---|---|
| Sunny | 85 | 85 | Weak | No |
| Overcast | 83 | 86 | Weak | Yes |
| Rain | 65 | 70 | Strong | No |

- **Text columns** (like Outlook): each value is a branch, for example three branches "Sunny / Overcast / Rain"
- **Number columns** (like Temperature, Humidity): a column where every cell is a number (blanks don't count) is a number column. The extension finds a split point by itself, for example two branches "Humidity ≤ 77.5" and "> 77.5"
- The answer column can be any text too: "Yes / No", "Go / Stay", "A / B / C" all work

> If even one cell is text, the whole column is treated as text. Don't add units to numbers (write \`85\`, not \`85%\`).`,

  highlights: [
    {icon: '🌳', title: 'Built on load', text: 'The tree is built as soon as the data is loaded. Text and number columns both work.'},
    {icon: '🪜', title: 'Choose each layer', text: 'Pick the question for layer 1, layer 2 and so on from dropdown menus, and compare with the automatic tree.'},
    {icon: '🔮', title: 'Predict and count chances', text: 'Ask the tree about a new case, or count "the chance of playing tennis when it is sunny" straight from the data.'},
    {icon: '🖼️', title: 'Big picture in a new window', text: 'Zoom, drag and download as PNG. If the browser blocks pop-ups, the tree is shown on the same page.'}
  ],

  groups: [
    {name: 'Load data', intro: 'Load data with [[useSample]] or [[setData]] first. Once it loads, a tree is built from all the rows and [[getStatus]] shows the result.'},
    {name: 'Choose each layer', intro: `Normally the extension chooses the column for each layer (the one that best separates the answers). This group lets you **decide yourself** what layer 1, layer 2 and so on ask. Compare with the automatic tree to see which questions matter most.

You can set the order before or after loading the data. If data is already loaded, changing the order rebuilds the tree at once, and an open window updates too.`},
    {name: 'See the tree', intro: 'Once data is loaded you can look at the tree.'},
    {name: 'Ask questions: predict and chances', intro: `Ask the tree or the data with conditions. Conditions are always written the same way: \`column=value\`, with several conditions separated by commas, for example \`Outlook=Sunny, Humidity>75\`.

| Written as | Text column | Number column |
|---|---|---|
| \`=\` | Yes (the value must appear in that column) | Yes |
| \`>\` \`<\` \`>=\` \`<=\` | No | Yes |

- [[predictText]]: asks the **tree** for the answer (only \`=\`)
- [[probability]]: counts straight from the **data**, whatever the tree looks like

You can type the conditions, or build them with [[condition]] and [[condAnd]] so there are no typos.`},
    {name: 'Fill in a case column by column to predict', intro: 'The same prediction as [[predictText]], set one column at a time. Handy with the "ask" block, so the user answers one question at a time.'}
  ],

  blocks: {
    useSample: {
      summary: 'Load the built-in "play tennis" sample data and build the tree.',
      detail: `The sample is a classic decision tree example: 14 days of weather and whether tennis was played that day. It has 5 columns:

| Column | Type | Values |
|---|---|---|
| Outlook | Text | Sunny, Overcast, Rain |
| Temperature | Number | 64–85 (°F) |
| Humidity | Number | 65–96 (%) |
| Wind | Text | Weak, Strong |
| Play | Text (answer) | No, Yes |

The automatic tree is 2 layers deep with 5 leaves: it asks "Outlook" first, then "Humidity" when sunny and "Wind" when rainy; overcast days always mean tennis.

It needs no internet and no Google Sheets extension, so it is good for a first try or a class demo. In the Chinese interface the column names and values are in Chinese (天氣, 溫度, 濕度, 風, 打網球).`,
      tips: 'You can load the sample first and then your own data with [[setData]]. The answer column switches back to the last column of your data.'
    },
    setData: {
      args: {DATA: 'Put in the "Google data" block from the Google Sheets extension. JSON text or CSV text (first row = column names) also works.'},
      summary: 'Load your own data and build the tree.',
      detail: `The tree is built from **all the rows**, and values are kept as they are (not turned into Yes / No).

- The **last column** is the answer; all other columns are used as questions
- A column that is all numbers is a number column; the rest are text columns (see the top of this page)
- A column that is the same in every row, or a text column that is different in every row (like names or seat numbers), cannot help decide, so it is skipped and listed in the status
- Rows with a blank answer are not used to build the tree; blanks in other columns are fine
- After loading, the column, value and answer dropdown menus on the blocks switch to this data

On success, [[getStatus]] shows "Loaded N rows, M columns. The decision tree is ready (built from all rows)."`,
      tips: 'Spaces around column names are removed. "Sunny" and "Sun" in the same column count as two different values, so spell values the same way.',
      example: [
        {t: 'get data from Google Sheet URL [U]', color: '#08086E', args: {U: 'https://docs.google.com/spreadsheets/d/…/edit?usp=sharing'}},
        {use: 'setData', args: {DATA: {t: 'Google data', color: '#08086E', type: 'reporter'}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
      ]
    },
    getColumns: {
      summary: 'The columns of the loaded data.',
      returns: 'Column names separated by ", ", for example `Outlook, Temperature, Humidity, Wind, Play`. Empty before data is loaded (or if loading failed).'
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
| Loaded N rows, M columns. The decision tree is ready (built from all rows). | Success; you can look at the tree and predict |
| Loaded N rows. The decision tree follows your layer order: Wind → Outlook | Success, using your own order |
| …; skipped: Name (different in every row) | Success, but a column was not used |
| Data is empty. Make sure the Google Sheet has been read. | The input was empty; usually the sheet was not read yet, or reading failed |
| Data format not recognized… | The input is not sheet data |
| Layer 3 has no column yet. | A layer was skipped in your order |
| "Outlook" is used in more than one layer. | The same column is in two layers |
| "Play" is the answer column, so it cannot be a layer. | The answer cannot be a question |
| Layer order has column(s) not in the data… | You changed data, and a column in the order is not in the new data |
| Prediction: Play = No (confidence 100%) | Prediction worked |
| Input is missing: Humidity | The tree asked about a column you did not give; that step followed the way most rows went |
| To predict, give an exact value with "=" (for example Humidity=70). | The prediction used > or < |
| 5 row(s) match Outlook=Sunny; 2 of them have Play = Yes. Chance: 40% | How [[probability]] worked it out |
| No rows match …, so the chance cannot be calculated. | No rows match the conditions |
| Column "Stormy" not found… | A column name in the condition is misspelled |
| "Outlook" has no value "Snow". Values: Sunny、Overcast、Rain | A value in a text column is misspelled |
| "Outlook" is a text column, so only "=" can be used. | A text column used > or < |
| "Temperature" is a number column, but "hot" is not a number. | Number columns need numbers |
| "Play" has no answer "Go". Answers: No、Yes | The answer chosen in [[probability]] is not in the answer column |
| Pop-up was blocked by the browser, so the tree is shown on this page… | See [[showTree]] |`,
      returns: 'Text.'
    },
    setLayer: {
      args: {
        LAYER: 'Which layer, starting from 1. The menu goes up to at least 5, or to the number of columns when there are more.',
        COL: 'The column this layer asks about. The menu lists the columns of the current data (not the answer). Before data is loaded, it lists the sample data columns.'
      },
      summary: 'Choose which column a layer of the tree asks about.',
      detail: `Set the layers one by one, for example layer 1 uses "Wind" and layer 2 uses "Outlook". You can set just the first few layers; the number of layers you set is the depth of the tree.

A tree with your own order differs from the automatic one:
- Each layer always asks the column you chose; a branch stops as soon as all its answers are the same
- Branches with the same answer are **not merged**, so you can see every layer
- Number columns still find their own split point, giving a ≤ branch and a > branch

To start over, clear the order with [[useAutoOrder]] and set layer 1 again.`,
      tips: 'A column cannot be in two layers, and you cannot skip a layer. These are checked when the tree is built, so a duplicate halfway through a script is fine as long as the final order is right.',
      example: [
        {use: 'useAutoOrder'},
        {use: 'setLayer', args: {LAYER: {v: '1', menu: true}, COL: {v: 'Wind', menu: true}}},
        {use: 'setLayer', args: {LAYER: {v: '2', menu: true}, COL: {v: 'Outlook', menu: true}}}
      ]
    },
    setLayerOrder: {
      args: {COLS: 'Column names separated by commas, for example `Wind, Outlook`. "all" or empty means back to automatic.'},
      summary: 'Type the order of all layers at once.',
      detail: 'Same as [[setLayer]], written in one go: the first column is layer 1, the second is layer 2, and so on. Repeated columns are removed. Useful when a variable or a join block builds the order.'
    },
    useAutoOrder: {
      summary: 'Drop your own order and let the extension choose each layer again.',
      detail: 'This is the default. If data is already loaded, the tree is rebuilt at once.'
    },
    showTree: {
      summary: 'Open a new window and draw the decision tree.',
      detail: `Each box is a question, and the lines below it are labelled with answers: one line per value for a text column (for example Sunny / Overcast / Rain), and two lines "≤ 77.5" and "> 77.5" for a number column. The leaves at the bottom are answers, and the colored bar in a box shows the share of each answer there.

In the window you can:
- Zoom with the mouse wheel and drag to move
- Click "Fit" to see the whole tree again
- Download a PNG image (2× resolution, good for reports)

Running it again reuses the same window. While the window is open, loading new data or changing the layer order updates the picture, and after a prediction the path taken is highlighted in orange. With your own order, the title shows it, for example "(custom order: Wind → Outlook)".

> If the browser blocks the pop-up, the tree is shown **on this page** in a floating panel instead (click outside it or "✕ Close" to close), and the status says so. To get a new window, allow pop-ups for this site in the address bar.

> The bar under the title says "train N rows, test 0 rows" because the tree is currently always built from all the rows.`,
      tips: 'Pop-ups are usually only allowed right after the user clicks. Put this block under "when this sprite clicked" or a key press. If a green flag script waits a long time first (for example to read a sheet), the pop-up is more likely to be blocked.'
    },
    closeTree: {
      summary: 'Close the decision tree window (or the floating panel on this page).',
      detail: 'Nothing goes wrong if no window is open.'
    },
    condition: {
      args: {
        COL: 'A column. The menu lists the columns of the current data (not the answer).',
        YN: 'The value. For a text column, the dropdown lists the values in that column. A number column has no dropdown: type a number, or `>75`, `<=80` and so on.'
      },
      summary: 'Build one condition, for example "Outlook=Sunny" or "Humidity>75".',
      detail: 'When you change the column, the value switches to the first value of the new column (cleared for a number column, so you can type your own).',
      returns: 'Text like `Outlook=Sunny` or `Humidity>75`, to put into [[predictText]], [[probability]] or [[condAnd]].'
    },
    condAnd: {
      args: {A: 'A condition, usually [[condition]].', B: 'Another condition.'},
      summary: 'Join two conditions; both must match.',
      returns: 'For example `Outlook=Sunny, Humidity>75`. Empty inputs are skipped. For three or more conditions, put a [[condAnd]] inside another [[condAnd]].'
    },
    predictText: {
      args: {TEXT: 'The case to predict, as `column=value` separated by commas, for example `Outlook=Sunny, Humidity=90`. You can also put in [[condition]] or [[condAnd]].'},
      summary: 'Give a new case and ask the decision tree for the answer.',
      detail: `Starting at the top of the tree, the values you give lead down the branches; the leaf it reaches is the answer.

- Only the columns the tree asks about are needed (the sample tree never asks about Temperature, for example)
- If the tree asks about a column you did not give, that step follows the way most rows went, and the status says "Input is missing: Humidity"
- Values in text columns must appear in the data; number columns need numbers
- Only \`=\` works here, not > or < (to ask about "humidity above 75", use [[probability]])

On success, [[getStatus]] shows "Prediction: Play = No (confidence 100%)". With the window open, the path taken is highlighted in orange.`,
      returns: 'The answer (for example `No`). Empty if the data, a column or a value is wrong; [[getStatus]] says why.',
      example: [
        {use: 'useSample'},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'predictText', args: {TEXT: 'Outlook=Sunny, Humidity=90'}}}}
      ]
    },
    getConfidence: {
      summary: 'The confidence of the last prediction: the percentage of rows in the leaf it reached that have the predicted answer.',
      detail: 'Every leaf in the sample tree has only one answer, so this is always 100. With messier data, or a shallow tree in your own order, a leaf can mix answers and the confidence is lower; for example a leaf with 2 of 3 rows "No" gives 66.7.',
      returns: 'A number from 0 to 100 (one decimal place). Empty before any prediction or if it failed.'
    },
    getPath: {
      summary: 'The questions the last prediction went through.',
      detail: 'Useful for explaining "why this answer".',
      returns: 'For example `Outlook = Sunny → Humidity > 77.5 → Play = No`. Empty before any prediction or if it failed.'
    },
    probability: {
      args: {
        COND: 'Conditions, for example `Outlook=Sunny, Humidity>75`. Type them, or put in [[condition]] or [[condAnd]]. Empty = all rows.',
        ANS: 'Which answer to work out the chance for. The menu lists the values in the answer column (for example Yes, No).'
      },
      summary: 'The chance that the answer is a given value under some conditions.',
      detail: `How it is worked out: find every row that matches the conditions, then see what percentage of them have the chosen answer. In the sample data, "Outlook=Sunny" matches 5 rows and tennis was played on 2 of them, so the chance of "Yes" is 40.

- Separate conditions with commas; all of them must match
- Number columns can use \`>\` \`<\` \`>=\` \`<=\`, for example \`Temperature>=80\`
- With no condition (empty), it uses all the rows (in the sample, 9 of 14 rows are "Yes": 64.3)

[[getStatus]] shows the working: "5 row(s) match Outlook=Sunny; 2 of them have Play = Yes. Chance: 40%".`,
      returns: 'A number from 0 to 100 (one decimal place). Empty when no rows match, a condition is wrong, or no data is loaded; [[getStatus]] says why.',
      tips: 'To compare with the tree, build your own tree in the order of the condition columns; the counts on the leaf then match how the chance is counted.',
      example: [
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'probability', args: {
          COND: {use: 'condAnd', args: {
            A: {use: 'condition', args: {COL: {v: 'Outlook', menu: true}, YN: {v: 'Sunny', menu: true}}},
            B: {use: 'condition', args: {COL: {v: 'Humidity', menu: true}, YN: '>75'}}
          }},
          ANS: {v: 'Yes', menu: true}
        }}}}
      ]
    },
    setInput: {
      args: {
        COL: 'A column. The menu lists the columns of the current data (not the answer).',
        VAL: 'The value. For a text column the dropdown lists the values in that column; for a number column, type a number.'
      },
      summary: 'Fill in one column of the case to predict.',
      detail: 'After filling in the columns, use [[predict]] to get the answer. Values stay until [[clearInput]]; if you set the same column twice, the later value is used.',
      example: [
        {use: 'clearInput'},
        {use: 'setInput', args: {COL: {v: 'Outlook', menu: true}, VAL: {v: 'Rain', menu: true}}},
        {use: 'setInput', args: {COL: {v: 'Wind', menu: true}, VAL: {v: 'Strong', menu: true}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'predict'}}}
      ]
    },
    clearInput: {
      summary: 'Clear the values filled in with [[setInput]].',
      detail: 'Clear them before each new case, so values left from last time are not used.'
    },
    predict: {
      summary: 'Ask the decision tree for the answer, using the values filled in with [[setInput]].',
      detail: 'Works the same way as [[predictText]]; afterwards you can use [[getConfidence]] and [[getPath]] too.',
      returns: 'The answer (for example `No`). With the window open, the path taken is highlighted in orange.'
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
      explain: 'Try answering: when it is sunny with humidity 85, is tennis played? Follow the tree from the top: Outlook = Sunny → Humidity > 77.5 → No.'
    },
    {
      title: 'Your own order vs. the automatic tree',
      intro: 'Press 1 for the automatic tree, press 2 for a tree that asks "Wind" first and then "Outlook". With the window open, the picture changes too.',
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
          {use: 'setLayer', args: {LAYER: {v: '1', menu: true}, COL: {v: 'Wind', menu: true}}},
          {use: 'setLayer', args: {LAYER: {v: '2', menu: true}, COL: {v: 'Outlook', menu: true}}},
          {use: 'showTree'}
        ]
      ],
      explain: 'The automatic tree needs only 5 leaves, each with a single answer. The tree that asks Wind first has 6 leaves, and two of them mix "Yes" and "No". Discuss why the automatic tree asks Outlook first.'
    },
    {
      title: 'Ask the sprite: will we play tennis today?',
      intro: 'The sprite asks about the outlook, humidity and wind one at a time, then says the tree\'s prediction and the reason.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'useSample'},
        {use: 'clearInput'},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'What is the outlook? (Sunny, Overcast, Rain)'}},
        {use: 'setInput', args: {COL: {v: 'Outlook', menu: true}, VAL: {t: 'answer', cat: 'sensing', type: 'reporter'}}},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'What is the humidity? (e.g. 80)'}},
        {use: 'setInput', args: {COL: {v: 'Humidity', menu: true}, VAL: {t: 'answer', cat: 'sensing', type: 'reporter'}}},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'How is the wind? (Weak, Strong)'}},
        {use: 'setInput', args: {COL: {v: 'Wind', menu: true}, VAL: {t: 'answer', cat: 'sensing', type: 'reporter'}}},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'Play tennis: ', B: {use: 'predict'}}}, S: {num: '2'}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getPath'}}}
      ],
      explain: 'Answering "Sunny, 70, Weak" gives "Yes", with the path "Outlook = Sunny → Humidity ≤ 77.5 → Play = Yes". If the outlook is "Overcast", the tree does not need the humidity or wind at all.'
    },
    {
      title: 'Ask the sprite for a chance',
      intro: 'Type some conditions; the sprite says the chance of playing tennis under them, and how it was worked out.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'useSample'},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'Type conditions, e.g. Outlook=Sunny, Humidity>75'}},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {
          A: {use: 'probability', args: {COND: {t: 'answer', cat: 'sensing', type: 'reporter'}, ANS: {v: 'Yes', menu: true}}},
          B: ' %'
        }}, S: {num: '2'}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getStatus'}}}
      ],
      explain: 'Try `Outlook=Sunny` (40%), `Wind=Strong` (50%) or `Temperature>=80` (50%). If a column or value is misspelled, the status lists the ones you can use.'
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
      explain: 'In the sheet\'s "Share" settings, choose "Anyone with the link can view". The extension reads the first sheet tab.'
    }
  ],

  faq: [
    {q: 'What is the difference between number and text columns?', a: 'A column where every cell is a number (blanks don\'t count) is a number column, and the tree finds a split point such as "Humidity ≤ 77.5". If even one cell is text, the column is treated as text, with one branch per value. Don\'t add units or percent signs to numbers.'},
    {q: 'Which column is the answer?', a: '**The last one.** Put the column the tree should decide (for example "Play") at the far right of the sheet. The answer can be any text, not only "Yes / No".'},
    {q: 'The columns or values in the dropdown are wrong?', a: 'Before any data is loaded, the menus list the sample data. After you load your own data the menus change to its columns and values; blocks already in the code area read the list again when you open the menu.'},
    {q: 'Why does the value box sometimes have a dropdown and sometimes not?', a: 'When the column before it is a text column, it lists the values in that column for you to pick. A number column has no fixed choices, so the box is empty and you type a number.'},
    {q: 'What is the difference between predicting and chances?', a: '[[predictText]] asks the **tree**: it follows the tree\'s questions down to a leaf. [[probability]] counts the **data**: what percentage of the matching rows have an answer, whatever the tree looks like.'},
    {q: 'The status says "Input is missing" when predicting?', a: 'The tree asked about a column you did not give, so that step followed the way most rows went, and there is still an answer. For a more reliable answer, fill in every column the tree asks about.'},
    {q: 'My tree and the automatic tree differ. Which is right?', a: 'Both come from the same data. The automatic tree picks the question that best separates the answers at each layer, so it is usually shorter with purer leaves. Your own tree asks in your order all the way down, which is useful for comparing how much each question matters.'},
    {q: 'No new window opens?', a: 'The browser blocked the pop-up, so the tree is shown on the same page. To get a new window, allow pop-ups for this site in the address bar, and put [[showTree]] under an event like "when this sprite clicked".'},
    {q: 'A column is missing from the tree?', a: 'A column that is the same in every row, or a text column that is different in every row (like names), cannot help decide, so it is skipped (the status lists it). Also, if a column does not help separate the answers, the automatic tree will not use it.'},
    {q: 'Where are the training and accuracy blocks?', a: 'Training settings are turned off for now, so those blocks are hidden from the palette and the tree is always built from all the rows. Old projects that use them still load and run.'},
    {q: 'Is my data sent anywhere?', a: 'Building the tree, predicting and drawing all happen in your browser; nothing is uploaded. When reading a Google Sheet, the Google Sheets extension downloads the data from Google.'}
  ],

  changelog: [
    {date: '2026-11-18', text: 'Decision Tree extension added: train a tree on Google Sheets data, draw it in a new window, and predict'},
    {date: '2026-11-21', text: 'Only yes/no data is accepted (every cell must be a yes/no answer; errors give the column and row). Training and prediction turned off for now: loading data builds the tree from all rows, and only viewing is available. "Yes" branches are always on the left'},
    {date: '2026-11-21', text: 'Added blocks to choose each layer yourself (columns from a dropdown menu) and a block to work out chances'},
    {date: '2026-11-27', text: 'Text and number data are accepted (values kept as they are; number columns find their own split point). The sample is back to the original play tennis data (Outlook, Temperature, Humidity, Wind). Prediction blocks are back (predict with conditions, fill in column by column, confidence, path). Conditions can use > < >= <=. The chance block lets you choose the answer. The value box shows a dropdown or stays empty depending on the column'}
  ]
});
