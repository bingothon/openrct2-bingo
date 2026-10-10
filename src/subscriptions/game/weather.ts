import { config } from "../../config";
import { subscriptions } from "../manager";

/** CheatType::forceWeather in OpenRCT2 */
const CHEAT_FORCE_WEATHER = 35;
/** Weather::Type::partiallyCloudy in OpenRCT2 */
const WEATHER_PARTIALLY_CLOUDY = 1;
/** Rain and snow keep guests away and out of open rides */
const WET_WEATHER: WeatherType[] = ["rain", "heavyRain", "thunder", "snow", "heavySnow", "blizzard"];

/**
 * Short showers: rain (or snow) stops after config.maxRainDays in-game days and turns partially
 * cloudy. OpenRCT2 then picks the next weather as usual. Server only: weather is part of the
 * synchronised game state.
 */
export function subscribeToWeather() {
    let wetDays = 0;
    subscriptions.upsert("weather", () =>
        context.subscribe("interval.day", () => {
            if (WET_WEATHER.indexOf(climate.current.weather) === -1) {
                wetDays = 0;
                return;
            }
            wetDays++;
            if (wetDays < config.maxRainDays) return;

            wetDays = 0;
            context.executeAction("cheatset", { type: CHEAT_FORCE_WEATHER, param1: WEATHER_PARTIALLY_CLOUDY, param2: 0 }, (result) => {
                if (result.error) console.log("[Weather] Couldn't stop the rain:", result.errorMessage);
            });
        })
    );
}

export function unsubscribeFromWeather() {
    subscriptions.dispose("weather");
}
