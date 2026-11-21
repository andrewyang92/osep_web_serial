/*
 * QR Code plugin: English descriptions.
 * Block text, menus and defaults come from plugins/qrcode.js (synced from the plugin source).
 */
OSEP.addText('qrcode', 'en', {
  tagline: 'Scan QR codes with the camera or from the stage and read the text or URL inside.',
  tags: ['Vision', 'Camera'],
  needs: ['Camera (to scan with it)'],

  overview: `Hold a QR code up to the camera and the plugin reads what is inside (text, a URL, numbers), drawing an orange frame around the code on the stage. It can also scan QR codes shown on the stage.

Ideas: a treasure hunt (one QR code per level), library check-in and check-out, taking attendance, controlling a sprite with cards.

> Scanning happens in your browser; images are not uploaded. On phones and tablets you can switch between the front and back cameras.

> QR Code is a registered trademark of DENSO WAVE INCORPORATED.

Original plugin author: Sugiura Lab; the two camera-switching blocks were added by estea chen. QR decoding uses [jsQR](https://github.com/cozmo/jsQR).`,

  groups: [
    {name: 'Scan', intro: 'Start with [[qrStart]]. The plugin scans again and again until [[qrStop]] or the stop button.'},
    {name: 'Read the content', intro: ''},
    {name: 'Display', intro: ''}
  ],

  blocks: {
    qrStart: {
      args: {INPUT: '"camera" scans the camera image; "stage" scans what is shown on the stage.'},
      summary: 'Start scanning for QR codes.',
      detail: `- **camera**: turns on the camera (not mirrored, so the code reads the right way round) and starts scanning once the camera is ready
- **stage**: scans the whole stage, for example a QR code in a costume or backdrop

The block does not wait for the camera before moving on. Running it again while scanning does nothing.`,
      tips: 'The browser asks for permission to use the camera. Click "Allow".'
    },
    changewebcam: {
      summary: 'Switch to the next camera on the computer.',
      detail: 'Use it when several cameras are connected (for example a built-in laptop camera and a USB camera).'
    },
    ue_cam: {
      args: {WEBCAM: '"back" is the camera on the back of a phone or tablet; "front" is the one on the screen side.'},
      summary: 'Choose the front or back camera on a phone or tablet.',
      detail: 'The back camera is usually easier for scanning. On a computer with one camera it makes no difference.'
    },
    qrStop: {
      summary: 'Stop scanning, turn off the camera and clear the frame on the stage.',
      detail: 'It also stops automatically when you click the red stop button. The content already read is kept; clear it with [[qrReset]].'
    },
    qrSetInterval: {
      args: {INTERVAL: '0.3, 0.5 or 1 second.'},
      summary: 'Set how often to scan.',
      detail: 'Default 0.3 seconds. A longer interval is lighter on the computer but reacts more slowly.'
    },
    qrScanning: {
      summary: 'Whether it is scanning.',
      returns: '`true` while scanning, otherwise `false`.'
    },
    qrData: {
      summary: 'The content of the most recently read QR code.',
      detail: 'The content is **not** cleared when the code leaves the view; it stays as the last one read. To detect a new code, clear it with [[qrReset]] after reading and wait for the next one.',
      returns: 'Text (Chinese and Japanese work too). Empty before anything is read.',
      example: [
        {t: 'wait until [C]', cat: 'control', args: {C: {t: '[A] > [B]', cat: 'operators', type: 'boolean', args: {A: {t: 'length of [S]', cat: 'operators', type: 'reporter', args: {S: {use: 'qrData'}}}, B: {num: '0'}}}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'qrData'}}},
        {use: 'qrReset'}
      ]
    },
    qrASCII: {
      args: {INDEX: 'Which letter, starting from 1.'},
      summary: 'The ASCII code of letter n of the content.',
      returns: 'A number from 0 to 127. 0 if it is not an English letter, digit or symbol (Chinese, for example), or out of range.',
      tips: 'You can use QR codes as "coded cards": for example read the ASCII code of letter 1; A is 65, B is 66.'
    },
    qrReset: {
      summary: 'Clear the content that was read.',
      detail: 'Afterwards [[qrData]] is empty until the next QR code is read.'
    },
    qrSetCameraTransparency: {
      args: {TRANSPARENCY: '0 to 100. 0 is fully visible, 100 is invisible.'},
      summary: 'Set the transparency of the camera image on the stage.',
      detail: 'A higher value makes sprites and backdrops easier to see; scanning still works.'
    }
  },

  examples: [
    {
      title: 'Treasure hunt',
      intro: 'Put a QR code at each spot containing "chest1", "chest2"… The sprite says which one was found.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'qrStart', args: {INPUT: {v: 'camera', menu: true}}},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] contains [B] ?', cat: 'operators', type: 'boolean', args: {A: {use: 'qrData'}, B: 'chest'}}}, body: [
            {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'Found: ', B: {use: 'qrData'}}}, S: {num: '2'}}},
            {t: 'start sound [S]', cat: 'sound', args: {S: {v: 'Win', menu: true}}},
            {use: 'qrReset'}
          ]}
        ]}
      ],
      explain: 'After "reset data", the same card has to be taken away and scanned again to count again.'
    },
    {
      title: 'Control a sprite with cards',
      intro: 'Make QR codes that say "left" and "right" and show them to the camera; the sprite moves accordingly.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'qrStart', args: {INPUT: {v: 'camera', menu: true}}},
        {use: 'qrSetCameraTransparency', args: {TRANSPARENCY: {num: '50'}}},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] = [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'qrData'}, B: 'left'}}}, body: [
            {t: 'change x by [N]', cat: 'motion', args: {N: {num: '-10'}}}
          ]},
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] = [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'qrData'}, B: 'right'}}}, body: [
            {t: 'change x by [N]', cat: 'motion', args: {N: {num: '10'}}}
          ]}
        ]}
      ],
      explain: 'Make the QR codes with any free QR code generator website.'
    }
  ],

  faq: [
    {q: 'The camera is on but nothing is scanned?', a: `- The QR code should be big enough, facing the camera, and not shiny
- Use good lighting
- Only normal dark-on-light QR codes work (inverted colors are not read)`},
    {q: 'Why is the camera image not mirrored?', a: 'When scanning with the camera, the plugin turns mirroring off so the QR code is the right way round and easier to aim.'},
    {q: '"data" still shows the code after I take it away?', a: 'The plugin keeps the last content it read. Clear it with "reset data" when needed.'},
    {q: 'How do I use the back camera on a phone?', a: 'Use the "use the back camera" block.'}
  ],

  changelog: [
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
