/*
 * Face Expression (MediaPipe) plugin: English descriptions.
 * Block text, menus and defaults come from plugins/faceExpressionMediapipe.js (synced from the plugin source).
 */
OSEP.addText('faceExpressionMediapipe', 'en', {
  tagline: 'Use the camera to read facial expressions, face movements and head angles, and make projects that react to your face.',
  tags: ['AI', 'Vision', 'Camera'],
  needs: ['Camera', 'Internet'],

  overview: `This plugin uses Google's **MediaPipe** face model to find 478 landmarks on the face in the camera image, and works out:

- **Emotion**: neutral, happy, sad, angry, fearful, disgusted, surprised (7 in total)
- **Face movements**: smile, mouth open, blink, raised eyebrows, pucker, cheek puff and more (11 in total), each from 0 to 100
- **Position and angle**: where the face is on the stage, how big it is, and how far the head turns, tilts and looks up

Make expression games, steer a sprite with your face, blink switches, open-your-mouth-to-eat games, expression scoreboards and more.

> Images are processed only on your computer and are **not** uploaded. The first use needs the internet to download the model (about 3.6 MB).

> ! Emotions are estimated from combinations of face movements, so clear expressions work better. Good lighting and facing the camera give the best results.`,

  highlights: [
    {icon: '😀', title: '7 emotions', text: 'Plus a "when facial emotion becomes" hat block that fires as soon as the expression changes.'},
    {icon: '😉', title: '11 face movements', text: 'Blink, mouth open and raised eyebrows each have a 0 to 100 amount: great for controllers.'},
    {icon: '🧭', title: 'Position and angle', text: 'The face x and y are already stage coordinates, so a sprite can follow your face directly.'},
    {icon: '⚡', title: 'GPU acceleration', text: 'Computers that support it use the graphics card for smoother results; others fall back to the CPU.'}
  ],

  groups: [
    {name: 'Start', intro: 'Usually one "start face expression recognition" block is all you need. The camera turns on automatically.'},
    {name: 'Emotion', intro: 'Seven emotions: neutral, happy, sad, angry, fearful, disgusted, surprised. The menus accept variables too; both "happy" and the Chinese 開心 work.'},
    {name: 'Face movements and position', intro: 'No emotion guessing: read how much each part of the face moves, plus position and angle. Good for games you play with your face.'},
    {name: 'Stop', intro: ''}
  ],

  blocks: {
    videoToggle: {
      args: {VIDEO_STATE: '"on" shows a mirror image; "on flipped" is not mirrored; "off" turns off the camera.'},
      summary: 'Turn the camera image on, off, or flip it.',
      detail: `Works like the block with the same name in Scratch's built-in Video Sensing.

It is optional: [[startRecognition]] turns the video on if it is off. The difference: **video you turned on with this block** stays on when recognition stops; video turned on automatically by "start" is turned off with it.`,
      tips: 'If you turn the video off during recognition, [[getStatus]] shows "Video is off, set video to On". Turn it on again and recognition continues by itself.'
    },
    startRecognition: {
      summary: 'Load the model, turn on the camera, and keep recognizing.',
      detail: `It does three things in order: load the MediaPipe model, turn on the camera, then recognize every frame.

The block **waits until everything is ready (or fails)** before the next block runs, so the next block reads the right [[getStatus]]. Loading the model takes about 10 seconds the first time.

The browser asks for permission to use the camera. Click "Allow".`,
      tips: 'Running it again does not load the model twice. After a failure, run it again to retry.'
    },
    getStatus: {
      summary: 'Which step it is on, or why it failed.',
      detail: `| Status | Meaning |
|---|---|
| Not started | "start" has not been run |
| Loading MediaPipe model... | Downloading and preparing the model |
| Opening camera... | Waiting for the camera |
| Recognizing (GPU) / (CPU) | Recognizing; the brackets show the processor used |
| Stopped | [[stopRecognition]] was used |
| Video is off, set video to On | Recognizing, but the camera was turned off |
| Error: cannot open camera… | Camera permission not allowed, or another program is using the camera |
| Error: cannot load MediaPipe library | Network problem |
| Error: cannot load the face model | Network problem, or the model address is blocked |`,
      returns: 'Status text. On an error, details are added in brackets.',
      example: [
        {use: 'startRecognition'},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {use: 'getStatus'}, S: {num: '2'}}}
      ]
    },
    isFaceDetected: {
      summary: 'Whether there is a face in the image right now.',
      detail: 'Only **one face** is recognized. With several people in view, the first face the model finds is used.',
      returns: '`true` when a face is found; `false` when there is no face, or recognition has not started or has stopped.'
    },
    whenEmotion: {
      args: {EMOTION: 'The emotion to wait for.'},
      summary: 'Runs the script below when the emotion "becomes" the chosen one.',
      detail: `Fires once, at the moment the emotion **changes to** this one. Holding the same expression does not fire again. Change to another expression and back to fire it again.

[[startRecognition]] must run first for this block to work.`
    },
    isEmotion: {
      args: {EMOTION: 'The emotion to compare with.'},
      summary: 'Whether the current emotion is the chosen one.',
      detail: 'Put it in "if" or "wait until", for example "wait until <facial emotion is happy?>".',
      returns: '`true` if it is; `false` if not, or when no face is found.'
    },
    getEmotion: {
      summary: 'The emotion with the highest score right now.',
      detail: 'When none of the other 6 emotions is clear, the result is "neutral".',
      returns: 'The emotion name, for example `happy`; `no face detected` when there is no face; empty before starting or after stopping.'
    },
    getConfidence: {
      summary: 'How high the current emotion\'s score is (0 to 1).',
      detail: 'This is the score of the [[getEmotion]] emotion. Bigger numbers mean a clearer expression.',
      returns: 'A number from 0 to 1, rounded to two decimal places; 0 when there is no face.'
    },
    getEmotionScore: {
      args: {EMOTION: 'The emotion whose score you want.'},
      summary: 'The score of one emotion (0 to 100).',
      detail: 'Every emotion has its own score. Use it for an emotion meter, to compare two emotions, or to set your own trigger (for example a big laugh only when the happy score is above 80).',
      returns: 'A whole number from 0 to 100; 0 when there is no face.'
    },
    getAction: {
      args: {ACTION: 'The face movement to read.'},
      summary: 'How strongly a face movement is made (0 to 100).',
      detail: `0 means the movement is not made at all; 100 means it is made as much as possible. Common uses:

- mouth open amount > 50: the sprite eats something
- left eye closed, right eye closed: blink to switch things on and off
- eyebrows raised amount: how high the sprite jumps`,
      returns: 'A whole number from 0 to 100; 0 when there is no face.',
      tips: '"Left eye" and "right eye" are **the person\'s own** left and right, not the left and right of the image.',
      example: [
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] > [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getAction', args: {ACTION: {v: 'mouth open', menu: true}}}, B: {num: '50'}}}}, body: [
            {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'mouth open', menu: true}}}
          ], else: [
            {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'mouth closed', menu: true}}}
          ]}
        ]}
      ]
    },
    getFaceProp: {
      args: {PROP: 'The position or angle to read.'},
      summary: 'Where the face is on the stage, how big it is, and the head angles.',
      detail: `| Option | Range and unit |
|---|---|
| x, y | Center of the face, in stage coordinates (x: -240 to 240, y: -180 to 180) |
| width, height | Size of the face on the stage. Bigger when closer to the camera |
| turn left/right (°) | How far the head turns left or right, in degrees; about 0 facing the camera |
| look up/down (°) | Positive looking up, negative looking down (degrees) |
| tilt (°) | How far the head leans toward a shoulder (degrees) |

The x value and the angles follow whether the video is mirrored, so they match what you see on the stage. Angles are estimates from the landmarks.`,
      returns: 'A number; 0 when there is no face.',
      tips: 'The numbers differ between people and cameras. First "say" the value while you turn your head, then choose a threshold.'
    },
    stopRecognition: {
      summary: 'Stop recognizing and reset all values.',
      detail: 'After stopping, [[getStatus]] shows "Stopped" and emotion, movements and position go back to 0 or empty. If the camera was turned on automatically by [[startRecognition]], it is turned off too; if you turned it on with [[videoToggle]], it stays on.'
    }
  },

  examples: [
    {
      title: 'Copy my face',
      intro: 'The sprite changes costume to match your expression. All three scripts go in the same sprite.',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {use: 'startRecognition'}
        ],
        [
          {use: 'whenEmotion', args: {EMOTION: {v: 'happy', menu: true}}},
          {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'smile', menu: true}}}
        ],
        [
          {use: 'whenEmotion', args: {EMOTION: {v: 'surprised', menu: true}}},
          {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'shocked', menu: true}}},
          {t: 'start sound [S]', cat: 'sound', args: {S: {v: 'wow', menu: true}}}
        ]
      ]
    },
    {
      title: 'Steer a sprite with your face',
      intro: 'The sprite follows your face and turns when you tilt your head.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'startRecognition'},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {use: 'isFaceDetected'}}, body: [
            {t: 'go to x: [X] y: [Y]', cat: 'motion', args: {X: {use: 'getFaceProp', args: {PROP: {v: 'x', menu: true}}}, Y: {use: 'getFaceProp', args: {PROP: {v: 'y', menu: true}}}}},
            {t: 'point in direction [D]', cat: 'motion', args: {D: {t: '[A] + [B]', cat: 'operators', type: 'reporter', args: {A: {num: '90'}, B: {use: 'getFaceProp', args: {PROP: {v: 'tilt (°)', menu: true}}}}}}}
          ]}
        ]}
      ],
      explain: 'With "if <face detected?>", the sprite stays where it is when your face leaves the image, instead of jumping back to the center (0, 0).'
    },
    {
      title: 'Blink counter',
      intro: 'Each time you close your right eye you score 1 point. "wait until" makes sure the eye opens again before the next blink counts.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'score', menu: true}, N: {num: '0'}}},
        {use: 'startRecognition'},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'wait until [C]', cat: 'control', args: {C: {t: '[A] > [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getAction', args: {ACTION: {v: 'right eye closed', menu: true}}}, B: {num: '60'}}}}},
          {t: 'change [V] by [N]', cat: 'data', args: {V: {v: 'score', menu: true}, N: {num: '1'}}},
          {t: 'wait until [C]', cat: 'control', args: {C: {t: '[A] < [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getAction', args: {ACTION: {v: 'right eye closed', menu: true}}}, B: {num: '30'}}}}}
        ]}
      ],
      explain: 'Two different thresholds, 60 and 30, stop the score from counting twice when the value wobbles around one threshold.'
    }
  ],

  faq: [
    {q: 'I see "Error: cannot open camera"?', a: `- Click the camera icon next to the address bar, change it to "Allow", then reload
- Close other programs using the camera (video calls, camera apps)
- If the computer has several cameras, choose the one to use in the OSEP interface`},
    {q: 'Expressions are not recognized well?', a: `- Use good lighting; do not sit with a bright light behind you
- Face the camera and come closer so the face is not too small
- Make the expressions clearer
- For precise checks, use [[getEmotionScore]] or [[getAction]] with your own thresholds`},
    {q: 'How is this different from the old "Face Expression Recognition" plugin?', a: 'The old plugin uses face-api.js and only has emotion and confidence. This plugin uses MediaPipe and adds a hat block, a score for each emotion, 11 face movements, face position and head angles. Both plugins can be used side by side; old projects are not affected.'},
    {q: 'Can it recognize several people at once?', a: 'Not at the moment. It recognizes one face.'},
    {q: 'Does it need the internet?', a: 'Yes. The library is downloaded from jsDelivr and the model from Google (about 3.6 MB). The images themselves are not uploaded.'}
  ],

  changelog: [
    {date: '2026-11-12', text: 'Plugin created (MediaPipe Face Landmarker)'},
    {date: '2026-11-17', text: 'Blocks grouped into four steps of use; the "blendshape" block hidden; card changed to the purple starry style'}
  ]
});
