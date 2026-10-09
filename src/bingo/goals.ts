import { INVENTION_ITEMS } from "src/constants";
import { Goal } from "../types";
import { buildParkScope, GoalScope } from "./goalScopes";
import { createSeededRandom } from "../utils";

type ThoughtKey = keyof typeof thoughtTypes;
type AwardKey = keyof typeof awardTypes;
const thoughtTypes = {
    "spent_money": "Thought: Spent too much money",
    "sick": "Thought: Feeling a bit sick",
    "very_sick": "Thought: Very sick!",
    "more_thrilling": "Thought: Needs more thrills",
    "intense": "Thought: Too intense!",
    "bad_value": "Thought: Not worth the money",
    "go_home": "Thought: Heading home",
    "good_value": "Thought: Great value for the price",
    "already_got": "Thought: Already have this item",
    "cant_afford_item": "Thought: Can't afford that item",
    "was_great": "Thought: That was awesome!",
    "get_off": "Thought: Get me off this ride!",
    "queuing_ages": "Thought: Zzz Queue",
    "cant_find": "Thought: Can't find",
    "not_while_raining": "Thought: Not doing that in the rain",
    "bad_litter": "Thought: Too much litter here",
    "cant_find_exit": "Thought: Can't find the exit",
    "not_safe": "Thought: Doesn't feel safe",
    "path_disgusting": "Thought: Path is disgusting",
    "crowded": "Thought: Too crowded",
    "vandalism": "Thought: Vandalism everywhere!",
    "scenery": "Thought: The scenery is beautiful",
    "very_clean": "Thought: Very clean here",
    "fountains": "Thought: Love the fountains",
    "music": "Thought: Enjoying the music",
    "wow": "Thought: Wow!",
    "wow2": "Thought: Double wow!",
    "help": "Thought: Help!",
    "running_out": "Thought: Running out of time",
    "new_ride": "Thought: Excited for the new ride",
};

const awardTypes = {
    "Most Tidy": "The tidiest park in the country",
    "Best Coasters": "The park with the best roller coasters",
    "Best Value": "The best value park in the country",
    "Most Beautiful": "The most beautiful park in the country",
    "Safest Park": "The safest park in the country",
    "Best Staff": "The park with the best staff",
    "Best Food": "The park with the best food in the country",
    "Best Toilets": "The park with the best toilet facilities in the country",
    "Best Water Rides": "The park with the best water rides in the country",
    "Best Custom Rides": "The park with the best custom-designed rides",
    "Best Gentle Rides": "The park with the best gentle rides"
};

const rideCategories = ["Transport", "Gentle", "Water", "Thrill", "Shop"]; // Ride categories

// Helpers for PvP/Lockout checks (see goalScopes.ts). Money values are in tenths, like park.cash.
const isRide = (ride: Ride) => ride.classification !== "stall" && ride.classification !== "facility";
const countRides = (rides: Ride[], predicate: (ride: Ride) => boolean) => rides.filter(predicate).length;
const anyRide = (rides: Ride[], predicate: (ride: Ride) => boolean) => countRides(rides, predicate) > 0;
const countGuestsWithItem = (guests: Guest[], item: GuestItemType) =>
    guests.filter((guest) => guest.hasItem({ type: item })).length;

function countUniqueStallTypes(rides: Ride[]): number {
    const uniqueStallTypes: number[] = [];
    rides
        .filter((ride) => ride.classification === "stall")
        .forEach((stall) => {
            if (uniqueStallTypes.indexOf(stall.object.index) === -1) {
                uniqueStallTypes.push(stall.object.index);
            }
        });
    return uniqueStallTypes.length;
}

function countUniqueUmbrellaColours(guests: Guest[]): number {
    const uniqueColours: number[] = [];
    guests.forEach((guest) => {
        const colour = guest.umbrellaColour;
        if (colour !== 0 && uniqueColours.indexOf(colour) === -1) {
            uniqueColours.push(colour);
        }
    });
    return uniqueColours.length;
}

const ONRIDE_PHOTOS: GuestItemType[] = ["photo1", "photo2", "photo3", "photo4"];

/**
 * A goal that works in every mode with one check: coop runs it against the whole park,
 * PvP/Lockout against the player's region
 */
