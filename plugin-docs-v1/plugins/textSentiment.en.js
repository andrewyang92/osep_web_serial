/*
 * Text Sentiment plugin: English descriptions.
 * Block text, menus and defaults come from plugins/textSentiment.js (synced from the plugin source).
 */
OSEP.addText('textSentiment', 'en', {
  tagline: 'Tell whether a sentence sounds positive or negative. Works in Chinese and English.',
  tags: ['AI', 'Language'],
  needs: ['Internet (first model download)'],

  overview: `Type a sentence and an AI model decides whether its feeling is **positive** or **negative**, with a score from 0 to 1. Use it for a mood diary, a sprite that reacts to how you feel, sorting comments, a mood thermometer and more.

The plugin detects whether the text is Chinese or English and picks the matching model. Traditional Chinese works directly.

> The models run in your browser, so the text you analyze is **not** sent to any server. The first use downloads the model (Chinese about 103 MB, English about 67 MB). After that the browser keeps it, so later runs are fast.

### Accuracy (tested)
| Test set | Correct |
|---|---|
| 50 short Traditional Chinese sentences | 96% |
| 400 Chinese reviews | 96% |
| 30 short English sentences | 100% |
| 400 English movie reviews | about 90% |`,

  highlights: [
    {icon: '🌏', title: 'Detects the language', text: 'Chinese text uses the Chinese model, English uses the English model. No switching needed.'},
    {icon: '🔒', title: 'Runs on your computer', text: 'The model runs in the browser; the text is not uploaded.'},
    {icon: '📊', title: 'Shows progress', text: '"Model status" shows the download percentage and initializing, so students know how long to wait.'},
    {icon: '⏳', title: 'Waits for the model', text: 'The preload and analyze blocks wait until they finish, so you do not need to guess wait times.'}
  ],

  groups: [
    {name: 'Prepare the model', intro: 'The model is downloaded the first time it is used. Preload it at the start of the green flag script so it is ready by the time students type.'},
    {name: 'Analyze text', intro: 'Put the text in with "Enter text sentiment", then analyze it with "Start Text Emotion Recognition".'},
    {name: 'Results', intro: 'Read the results after the analysis.'}
  ],

  blocks: {
    preloadModel: {
      args: {LANG: 'Which language model to load. Choose "Chinese" for projects that only use Chinese: the download is smaller.'},
      summary: 'Download and prepare the model in advance.',
      detail: `This block **waits until the model can be used** (or loading fails) before the next block runs.

It is optional: the first [[startTextSentiment]] loads the model automatically, but that first run takes longer.

[[getModelStatus]] shows the progress: a percentage while downloading, then "initializing" for a while (about 20 seconds the first time), then "ready".`,
      tips: 'To do something else while loading (such as showing progress), put this block in a separate green flag script and check [[isModelReady]]. See example 3.'
    },
    isModelReady: {
      args: {LANG: 'The model to check. "all" means both Chinese and English must be ready.'},
      summary: 'Whether the model can be used yet.',
      detail: 'Only checks; it does **not** start loading the model. Most often used with "wait until", so another script waits for the model.',
      returns: '`true` when the model is ready, otherwise `false`.',
      example: [
        {t: 'wait until [C]', cat: 'control', args: {C: {use: 'isModelReady', args: {LANG: {v: 'Chinese', menu: true}}}}},
        {t: 'say [M]', cat: 'looks', args: {M: "I'm ready!"}}
      ]
    },
    getModelStatus: {
      summary: 'The current loading state of the model.',
      detail: `| Shows | Meaning |
|---|---|
| not loaded | Download has not started |
| loading 56% | Downloading (the percentage only goes up) |
| initializing | Downloaded; preparing the model |
| ready | Ready to use |
| failed | Usually a network problem. Reload the page and try again |

It shows the language used most recently, for example \`Chinese:ready\`. When preloading "all", both are shown, for example \`Chinese:loading 32% / English:ready\`.`,
      returns: 'Status text.'
    },
    inputText: {
      args: {defaultText: 'The text to analyze, often "answer" or a variable. Only the first 500 characters are analyzed.'},
      summary: 'Set the text to analyze.',
      detail: 'This block only stores the text; it **does not analyze** it yet. Run [[startTextSentiment]] next to get a result.'
    },
    startTextSentiment: {
      summary: 'Analyze the current text. The three reporter blocks below are updated.',
      detail: `This block waits until the analysis is done, so the next block can read [[getSentiment]], [[getConfidence]] and [[getLanguage]] right away.

If the model is not loaded yet, it loads first (the first time takes longer). If the text is empty or has no Chinese or English letters (only numbers and symbols, for example), the result is "neutral" and the model is not called.`,
      tips: 'When several scripts analyze at the same time, only the latest result is kept. A slower, older result never overwrites it.'
    },
    getSentiment: {
      summary: '"positive" or "negative".',
      detail: 'The model only learned two classes, positive and negative, so a normal sentence always gets one of them. To detect "neutral", set your own range on the [[getConfidence]] score (see the FAQ).',
      returns: '`positive` or `negative`; `neutral` when the text is empty; empty before the first analysis. The Chinese interface returns 正面 / 負面 / 中性.',
      example: [
        {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] = [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getSentiment'}, B: 'positive'}}}, body: [
          {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'happy', menu: true}}}
        ], else: [
          {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'sad', menu: true}}}
        ]}
      ]
    },
    getConfidence: {
      summary: 'How positive the sentence is, as a score from 0 to 1.',
      detail: `> Note: this number is **how positive** the text is, not how sure the AI is.

- Close to **1**: very positive ("I got 100 on my test today, I'm so happy!" is about 0.98)
- Close to **0**: very negative
- **Around 0.5**: the model is not sure; you can treat it as neutral

It works this way to stay compatible with projects made with the old version of the plugin.`,
      returns: 'A number from 0 to 1, rounded to two decimal places. 0 before the first analysis.'
    },
    getLanguage: {
      summary: 'Whether the Chinese or English model was used this time.',
      detail: 'Any Chinese in the text means the Chinese model is used. For mixed text, the number of Chinese characters is compared with the number of English words, and the larger one wins.',
      returns: '`Chinese` or `English`; empty when there are no Chinese or English letters.'
    }
  },

  examples: [
    {
      title: 'Mood diary',
      intro: 'Ask about today; the sprite changes costume and answers based on the feeling.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'preloadModel', args: {LANG: {v: 'English', menu: true}}},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'How was your day?'}},
        {use: 'inputText', args: {defaultText: {t: 'answer', cat: 'sensing', type: 'reporter'}}},
        {use: 'startTextSentiment'},
        {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] = [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getSentiment'}, B: 'positive'}}}, body: [
          {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'happy', menu: true}}},
          {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: "Great, I'm happy for you!", S: {num: '2'}}}
        ], else: [
          {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'comfort', menu: true}}},
          {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: 'That sounds hard. Here is a hug.', S: {num: '2'}}}
        ]}
      ]
    },
    {
      title: 'Mood thermometer',
      intro: 'Turn the score into a height: the more positive, the higher the pointer.',
      script: [
        {t: 'when [K] key pressed', cat: 'events', type: 'hat', args: {K: {v: 'space', menu: true}}},
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'Say something'}},
        {use: 'inputText', args: {defaultText: {t: 'answer', cat: 'sensing', type: 'reporter'}}},
        {use: 'startTextSentiment'},
        {t: 'glide [S] secs to x: [X] y: [Y]', cat: 'motion', args: {S: {num: '1'}, X: {num: '0'}, Y: {t: '[A] - [B]', cat: 'operators', type: 'reporter', args: {A: {t: '[A] * [B]', cat: 'operators', type: 'reporter', args: {A: {use: 'getConfidence'}, B: {num: '300'}}}, B: {num: '150'}}}}}
      ],
      explain: 'The 0 to 1 score times 300, minus 150, gives a y position from -150 to 150 on the stage.'
    },
    {
      title: 'Show progress while loading',
      intro: 'Two green flag scripts start together: one loads the model, the other shows progress and lets students type once it is ready.',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {use: 'preloadModel', args: {LANG: {v: 'all', menu: true}}}
        ],
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {t: 'repeat until [C]', cat: 'control', type: 'c', args: {C: {use: 'isModelReady', args: {LANG: {v: 'all', menu: true}}}}, body: [
            {t: 'say [M]', cat: 'looks', args: {M: {use: 'getModelStatus'}}}
          ]},
          {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: 'Ready!', S: {num: '1'}}},
          {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'Type a sentence'}}
        ]
      ]
    }
  ],

  faq: [
    {q: 'The first run takes a long time?', a: 'The first time, the model is downloaded (Chinese about 103 MB, English about 67 MB) and then initialized for about 20 seconds. The browser keeps the model, so later runs are fast. Before class, open it once on each computer.'},
    {q: 'Why is there no "neutral"?', a: `The model only learned positive and negative. You can decide with the score yourself, for example treat [[getConfidence]] between 0.4 and 0.6 as neutral:

- Above 0.6: positive
- Below 0.4: negative
- Otherwise: neutral`},
    {q: 'Progress jumps to 99% and then goes down?', a: 'The old version did this. Fixed on 2026-11-17: the percentage only goes up now, and "initializing" is shown after the download.'},
    {q: 'Can it work offline?', a: 'It needs the internet for now (the library comes from jsDelivr and the models from Hugging Face). On a computer that already downloaded them, the models stay in the browser cache.'},
    {q: 'Do old projects still work?', a: 'Yes. All the old blocks are kept. The old version translated Chinese into English before analyzing; the new version uses a Chinese model directly, with no translation.'}
  ],

  changelog: [
    {date: '2026-11-09', text: 'Switched to two new models, Chinese and English, with no translation step; added sentiment result, detected language, preload model and model status blocks'},
    {date: '2026-11-17', text: 'Added the "model ready?" block; progress only goes up and shows "initializing"; card changed to the purple starry style'}
  ]
});
