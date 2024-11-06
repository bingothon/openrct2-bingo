# OpenRCT2 Analytics SDK

This is a tool for OpenRCT2 plugins that provides analytics functionality for tracking player actions. It enables visualization of user behaviour that can be sliced and diced in many ways to interesting effect. 

### Table of Contents
- [Adding analytics to your plugin](#adding-analytics-to-your-plugin)
    - [Installing from npm](#installing-from-npm)
    - [Tracking your events](#tracking-your-events)
    - [Flushing to storage](#flushing-to-storage)
- [Accessing analytics data](#accessing-analytics-data)
    - [Realtime usage](#realtime-usage)
- [Metadata](#metadata)
- [Recommendations](#recommendations)

# Adding analytics to your plugin

You may be interested in how users play the game or have a gameplay hypothesis that needs data to prove. This tool makes behaviour tracking easy. 

- 🔧 Implement it in your own projects to track custom user actions, or reference the saved event data for building displays or training ML models.
- 📵 All data is stored locally and this tool has no network connection.
- 💡 The tracking model was inspired by [Segment's analytics.js](https://github.com/segmentio/analytics-next/blob/master/packages/browser/README.md) library.

If you want to implement analytics tracking into your own project, keep reading. If you just want to access saved tracking data, skip on to [accessing analytics data](#accessing-analytics-data).

## Installing from `npm`
    
Install the package from npm.
    
```sh
# npm
npm i openrct2-analytics-sdk@next
```
    
Import the packing into your plugin project and initialize in your startup function:
```ts
import { analytics } from "openrct2-analytics-sdk";

export function startup() {
    analytics.init({
        pluginName: "your-plugin-name",
    });
    
    // initialize window, UI, etc.
    ...
}
```

## Tracking Your Events

The core tracking function is `analytics.track`. The track() call can take an event name, or an object with a name and anything else you may want stored that's specific to this event.

```ts
context.subscribe("action.execute", (args) => {
  if (args.action === "loadorquit") {
    // if there are no relevant additional properties
    analytics.track("Game loaded or quit");
  } else if (args.action === "bannersetcolour") {
    // Add any/all of the args values
    analytics.track({
      name: "Banner colour set",
      properties: args,
    });
  }
});
```
You can use track calls directly in your UI event listeners. (This example component uses @Basssiiie's [FlexUI library](https://github.com/Basssiiie/OpenRCT2-FlexUI/tree/main)  for state management and UI.)
```ts
import { analytics } from "openrct2-analytics-sdk";
import { vertical, label, dropdown } from "openrct2-flexui";

const foodChoices = ["Tacos", "Burgers", "Cotton Candy", "Popcorn"];
    
// returns a FlexUI component
export const favoriteFoodSelector = () => {
  return vertical({
    content: [
        label({
            text:"Select your favorite food."
        }),
        dropdown({
            items: foodChoices,
            onChange: (index) => {
              analytics.track({
                name: `Favorite food changed`,
                favoriteFood: foodChoices[index],
              });
            },
        }),
    ],
  })
}
```

Besides the data you specify to track in the event, the plugin also adds contextual metadata to every event. See more in [metadata](#-metadata).

## Flushing to storage

When calling `analytics.track`, the events are stored in memory up to a chosen threshold (the default value is 25 events). When this threshold is passed or the game fires `loadorquit`, the events will be processed and saved into shared storage using `analytics.flush()`. `flush()` is automatically called on `loadorquit`, which is adequate for normal gameplay; but some events may be dropped during development if hot reloading is enabled. Setting the threshold to `1` will flush after every event is triggered, but it may negatively impact performance.

If you need different flushing behaviour, you have options:
* When initializing analytics with `analytics.init`, set the optional `flushThreshold` to a numerical value between 1 and 1000.
* Use `analytics.setFlushThreshold(n:number)`
* Call `analytics.flush()` at any point.

## Accessing analytics data

Analytics data is saved in OpenRCT2's shared storage under the key `"analytics.data.storage"` as a object with event names as keys, and arrays of events as values. This key can also be accessed by reference with the exported `dataSaveKey`.

```ts  
import { dataSaveKey } from "openrct2-analytics-sdk";

// load whichever way you prefer
const loadedData = context.sharedStorage.get(dataSaveKey, []);
const sameLoadedData = context.sharedStorage.get("analytics.data.storage", []);
const keys = Object.keys(loadedData);
/**
 * keys: ["Game loaded or quit", "Banner colour set", "Favorite food changed", ...]
 * loadedData["Banner colour set"]: TrackEventType[]
 */
```

See [event metadata](#metadata) for documentation of `TrackEventType` structure.

## Realtime Usage

To use analytics data in real time in your plugin, `analytics.init` takes an optional `eventCallback` property which can be connected to your plugin's state. This callback is called for each event whenever events are flushed to storage. Here's an example for connecting an event view  component using FlexUI's ArrayStore.

```ts
// startup.ts
import { TrackEventType, analytics } from "openrct2-analytics-sdk";
import { arrayStore } from "openrct2-flexui";

export const eventDebugger = arrayStore<TrackEventType>([])

export function startup() {
    analytics.init({
            pluginName: "your-plugin-name",
            eventCallback:(eventData) => {
                eventDebugger.push(eventData)
            }
        });
        // other startup details
        ...
}
```
```ts
// eventView.ts
import { compute, groupbox, horizontal, label } from "openrct2-flexui";
import { eventDebugger } from "../../startup";

export const eventView = (index: number) => {
  return groupbox({
    content: [
      horizontal({
        content: [
          label({
            text: compute(eventDebugger.store, (eventArray) => {
              if (eventArray[index] === undefined) {
                return "No Event";
              }
              return eventArray[index]?.properties.name || "No Event";
            }),
          }),
          label({
            text: compute(eventDebugger.store, (eventArray) => {
              if (eventArray[index] === undefined) {
                return "";
              }
              const date = new Date(eventArray[index]?.timestamp || "");
              return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            }),
          }),
        ],
      }),
    ],
  });
};
```
Here's what this debugger could look like in action: 

![MOV to GIF conversion (1)](https://github.com/ltsSmitty/openRCT2-analyticsSDK/assets/12832906/1a3ac75b-2574-44cc-ac9e-27389e73cefd)


### Metadata

Each event is enriched with additional metadata that can be used for further analysis. 

```ts
type TrackEventType = {
  // Your data inputted to `track()`
  properties: {
    name: string;
    [...your-additonal-props]?: any;
  }
  // automatically added event metadata
  context: {
        park: {
            id: number; // unique identifier for a specific save file
            scenario: {
                fileName: string;
                scenarioName: string;
                name: string;
            };
            inGameDate: {
                year: number;
                month: number;
                day: number;
                ticksElapsed: number;
                monthProgress: number;
            };
        };
        library: {
            pluginVersion: string,
            apiVersion: number,
            eventPluginSource: string, // your plugin name from analytics.init()
        };
        network: {
            networkMode: NetworkMode
        };
        mode: GameMode;
    };
    messageID: number; // semi-unique identifier for the event
    timestamp: string; // Datetime as ISO string
}

```

## Recommendations
* **Adopt standard event naming methodology.**
    *   I recommend a past tense, noun verb pattern like "Ride painted" or "Map purchased". [Read more here](https://segment.com/docs/protocols/tracking-plan/best-practices/#formalize-your-naming-and-collection-standards).
* **Avoid dynamically generating event names**. 
    *   Don't use string templates for event names. Avoid patterns like `analytics.track("Property "+ props.name + " changed."`)
* **Debug Logging**
    * If you're in development, you can initialize analytics with the optional `enableDebugLogging` to view a log of events being tracked and flushed.

## Development

Questions or want to contribute? Great! This project is responsive to Github PRs and issues. For quick support, consider posting in `#plugin` in the [OpenRCT2 Discord](https://discord.com/channels/264137540670324737/696130778618396683)

## License

MIT

