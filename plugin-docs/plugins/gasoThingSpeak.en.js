/*
 * ThingSpeak plugin: English descriptions.
 * Block text, menus and defaults come from plugins/gasoThingSpeak.js (synced from the plugin source).
 */
OSEP.addText('gasoThingSpeak', 'en', {
  tagline: 'Store values on the ThingSpeak IoT platform as charts, and read the data back into Scratch.',
  tags: ['IoT', 'Web services'],
  needs: ['Internet', 'ThingSpeak account'],

  overview: `ThingSpeak is MathWorks' IoT data platform: send sensor or game values to it, and the website draws line charts automatically. Other programs can read the data back.

ThingSpeak keeps data in "channels", and each channel has 8 fields (field1 to field8). This plugin can:

- **Write**: set the write key → fill in the fields to send → send
- **Read**: download data with the read key and channel ID, then take it apart with the JSON plugin

### Before you start (on the ThingSpeak website)
- Sign up and create a channel (New Channel), ticking the fields you want
- The channel's "API Keys" page shows the **Write API Key**, **Read API Key** and **Channel ID**

> Free accounts can only send data at intervals (about once every 15 seconds); data sent too fast is dropped. Check ThingSpeak's website for the current limits.

Original plugin author: gasolin ([scratch3-internet](https://github.com/gasolin/scratch3-internet)).`,

  groups: [
    {name: 'Write and read', intro: `Writing always goes: [[TS_Writekey]] → one or more [[TS_col]] → [[Write_TS]].

To read, use [[TS_Read]], then get the data with [[TS_JSON]].`}
  ],

  blocks: {
    TS_Writekey: {
      args: {KEY: "The channel's Write API Key."},
      summary: 'Set the write key and clear the fields waiting to be sent.',
      detail: 'Run this block before every new set of data: it clears the fields filled in earlier with [[TS_col]]. Otherwise the old fields are sent again together with the new ones.',
      tips: 'The key is saved in the project. Delete it before sharing the project.'
    },
    TS_col: {
      args: {
        COLUMN: 'field1 to field8 of the channel.',
        VALUE: 'The value to store, usually a number.'
      },
      summary: 'Fill in one field and value to send.',
      detail: 'Use one block per field. Nothing is sent yet; that happens with [[Write_TS]].',
      tips: 'Do not put `&` or `#` in the value: they cut the address.'
    },
    Write_TS: {
      summary: 'Send the filled-in fields to ThingSpeak.',
      detail: 'It calls `https://api.thingspeak.com/update?api_key=…&field1=…`. The block does not report success or failure; check the channel chart on ThingSpeak.',
      example: [
        {use: 'TS_Writekey', args: {KEY: 'your write key'}},
        {use: 'TS_col', args: {COLUMN: {v: 'field1', menu: true}, VALUE: {t: 'temperature', cat: 'data', type: 'reporter'}}},
        {use: 'TS_col', args: {COLUMN: {v: 'field2', menu: true}, VALUE: {t: 'humidity', cat: 'data', type: 'reporter'}}},
        {use: 'Write_TS'}
      ]
    },
    TS_Read: {
      args: {
        KEY: "The channel's Read API Key (leave blank for a public channel).",
        CHANNEL: 'The channel ID (a number).'
      },
      summary: 'Download the data in a channel.',
      detail: `When the download finishes, [[TS_JSON]] holds JSON text: each entry is an object with \`created_at\` (time), \`entry_id\` (number) and \`field1\` to \`field8\`.

> The data **may not be downloaded yet** when the block finishes. Add "wait 1 seconds" before reading, to be safe.`
    },
    TS_JSON: {
      summary: 'The data from the latest [[TS_Read]].',
      returns: 'JSON text, for example `[{"created_at":"…","entry_id":1,"field1":"25"}, …]`. Before any read, "Error: ThingSpeak data does not exist".',
      tips: 'Use the JSON plugin\'s "item [n] of JSON data" and "JSON data with attribute" blocks to get one field of one entry. See example 2.'
    }
  },

  examples: [
    {
      title: 'Upload the temperature every 20 seconds',
      intro: 'Send the variable "temperature" (for example a sensor reading) to field 1 on a timer, and ThingSpeak draws a line chart.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {use: 'TS_Writekey', args: {KEY: 'your write key'}},
          {use: 'TS_col', args: {COLUMN: {v: 'field1', menu: true}, VALUE: {t: 'temperature', cat: 'data', type: 'reporter'}}},
          {use: 'Write_TS'},
          {t: 'wait [S] seconds', cat: 'control', args: {S: {num: '20'}}}
        ]}
      ],
      explain: 'Setting the write key at the start of each loop keeps the previous fields from being sent again.'
    },
    {
      title: 'Read back the latest entry',
      intro: 'Download the channel data and get field 1 of the last entry. Needs the JSON plugin.',
      script: [
        {t: 'when [K] key pressed', cat: 'events', type: 'hat', args: {K: {v: 'space', menu: true}}},
        {use: 'TS_Read', args: {KEY: 'your read key', CHANNEL: '1234567'}},
        {t: 'wait [S] seconds', cat: 'control', args: {S: {num: '1'}}},
        {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'all', menu: true}, N: {use: 'TS_JSON'}}},
        {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'latest', menu: true}, N: {use: 'gasoJSON.readEntryFromJSON', args: {variable: {t: 'all', cat: 'data', type: 'reporter'}, n: {use: 'gasoJSON.getJsonAllNum', args: {variable: {t: 'all', cat: 'data', type: 'reporter'}}}}}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'gasoJSON.readAttrFromJSON', args: {variable: {t: 'latest', cat: 'data', type: 'reporter'}, attr: 'field1'}}}}
      ],
      explain: 'The number of entries is also the position of the last one, so using it as "item n" gets the latest entry.'
    }
  ],

  faq: [
    {q: 'I sent data but no new point appears on the chart?', a: `- Use the **Write** API Key, not the Read key
- Data sent too fast is dropped; wait longer between sends
- The field must be enabled in the channel settings`},
    {q: 'Why are the values I read text?', a: 'ThingSpeak returns field values as text (for example "25"). Scratch converts them to numbers automatically when you calculate.'},
    {q: 'I get "Error: ThingSpeak data does not exist"?', a: 'The download has not finished, or it failed. Check the channel ID and read key, and wait a little after [[TS_Read]].'}
  ],

  changelog: [
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