function sharedGoal(definition: {
    name: string;
    playerName?: string;
    check: (scope: GoalScope) => boolean;
    progress: (scope: GoalScope) => string | number;
}): Goal {
    return {
        name: definition.name,
        playerName: definition.playerName,
        slot: undefined,
        colors: "blank",
        status: "incomplete",
        checkCondition: () => definition.check(buildParkScope()),
        currentCondition: () => definition.progress(buildParkScope()),
        checkPlayer: definition.check,
        playerProgress: definition.progress,
    };
}

/**
 * "Create all rides in the X category": every ride type of the category built, and enough of
 * them profitable (half for gentle/thrill, all otherwise)
 */
function getCategoryRideTypes(category: string): number[] {
    const categoryRideTypes: number[] = [];
    INVENTION_ITEMS.forEach((ride) => {
        if (
            ride.type === "ride" &&
            ride.category === category &&
            ride.rideType !== undefined &&
            categoryRideTypes.indexOf(ride.rideType) === -1
        ) {
            categoryRideTypes.push(ride.rideType);
        }
    });
    return categoryRideTypes;
}

function isCategoryComplete(rides: Ride[], category: string): boolean {
    const categoryRideTypes = getCategoryRideTypes(category);
    let profitableCount = 0;
    for (let i = 0; i < categoryRideTypes.length; i++) {
        const ofType = rides.filter((ride) => ride.type === categoryRideTypes[i]);
        if (ofType.length === 0) return false; // not all built
        if (anyRide(ofType, (ride) => ride.totalProfit > 0)) profitableCount++;
    }
    const requiredProfitableCount =
        category === "gentle" || category === "thrill"
            ? Math.ceil(categoryRideTypes.length / 2)
            : categoryRideTypes.length;
    return profitableCount >= requiredProfitableCount;
}

