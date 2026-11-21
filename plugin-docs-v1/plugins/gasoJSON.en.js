/*
 * JSON plugin: English descriptions.
 * Block text, menus and defaults come from plugins/gasoJSON.js (synced from the plugin source).
 */
OSEP.addText('gasoJSON', 'en', {
  tagline: 'Download JSON, CSV, text or XML data from the web, then search, filter and edit it in Scratch.',
  tags: ['Web services', 'Open data', 'Data analysis'],
  needs: ['Internet'],

  overview: `Much open data (weather, buses, air quality, government data) comes in **JSON** format. This plugin can:

- **Download** JSON, CSV, text and XML files from the web
- **Read** one entry or one field, list all fields, count entries
- **Search** for entries whose field contains some text, or whose number is above a value
- **Edit** the data: change a cell, add, replace or delete an entry

### What JSON looks like
The most common JSON is a list of entries, each with several fields:

\`\`\`
[{"name": "Amy", "score": 90}, {"name": "Ben", "score": 75}]
\`\`\`

"Item 1" is \`{"name": "Amy", "score": 90}\`, and its \`score\` field is \`90\`. The reading blocks pass data around as text, so a common approach is to store the data in a variable and take it apart step by step.

### Two things to know when reading web data
- The download blocks **finish before the data arrives**. Put the reading blocks under [[onJSONReceived]], or add "wait 1 seconds" after downloading
- Many websites do not let other pages read their data directly (cross-origin restrictions, CORS). When [[fetchJSON]] is blocked, it automatically tries again through a relay server (OSEP's Google Apps Script); [[corsfetchJSON]] uses the relay from the start

Original plugin authors: gasolin and TYiC ([scratch3-internet](https://github.com/gasolin/scratch3-internet)).`,

  groups: [
    {name: 'Get data', intro: 'Download (or paste) data into the plugin. The plugin keeps one set of data at a time; new data replaces the old.'},
    {name: 'When data arrives', intro: ''},
    {name: 'Read data', intro: 'The `[data]` input of these blocks takes JSON text: use [[readFromJSON]], or a variable that holds JSON.'},
    {name: 'Search and split', intro: 'Find entries in a list that match a condition. `[column]` must match the field name in the data exactly.'},
    {name: 'Edit data and tools', intro: 'These change **the data currently in the plugin** (the one [[readFromJSON]] gives). The data must be a JSON list.'}
  ],

  blocks: {
    fetchJSON: {
      args: {url: 'The address of the JSON data.'},
      summary: 'Download JSON data from a URL.',
      detail: `It downloads directly first; if cross-origin restrictions block it, it tries again through the relay. When the download finishes, [[onJSONReceived]] fires and [[readFromJSON]] holds the data.

> The data may not be downloaded yet when the block finishes.`
    },
    corsfetchJSON: {
      args: {url: 'The address of the JSON data.'},
      summary: 'Download JSON through the relay server from the start.',
      detail: 'Use it when you know the website has cross-origin restrictions, to skip the first failed try. The relay is a Google Apps Script and can be slow under heavy use. In the English interface its text is the same as [[fetchJSON]]; it is the second block in the palette.'
    },
    fetchCSV: {
      args: {url: 'The address of the CSV file.'},
      summary: 'Download a CSV file from a URL.',
      detail: `CSV is table text with fields separated by commas and one row per line. It is stored as \`{"0": "line 1", "1": "line 2", …}\`, and you split each line by commas with [[splitString]].

> ! The current code only splits lines where the text literally contains the characters \`\\r\\n\`, so a normal CSV file often ends up **entirely in item 1**. For table data, use the Google Sheets plugin instead, or convert to JSON first ([[openexceltojsonurl]]).`
    },
    fetchTXT: {
      args: {url: 'The address of the text file.'},
      summary: 'Download a plain text file, one line per item.',
      detail: 'Stored as `{"0": "line 1", "1": "line 2", …}`. Use [[readEntryFromJSON]] to get a line.',
      tips: 'This format is not a list, so [[getJsonAllNum]] cannot count the lines (it is empty).'
    },
    fetchXML: {
      args: {url: 'The address of the XML data.'},
      summary: 'Download XML from a URL and turn it into JSON.',
      detail: 'Always goes through the relay server, which turns the XML into JSON. The result is deeply nested (tag contents are often inside lists), so "say" it first to see its shape before deciding how to read it.'
    },
    openCorsSite: {
      summary: 'Open the cors-anywhere demo page.',
      detail: 'This was the cross-origin service of older versions of the plugin. The plugin now uses its own relay, so you usually **do not need** this block.'
    },
    clearJSONData: {
      summary: 'Clear the data in the plugin.',
      detail: 'Afterwards [[readFromJSON]] gives "Error: JSON data does not exist".'
    },
    onJSONReceived: {
      summary: 'Runs the script below when data has been downloaded (or added or replaced).',
      detail: 'Fires when a download block, [[texttojson]], [[jsonpush]] or [[jsonreplace]] finishes. Put the reading blocks here so you do not have to guess how long to wait.'
    },
    readFromJSON: {
      summary: 'All the data currently in the plugin.',
      returns: 'JSON text. With no data: "Error: JSON data does not exist".',
      tips: 'A common approach: store it in a variable "all" first, then use the variable. It is easier to read and faster.'
    },
    readEntryFromJSON: {
      args: {variable: 'JSON text (a list).', n: 'Which item, starting from 1.'},
      summary: 'Get item n of a list.',
      returns: 'The item. If it is an object, JSON text (use [[readAttrFromJSON]] for its fields); if it is text, the text. If the data is not valid, `Error: …`.',
      example: [
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'readEntryFromJSON', args: {variable: {use: 'readFromJSON'}, n: {num: '1'}}}}}
      ]
    },
    readAttrFromJSON: {
      args: {variable: 'JSON text (one object).', attr: 'The field name, with the same upper/lower case.'},
      summary: 'Get the value of a field.',
      returns: 'The field value. Empty if the field does not exist; `Error: …` if the data is not valid.',
      example: [
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'readAttrFromJSON', args: {
          variable: {use: 'readEntryFromJSON', args: {variable: {use: 'readFromJSON'}, n: {num: '1'}}},
          attr: 'name'
        }}}}
      ]
    },
    getJsonCol: {
      args: {variable: 'JSON text (one object, such as one item).'},
      summary: 'List all field names.',
      returns: 'For example `["name","score"]`.',
      tips: 'Pass one item, not the whole list: the whole list gives `["0","1","2",…]`.'
    },
    getJsonAllNum: {
      args: {variable: 'JSON text (a list).'},
      summary: 'How many items the list has.',
      returns: 'A number. Empty if it is not a list.'
    },
    useTextSearchGetData2: {
      args: {data: 'JSON text (a list).', column: 'The field to check.', value: 'The text to look for.'},
      summary: 'Find every entry whose field "contains" some text.',
      returns: 'The matching entries, also a JSON list you can read with the other blocks; `[]` when nothing matches.',
      tips: 'It means "contains", not "equals": searching for "an" finds "Dan" and "Anna".'
    },
    useTextSearchGetData: {
      args: {data: 'JSON text (a list).', column: 'The field to check.', value: 'The text to look for.', column2: 'The field to get.'},
      summary: 'For entries whose field contains some text, get another field.',
      detail: 'For example, in bus data, for routes whose name contains "Red", get the stop name.',
      returns: 'The values joined with commas, for example `Main St,City Hall`. Take them one by one with [[splitString]].'
    },
    useNumberCompareGetData: {
      args: {data: 'JSON text (a list).', column: 'The field to compare (holding numbers).', symbol: 'How to compare.', number: 'The number to compare with (decimals are cut off to a whole number).', column2: 'The field to get.'},
      summary: 'For entries whose number matches a condition, get another field.',
      detail: 'For example, for entries with "score" above 80, get "name".',
      returns: 'The values joined with commas, for example `Amy,Cara`.'
    },
    splitString: {
      args: {data: 'Text separated by commas.', n: 'Which part, starting from 1.'},
      summary: 'Split comma-separated text and get part n.',
      returns: 'That part; empty when out of range.',
      example: [
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'splitString', args: {data: 'apple,banana,melon', n: {num: '2'}}}}}
      ]
    },
    openexceltojsonurl: {
      summary: 'Open the "spreadsheet to JSON" website.',
      detail: 'Paste an Excel sheet or spreadsheet there to turn it into JSON, then put it into the plugin with [[texttojson]].'
    },
    texttojson: {
      args: {TEXT: 'JSON text, for example `[{"id":1,"name":"john"}]`.'},
      summary: 'Put a piece of JSON text straight into the plugin as the current data.',
      detail: 'No internet needed: good for small data you prepare yourself. [[onJSONReceived]] fires afterwards. The plugin does not check the format; if it is wrong, the reading blocks give `Error: …` later.'
    },
    editjson: {
      args: {ROW: 'Which entry, starting from 1.', COL: 'The field name; a new field is added if it does not exist.', VALUE: 'The new value (stored as text).'},
      summary: 'Change one field of entry n.'
    },
    jsonclear: {
      summary: 'Delete all the data in the plugin.',
      detail: 'Same as [[clearJSONData]]. Afterwards, put in new data with [[texttojson]] or a download block.'
    },
    jsonpush: {
      args: {NUM: 'The position to insert at, starting from 1; past the end, it is added at the end.', TEXT: 'The new entry, a JSON object, for example `{"name":"Cara","score":88}`.'},
      summary: 'Insert a new entry at position n.',
      detail: 'The entry at that position and those after it move back. [[onJSONReceived]] fires afterwards.'
    },
    jsonreplace: {
      args: {NUM: 'Which entry to replace, starting from 1.', TEXT: 'The new entry, a JSON object.'},
      summary: 'Replace entry n with new data.',
      detail: '[[onJSONReceived]] fires afterwards.'
    },
    jsondeletenum: {
      args: {NUM: 'Which entry to delete, starting from 1.'},
      summary: 'Delete entry n.',
      detail: 'The entries after it move forward.'
    },
    copyTEXT_memory: {
      args: {TEXT: 'The text to copy.'},
      summary: "Copy text to the computer's clipboard.",
      tips: 'Browsers only allow copying right after a user action (such as clicking a sprite), so put it under "when this sprite clicked".'
    }
  },

  examples: [
    {
      title: 'Read JSON from the web',
      intro: 'Download data and, when it arrives, say the name of item 1.',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {use: 'fetchJSON', args: {url: 'https://jsonplaceholder.typicode.com/users'}}
        ],
        [
          {use: 'onJSONReceived'},
          {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'all', menu: true}, N: {use: 'readFromJSON'}}},
          {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'Items: ', B: {use: 'getJsonAllNum', args: {variable: {t: 'all', cat: 'data', type: 'reporter'}}}}}, S: {num: '2'}}},
          {t: 'say [M]', cat: 'looks', args: {M: {use: 'readAttrFromJSON', args: {variable: {use: 'readEntryFromJSON', args: {variable: {t: 'all', cat: 'data', type: 'reporter'}, n: {num: '1'}}}, attr: 'name'}}}}
        ]
      ],
      explain: 'jsonplaceholder.typicode.com is a practice site with fake data.'
    },
    {
      title: 'Make a score list and search it',
      intro: 'No internet: build the data from text, find everyone with 80 or more, then add an entry.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'texttojson', args: {TEXT: '[{"name":"Amy","score":90},{"name":"Ben","score":75},{"name":"Cara","score":85}]'}},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {use: 'useNumberCompareGetData', args: {data: {use: 'readFromJSON'}, column: 'score', symbol: {v: '>', menu: true}, number: {num: '80'}, column2: 'name'}}, S: {num: '2'}}},
        {use: 'jsonpush', args: {NUM: {num: '4'}, TEXT: '{"name":"Dan","score":60}'}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getJsonAllNum', args: {variable: {use: 'readFromJSON'}}}}}
      ],
      explain: 'First it says "Amy,Cara"; after adding an entry, the count is 4.'
    },
    {
      title: 'List every entry',
      intro: 'Use "repeat" to add the name of every entry to a list.',
      script: [
        {use: 'onJSONReceived'},
        {t: 'delete all of [L]', cat: 'list', args: {L: {v: 'names', menu: true}}},
        {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'i', menu: true}, N: {num: '1'}}},
        {t: 'repeat [N]', cat: 'control', type: 'c', args: {N: {use: 'getJsonAllNum', args: {variable: {use: 'readFromJSON'}}}}, body: [
          {t: 'add [X] to [L]', cat: 'list', args: {X: {use: 'readAttrFromJSON', args: {variable: {use: 'readEntryFromJSON', args: {variable: {use: 'readFromJSON'}, n: {t: 'i', cat: 'data', type: 'reporter'}}}, attr: 'name'}}, L: {v: 'names', menu: true}}},
          {t: 'change [V] by [N]', cat: 'data', args: {V: {v: 'i', menu: true}, N: {num: '1'}}}
        ]}
      ]
    }
  ],

  faq: [
    {q: 'I get "Error: JSON data does not exist"?', a: `- The data has not been downloaded yet: put the reading blocks under "When JSON data is recieved"
- The URL is wrong, or the website is temporarily unreachable
- "clear JSON data" or "Delete all elements" was used`},
    {q: 'I get `Error: SyntaxError…`?', a: 'What is in the `[data]` input is not valid JSON text. Usually it is the wrong level: for example the result of "item 1" put into a block that needs a list, or a field name that does not match the data. "say" it first to see what it looks like.'},
    {q: 'Why can\'t I read a website\'s data?', a: 'Many websites have cross-origin restrictions or need an API key. [[fetchJSON]] retries through the relay when it fails; if it still fails, the URL may need a key, or the website does not return JSON.'},
    {q: 'A CSV file comes in as a single item?', a: 'The current code does not split lines properly, so a normal CSV file often ends up entirely in item 1. Use the Google Sheets plugin instead, or convert it to JSON first with [[openexceltojsonurl]].'},
    {q: 'Does editing change the file on the web?', a: 'No. It only changes the copy in the plugin; reloading the page or downloading again brings back the original data.'}
  ],

  changelog: [
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
