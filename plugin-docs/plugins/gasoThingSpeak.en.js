/*
 * ThingSpeak plugin: English descriptions.
 * Block text, menus and defaults come from plugins/gasoThingSpeak.js (synced from the plugin source).
 */
OSEP.addText('gasoThingSpeak', 'en', {
  tagline: 'Store values on the ThingSpeak IoT platform as charts, read the data back into Scratch, get field values, or draw a line chart with the Chart extension.',
  tags: ['IoT', 'Web services'],
  needs: ['Internet', 'ThingSpeak account'],

  overview: `ThingSpeak is MathWorks' IoT data platform: send sensor or game values to it, and the website draws line charts automatically. Other programs can read the data back.

ThingSpeak keeps data in "channels", and each channel has 8 fields (field1 to field8). This plugin can:

- **Write**: set the write key → fill in the fields to send → send, then check [[TS_writeResult]]
- **Read**: download the latest 100 entries with the channel ID (plus the read key for a private channel), then get values with [[TS_lastValue]] and [[TS_valueAt]], or give [[TS_JSON]] to the Chart extension to draw a line chart

### Which card should I use?
In the original author's version, the write and read blocks fail as soon as they run (the code uses undeclared variables), so they do not work at all. OSEP fixed them and put the fixed version on a separate card in the new OSEP:

| OSEP version | Extension card | Status |
|---|---|---|
| New | **ThingSpeak 物聯網 / ThingSpeak IoT** (block category "ThingSpeak IoT") | Works; the 9 blocks on this page |
| New | ThingSpeak (original author) | Write and read fail |
| Old | ThingSpeak | Write and read fail (the old version has not been updated) |

> ! In the **new** OSEP, add the "**ThingSpeak IoT**" card. The original 5 blocks work the same way; when moving an old project to the new card, drag the blocks in again.

### Before you start (on the [ThingSpeak website](https://thingspeak.mathworks.com/))
- Click **Sign Up** to create a free MathWorks account, activate it from the email, and sign in
- On [My Channels](https://thingspeak.mathworks.com/channels), click **New Channel**: enter a Name, tick the fields you want (Field 1 to 8, you can name them, e.g. "Temperature"), then click **Save Channel** at the bottom
- The **Channel ID** is at the top of the channel page; the **API Keys** tab has the **Write API Key** and **Read API Keys**
- **Sharing** tab: channels are private by default (reading needs the Read API Key); choose **Share channel view with everyone** to make it public, and the read key can be left blank. Writing always needs the Write API Key

> Free accounts can write to a channel only about once every 15 seconds; writing faster fails ([[TS_writeResult]] is 0). Check ThingSpeak's website for the current limits.

> ! The Write API Key gives write access. Do not put it in a project you share publicly (you can use "ask and wait" so users paste their own). If it leaks, click **Generate New Write API Key** on the API Keys tab.

### Try reading without an account
ThingSpeak's official demo channel **9** (my_house, field1 = light, field2 = outside temperature) is public: use channel ID 9 and leave the read key blank. See examples 2 to 4.

### Related websites
- [ThingSpeak home](https://thingspeak.mathworks.com/): sign up, sign in
- [My Channels](https://thingspeak.mathworks.com/channels): your channels; open one to see its charts and API Keys (sign-in required)
- [Create a new channel](https://thingspeak.mathworks.com/channels/new) (sign-in required)
- [Demo channel 9](https://thingspeak.mathworks.com/channels/9): charts of a public channel

Original plugin author: gasolin ([scratch3-internet](https://github.com/gasolin/scratch3-internet)). OSEP fixed the read/write errors and added the value blocks.`,

  groups: [
    {name: 'Write', intro: 'Writing always goes: [[TS_Writekey]] → one or more [[TS_col]] → [[Write_TS]]. Then check [[TS_writeResult]].'},
    {name: 'Read', intro: 'Download the data with [[TS_Read]], then use [[TS_lastValue]], [[TS_valueAt]] and [[TS_count]]; to draw a line chart, give [[TS_JSON]] to the Chart extension. [[TS_Read]] waits until the download finishes, so no wait block is needed after it.'}
  ],

  blocks: {
    TS_Writekey: {
      args: {KEY: "The channel's Write API Key (API Keys tab)."},
      summary: 'Set the write key and clear the fields waiting to be sent.',
      detail: 'Run this block before filling in a new set of data: it clears the fields filled in earlier with [[TS_col]]. Spaces around the key are removed.',
      tips: 'The key is saved in the project. Delete it before sharing the project, or use "ask and wait" so users paste their own.'
    },
    TS_col: {
      args: {
        COLUMN: 'field1 to field8, matching Field 1 to Field 8 of the channel (tick them in the channel settings).',
        VALUE: 'The value to store, usually a number.'
      },
      summary: 'Fill in one field and value to send.',
      detail: `Use one block per field. If the same field is set twice, only the last value is sent. Nothing is sent yet; that happens with [[Write_TS]].

Values are URL-encoded automatically, so Chinese text, spaces, \`&\` and \`#\` are fine.`
    },
    Write_TS: {
      summary: 'Send the filled-in fields to ThingSpeak and wait for its reply.',
      detail: `It calls \`https://api.thingspeak.com/update?api_key=…&field1=…\`. Check [[TS_writeResult]] afterwards.

If no key is set or no field is filled in, nothing is sent and [[TS_writeResult]] is 0.

The fields are not cleared after sending; run [[TS_Writekey]] before the next set of data.`,
      example: [
        {use: 'TS_Writekey', args: {KEY: 'your write key'}},
        {use: 'TS_col', args: {COLUMN: {v: 'field1', menu: true}, VALUE: {t: 'temperature', cat: 'data', type: 'reporter'}}},
        {use: 'TS_col', args: {COLUMN: {v: 'field2', menu: true}, VALUE: {t: 'humidity', cat: 'data', type: 'reporter'}}},
        {use: 'Write_TS'},
        {t: 'say [M]', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'entries written: ', B: {use: 'TS_writeResult'}}}}}
      ]
    },
    TS_writeResult: {
      summary: 'Which entry of the channel the latest [[Write_TS]] wrote.',
      returns: 'On success, the number of the new entry, which is also how many entries the channel now has (1, 2, 3…); on failure, 0 (wrong key, less than 15 seconds since the last write, no network, or no fields). Empty before anything is sent.',
      tips: 'Use "[[TS_writeResult]] > 0" to check whether the write succeeded. Tick the box next to the block to show "ThingSpeak entries written" on the stage.'
    },
    TS_Read: {
      args: {
        CHANNEL: 'The channel ID (a number, the Channel ID at the top of the channel page).',
        KEY: "The channel's Read API Key; leave blank for a public channel."
      },
      summary: 'Download the latest 100 entries of a channel and wait until the download finishes.',
      detail: `Then use [[TS_lastValue]] and [[TS_valueAt]] to get values; [[TS_count]] is the number of entries; [[TS_JSON]] can be given to the Chart extension to draw a line chart.

If the download fails (wrong channel ID, private channel without a read key, no network), the previous data is cleared and [[TS_count]] becomes 0.

It reads \`https://api.thingspeak.com/channels/<channel ID>/feeds.json\`, which you can also open in a browser.`,
      example: [
        {use: 'TS_Read', args: {CHANNEL: '9', KEY: ' '}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'TS_lastValue', args: {COLUMN: {v: 'field1', menu: true}}}}}
      ]
    },
    TS_lastValue: {
      args: {COLUMN: 'field1 to field8, or "time".'},
      summary: 'One field of the latest entry.',
      returns: 'The field value (text such as "25", usable in calculations). "time" gives when the entry was uploaded, e.g. `2026-11-28 10:32:25`, converted to the computer\'s time zone. Empty before reading, after a failed read, or when the field is empty in that entry.'
    },
    TS_valueAt: {
      args: {
        N: 'Which entry; 1 is the oldest.',
        COLUMN: 'field1 to field8, or "time".'
      },
      summary: 'One field of entry N.',
      returns: 'Same as [[TS_lastValue]]. Empty when N is out of range (less than 1 or more than the number of entries).',
      detail: 'Entry 1 is the oldest and entry [[TS_count]] is the newest. Use "repeat [[TS_count]]" with a variable to put every entry into a list. See example 3.'
    },
    TS_count: {
      summary: 'How many entries were read.',
      returns: 'A number, at most 100. 0 before reading or after a failed read.'
    },
    TS_JSON: {
      summary: 'The data from the latest [[TS_Read]], arranged so the Chart extension can draw a line chart.',
      returns: 'JSON text, for example `[{"time":"11-28 10:32","Light":"240","Outside Temperature":"38"}, …]`. "Error: ThingSpeak data does not exist" before reading or after a failed read.',
      detail: `Each entry is an object:

- First comes "time" (month-day hour:minute in the computer's time zone), used as the x axis
- Then every enabled field of the channel, named as in the channel's Channel Settings, e.g. \`Light\`; unnamed fields are "field1" and so on. Each field becomes one line
- Values are text; an empty value in an entry is "" (the line has a gap)

Put this block in the Chart extension's "read data [data] show [line chart]" to draw it. See example 4. A bar chart works too.`,
      tips: 'Rename the fields in ThingSpeak\'s Channel Settings to change the names shown in the chart legend.',
      example: [
        {use: 'TS_Read', args: {CHANNEL: '9', KEY: ' '}},
        {t: 'read data [D] show [C]', color: '#83251B', args: {D: {use: 'TS_JSON'}, C: {v: 'line chart', menu: true}}}
      ]
    }
  },

  examples: [
    {
      title: 'Upload the temperature every 20 seconds',
      intro: 'Send the variable "temperature" (for example a sensor reading) to field 1 on a timer, and ThingSpeak draws a line chart. The sprite says the result of each write.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {use: 'TS_Writekey', args: {KEY: 'your write key'}},
          {use: 'TS_col', args: {COLUMN: {v: 'field1', menu: true}, VALUE: {t: 'temperature', cat: 'data', type: 'reporter'}}},
          {use: 'Write_TS'},
          {t: 'say [M]', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'entries written: ', B: {use: 'TS_writeResult'}}}}},
          {t: 'wait [S] seconds', cat: 'control', args: {S: {num: '20'}}}
        ]}
      ],
      explain: 'A number (which entry of the channel this is) means success; 0 means failure. Free accounts can write only about once every 15 seconds, so waiting 20 seconds is safer.'
    },
    {
      title: 'Read back the latest entry',
      intro: 'Read ThingSpeak\'s public demo channel 9 and say the latest light value (field 1) and its time. No account needed.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'TS_Read', args: {CHANNEL: '9', KEY: ' '}},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {
          M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'latest light: ', B: {use: 'TS_lastValue', args: {COLUMN: {v: 'field1', menu: true}}}}},
          S: {num: '3'}}},
        {t: 'say [M]', cat: 'looks', args: {
          M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'time: ', B: {use: 'TS_lastValue', args: {COLUMN: {v: 'time', menu: true}}}}}}}
      ],
      explain: 'To read your own channel, change 9 to your channel ID; a private channel also needs the Read API Key.'
    },
    {
      title: 'Put every entry into a list',
      intro: 'Read demo channel 9 and add the light values of the latest 100 entries, in order, to the list "light log", which you can scroll on the stage.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'TS_Read', args: {CHANNEL: '9', KEY: ' '}},
        {t: 'delete all of [L]', cat: 'data', args: {L: {v: 'light log', menu: true}}},
        {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'i', menu: true}, N: '1'}},
        {t: 'repeat [N]', cat: 'control', type: 'c', args: {N: {use: 'TS_count'}}, body: [
          {t: 'add [X] to [L]', cat: 'data', args: {X: {use: 'TS_valueAt', args: {N: {t: 'i', cat: 'data', type: 'reporter'}, COLUMN: {v: 'field1', menu: true}}}, L: {v: 'light log', menu: true}}},
          {t: 'change [V] by [N]', cat: 'data', args: {V: {v: 'i', menu: true}, N: {num: '1'}}}
        ]}
      ],
      explain: 'Entry 1 is the oldest; the last one (entry "number of entries") is the newest.'
    },
    {
      title: 'See the channel data as a line chart',
      intro: 'Read demo channel 9 and use the Chart extension to draw the light and outside temperature as a line chart (it opens a new window). Add the Chart extension too.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'TS_Read', args: {CHANNEL: '9', KEY: ' '}},
        {t: 'chart title [T]', color: '#83251B', args: {T: 'ThingSpeak channel 9'}},
        {t: 'axis titles: x axis [X] y axis [Y]', color: '#83251B', args: {X: 'time', Y: 'value'}},
        {t: 'read data [D] show [C]', color: '#83251B', args: {D: {use: 'TS_JSON'}, C: {v: 'line chart', menu: true}}}
      ],
      explain: 'Each field is one line, named after the channel\'s field names (Light and Outside Temperature for channel 9). Change the channel ID to chart your own data.'
    }
  ],

  faq: [
    {q: 'I added the "ThingSpeak" card and the blocks do nothing?', a: 'That is the original author\'s version; its write and read blocks fail. In the **new** OSEP, add the "**ThingSpeak IoT**" card instead (see "Which card should I use?" in the overview).'},
    {q: 'The write result is 0?', a: `- Use the **Write** API Key, not the Read key
- Less than 15 seconds since the last write (free account limit); wait longer
- Run [[TS_Writekey]], fill in at least one [[TS_col]], then [[Write_TS]]`},
    {q: 'The write succeeded, but the chart does not show that field?', a: 'The field must be enabled in Channel Settings before the chart shows it.'},
    {q: 'Why are the values I read text?', a: 'ThingSpeak returns field values as text (for example "25"). Scratch converts them to numbers automatically when you calculate.'},
    {q: 'The number of entries is 0, or I get "Error: ThingSpeak data does not exist"?', a: 'The download failed. Check the channel ID (it must be a number); a private channel needs the Read API Key, or make it public on the Sharing tab. Try demo channel 9 to check the network.'},
    {q: 'The time is different from the ThingSpeak website?', a: 'Times from the blocks ("time" in [[TS_lastValue]] and [[TS_valueAt]], and [[TS_JSON]]) are converted to the computer\'s time zone; `created_at` in the raw ThingSpeak address is UTC.'},
    {q: 'The line chart does not appear, or I get "資料格式錯誤" (data format error)?', a: `- Check that [[TS_count]] is not 0 (the read succeeded)
- The chart opens a new window; if the browser blocks pop-ups, allow pop-ups for this site
- Put [[TS_JSON]] in "read data", not [[TS_count]]`}
  ],

  changelog: [
    {date: '2026-11-28', text: 'Fixed version: the write and read blocks no longer fail; reading and writing wait until done; values are URL-encoded; new write result, latest value, entry N value and number of entries blocks. In the new OSEP the card is "ThingSpeak IoT". "ThingSpeak data" now gives data the Chart extension can draw as a line chart; "write result" is renamed "entries written"'},
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