export const goals = (seed: number) => {
    let startMonth = date.monthsElapsed;
    let consecutiveCleanMonths = 0;
    let lastCheckedMonth = startMonth;
    const rng = seed !== undefined ? createSeededRandom(seed) : Math.random;
    const thoughtKeys = Object.keys(thoughtTypes) as ThoughtKey[];
    const awardKeys = Object.keys(awardTypes) as AwardKey[];
    const randomCategory = rideCategories[Math.floor(rng() * rideCategories.length)];

    const randomAwards: AwardKey[] = [];
    while (randomAwards.length < 3) {
        const randomAwardKey = awardKeys[Math.floor(rng() * awardKeys.length)];
        if (randomAwards.indexOf(randomAwardKey) === -1) {
            randomAwards.push(randomAwardKey);
        }
    }


    const randomThoughtKey = thoughtKeys[Math.floor(rng() * thoughtKeys.length)];
    const cleanMonthsByRegion: { [region: string]: { lastMonth: number; months: number } } = {};
    const randomThought = thoughtTypes[randomThoughtKey];


    let goals: Goal[] = [
        {
            name: "Have 3 coasters with a (6+) high nausea rating, must have profits",
            playerProgress: (scope) => countRides(scope.rides, (ride) => ride.nausea > 600 && ride.totalProfit > 0),
            checkPlayer: (scope) => countRides(scope.rides, (ride) => ride.nausea > 600 && ride.totalProfit > 0) >= 3,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.nausea > 600 && ride.totalProfit > 0).length >= 3,
        },
        {
            name: "Have 3 coasters with a (8+) high excitement rating, must have profits",
            playerProgress: (scope) => countRides(scope.rides, (ride) => ride.excitement > 800 && ride.totalProfit > 0),
            checkPlayer: (scope) => countRides(scope.rides, (ride) => ride.excitement > 800 && ride.totalProfit > 0) >= 3,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => map.rides.filter(ride => ride.excitement > 800 && ride.totalProfit > 0).length || 0,
            checkCondition: () => map.rides.filter(ride => ride.excitement > 800 && ride.totalProfit > 0).length >= 3,
        },
        {
            name: "Have 3 coasters with a (8+) high intensity rating, must have profits",
            playerProgress: (scope) => countRides(scope.rides, (ride) => ride.intensity > 800 && ride.totalProfit > 0),
            checkPlayer: (scope) => countRides(scope.rides, (ride) => ride.intensity > 800 && ride.totalProfit > 0) >= 3,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => map.rides.filter(ride => ride.intensity > 800 && ride.totalProfit > 0).length || 0,
            checkCondition: () => map.rides.filter(ride => ride.intensity > 800 && ride.totalProfit > 0).length >= 3
        },
        {
            name: "Park Rating 900+",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.rating,
            checkCondition: () => park.rating >= 900
        },
        {
            name: "Umbrella Pride (in 9 different colors)",
            playerProgress: (scope) => countUniqueUmbrellaColours(scope.guests),
            playerName: "Umbrella Pride (9 different colors in your region)",
            checkPlayer: (scope) => countUniqueUmbrellaColours(scope.guests) >= 9,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                const guests = map.getAllEntities('guest');
                let uniqueColors: number[] = [];  // Ensure uniqueColors is an array

                guests.forEach(guest => {
                    const umbrellaColor = guest.umbrellaColour;

                    // Check if umbrellaColor is not 0 and is not already in uniqueColors
                    if (umbrellaColor !== 0 && Array.isArray(uniqueColors)) {
                        let colorExists = false;
                        for (let i = 0; i < uniqueColors.length; i++) {
                            if (uniqueColors[i] === umbrellaColor) {
                                colorExists = true;
                                break;
                            }
                        }
                        if (!colorExists) {
                            uniqueColors.push(umbrellaColor);
                        }
                    }
                });
                return uniqueColors.length;
            },
            checkCondition: () => {
                const guests = map.getAllEntities('guest');
                let uniqueColors: number[] = [];  // Ensure uniqueColors is an array

                guests.forEach(guest => {
                    const umbrellaColor = guest.umbrellaColour;

                    // Check if umbrellaColor is not 0 and is not already in uniqueColors
                    if (umbrellaColor !== 0 && Array.isArray(uniqueColors)) {
                        let colorExists = false;
                        for (let i = 0; i < uniqueColors.length; i++) {
                            if (uniqueColors[i] === umbrellaColor) {
                                colorExists = true;
                                break;
                            }
                        }
                        if (!colorExists) {
                            uniqueColors.push(umbrellaColor);
                        }
                    }
                });
                return uniqueColors.length >= 9;
            }
        },
        {
            name: "Neineinein (999+ park rating)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.rating,
            checkCondition: () => park.rating >= 999
        },
        {

            name: "A millie (1000000+ cash)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.cash,
            checkCondition: () => park.cash >= 100_000_00
        },
        {
            name: "Get in debt for 420.000",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.bankLoan,
            checkCondition: () => park.bankLoan >= 420_000_0
        },
        {
            name: "Ride with more than 1000 guests",
            playerProgress: (scope) => scope.rides.filter((ride) => isRide(ride)).reduce((max, ride) => Math.max(max, ride.totalCustomers), 0),
            checkPlayer: (scope) => anyRide(scope.rides, (ride) => isRide(ride) && ride.totalCustomers >= 1000),
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () =>
                map.rides
                    .filter((ride) => ride.classification !== 'stall' && ride.classification !== 'facility')
                    .reduce((acc, ride) => acc + ride.totalCustomers, 0),

            checkCondition: () =>
                map.rides
                    .filter((ride) => ride.classification !== 'stall' && ride.classification !== 'facility')
                    .reduce((acc, ride) => acc + ride.totalCustomers, 0) >= 1000
        },
        {
            name: "Dirty (+100 litter)",
            playerProgress: (scope) => scope.litterCount,
            playerName: "Dirty (100+ litter in your region)",
            checkPlayer: (scope) => scope.litterCount >= 100,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => map.getAllEntities('litter').length,
            checkCondition: () => {
                return map.getAllEntities('litter').length >= 100;
            }
        },
        {
            name: "Clean AF (Max 16 litter for 3 months)",
            playerProgress: (scope) => {
                const state = cleanMonthsByRegion[scope.region];
                return `Litter: ${scope.litterCount}, guests: ${scope.guests.length}, clean months: ${state ? state.months : 0}`;
            },
            playerName: "Clean AF (max 16 litter in your region for 3 months, 100+ guests)",
            // An empty region has no litter, so a month only counts with 100+ guests
            checkPlayer: (scope) => {
                const month = date.monthsElapsed;
                const state = cleanMonthsByRegion[scope.region] || (cleanMonthsByRegion[scope.region] = { lastMonth: month, months: 0 });
                if (month !== state.lastMonth) {
                    state.lastMonth = month;
                    state.months = scope.litterCount <= 16 && scope.guests.length >= 100 ? state.months + 1 : 0;
                }
                return state.months >= 3;
            },
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => `Current litter: ${map.getAllEntities('litter').length} - Current Clean Months: ${consecutiveCleanMonths}`,
            checkCondition: (() => {
                return () => {

                    const currentMonth = date.monthsElapsed;
                    const litterCount = map.getAllEntities('litter').length;

                    // Only proceed if a new month has started
                    if (currentMonth !== lastCheckedMonth) {
                        lastCheckedMonth = currentMonth;

                        // Check cleanliness for the month
                        if (litterCount <= 16) {
                            consecutiveCleanMonths++; // Increment if park was clean this month
                        } else {
                            consecutiveCleanMonths = 0; // Reset if cleanliness condition fails
                        }
                    }

                    console.log(`Consecutive clean months: ${consecutiveCleanMonths}`);

                    // Return true if park has been clean for six consecutive months
                    return consecutiveCleanMonths >= 3;
                };
            })()

        },

        {
            name: "Long track (2500m+)",
            playerProgress: (scope) => scope.rides.reduce((max, ride) => Math.max(max, ride.rideLength), 0),
            checkPlayer: (scope) => anyRide(scope.rides, (ride) => ride.rideLength >= 2500 && ride.totalProfit > 0),
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                // return the current longest track
                const rides = map.rides.filter(ride => ride.rideLength >= 0);
                if (rides.length > 0) {
                    return rides.reduce((acc, ride) => ride.rideLength > acc ? ride.rideLength : acc, 0);
                } else {
                    return 0;
                }
            },
            checkCondition: () => {

                return map.rides.filter(ride => ride.rideLength >= 2500 && ride.totalProfit > 0).length >= 1
            }
        },
        {
            name: "Create 25 unique stalls",
            playerProgress: (scope) => countUniqueStallTypes(scope.rides),
            checkPlayer: (scope) => countUniqueStallTypes(scope.rides) >= 25,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                // Track unique stall types using `object.index`
                const uniqueStallTypes: number[] = [];

                map.rides
                    .filter((ride) => ride.classification === "stall")
                    .forEach((stall) => {
                        // Only add the stall type if it's not already added
                        if (!uniqueStallTypes.some((type) => type === stall.object.index)) {
                            uniqueStallTypes.push(stall.object.index);
                        }
                    });

                // Return the count of unique stall types
                return uniqueStallTypes.length;
            },

            checkCondition: () => {
                // Track unique stall types using `object.index`
                const uniqueStallTypes: number[] = [];

                map.rides
                    .filter((ride) => ride.classification === "stall")
                    .forEach((stall) => {
                        // Only add the stall type if it's not already added
                        if (!uniqueStallTypes.some((type) => type === stall.object.index)) {
                            uniqueStallTypes.push(stall.object.index);
                        }
                    });

                // Check if the number of unique stall types is 25 or more
                return uniqueStallTypes.length >= 25;
            },
        },
        {
            name: "Create 10 rides",
            playerProgress: (scope) => countRides(scope.rides, (ride) => isRide(ride) && ride.totalProfit > 0),
            checkPlayer: (scope) => countRides(scope.rides, (ride) => isRide(ride) && ride.totalProfit > 0) >= 10,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => map.rides.filter(ride => ride.classification !== 'stall' && ride.classification !== 'facility').length,
            checkCondition: function () { return map.rides.filter(function (ride) { return ride.classification !== 'stall' && ride.classification !== 'facility' && ride.totalProfit > 0; }).length >= 10; }
        },
        {
            name: "Airtime (10+ sec)",
            playerProgress: (scope) => scope.rides.reduce((max, ride) => Math.max(max, ride.totalAirTime), 0),
            checkPlayer: (scope) => anyRide(scope.rides, (ride) => ride.totalAirTime >= 10 && ride.totalProfit > 0),
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                // check the current longest airtime
                const rides = map.rides.filter(ride => ride.totalAirTime >= 0);
                if (rides.length > 0) {
                    return rides.reduce((acc, ride) => ride.totalAirTime > acc ? ride.totalAirTime : acc, 0);
                }
                return 0;
            },
            checkCondition: () => map.rides.filter(ride => ride.totalAirTime >= 10 && ride.totalProfit > 0).length >= 1
        },
        {
            name: "Get 1000 guests in the park",
            // Coop only: how many guests reach a region is luck, not skill
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 1000
        },
        {
            name: "Get 500 guests in the park",
            // Coop only: how many guests reach a region is luck, not skill
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 500
        },
        {
            name: "Get 250 guests in the park",
            // Coop only: how many guests reach a region is luck, not skill
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 250
        },
        {
            name: "Get 100 guests in the park",
            // Coop only: how many guests reach a region is luck, not skill
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 100
        },
        {
            name: "Ride with >$1000 profit",
            playerProgress: (scope) => scope.rides.filter(isRide).reduce((max, ride) => Math.max(max, ride.totalProfit), 0) / 10,
            checkPlayer: (scope) => anyRide(scope.rides, (ride) => isRide(ride) && ride.totalProfit >= 1000 * 10),
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () =>
                map.rides
                    .filter((ride) => ride.classification !== 'stall' && ride.classification !== 'facility')
                    .reduce((acc, ride) => acc + ride.totalProfit, 0) / 10,
            checkCondition: () =>
                map.rides
                    .filter((ride) => ride.classification !== 'stall' && ride.classification !== 'facility')
                    .reduce((acc, ride) => acc + ride.totalProfit, 0) >= 1000 * 10
        },
        {
            name: "Long Ride Time (4+S min)",
            playerProgress: (scope) => scope.rides.reduce((max, ride) => Math.max(max, ride.rideTime), 0),
            checkPlayer: (scope) => anyRide(scope.rides, (ride) => ride.rideTime >= 60 * 4 && ride.totalProfit > 0),
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                // check the current longest ride time
                const rides = map.rides.filter(ride => ride.rideTime >= 0);
                if (rides.length > 0) {
                    return rides.reduce((acc, ride) => ride.rideTime > acc ? ride.rideTime : acc, 0);
                }
                return 0;
            },
            checkCondition: () => {
                // const filterName = "Monorail 1";
                // const ride = map.rides.filter(ride => ride.name === filterName)[0];
                // console.log(`Ride time for ${filterName}: ${ride.rideTime}`);
                return map.rides.filter(ride => ride.rideTime >= 60 * 4 && ride.totalProfit > 0).length >= 1
            }
        },
        {
            name: `One of these Awards: ${randomAwards.join(", ")}`,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                // Return the last award
                const awards = park.messages.filter(message => message.type === 'award');
                const award = awards[awards.length - 1];
                return award ? award.text || 'No awards yet' : 'No awards yet';
            },
            checkCondition: () => {
                const awards = park.messages.filter(message => message.type === 'award');
                return randomAwards.some(randomAwardKey =>
                    awards.some(award => award.text.indexOf(awardTypes[randomAwardKey]) !== -1)
                );
            },
        },
        {
            name: `${randomThought} (25+ times)`,
            playerProgress: (scope) => scope.guests.filter((guest) => guest.thoughts.some((thought) => thought.type === randomThoughtKey)).length,
            playerName: `${randomThought} (25+ guests in your region)`,
            checkPlayer: (scope) => scope.guests.filter((guest) => guest.thoughts.some((thought) => thought.type === randomThoughtKey)).length >= 25,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                const guests = map.getAllEntities('guest');
                return guests.filter(guest => guest.thoughts.some(thought => thought.type === randomThoughtKey)).length;
            },
            checkCondition: () => {
                const guests = map.getAllEntities('guest');
                return guests.filter(guest => guest.thoughts.some(thought => thought.type === randomThoughtKey)).length >= 25;
            }
        },
        {
            name: "White Castle (Burger Stall Highest Possible, with Profit)",
            playerProgress: (scope) => {
                const stall = scope.rides.filter((ride) => ride.classification === "stall" && ride.type === 28 && ride.stations.some((station) => station.start && station.start.z >= 2000))[0];
                return stall ? stall.name : "No White Castle";
            },
            checkPlayer: (scope) =>
                anyRide(
                    scope.rides,
                    (ride) =>
                        ride.classification === "stall" &&
                        ride.type === 28 &&
                        ride.totalProfit > 0 &&
                        ride.stations.some((station) => station.start && station.start.z >= 2000),
                ),
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                const ride = map.rides.filter(
                    ride => ride.classification === 'stall' &&
                        ride.type === 28 &&
                        ride.stations.some(station => station.start && station.start.z >= 2000)
                )[0]
                return ride !== undefined ? ride.name : "No White Castle";
            },
            checkCondition: () => {

                const ride = map.rides.filter(
                    ride => ride.classification === 'stall' &&
                        ride.type === 28 &&
                        ride.stations.some(station => station.start && station.start.z >= 2000)
                )[0]
                return ride !== undefined && ride.totalProfit > 0;
            }
        },
        {
            name: `Create all rides in the ${randomCategory} category`,
            playerProgress: (scope) => {
                const types = getCategoryRideTypes(randomCategory.toLowerCase());
                return `${types.filter((type) => anyRide(scope.rides, (ride) => ride.type === type)).length}/${types.length} built`;
            },
            checkPlayer: (scope) => isCategoryComplete(scope.rides, randomCategory.toLowerCase()),
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => {
                const loweredRandomCategory = randomCategory.toLowerCase();

                // Get unique rideTypes for the selected category manually
                const categoryRideTypes: number[] = [];
                INVENTION_ITEMS.forEach((ride) => {
                    if (
                        ride.type === "ride" &&
                        ride.category === loweredRandomCategory &&
                        ride.rideType !== undefined // Ensure rideType is defined
                    ) {
                        let alreadyAdded = false;
                        for (let i = 0; i < categoryRideTypes.length; i++) {
                            if (categoryRideTypes[i] === ride.rideType) {
                                alreadyAdded = true;
                                break;
                            }
                        }
                        if (!alreadyAdded) {
                            categoryRideTypes.push(ride.rideType);
                        }
                    }
                });

                // Count how many unique rideTypes are built and profitable
                let builtCount = 0;
                let builtProfitableCount = 0;
                for (let i = 0; i < categoryRideTypes.length; i++) {
                    const rideType = categoryRideTypes[i];
                    let isBuilt = false;
                    let isProfitable = false;
                    for (let j = 0; j < map.rides.length; j++) {
                        const builtRide = map.rides[j];
                        if (builtRide.type === rideType) {
                            isBuilt = true;
                            if (builtRide.totalProfit > 0) {
                                isProfitable = true;
                            }
                        }
                    }
                    if (isBuilt) {
                        builtCount++;
                    }
                    if (isProfitable) {
                        builtProfitableCount++;
                    }
                }

                const requiredProfitableCount =
                    loweredRandomCategory === "gentle" || loweredRandomCategory === "thrill"
                        ? Math.ceil(categoryRideTypes.length / 2)
                        : categoryRideTypes.length;

                // Return progress in the format `built/current (profitable/requiredProfitable)`
                return `${builtCount}/${categoryRideTypes.length} (required profitable ${builtProfitableCount}/${requiredProfitableCount})`;
            },
            checkCondition: () => {
                const loweredRandomCategory = randomCategory.toLowerCase();

                // Get unique rideTypes for the selected category manually
                const categoryRideTypes: number[] = [];
                INVENTION_ITEMS.forEach((ride) => {
                    if (
                        ride.type === "ride" &&
                        ride.category === loweredRandomCategory &&
                        ride.rideType !== undefined // Ensure rideType is defined
                    ) {
                        let alreadyAdded = false;
                        for (let i = 0; i < categoryRideTypes.length; i++) {
                            if (categoryRideTypes[i] === ride.rideType) {
                                alreadyAdded = true;
                                break;
                            }
                        }
                        if (!alreadyAdded) {
                            categoryRideTypes.push(ride.rideType);
                        }
                    }
                });

                // Ensure all rides are built
                let allBuilt = true;
                for (let i = 0; i < categoryRideTypes.length; i++) {
                    const rideType = categoryRideTypes[i];
                    let isBuilt = false;
                    for (let j = 0; j < map.rides.length; j++) {
                        if (map.rides[j].type === rideType) {
                            isBuilt = true;
                            break;
                        }
                    }
                    if (!isBuilt) {
                        allBuilt = false;
                        break;
                    }
                }

                // Count how many rides are profitable
                let profitableCount = 0;
                for (let i = 0; i < categoryRideTypes.length; i++) {
                    const rideType = categoryRideTypes[i];
                    for (let j = 0; j < map.rides.length; j++) {
                        if (map.rides[j].type === rideType && map.rides[j].totalProfit > 0) {
                            profitableCount++;
                            break;
                        }
                    }
                }

                const requiredProfitableCount =
                    loweredRandomCategory === "gentle" || loweredRandomCategory === "thrill"
                        ? Math.ceil(categoryRideTypes.length / 2)
                        : categoryRideTypes.length;

                // Return true if all rides are built and profit condition is met
                return allBuilt && profitableCount >= requiredProfitableCount;
            },
        },
        // Goals for every mode: coop checks the whole park, PvP/Lockout the player's region
        sharedGoal({
            name: "Rides and stalls earn $10,000 profit",
            playerName: "Your rides and stalls earn $10,000 profit",
            check: (scope) => scope.rides.reduce((total, ride) => total + ride.totalProfit, 0) >= 10_000 * 10,
            progress: (scope) => scope.rides.reduce((total, ride) => total + ride.totalProfit, 0) / 10,
        }),
        sharedGoal({
            name: "A stall with 500+ customers",
            check: (scope) => anyRide(scope.rides, (ride) => ride.classification === "stall" && ride.totalCustomers >= 500),
            progress: (scope) => scope.rides.filter((ride) => ride.classification === "stall").reduce((max, ride) => Math.max(max, ride.totalCustomers), 0),
        }),
        sharedGoal({
            name: "Smooth operator (ride with 7+ excitement and under 5 intensity, with profit)",
            check: (scope) =>
                anyRide(scope.rides, (ride) => ride.excitement >= 700 && ride.intensity < 500 && ride.totalProfit > 0),
            progress: (scope) => countRides(scope.rides, (ride) => ride.excitement >= 700 && ride.intensity < 500 && ride.totalProfit > 0),
        }),
        sharedGoal({
            name: "Hat trick (25 guests wearing hats)",
            playerName: "Hat trick (25 guests wearing hats in your region)",
            check: (scope) => countGuestsWithItem(scope.guests, "hat") >= 25,
            progress: (scope) => countGuestsWithItem(scope.guests, "hat"),
        }),
        sharedGoal({
            name: "Tourist season (50 guests carrying a park map)",
            playerName: "Tourist season (50 guests carrying a park map in your region)",
            check: (scope) => countGuestsWithItem(scope.guests, "map") >= 50,
            progress: (scope) => countGuestsWithItem(scope.guests, "map"),
        }),
        sharedGoal({
            name: "Balloon party (25 guests with balloons)",
            playerName: "Balloon party (25 guests with balloons in your region)",
            check: (scope) => countGuestsWithItem(scope.guests, "balloon") >= 25,
            progress: (scope) => countGuestsWithItem(scope.guests, "balloon"),
        }),
        sharedGoal({
            name: "Money pit (a ride losing $500)",
            check: (scope) => anyRide(scope.rides, (ride) => isRide(ride) && ride.totalProfit <= -500 * 10),
            progress: (scope) => scope.rides.filter(isRide).reduce((min, ride) => Math.min(min, ride.totalProfit), 0) / 10,
        }),
        sharedGoal({
            name: "Build 15 rides (with profit)",
            check: (scope) => countRides(scope.rides, (ride) => isRide(ride) && ride.totalProfit > 0) >= 15,
            progress: (scope) => countRides(scope.rides, (ride) => isRide(ride) && ride.totalProfit > 0),
        }),
        sharedGoal({
            name: "Big crowd (a ride with 2000+ customers)",
            check: (scope) => anyRide(scope.rides, (ride) => isRide(ride) && ride.totalCustomers >= 2000),
            progress: (scope) => scope.rides.filter(isRide).reduce((max, ride) => Math.max(max, ride.totalCustomers), 0),
        }),
        sharedGoal({
            name: "Crowd pleasers (3 rides with 90%+ satisfaction)",
            check: (scope) => countRides(scope.rides, (ride) => isRide(ride) && ride.satisfaction >= 90) >= 3,
            progress: (scope) => countRides(scope.rides, (ride) => isRide(ride) && ride.satisfaction >= 90),
        }),
        sharedGoal({
            name: "Thrill seekers (5 rides with 6+ excitement, with profit)",
            check: (scope) => countRides(scope.rides, (ride) => ride.excitement >= 600 && ride.totalProfit > 0) >= 5,
            progress: (scope) => countRides(scope.rides, (ride) => ride.excitement >= 600 && ride.totalProfit > 0),
        }),
        sharedGoal({
            name: "Food court (10 stalls with profit)",
            check: (scope) => countRides(scope.rides, (ride) => ride.classification === "stall" && ride.totalProfit > 0) >= 10,
            progress: (scope) => countRides(scope.rides, (ride) => ride.classification === "stall" && ride.totalProfit > 0),
        }),
        sharedGoal({
            name: "Cash cow (a stall with $2,000 profit)",
            check: (scope) => anyRide(scope.rides, (ride) => ride.classification === "stall" && ride.totalProfit >= 2_000 * 10),
            progress: (scope) => scope.rides.filter((ride) => ride.classification === "stall").reduce((max, ride) => Math.max(max, ride.totalProfit), 0) / 10,
        }),
        sharedGoal({
            name: "Long haul (3 rides of 1000m+, with profit)",
            check: (scope) => countRides(scope.rides, (ride) => ride.rideLength >= 1000 && ride.totalProfit > 0) >= 3,
            progress: (scope) => countRides(scope.rides, (ride) => ride.rideLength >= 1000 && ride.totalProfit > 0),
        }),
        sharedGoal({
            name: "Merch drop (50 guests wearing park t-shirts)",
            playerName: "Merch drop (50 guests wearing park t-shirts in your region)",
            check: (scope) => countGuestsWithItem(scope.guests, "tshirt") >= 50,
            progress: (scope) => countGuestsWithItem(scope.guests, "tshirt"),
        }),
        sharedGoal({
            name: "Shades on (50 guests wearing sunglasses)",
            playerName: "Shades on (50 guests wearing sunglasses in your region)",
            check: (scope) => countGuestsWithItem(scope.guests, "sunglasses") >= 50,
            progress: (scope) => countGuestsWithItem(scope.guests, "sunglasses"),
        }),
        sharedGoal({
            name: "Say cheese (25 guests with an on-ride photo)",
            playerName: "Say cheese (25 guests with an on-ride photo in your region)",
            check: (scope) =>
                scope.guests.filter((guest) => ONRIDE_PHOTOS.some((photo) => guest.hasItem({ type: photo }))).length >= 25,
            progress: (scope) => scope.guests.filter((guest) => ONRIDE_PHOTOS.some((photo) => guest.hasItem({ type: photo }))).length,
        }),
        // {
        //     name: "Place 5 Litter Bins",
        //     slot: undefined,
        //     colors: "blank",
        //     status: "incomplete",
        //     currentCondition: () => {
        //         // Count litter bins by checking footpath additions
        //         let litterBinCount = 0;
        //         const footpathAdditions = objectManager.getAllObjects("footpath_addition");
                
        //         // Count litter bin objects that are placed
        //         for (const addition of footpathAdditions) {
        //             if (addition.identifier === "rct2.footpath_item.litter1") {
        //                 // This is a litter bin object, but we need to count how many are placed
        //                 // For now, we'll use a simple approach - count based on the object being available
        //                 litterBinCount = 1; // At least one litter bin type is available
        //                 break;
        //             }
        //         }
                
        //         return `Litter bins available: ${litterBinCount > 0 ? 'Yes' : 'No'}`;
        //     },
        //     checkCondition: () => {
        //         // For now, just check if the litter bin object is available
        //         // A more sophisticated check would require tracking placed objects
        //         const footpathAdditions = objectManager.getAllObjects("footpath_addition");
        //         return footpathAdditions.some(addition => addition.identifier === "rct2.footpath_item.litter1");
        //     }
        // }
    ];
    return goals;
};