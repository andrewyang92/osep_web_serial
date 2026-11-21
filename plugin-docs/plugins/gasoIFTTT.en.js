/*
 * IFTTT plugin: English descriptions.
 * Block text, menus and defaults come from plugins/gasoIFTTT.js (synced from the plugin source).
 */
OSEP.addText('gasoIFTTT', 'en', {
  tagline: 'Trigger IFTTT from Scratch: send an email or notification, log to a spreadsheet, control smart devices.',
  tags: ['IoT', 'Web services'],
  needs: ['Internet', 'IFTTT account'],

  overview: `IFTTT ("If This Then That") is a platform that connects many web services. This plugin has a single block: it sends an "event" to IFTTT's **Webhooks** service, and IFTTT then runs the action you set up, for example:

- Email or send a phone notification to yourself
- Log a score or sensor value to a Google Sheet
- Turn on or off smart bulbs and plugs that work with IFTTT

Each event can carry 3 values (value1 to value3). In the IFTTT action, use \`{{Value1}}\` and so on to put them into the email or sheet.

> The plugin only sends. It cannot see whether IFTTT ran the action. To check, look at the Activity log on the IFTTT website.

### Before you start (on the IFTTT website)
- Sign up and create an Applet
- For "If This", choose **Webhooks** → "Receive a web request" and enter an event name, for example \`scratch_score\`
- For "Then That", choose the action (Email, Google Sheets…)
- Find your **key** on the Webhooks service's settings (Documentation) page

> Whether Webhooks needs a paid plan, and which actions are available, is up to IFTTT's current terms.

Original plugin author: gasolin ([scratch3-internet](https://github.com/gasolin/scratch3-internet)).`,

  groups: [
    {name: 'Send an event', intro: ''}
  ],

  blocks: {
    fetchIFTTT: {
      args: {
        key: 'Your Webhooks key (on the IFTTT Webhooks settings page).',
        event: 'The event name. It must match the name in the Applet\'s "Receive a web request" exactly.',
        value1: 'The first value. Use `{{Value1}}` in the IFTTT action. Leave blank if not needed.',
        value2: 'The second value (`{{Value2}}`).',
        value3: 'The third value (`{{Value3}}`).'
      },
      summary: 'Send an event to IFTTT with up to 3 values.',
      detail: `The plugin calls \`https://maker.ifttt.com/trigger/EVENT/with/key/YOUR_KEY?value1=…&value2=…&value3=…\`. When IFTTT receives it, the Applet for that event runs.

- Do not put \`&\`, \`#\` or \`?\` in the values: they cut the address, and IFTTT receives incomplete values
- The browser cannot see IFTTT's reply, so the block does not tell you whether it worked
- Do not send inside a "forever" loop: IFTTT has usage limits`,
      tips: 'The key works like your IFTTT password. Anyone with your project can trigger your events, so delete the key before sharing.',
      example: [
        {t: 'when [K] key pressed', cat: 'events', type: 'hat', args: {K: {v: 'space', menu: true}}},
        {use: 'fetchIFTTT', args: {key: 'your key', event: 'scratch_score', value1: {t: 'score', cat: 'data', type: 'reporter'}, value2: ' ', value3: ' '}}
      ]
    }
  },

  examples: [
    {
      title: 'Log the score to a spreadsheet when the game ends',
      intro: 'In IFTTT, create an Applet "Webhooks (event game_over) → Google Sheets add row", with Value1 as the name and Value2 as the score.',
      script: [
        {t: 'when I receive [M]', cat: 'events', type: 'hat', args: {M: {v: 'game over', menu: true}}},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: "What's your name?"}},
        {use: 'fetchIFTTT', args: {key: 'your key', event: 'game_over', value1: {t: 'answer', cat: 'sensing', type: 'reporter'}, value2: {t: 'score', cat: 'data', type: 'reporter'}, value3: ' '}},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: 'Score sent!', S: {num: '2'}}}
      ],
      explain: 'If the name contains & or #, the spreadsheet receives it incomplete.'
    }
  ],

  faq: [
    {q: 'Nothing happens in IFTTT?', a: `- The event name must exactly match the Applet (including upper/lower case)
- The key must be your own account's Webhooks key
- Check the Activity log on the IFTTT website
- Make sure the Applet is turned on`},
    {q: 'Can IFTTT send data back to Scratch?', a: 'Not with this plugin; it only sends out. To read data from the web, use the JSON plugin.'},
    {q: 'Why only 3 values?', a: 'IFTTT\'s "Receive a web request" only provides Value1 to Value3. To send more, join several values into one with "join", for example separated by commas.'}
  ],

  changelog: [
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
