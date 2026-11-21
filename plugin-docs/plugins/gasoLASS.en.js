/*
 * LASS plugin: English descriptions.
 * Block text, menus and defaults come from plugins/gasoLASS.js (synced from the plugin source).
 */
OSEP.addText('gasoLASS', 'en', {
  tagline: "Read Taiwan's air quality and weather data: AirBox sensors, environment ministry stations and the weather forecast.",
  tags: ['IoT', 'Environment', 'Open data'],
  needs: ['Internet'],

  overview: `This plugin brings three kinds of Taiwanese open data into Scratch, for projects like an air quality board, a "should I go out?" reminder or a weather reporter:

| Data | Source | You need |
|---|---|---|
| PM2.5, temperature and humidity from an AirBox | LASS (Location Aware Sensing System) | The AirBox device ID |
| AQI, PM2.5, PM10 and ozone from monitoring stations | Ministry of Environment air quality network | Nothing |
| 36-hour forecast for each city and county | Central Weather Administration (CWA) open data | Your own authorization key |

> All data is downloaded live from the internet. If the network is down or a data source is under maintenance, nothing can be read.

Station names, city names in the Chinese interface, and the text values from the weather forecast are in Chinese, because the data sources provide them that way.

Original plugin author: gasolin ([scratch3-internet](https://github.com/gasolin/scratch3-internet)).`,

  groups: [
    {name: 'LASS AirBox', intro: 'Read the latest readings from one AirBox. Download with [[fetchLASS]]; when the data arrives, [[onLASSReceived]] fires, and [[parseAttrFromLASS]] reads the values.'},
    {name: 'Air quality stations', intro: "Data from the Ministry of Environment's air quality monitoring stations, about 80 across Taiwan. No setup needed."},
    {name: 'Weather forecast', intro: 'The Central Weather Administration\'s "36-hour weather forecast". First register on the CWA open data platform to get your own authorization key.'}
  ],

  blocks: {
    openEdiGreen: {
      summary: "Open Edimax's AirBox website in a new tab.",
      detail: 'Find an AirBox near you on the map and look up its device ID (the MAC address string, for example `74DA38F208E2`).'
    },
    openAirBoxDeviceData: {
      summary: 'Open the latest data of every AirBox (JSON) in a new tab.',
      detail: 'It is long. `device_id` is the device ID and `s_d0` is PM2.5. Useful for teachers to look up device IDs in advance.'
    },
    fetchLASS: {
      args: {id: 'The AirBox device ID (12 letters or digits).'},
      summary: "Download this AirBox's latest data.",
      detail: `When the download finishes, [[onLASSReceived]] fires once.

> The data may not be downloaded yet when the block finishes, so put the reading blocks under [[onLASSReceived]]. With a wrong device ID, the values are empty.`
    },
    onLASSReceived: {
      summary: 'Runs the script below when the AirBox data has been downloaded.',
      detail: 'Fires once every time a [[fetchLASS]] download finishes.'
    },
    parseAttrFromLASS: {
      args: {attr: 'PM2.5, temperature, humidity, or the date and time of the reading.'},
      summary: "Read the AirBox's PM2.5, temperature, humidity or time.",
      returns: 'A number, for example PM2.5 `12` (µg/m³), temperature `26.5` (°C), humidity `70` (%); date and time is text like `2026-11-22 08:30:00`. Before any download: "Error： Data does not exist".'
    },
    getEPAData: {
      args: {
        siteName: 'The station name in Chinese, for example 基隆, 中山 or 臺南. The menu fills with all stations after the plugin loads.',
        attr: 'AQI, PM2.5, PM10, O3 (ozone) or publish time.'
      },
      summary: "Read a station's air quality.",
      detail: `The data is downloaded again every time, so the value takes a moment.

| Item | Meaning |
|---|---|
| AQI | Air Quality Index: 0–50 good, 51–100 moderate, above 100 unhealthy for sensitive groups |
| PM2.5, PM10 | Fine and coarse particulate matter (µg/m³) |
| O3 | Ozone (ppb) |
| Publish Time | When the reading was published, for example \`2026/11/22 08:00:00\` |`,
      returns: 'Text or a number. Empty if the station name is wrong.',
      tips: 'At first the menu only has 基隆 (Keelung). The other stations appear once the plugin has downloaded the station list.'
    },
    EPAStation: {
      summary: 'The names of all stations.',
      returns: 'Station names separated by ", ", for example `基隆, 汐止, 萬里, …`.'
    },
    authorization: {
      args: {apiKey: 'Your CWA open data authorization key (starts with CWA-).'},
      summary: 'Download the forecast for every city and county with your authorization key.',
      detail: `Get the key by signing in to the CWA open data platform (opendata.cwa.gov.tw) and opening your member information.

> This block finishes without waiting for the download. Add "wait 2 seconds" before using [[getWeatherData]].`,
      tips: 'The key is saved in the project. Delete it before sharing the project.'
    },
    getWeatherData: {
      args: {
        locationName: 'One of 22 cities and counties.',
        forecastTime: '12, 24, 36: the first, second or third 12-hour period of the 36-hour forecast.',
        weatherAttrs: 'Weather phenomenon, maximum temperature, minimum temperature, comfort, or rainfall probability.'
      },
      summary: 'Read the forecast for a city in a time period.',
      detail: `| Item | Example |
|---|---|
| Weather Phenomenon | 多雲時晴 (cloudy, then sunny) |
| Maximum / Minimum Temperature | 28 (°C) |
| Comfort | 舒適至悶熱 (comfortable to muggy) |
| Rainfall Probability | 20 (%) |

Weather phenomenon and comfort are Chinese text from the CWA, also in the English interface.`,
      returns: 'Text or a number. Nothing until [[authorization]] has downloaded the data.'
    }
  },

  examples: [
    {
      title: 'AirBox board',
      intro: 'Update a nearby AirBox\'s PM2.5 every minute and switch to a face-mask costume when it is high.',
      script: [
        [
          {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
          {t: 'forever', cat: 'control', type: 'c', body: [
            {use: 'fetchLASS', args: {id: '74DA38F208E2'}},
            {t: 'wait [S] seconds', cat: 'control', args: {S: {num: '60'}}}
          ]}
        ],
        [
          {use: 'onLASSReceived'},
          {t: 'say [M]', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'PM2.5: ', B: {use: 'parseAttrFromLASS', args: {attr: {v: 'PM2.5', menu: true}}}}}}},
          {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] > [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'parseAttrFromLASS', args: {attr: {v: 'PM2.5', menu: true}}}, B: {num: '35'}}}}, body: [
            {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'mask', menu: true}}}
          ], else: [
            {t: 'switch costume to [X]', cat: 'looks', args: {X: {v: 'smile', menu: true}}}
          ]}
        ]
      ]
    },
    {
      title: 'Do I need an umbrella?',
      intro: "Check Taipei's rainfall probability for the first 12 hours with CWA data, and remind you to take an umbrella above 50%.",
      script: [
        {t: 'when 🏁 clicked', cat: 'events', type: 'hat'},
        {use: 'authorization', args: {apiKey: 'CWA-your-key'}},
        {t: 'wait [S] seconds', cat: 'control', args: {S: {num: '2'}}},
        {t: 'if [C] then', cat: 'control', type: 'c', args: {C: {t: '[A] > [B]', cat: 'operators', type: 'boolean', args: {A: {use: 'getWeatherData', args: {locationName: {v: 'Taipei City', menu: true}, forecastTime: {v: '12', menu: true}, weatherAttrs: {v: 'Rainfall Probability', menu: true}}}, B: {num: '50'}}}}, body: [
          {t: 'say [M]', cat: 'looks', args: {M: 'Take an umbrella!'}}
        ], else: [
          {t: 'say [M]', cat: 'looks', args: {M: {use: 'getWeatherData', args: {locationName: {v: 'Taipei City', menu: true}, forecastTime: {v: '12', menu: true}, weatherAttrs: {v: 'Weather Phenomenon', menu: true}}}}}
        ]}
      ]
    },
    {
      title: 'Station AQI report',
      intro: 'Ask which station to check and say its AQI and publish time.',
      script: [
        {t: 'ask [Q] and wait', cat: 'sensing', args: {Q: 'Which station? (e.g. 中山)'}},
        {t: 'say [M] for [S] seconds', cat: 'looks', args: {M: {t: 'join [A] [B]', cat: 'operators', type: 'reporter', args: {A: 'AQI: ', B: {use: 'getEPAData', args: {siteName: {t: 'answer', cat: 'sensing', type: 'reporter'}, attr: {v: 'AQI', menu: true}}}}}, S: {num: '2'}}},
        {t: 'say [M]', cat: 'looks', args: {M: {use: 'getEPAData', args: {siteName: {t: 'answer', cat: 'sensing', type: 'reporter'}, attr: {v: 'Publish Time', menu: true}}}}}
      ],
      explain: 'List the station names first with [[EPAStation]].'
    }
  ],

  faq: [
    {q: 'The AirBox values are empty?', a: `- The device ID is wrong, or that AirBox has not uploaded data for a long time
- The data was not downloaded yet when you read it: put the reading blocks under "When data is received from LASS"`},
    {q: 'The weather forecast cannot be read?', a: `- Use your own key from the CWA open data platform
- Wait a moment (about 2 seconds) after [[authorization]]
- The network must be able to reach opendata.cwa.gov.tw`},
    {q: 'The station menu only has 基隆?', a: 'The station list has not been downloaded yet when the plugin first loads. Wait a few seconds and open the menu again; with no network, only 基隆 is there. You can also put text or a variable into the menu slot.'},
    {q: 'What do "next 12 / 24 / 36 hours" mean?', a: 'The CWA 36-hour forecast is split into three 12-hour periods. 12 is the first period (the next 12 hours from now), 24 the second, 36 the third.'}
  ],

  changelog: [
    {date: '2026-11-22', text: 'Documentation page created'}
  ]
});
