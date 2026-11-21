/*
 * TMPose2Scratch plugin: English descriptions.
 * Block text, menus and defaults come from plugins/tmpose2scratch.js (synced from the plugin source).
 */
OSEP.addText('tmpose2scratch', 'en', {
  tagline: 'Bring pose models trained in Teachable Machine into Scratch and control projects with body movements.',
  tags: ['AI', 'Vision', 'Camera'],
  needs: ['Internet', 'Camera'],

  overview: `Google's **Teachable Machine** can train "pose" models: strike a few poses in front of the camera (left hand up, right hand up, squat), collect samples for each, and it learns to tell them apart. This plugin connects the trained pose model to Scratch.

Unlike image models (TM2Scratch), which look at the whole picture, pose models only look at the positions of the body's skeleton, so the background and clothes matter less.

### Steps
- In Teachable Machine, create a **Pose Project**
- Name each Class, collect samples by posing in front of the camera, and click **Train Model**
- Click **Export Model** → **Upload (shareable link)** and copy the address
- In Scratch, paste the address into [[setPoseClassificationModelURL]]

> The plugin turns the camera on (mirrored) as soon as it loads. Recognition runs in your browser; images are not uploaded. The model and libraries are downloaded from the internet.

Original plugin authors: Tsukurusha, YengawaLab and Google.`,

  groups: [
    {name: 'Pose recognition', intro: 'Load a model with [[setPoseClassificationModelURL]] first. The plugin then keeps recognizing poses in the camera image automatically.'},
    {name: 'Settings', intro: ''}
  ],

  blocks: {
    whenPoseLabelReceived: {
      args: {LABEL: 'The pose class to wait for. "any" means any class counts.'},
      summary: 'Runs the script below when this pose is recognized.',
      detail: 'The result is cleared briefly between recognitions, so holding the same pose fires it again about once per recognition interval (1 second by default).'
    },
    isPoseLabelDetected: {
      args: {LABEL: 'The pose class to check, or "any".'},
      summary: 'Whether the current pose is this class.',
      returns: '`true` if it is, otherwise `false`.'
    },
    poseLabelConfidence: {
      args: {LABEL: 'The pose class to check.'},
      summary: "A pose class's confidence in the latest recognition.",
      returns: 'A number from 0 to 1. Sometimes 0 between two recognitions.'
    },
    setPoseClassificationModelURL: {
      args: {URL: 'The pose model address from Teachable Machine after uploading, ending with `/`. Empty by default in the English interface (the Chinese interface has a demo model).'},
      summary: 'Load a pose model from Teachable Machine.',
      detail: 'Waits until the model is loaded. The same address with an unchanged model is not downloaded again.',
      tips: 'A wrong address gives no message; your classes just do not appear in the label menu.'
    },
    classifyVideoPoseBlock: {
      summary: 'Recognize the pose in the camera image once, right now.',
      detail: 'With automatic recognition turned off by [[toggleClassification]], use this to decide when to recognize.'
    },
    getPoseLabel: {
      summary: 'The recognized pose (the most likely class).',
      returns: 'The class name. Empty when below the threshold, before the first recognition, or between two recognitions.'
    },
    toggleClassification: {
      args: {CLASSIFICATION_STATE: 'Turn automatic recognition on or off.'},
      summary: 'Turn automatic recognition on or off.',
      detail: 'It is **on** by default.'
    },
    setClassificationInterval: {
      args: {CLASSIFICATION_INTERVAL: '1, 0.5, 0.2 or 0.1 seconds.'},
      summary: 'Set how often to recognize.',
      detail: 'Default 1 second. For movement games, 0.2 seconds reacts faster.'
    },
    setConfidenceThreshold: {
      args: {CONFIDENCE_THRESHOLD: '0 to 1, default 0.5.'},
      summary: 'Set the confidence threshold: how sure the most likely pose must be to count.'
    },
    getConfidenceThreshold: {
      summary: 'The current confidence threshold.',
      returns: 'A number from 0 to 1.'
    },
    videoToggle: {
      args: {VIDEO_STATE: '"on" shows a mirror image; "on flipped" is not mirrored; "off" makes the camera image transparent.'},
      summary: 'Choose how the camera image is shown on the stage.',
      detail: '"off" only makes the image fully transparent; the camera stays on and recognition continues.'
    }
  },

  examples: [
    {
      title: 'Move a sprite by raising your hands',
      intro: 'Train "left hand up", "right hand up" and "standing"; the sprite moves left and right.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'setPoseClassificationModelURL', args: {URL: 'https://teachablemachine.withgoogle.com/models/your-model/'}},
        {use: 'setClassificationInterval', args: {CLASSIFICATION_INTERVAL: {v: '0.2', menu: true}}},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {use: 'isPoseLabelDetected', args: {LABEL: {v: 'left hand up', menu: true}}}}, body: [
            {t: 'change x by [N]', cat: 'motion', args: {N: {num: '-5'}}}
          ]},
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {use: 'isPoseLabelDetected', args: {LABEL: {v: 'right hand up', menu: true}}}}, body: [
            {t: 'change x by [N]', cat: 'motion', args: {N: {num: '5'}}}
          ]}
        ]}
      ]
    },
    {
      title: 'Squat counter',
      intro: 'Train "stand" and "squat"; going from squat back to stand counts once.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'setPoseClassificationModelURL', args: {URL: 'https://teachablemachine.withgoogle.com/models/your-model/'}},
        {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'count', menu: true}, N: {num: '0'}}},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'wait until [C]', cat: 'control', args: {C: {use: 'isPoseLabelDetected', args: {LABEL: {v: 'squat', menu: true}}}}},
          {t: 'wait until [C]', cat: 'control', args: {C: {use: 'isPoseLabelDetected', args: {LABEL: {v: 'stand', menu: true}}}}},
          {t: 'change [V] by [N]', cat: 'data', args: {V: {v: 'count', menu: true}, N: {num: '1'}}},
          {t: 'say [M]', cat: 'looks', args: {M: {t: 'count', cat: 'data', type: 'reporter'}}}
        ]}
      ],
      explain: 'With two "wait until" blocks, you have to squat first and then stand up for it to count.'
    }
  ],

  faq: [
    {q: 'My classes are not in the label menu?', a: `- The model has not finished loading, or the address is wrong (it must end with \`/\`)
- Use the address you get after Export Model → Upload
- The menu updates when you open it after loading`},
    {q: 'Recognition is inaccurate?', a: `- Your whole body (at least the upper body) must be in view
- Collect more samples per pose, standing at different positions and distances
- Raise the threshold with "set confidence threshold"`},
    {q: 'Slow to start, or no response?', a: 'When the plugin loads, it downloads the TensorFlow and Teachable Machine libraries from the internet. On a slow network this takes a while.'}
  ],

  changelog: [
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
