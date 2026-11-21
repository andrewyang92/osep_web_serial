/*
 * Claude AI plugin: English descriptions.
 * Block text, menus and defaults come from plugins/claude.js (synced from the plugin source).
 */
OSEP.addText('claude', 'en', {
  tagline: 'Let sprites chat with Claude AI, and let Claude look at the stage to answer questions.',
  tags: ['AI', 'Language', 'Chatbot'],
  needs: ['Internet'],

  overview: `This plugin brings Anthropic's **Claude** AI into Scratch. A sprite can send a question to Claude and say the answer, so you can build chatbots, quiz games, story chains, homework helpers and more.

Claude can also "see" the stage: [[askStage]] sends the current stage image along with the question, so Claude can describe the scene, guess what you drew, or give feedback on your project.

> You need **your own Anthropic API key**. Enter it with [[setApiKey]]. The plugin connects to Anthropic directly, and usage is billed to the key's account.

### Getting started
- Get an API key (starts with \`sk-ant-\`) from Anthropic's Claude Console
- Put [[setApiKey]] at the top of the green flag script and enter the key
- Ask with [[ask]], then read the answer with [[getAnswer]]`,

  highlights: [
    {icon: '💬', title: 'Ask with one block', text: '"talk text of" sends a question and "Claude answer" gives the reply. The block waits for Claude automatically.'},
    {icon: '🖼️', title: 'Understands the stage', text: 'Send a picture of the stage to Claude to describe, grade, or guess.'},
    {icon: '🧠', title: 'Remembers the conversation', text: 'With memory on, Claude remembers the last 10 rounds and can carry on the conversation.'},
    {icon: '🎭', title: 'Custom AI role', text: 'Use "configure system of" to make Claude a teacher, a story character or a game host.'}
  ],

  groups: [
    {name: 'Connection', intro: 'Before using this plugin, you must enter your own Anthropic API key with [[setApiKey]].'},
    {name: 'Setup', intro: "Set Claude's role, the model, and whether it remembers the conversation. Usually placed at the start of the green flag script."},
    {name: 'Fine-tuning', intro: 'Adjust the style and length of answers. Optional: defaults are used if you skip them.'},
    {name: 'Asking', intro: 'Three ways to ask. All three blocks **wait for Claude to finish answering** before the next block runs.'},
    {name: 'Results', intro: 'Read the answer and status, and copy or clear when you are done.'}
  ],

  blocks: {
    setAccessCode: {
      args: {CODE: 'The access code from your teacher. Spaces at the start and end are removed.'},
      summary: 'Enter the access code for the relay server.',
      detail: `If the relay has an access code (\`ACCESS_CODE\`), every question must include the right code. Put this block at the top of the green flag script; once per project is enough.

You do not need this block for a relay without an access code.`,
      tips: 'With a wrong code, [[getStatus]] shows "Error: Wrong access code".'
    },
    setApiKey: {
      args: {KEY: 'Your own Anthropic API key (starts with `sk-ant-`). Leaving the default `sk-ant-...` or clearing it means no key, and asking gives "Please set your Claude API key first".'},
      summary: 'Enter your own API key to connect to Anthropic.',
      detail: `**You must set a key to use this plugin.** The plugin calls the Anthropic API directly, and usage is billed to the key's account.

You can get a key from Anthropic's Claude Console. Put this block at the top of the green flag script; once per project is enough.`,
      tips: '> ! A key typed into the block is saved in the .sb3 project file. Delete the key before you share or upload the project.'
    },
    setProxyUrl: {
      args: {URL: 'The address of your own Google Apps Script deployment (ends with `/exec`). Leaving the default text changes nothing; clearing it goes back to the OSEP relay.'},
      summary: 'Use a different relay server (Google Apps Script).',
      detail: 'The OSEP relay address is built in, so you usually do not need this. If a school wants its own relay on its own Google account (for example to have its own usage limit), deploy it with the steps in `gas/README.md` in the plugin folder, then enter the address with this block.'
    },
    setSystem: {
      args: {SYSTEM: "Claude's role and rules: who it is, how it talks, how long the answers are, which language to use."},
      summary: 'Tell Claude who it is and how to answer.',
      detail: `This text is the "system prompt". It is sent with every question but is not part of the conversation. Good prompts state the **role**, the **audience** and the **rules**, for example:

- You are an octopus teacher who lives under the sea. Answer primary school students in 50 words or fewer.
- You are the host of a guessing game. I will guess an animal; you may only answer "yes" or "no".
- Answer in English.

Without this block, Claude gets no role at all.`,
      tips: 'If Claude answers in the wrong language, add "Answer in English" (or the language you want) to the role.'
    },
    setModel: {
      args: {MODEL: 'The Claude model to use. Pick one from the menu, or put in a variable or type a model name.'},
      summary: 'Choose which Claude model to use.',
      detail: `| Model | Good for |
|---|---|
| \`claude-haiku-5-5\` (default) | Fast answers, fine for most class activities |
| \`claude-sonnet-5-5\` | Smarter: reasoning, code, longer answers. Slower |

You can also type another model name that is not in the menu (it must be a Claude model your key can use).`
    },
    setMemory: {
      args: {ONOFF: 'Turn conversation memory on or off.'},
      summary: 'Make Claude remember (or forget) what was said before.',
      detail: `Memory starts **off**: every question stands alone and Claude does not know what you asked before.

When it is on, Claude remembers the last **10 rounds** (10 questions and 10 answers) and can continue the conversation, for example in a story chain or a multi-step quiz. After 10 rounds the oldest ones are forgotten first.

Turning memory off also clears what was remembered.`,
      tips: 'More memory means longer requests and slightly slower answers. Use [[clearHistory]] to start a new topic. A round that failed is not remembered.'
    },
    setTemperature: {
      args: {TEMP: 'A number from 0 to 1. Values outside the range are changed to 0 or 1; empty means the model default.'},
      summary: 'Choose steady, consistent answers or creative, varied ones.',
      detail: `- **Close to 0**: answers are similar each time and more careful. Good for questions, translation and calculation.
- **Close to 1**: answers vary more and are more imaginative. Good for stories, names and ideas.

Without this block, the model's own default is used.`
    },
    setMaxTokens: {
      args: {TOKENS: 'The longest the answer can be, from 1 to 16000 (default 1024).'},
      summary: 'Limit how long an answer can be.',
      detail: `A token is the unit AI uses to measure text. An English word is about 1 to 2 tokens. Smaller numbers give shorter, faster answers.

If an answer stops halfway, [[getStatus]] shows "done (reply cut off: increase max length)". Make the number bigger.`,
      tips: 'For short answers, it is better to write "answer in 30 words or fewer" in [[setSystem]] than to make the token limit tiny, so answers are not cut off mid-sentence.'
    },
    ask: {
      args: {QUESTION: 'What you want to ask Claude. You can use "answer", a variable, or a join block.'},
      summary: 'Send a question to Claude and wait for the answer.',
      detail: `The block waits until Claude answers (or an error happens) before the next block runs. The answer is kept in [[getAnswer]], so you can say it, store it in a variable, or check it.

An empty question is not sent; the status shows "Error: The question is empty".`,
      example: [
        {use: 'ask', args: {QUESTION: 'Think of a name for a cat'}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getAnswer'}}}
      ]
    },
    askReporter: {
      args: {QUESTION: 'What you want to ask Claude.'},
      summary: 'Ask and use the answer directly as a value.',
      detail: `Like [[ask]], it sends the question and waits. The difference is that this is a rounded reporter block, so you can drop it straight into "say", "set variable to" and other inputs, with one block fewer.

The answer is also kept in [[getAnswer]].`,
      returns: 'The text of Claude\'s answer. On an error, the error message (starting with "Error: ").',
      example: [
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'askReporter', args: {QUESTION: 'In one sentence, why is the sky blue?'}}}}
      ]
    },
    askStage: {
      args: {QUESTION: 'A question about the stage.'},
      summary: 'Send a picture of the stage to Claude with a question.',
      detail: `When the block runs, the plugin captures the whole stage (backdrop, sprites, pen drawings) and sends it with the question. You can use it to:

- Let Claude describe the scene: "How many sprites are on the stage?"
- Drawing guessing game: draw with the pen, then ask "What did I draw? Answer with one word."
- Project feedback: "How could this game screen be better?"

The answer is kept in [[getAnswer]] as usual.`,
      tips: 'The video image is captured too, so with "turn video on" Claude can look at the camera.'
    },
    getAnswer: {
      summary: "Claude's most recent answer.",
      detail: 'Tick the checkbox next to the block to show the answer on the stage.',
      returns: 'The text of the latest answer. Empty before the first question; the error message if the question failed.'
    },
    isBusy: {
      summary: 'Whether a question is still waiting for Claude.',
      detail: 'Useful for a "thinking" animation, for example in another script: while Claude is thinking, switch the sprite to a thinking costume.',
      returns: '`true` while a question is waiting for an answer, otherwise `false`.',
      example: [
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {use: 'isBusy'}}, elseText: 'else', body: [
            {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'thinking', menu: true}}}
          ], else: [
            {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'normal', menu: true}}}
          ]}
        ]}
      ]
    },
    getStatus: {
      summary: 'The current status, or the reason for the last error.',
      detail: `| Status | Meaning |
|---|---|
| ready | Nothing asked yet |
| thinking… | Waiting for Claude to answer |
| done | Answered |
| done (reply cut off: increase max length) | The answer was too long and was cut. Increase [[setMaxTokens]] |
| Error: … | The question failed. The reason follows the colon (see the FAQ below) |`,
      returns: 'Status text.'
    },
    copyText: {
      args: {TEXT: 'The text to copy, often [[getAnswer]].'},
      summary: "Copy text to the computer's clipboard.",
      detail: 'Then press Ctrl+V in another program to paste, for example to put a story Claude wrote into a document.',
      tips: 'Browsers only allow copying right after a user action (such as clicking a sprite or pressing a key), so put this under "when this sprite clicked".'
    },
    clearHistory: {
      summary: 'Forget the remembered conversation and start a new topic.',
      detail: 'Only matters when [[setMemory]] is on. After clearing, the next question is like meeting Claude for the first time. The memory setting itself does not change.'
    }
  },

  examples: [
    {
      title: 'The simplest chatbot',
      intro: 'The sprite asks what you want to talk about, then says Claude\'s answer, over and over.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'setApiKey', args: {KEY: 'sk-ant-...'}},
        {use: 'setSystem', args: {SYSTEM: 'You are a friendly tutor. Answer briefly in English.'}},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'What do you want to ask Claude?'}},
          {use: 'ask', args: {QUESTION: {t: 'answer', cat: 'sensing', type: 'reporter'}}},
          {t: 'say [M]', cat: 'looks', args: {M: {use: 'getAnswer'}}}
        ]}
      ],
      explain: 'Because [[ask]] waits for the answer, "say" always gets this answer. No extra "wait" is needed.'
    },
    {
      title: 'Role-play that remembers',
      intro: 'Give Claude a role and turn on memory for a continuous conversation.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'setApiKey', args: {KEY: 'sk-ant-...'}},
        {use: 'setSystem', args: {SYSTEM: 'You are an octopus teacher who lives under the sea. Use words a primary school student understands, 50 words or fewer.'}},
        {use: 'setMemory', args: {ONOFF: {v: 'on', menu: true}}},
        {use: 'clearHistory'},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'What do you want to talk to the octopus teacher about?'}},
          {t: 'say [M]', cat: 'looks', args: {M: {use: 'askReporter', args: {QUESTION: {t: 'answer', cat: 'sensing', type: 'reporter'}}}}}
        ]}
      ],
      explain: 'The [[clearHistory]] at the start means the octopus teacher forgets the previous run when you click the green flag again.'
    },
    {
      title: 'Draw and let Claude guess',
      intro: 'Draw on the stage with the pen, then press space to let Claude guess what you drew. (Set your key with [[setApiKey]] in the green flag script first.)',
      script: [
        {t: 'when [K] key pressed', cat: 'events', type: 'hat', args: {K: {v: 'space', menu: true}}},
        {t: 'say [M]', cat: 'looks', args: {M: 'Let me see…'}},
        {use: 'askStage', args: {QUESTION: 'I drew something on the stage. Guess what it is. Answer with one word.'}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getAnswer'}}}
      ],
      explain: 'The more specific the question (for example "answer with one word"), the easier it is to use the answer in a game.'
    }
  ],

  faq: [
    {q: 'Claude answers in the wrong language?', a: 'Use [[setSystem]] and add "Answer in English" (or the language you want) to the role.'},
    {q: 'I see "Error: Too many requests or out of credit"?', a: 'Wait and try again. If it keeps happening, check the credit and usage limits of the key\'s account in the Claude Console.'},
    {q: 'What do the error messages mean?', a: `| Message | Cause and fix |
|---|---|
| Please set your Claude API key first | No key yet. Enter one with [[setApiKey]] at the top of the green flag script |
| Invalid API key | Check the key you entered |
| Too many requests or out of credit | Wait and try again; check the credit of the key's account |
| Claude is busy right now | Claude is overloaded for a moment. Try again later |
| Timed out | No answer within 90 seconds. Use the haiku model or a smaller max token |
| Could not capture the stage | Taking the stage picture failed. Reload the page and try again |`},
    {q: 'Can I use Opus or other models?', a: 'The menu lists `claude-haiku-5-5` and `claude-sonnet-5-5`. You can also type another Claude model name into [[setModel]]. Larger models cost more and are slower.'},
    {q: 'Answers take a long time?', a: `- Use \`claude-haiku-5-5\` (the default)
- Ask for short answers with [[setMaxTokens]] or in the role
- With memory on for a long time, requests grow longer. Clear them with [[clearHistory]]`},
    {q: 'Are students\' questions stored?', a: 'Questions go directly to Anthropic to produce the answer. The plugin itself does not store conversations. With memory on, the conversation is kept only in the browser and disappears when the page is reloaded.'}
  ],

  changelog: [
    {date: '2026-11-11', text: 'Plugin created, with the OSEP relay and your own key as connection options'},
    {date: '2026-11-14', text: 'Block text changed to match the OpenAI plugin'},
    {date: '2026-11-17', text: 'Blocks regrouped into five groups; card changed to the purple starry style'},
    {date: '2026-11-21', text: 'Your own API key is now required: the built-in relay address was removed, and the "set class access code" and "set relay (GAS) URL" blocks are hidden (they still run in old projects)'}
  ]
});
