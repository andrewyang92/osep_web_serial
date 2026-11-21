/*
 * YOLO Object Detection plugin: English descriptions.
 * Block text, menus and defaults come from plugins/yoloDetection.js (synced from the plugin source).
 */
OSEP.addText('yoloDetection', 'en', {
  tagline: 'Use YOLO to find people, animals and things in an image, the stage or the camera, and where they are.',
  tags: ['AI', 'Vision', 'Camera'],
  needs: ['Internet', 'Camera (for video)'],

  overview: `YOLO ("You Only Look Once") is a fast object detection AI: one look at an image, and it draws a box around each thing it finds and tells you **what it is**, **how sure it is**, and **where it is**.

This plugin uses the **YOLOX** model, which knows 80 common things such as person, cat, dog, car, bicycle, cup, cell phone and banana. It can detect four sources:

- Camera video (continuously): [[startVideo]]
- The stage: [[detectStage]]
- An image on the web: [[detectUrl]]
- An image file on your computer: [[detectFile]]

Boxes are drawn on the stage, and positions are already in stage coordinates, so a sprite can go straight to an object. Good for "meow when a cat appears", counting people, making a list of things, hide-and-seek games and more.

> Detection runs in your browser; images are **not** uploaded. The first use downloads the model (fast 3.7 MB, accurate 20.2 MB) and the runtime library.

### Two models
| Model | Size | Best for |
|---|---|---|
| fast (YOLOX-Nano, default) | 3.7 MB | Video: smoother |
| accurate (YOLOX-Tiny) | 20.2 MB | Images: more accurate, better with small things |

### Graphics card acceleration
The plugin starts on the CPU so it works right away. If the browser supports WebGPU, it prepares a graphics card (GPU) version in the background and switches when it is ready; the brackets in [[getStatus]] change from "CPU" to "GPU". The first time on a computer, preparing the GPU takes about 20 to 30 seconds; after that about 1 second.`,

  highlights: [
    {icon: '🎯', title: '80 kinds of objects', text: 'People, animals, vehicles, food, furniture, stationery and more, all in the menu.'},
    {icon: '📷', title: 'Four sources', text: 'Camera, stage, image URL or an uploaded image file.'},
    {icon: '🟪', title: 'Boxes on the stage', text: 'Boxes are drawn on the stage, and x and y are stage coordinates, so sprites can follow objects.'},
    {icon: '⚡', title: 'Uses the GPU automatically', text: 'Starts on the CPU at once and switches to the graphics card when it is ready.'}
  ],

  groups: [
    {name: 'Prepare and detect', intro: `First choose what to detect: [[startVideo]] for camera video, or one block each for the stage, a web image or an image file. The model loads automatically on the first detection, so [[loadModel]] is optional.

Detecting the stage, an image URL or an image file stops video detection first; otherwise the next video frame would overwrite the result.`},
    {name: 'Display and status', intro: 'Control the boxes on the stage, filter out uncertain results, and check the current status.'},
    {name: 'Results', intro: `Read the detected objects. Only objects at or above the threshold ([[setThreshold]]) count, and they are **sorted from most to least confident**.

The object menu has 80 kinds. It accepts variables too; English ("dog") and Chinese (狗) names both work.`}
  ],

  blocks: {
    loadModel: {
      args: {MODEL: '"fast" suits video; "accurate" is better but slower, and suits images.'},
      summary: 'Choose and load a YOLO model.',
      detail: `This block **waits until the model can be used** (or loading fails). Put it at the start of the green flag script so the model is ready when students start.

It is optional: the first detection loads the "fast" model automatically, but that first run takes longer. After you change models, the next detection uses the new one.`,
      tips: 'While loading, [[getStatus]] shows the download progress, like "Loading YOLO model… 45%".'
    },
    videoToggle: {
      args: {VIDEO_STATE: '"on" shows a mirror image; "on flipped" is not mirrored; "off" turns off the camera.'},
      summary: 'Turn the camera image on, off, or flip it.',
      detail: `Works like the block with the same name in Scratch's built-in Video Sensing.

It is optional: [[startVideo]] turns the video on (mirrored) if it is off. The difference: **video you turned on with this block** stays on when detection stops; video turned on automatically by "start" is turned off with it.`,
      tips: 'The x positions in the results follow the mirroring, so they match what you see on the stage.'
    },
    startVideo: {
      summary: 'Turn on the camera and keep detecting the video.',
      detail: `It loads the model, turns on the camera, then detects frame after frame; the results keep updating. The block **waits until everything is ready (or fails)** before the next block runs.

The browser asks for permission to use the camera. Click "Allow". On the CPU it pauses a little after each detection so Scratch does not lag; on the GPU it detects more often.`,
      tips: 'Running it again does not start a second loop. If you turn the video off while detecting, the status shows "Video is off"; turn it on again and detection continues.'
    },
    stopVideo: {
      summary: 'Stop video detection and clear the results.',
      detail: 'After stopping, the status shows "Stopped", the object count goes to 0 and the boxes disappear. If [[startVideo]] turned the camera on, it is turned off too; if you turned it on with [[videoToggle]], it stays on.'
    },
    detectStage: {
      summary: 'Detect objects in the current stage image (backdrop, sprites, pen and video all count).',
      detail: `Takes a picture of the stage and detects it once; the next block runs after it finishes. The detection boxes already on the stage are not included in the picture.

Use it to detect pictures in sprite costumes, pen drawings, or a single video frame only when you need it.`
    },
    detectUrl: {
      args: {URL: 'The address of the image (starting with `https://`, pointing directly at the image).'},
      summary: 'Detect objects in an image on the web.',
      detail: `The image is shown on the stage at its original proportions (black around it) with boxes drawn on it. The next block runs after detection finishes.

> Some websites do not let other pages read their images. The status then shows "Error: cannot read the image (wrong URL, or the site does not allow it)". Try another image, or download it and use [[detectFile]].`
    },
    detectFile: {
      summary: 'Choose an image on your computer to detect.',
      detail: `Opens a file picker. The chosen image is shown on the stage at its original proportions with boxes drawn on it; the next block runs after detection. If you cancel, the status shows "No image chosen".

Browsers only open a file picker right after the user clicks. If the script reaches this block on its own (for example a while after the green flag), a small dialog appears on the stage; click "Choose image…" to open the picker.`,
      tips: 'Put it under "when this sprite clicked": clicking the sprite opens the file picker directly.'
    },
    showBoxes: {
      args: {STATE: 'Show or hide.'},
      summary: 'Show or hide the detection boxes on the stage.',
      detail: 'Boxes are drawn above the video and below the sprites, each labelled with the name and confidence. Hiding them does not change the results; you just cannot see them.'
    },
    setThreshold: {
      args: {VALUE: '10 to 100, default 50. Values outside the range are adjusted.'},
      summary: 'Objects below this confidence % do not count.',
      detail: `A higher threshold gives fewer but more reliable results; a lower one finds more things but makes more mistakes.

The change **takes effect immediately** without detecting again: the object count, the boxes and every result block update at once.`
    },
    clearResults: {
      summary: 'Clear the current results and the boxes on the stage (and the image, if any).',
      detail: 'If video detection is still running, the next frame produces new results. Use [[stopVideo]] to stop completely.'
    },
    getStatus: {
      summary: 'Which step it is on, or why it failed.',
      detail: `| Status | Meaning |
|---|---|
| Not started | No model loaded yet |
| Loading YOLO model… 45% | Downloading the model |
| Ready (YOLOX-Nano, CPU) | The model is ready; the brackets show the model and processor |
| Opening camera… | Waiting for the camera |
| Detecting video (YOLOX-Nano, GPU) | Detecting the video |
| Detecting image… | Detecting an image or the stage |
| Done (YOLOX-Tiny, CPU) | Finished detecting an image or the stage |
| Choosing an image… / No image chosen | [[detectFile]] is waiting / was cancelled |
| Stopped | [[stopVideo]] was used |
| Video is off | Detecting video, but the camera was turned off |
| Error: cannot open the camera | Camera permission not allowed, or another program is using the camera |
| Error: cannot load onnxruntime (check the network) | The runtime library failed to download |
| Error: cannot download the model | Network problem |
| Error: cannot start the model | The model download was incomplete or the browser cannot run it; reload, or try the latest Chrome or Edge |
| Error: cannot read the image… | Wrong image URL, or the site does not allow it |`,
      returns: 'Status text. On an error, details may be added in brackets.'
    },
    whenDetected: {
      args: {CLASS: 'The kind of object to wait for.'},
      summary: 'Runs the script below when this kind of object "starts to appear".',
      detail: 'Fires once, at the moment it goes **from not found to found**. An object that stays in view does not fire again; it has to leave and come back. Works best with video detection.'
    },
    isDetected: {
      args: {CLASS: 'The kind of object to check.'},
      summary: 'Whether the current results include this kind of object.',
      returns: '`true` if found, otherwise `false`.',
      example: [
        {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {use: 'isDetected', args: {CLASS: {v: 'cat', menu: true}}}}, body: [
          {t: 'start sound [S]', cat: 'sound', args: {S: {v: 'Meow', menu: true}}}
        ]}
      ]
    },
    getCount: {
      summary: 'How many objects were found in total (all kinds).',
      returns: 'A number; 0 when there are no results.'
    },
    getClassCount: {
      args: {CLASS: 'The kind of object to count.'},
      summary: 'How many of one kind of object, for example how many people are in view.',
      returns: 'A number; 0 when there are none.'
    },
    getObjectProp: {
      args: {
        INDEX: 'Which one, starting from 1. Number 1 is the most confident.',
        PROP: 'What to read.'
      },
      summary: "Read an object's name, confidence, position or size.",
      detail: `| Option | Value |
|---|---|
| name | The object's name, for example \`dog\` (狗 in the Chinese interface) |
| confidence | 0 to 100 |
| x, y | Center of the box, in stage coordinates (x: -240 to 240, y: -180 to 180) |
| width, height | Size of the box on the stage |

With [[getCount]] and a "repeat" block you can read out every object one by one.`,
      returns: 'Text or a number. When the index is out of range, the name is empty and the others are 0.',
      example: [
        {t: 'set [V] to [N]', cat: 'data', args: {V: {v: 'i', menu: true}, N: {num: '1'}}},
        {t: 'repeat [N]', cat: 'control', type: 'c', args: {N: {use: 'getCount'}}, body: [
          {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {use: 'getObjectProp', args: {INDEX: {t: 'i', cat: 'data', type: 'reporter'}, PROP: {v: 'name', menu: true}}}, S: {num: '1'}}},
          {t: 'change [V] by [N]', cat: 'data', args: {V: {v: 'i', menu: true}, N: {num: '1'}}}
        ]}
      ]
    },
    getClassProp: {
      args: {CLASS: 'The kind of object.', PROP: 'What to read.'},
      summary: 'Position, size or confidence of one kind of object.',
      detail: 'When there are several of the same kind, it reads the **most confident** one. Most often used to make a sprite follow something.',
      returns: 'A number; 0 when that kind of object is not found.',
      example: [
        {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {use: 'isDetected', args: {CLASS: {v: 'cup', menu: true}}}}, body: [
          {t: 'glide [S] secs to x: [X] y: [Y]', cat: 'motion', args: {S: {num: '0.3'}, X: {use: 'getClassProp', args: {CLASS: {v: 'cup', menu: true}, PROP: {v: 'x', menu: true}}}, Y: {use: 'getClassProp', args: {CLASS: {v: 'cup', menu: true}, PROP: {v: 'y', menu: true}}}}}
        ]}
      ]
    },
    getAllLabels: {
      summary: 'A list of the kinds of objects found (no repeats).',
      returns: 'For example `dog, bicycle, car` (the Chinese interface uses 、), from most to least confident; empty when there are no results.'
    }
  },

  examples: [
    {
      title: 'What does the camera see?',
      intro: 'Start video detection; the sprite keeps saying what is in view.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'loadModel', args: {MODEL: {v: 'fast (Nano)', menu: true}}},
        {use: 'startVideo'},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'say [M]', cat: 'looks', args: {M: {use: 'getAllLabels'}}}
        ]}
      ]
    },
    {
      title: 'Meow when a cat appears',
      intro: 'As soon as a cat appears in front of the camera, the sprite meows and says how many cats it sees.',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {use: 'startVideo'}
        ],
        [
          {use: 'whenDetected', args: {CLASS: {v: 'cat', menu: true}}},
          {t: 'start sound [S]', cat: 'sound', args: {S: {v: 'Meow', menu: true}}},
          {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'I see a cat! Cats: ', B: {use: 'getClassCount', args: {CLASS: {v: 'cat', menu: true}}}}}, S: {num: '2'}}}
        ]
      ],
      explain: 'No cat at home? Show the camera a cat photo on a phone.'
    },
    {
      title: 'Detect a photo',
      intro: 'Click the sprite, choose a photo, detect it with the accurate model, and say how many things were found and the most confident one.',
      script: [
        {t: 'when this sprite clicked', cat: 'events', type: 'hat'},
        {use: 'loadModel', args: {MODEL: {v: 'accurate (Tiny)', menu: true}}},
        {use: 'detectFile'},
        {t: 'say [M]', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {
          A: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'Found ', B: {use: 'getCount'}}},
          B: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: '. Most sure: ', B: {use: 'getObjectProp', args: {INDEX: {num: '1'}, PROP: {v: 'name', menu: true}}}}}
        }}}}
      ],
      explain: 'Under "when this sprite clicked", clicking the sprite opens the file picker directly.'
    },
    {
      title: 'Count people',
      intro: 'Warn when more than 3 people are in view. A higher threshold avoids counting other things as people.',
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'setThreshold', args: {VALUE: {num: '60'}}},
        {use: 'startVideo'},
        {t: 'forever', cat: 'control', type: 'c', body: [
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] > [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getClassCount', args: {CLASS: {v: 'person', menu: true}}}, B: {num: '3'}}}}, body: [
            {t: 'say [M]', cat: 'looks', args: {M: 'Too many people!'}}
          ], else: [
            {t: 'say [M]', cat: 'looks', args: {M: {use: 'getClassCount', args: {CLASS: {v: 'person', menu: true}}}}}
          ]}
        ]}
      ]
    }
  ],

  faq: [
    {q: 'What can it detect?', a: '80 common objects (the COCO data set): people, vehicles, animals, sports gear, food, tableware, furniture, appliances, stationery and more. See the menu of [[isDetected]] for the full list. Things not on the list (a pencil, a tree) cannot be recognized and may be mistaken for something similar.'},
    {q: 'The first run takes a long time?', a: 'The first time, the model (fast 3.7 MB, accurate 20.2 MB) and the runtime library are downloaded. The browser keeps them, so later runs are fast. Before class, open it once on each computer.'},
    {q: 'The status says CPU first, then GPU?', a: 'That is normal. The plugin starts on the CPU right away and prepares the graphics card version in the background, then switches. Preparing the GPU takes 20 to 30 seconds the first time on a computer. Browsers without WebGPU stay on the CPU; it still works, just slower.'},
    {q: 'Detection is inaccurate?', a: `- Use good lighting; objects should not be too small or covered
- Switch to the "accurate (Tiny)" model
- Raise the threshold with [[setThreshold]], for example to 60 to 70
- Check the confidence yourself (the confidence option of [[getClassProp]])`},
    {q: 'An image URL gives "cannot read the image"?', a: 'Some websites do not let other pages read their images. Try another image (Wikimedia Commons images usually work), or download it and use [[detectFile]].'},
    {q: 'I see "Error: cannot open the camera"?', a: `- Click the camera icon next to the address bar, change it to "Allow", then reload
- Close other programs using the camera (video calls, camera apps)`},
    {q: 'Can I use it with the face expression plugin?', a: 'Yes. Both plugins share the same camera image. Running two AIs at once is slower, though.'},
    {q: 'Are images uploaded?', a: 'No. The model and library are downloaded from the internet, but detection happens in your browser and images never leave your computer.'}
  ],

  changelog: [
    {date: '2026-11-21', text: 'YOLO Object Detection plugin added (YOLOX-Nano / Tiny, 80 kinds of objects; video, stage, image URL and image file sources; CPU first with a background GPU upgrade)'}
  ]
});
