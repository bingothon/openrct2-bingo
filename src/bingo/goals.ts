import { INVENTION_ITEMS } from "src/constants";
import { Goal } from "../types";
import { createSeededRandom } from "../util";

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
    const randomThought = thoughtTypes[randomThoughtKey];


    let goals: Goal[] = [
        {
            name: "Have 3 coasters with a (6+) high nausea rating, must have profits",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.nausea > 600 && ride.totalProfit > 0).length >= 3
        },
        {
            name: "Have 3 coasters with a (8+) high excitement rating, must have profits",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => map.rides.filter(ride => ride.excitement > 800 && ride.totalProfit > 0).length || 0,
            checkCondition: () => map.rides.filter(ride => ride.excitement > 800 && ride.totalProfit > 0).length >= 3
        },
        {
            name: "Have 3 coasters with a (8+) high intensity rating, must have profits",
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
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => map.rides.filter(ride => ride.classification !== 'stall' && ride.classification !== 'facility').length,
            checkCondition: function () { return map.rides.filter(function (ride) { return ride.classification !== 'stall' && ride.classification !== 'facility' && ride.totalProfit > 0; }).length >= 10; }
        },
        {
            name: "Airtime (10+ sec)",
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
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 1000
        },
        {
            name: "Get 500 guests in the park",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 500
        },
        {
            name: "Get 250 guests in the park",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 250
        },
        {
            name: "Get 100 guests in the park",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            currentCondition: () => park.guests,
            checkCondition: () => park.guests >= 100
        },
        {
            name: "Ride with >$1000 profit",
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

                // Count how many unique rideTypes are built manually
                let builtCount = 0;
                categoryRideTypes.forEach((rideType) => {
                    if (
                        map.rides.some((builtRide) => builtRide.type === rideType && builtRide.totalProfit > 0)
                    ) {
                        builtCount++;
                    }
                });

                // Return progress in the format `current/max`
                return `${builtCount}/${categoryRideTypes.length}`;
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

                // Verify all unique rideTypes are built
                for (let i = 0; i < categoryRideTypes.length; i++) {
                    const rideType = categoryRideTypes[i];
                    if (!map.rides.some((builtRide) => builtRide.type === rideType && builtRide.totalProfit > 0)) {
                        return false;
                    }
                }
                return true;
            },
        }



    ];
    return goals;
};