/*
 * TM2Scratch plugin: English descriptions.
 * Block text, menus and defaults come from plugins/tm2scratch.js (synced from the plugin source).
 */
OSEP.addText('tm2scratch', 'en', {
  tagline: 'Bring image and sound models trained in Teachable Machine into Scratch, so sprites recognize what you taught them.',
  tags: ['AI', 'Vision', 'Camera', 'Sound'],
  needs: ['Internet', 'Camera', 'Microphone (sound models)'],

  overview: `Google's **Teachable Machine** (teachablemachine.withgoogle.com) trains AI without code: take a few dozen photos of "rock", "paper" and "scissors", or record "clap" and "whistle", and it learns to tell them apart. This plugin connects the trained model to Scratch.

### Steps
- In Teachable Machine, create an **Image Project** or an **Audio Project**
- Name each Class, take photos or record sounds, and click **Train Model**
- Click **Export Model** → **Upload (shareable link)** and copy the address (\`https://teachablemachine.withgoogle.com/models/…/\`)
- In Scratch, paste the address into [[setImageClassificationModelURL]] or [[setSoundClassificationModelURL]]

Once the model is loaded, the plugin keeps recognizing from the camera (or microphone), and the label menus show your class names.

> The plugin turns the camera on as soon as it loads. Recognition runs in your browser; images and sound are not uploaded. The model is downloaded from Teachable Machine.

Original plugin authors: Tsukurusha, YengawaLab and Google.`,

  groups: [
    {name: 'Image recognition', intro: 'Load an image model with [[setImageClassificationModelURL]] first. The plugin then keeps recognizing the camera image automatically.'},
    {name: 'Sound recognition', intro: 'Load a sound model with [[setSoundClassificationModelURL]]; the plugin starts listening through the microphone.'},
    {name: 'Settings', intro: ''}
  ],

  blocks: {
    whenReceived: {
      args: {LABEL: 'The class to wait for. "any" means any class counts.'},
      summary: 'Runs the script below when the result "becomes" this class.',
      detail: 'Fires once at the moment the result changes to this class from another one; staying on the same class does not fire it again.'
    },
    isImageLabelDetected: {
      args: {LABEL: 'The class to check, or "any".'},
      summary: 'Whether the current result is this class.',
      returns: '`true` if it is, otherwise `false`.'
    },
    imageLabelConfidence: {
      args: {LABEL: 'The class to check.'},
      summary: "A class's confidence in the latest recognition.",
      returns: 'A number from 0 to 1; closer to 1 means more alike. Sometimes 0 between two recognitions.'
    },
    setImageClassificationModelURL: {
      args: {URL: 'The model address from Teachable Machine after uploading, ending with `/`. The default is a demo model.'},
      summary: 'Load an image model from Teachable Machine.',
      detail: 'This block **waits until the model is loaded**. The same address with an unchanged model is not downloaded again. After retraining in Teachable Machine and uploading to the same address, run it again to switch to the new model.',
      tips: 'A wrong address gives no message; your classes just do not appear in the label menu.'
    },
    classifyVideoImageBlock: {
      summary: 'Recognize the camera image once, right now.',
      detail: 'With automatic recognition turned off by [[toggleClassification]], use this to decide when to recognize, for example once per press of the space key.'
    },
    getImageLabel: {
      summary: 'The image result (the most likely class).',
      returns: 'The class name. If the most likely class is below the threshold: "low confidence level". Empty before the first recognition.'
    },
    whenReceivedSoundLabel: {
      args: {LABEL: 'The class to wait for, or "any".'},
      summary: 'Runs the script below when the sound result "becomes" this class.'
    },
    isSoundLabelDetected: {
      args: {LABEL: 'The class to check, or "any".'},
      summary: 'Whether the current sound result is this class.',
      returns: '`true` if it is, otherwise `false`.'
    },
    soundLabelConfidence: {
      args: {LABEL: 'The class to check.'},
      summary: "A sound class's confidence.",
      returns: 'A number from 0 to 1.'
    },
    setSoundClassificationModelURL: {
      args: {URL: 'The address of a Teachable Machine sound model, ending with `/`. The default is a demo model.'},
      summary: 'Load a sound model from Teachable Machine and start listening.',
      detail: 'Waits until the model is loaded. The browser asks for permission to use the microphone. Click "Allow".',
      tips: 'The first class of a sound model is "Background Noise"; when it is quiet, that is usually the result.'
    },
    getSoundLabel: {
      summary: 'The sound result (the most likely class).',
      returns: 'The class name; "low confidence level" when below the threshold.'
    },
    toggleClassification: {
      args: {CLASSIFICATION_STATE: 'Turn automatic recognition on or off.'},
      summary: 'Turn automatic recognition on or off.',
      detail: 'It is **on** by default. When off, neither images nor sounds are recognized automatically; use [[classifyVideoImageBlock]] to recognize the image yourself.'
    },
    setClassificationInterval: {
      args: {CLASSIFICATION_INTERVAL: '1, 0.5, 0.2 or 0.1 seconds.'},
      summary: 'Set how often to recognize.',
      detail: 'Default 1 second. Shorter intervals react faster but keep the computer busier.'
    },
    setConfidenceThreshold: {
      args: {CONFIDENCE_THRESHOLD: '0 to 1, default 0.5.'},
      summary: 'Set the confidence threshold: how sure the most likely class must be to count.',
      detail: 'A higher threshold means fewer mistakes, but "low confidence level" appears more often.'
    },
    getConfidenceThreshold: {
      summary: 'The current confidence threshold.',
      returns: 'A number from 0 to 1.'
    },
    videoToggle: {
      args: {VIDEO_STATE: '"on" shows a mirror image; "on flipped" is not mirrored; "off" hides it from the stage.'},
      summary: 'Choose whether to show the camera image on the stage.',
      detail: 'It only changes what the stage shows. The plugin opens its own camera stream for recognition, so recognition continues when it is off.'
    }
  },

  examples: [
    {
      title: 'Rock, paper, scissors',
      intro: 'Train "rock", "paper" and "scissors" in Teachable Machine; the sprite plays its move and says who won.',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {use: 'setImageClassificationModelURL', args: {URL: 'https://teachablemachine.withgoogle.com/models/your-model/'}},
          {use: 'setConfidenceThreshold', args: {CONFIDENCE_THRESHOLD: {num: '0.8'}}},
          {t: 'say [M]', cat: 'looks', args: {M: 'Ready, show your hand!'}}
        ],
        [
          {use: 'whenReceived', args: {LABEL: {v: 'rock', menu: true}}},
          {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'paper', menu: true}}},
          {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: 'Paper. I win!', S: {num: '2'}}}
        ]
      ],
      explain: 'Write one script like this for each of the other two classes. A threshold of 0.8 avoids guesses while your hand is still moving.'
    },
    {
      title: 'Clap to light up',
      intro: 'Train a sound model with "Background Noise" and "clap"; the stage gets brighter when you clap.',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {use: 'setSoundClassificationModelURL', args: {URL: 'https://teachablemachine.withgoogle.com/models/your-model/'}}
        ],
        [
          {use: 'whenReceivedSoundLabel', args: {LABEL: {v: 'clap', menu: true}}},
          {t: 'change [E] effect by [N]', cat: 'looks', args: {E: {v: 'brightness', menu: true}, N: {num: '20'}}}
        ]
      ]
    },
    {
      title: 'Recognize on the space key',
      intro: 'Turn off automatic recognition; each press of space recognizes once and says the result.',
      script: [
        {t: 'when [K] key pressed', cat: 'events', type: 'hat', args: {K: {v: 'space', menu: true}}},
        {use: 'toggleClassification', args: {CLASSIFICATION_STATE: {v: 'off', menu: true}}},
        {use: 'classifyVideoImageBlock'},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getImageLabel'}}}
      ]
    }
  ],

  faq: [
    {q: 'My classes are not in the label menu?', a: `- The model has not finished loading, or the address is wrong (it must end with \`/\`)
- Use the address you get after Export Model → Upload, not the project page address
- The menu updates when you open it after loading`},
    {q: 'Recognition is inaccurate?', a: `- Take more samples per class, with different angles and lighting
- Add a "nothing" class so an empty view is not guessed as something
- Raise the threshold with "set confidence threshold"`},
    {q: 'It keeps saying "low confidence level"?', a: 'Even the most likely class is below the threshold. Lower the threshold, or collect more data in Teachable Machine and retrain.'},
    {q: 'How is it different from TMPose2Scratch?', a: 'TM2Scratch looks at the whole image (and sound); TMPose2Scratch looks at body posture (the skeleton). For movement projects, TMPose2Scratch is more accurate.'}
  ],

  changelog: [
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
