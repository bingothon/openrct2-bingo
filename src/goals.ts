
import type { Goal } from "./types";
import { createSeededRandom } from "./ui-helpers";
type ThoughtKey = keyof typeof thoughtTypes;
type AwardKey = keyof typeof awardTypes;
const thoughtTypes = {
    "cant_afford_ride": "Thought: Can't afford this ride",
    "spent_money": "Thought: Spent too much money",
    "sick": "Thought: Feeling a bit sick",
    "very_sick": "Thought: Very sick!",
    "more_thrilling": "Thought: Needs more thrills",
    "intense": "Thought: Too intense!",
    "havent_finished": "Thought: Didn't get to finish",
    "sickening": "Thought: That ride was sickening",
    "bad_value": "Thought: Not worth the money",
    "go_home": "Thought: Heading home",
    "good_value": "Thought: Great value for the price",
    "already_got": "Thought: Already have this item",
    "cant_afford_item": "Thought: Can't afford that item",
    "drowning": "Thought: Help! I'm drowning!",
    "lost": "Thought: I'm lost",
    "was_great": "Thought: That was awesome!",
    "queuing_ages": "Thought: Zzz Queue",
    "tired": "Thought: Feeling tired",
    "cant_find": "Thought: Can't find",
    "not_paying": "Thought: Not paying that much!",
    "not_while_raining": "Thought: Not doing that in the rain",
    "bad_litter": "Thought: Too much litter here",
    "cant_find_exit": "Thought: Can't find the exit",
    "get_off": "Thought: I want to get off!",
    "get_out": "Thought: I need to get out",
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
    "Most Untidy": "The most untidy park in the country",
    "Most Tidy": "The tidiest park in the country",
    "Best Coasters": "The park with the best roller coasters",
    "Best Value": "The best value park in the country",
    "Most Beautiful": "The most beautiful park in the country",
    "Worst Value": "The worst value park in the country",
    "Safest Park": "The safest park in the country",
    "Best Staff": "The park with the best staff",
    "Best Food": "The park with the best food in the country",
    "Worst Food": "The park with the worst food in the country",
    "Best Toilets": "The park with the best toilet facilities in the country",
    "Most Disappointing": "The most disappointing park in the country",
    "Best Water Rides": "The park with the best water rides in the country",
    "Best Custom Rides": "The park with the best custom-designed rides",
    "Best Colors": "The park with the most dazzling choice of colour schemes",
    "Most Confusing Layout": "The park with the most confusing layout",
    "Best Gentle Rides": "The park with the best gentle rides"
};

export const goals = (seed: number) => {
    const rng = seed !== undefined ? createSeededRandom(seed) : Math.random;
    const thoughtKeys = Object.keys(thoughtTypes) as ThoughtKey[];
    const awardKeys = Object.keys(awardTypes) as AwardKey[];

    const randomThoughtKey = thoughtKeys[Math.floor(rng() * thoughtKeys.length)];
    const randomAwardKey = awardKeys[Math.floor(rng() * awardKeys.length)];
    const randomThought = thoughtTypes[randomThoughtKey];


    let goals: Goal[] = [
        {
            name: "Have 3 coasters with a (8+) high nausea rating",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.nausea > 800).length >= 3
        },
        {
            name: "Have 3 coasters with a (8+) high excitement rating",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.excitement > 800).length >= 3
        },
        {
            name: "Have 3 coasters with a (8+) high intensity rating",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.intensity > 800).length >= 3
        },
        {
            name: "Park Rating 900+",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => park.rating >= 900
        },
        {
            name: "Umbrella Pride (in 9 different colors)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
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
            checkCondition: () => park.rating >= 999
        },
        {

            name: "A millie",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => park.cash >= 10000000
        },
        {
            name: "Get in debt for 420.000",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => park.bankLoan >= 4200000
        },
        {
            name: "Ride with more than 13337 guests",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.reduce((acc, ride) => acc + ride.totalCustomers, 0) >= 13337
        },
        {
            name: "Dirty (+500 litter)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => {
                return map.getAllEntities('litter').length >= 500
            }
        },
        {
            name: "Clean AF (Max 16 litter for 6 months)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: (() => {
                let startMonth = date.monthsElapsed;
                let consecutiveCleanMonths = 0;
                let lastCheckedMonth = startMonth;
            
                return () => {
                   
                    const currentMonth = date.monthsElapsed;
                    const litterCount = map.getAllEntities('litter').length;
            
                    // Only proceed if a new month has started
                    if (currentMonth !== lastCheckedMonth) {
                        lastCheckedMonth = currentMonth;
            
                        // Check cleanliness for the month
                        if (litterCount <= 10) {
                            consecutiveCleanMonths++; // Increment if park was clean this month
                        } else {
                            consecutiveCleanMonths = 0; // Reset if cleanliness condition fails
                        }
                    }
            
                    console.log(`Consecutive clean months: ${consecutiveCleanMonths}`);
            
                    // Return true if park has been clean for six consecutive months
                    return consecutiveCleanMonths >= 6;
                };
            })()
            
        },

        {
            name: "Long track (10000m+)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",

            checkCondition: () => {

                return map.rides.filter(ride => ride.rideLength >= 10000).length >= 1
            }
        },
        {
            name: "Create 25 stalls",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: function () { return map.rides.filter(function (ride) { return ride.classification === 'stall'; }).length >= 50; }
        },
        {
            name: "Create 10 rides",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: function () { return map.rides.filter(function (ride) { return ride.classification !== 'stall'; }).length >= 10; }
        },
        {
            name: "Fast Average Track (200km/h+)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.maxSpeed >= 200).length >= 1
        },
        {
            name: "Airtime (20+ sec)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.totalAirTime >= 20).length >= 1
        },
        {
            name: "Average Speed (100km/h+)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.averageSpeed >= 1000).length >= 1
        },
        {
            name: "Get 1000 guests in the park",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => park.guests >= 1000
        },
        {
            name: "Get 500 guests in the park",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => park.guests >= 500
        },
        {
            name: "Get 250 guests in the park",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => park.guests >= 250
        },
        {
            name: "Get 100 guests in the park",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => park.guests >= 100
        },
        {
            name: "Ride with >$13337 profit",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.reduce((acc, ride) => acc + ride.totalProfit, 0) >= 133370
        },
        {
            name: "Long Ride Time (10+ min)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(ride => ride.rideTime >= 600).length >= 1
        },
        {
            name: `Award: ${randomAwardKey}`,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => {
                const awards = park.messages.filter(message => message.type === 'award');
                // console.log(awards);
                return awards.some(award => award.text.indexOf(awardTypes[randomAwardKey]) !== -1);
            }
        },
        {
            name: `${randomThought} (100+ times)`,
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => {
                const guests = map.getAllEntities('guest');
                return guests.filter(guest => guest.thoughts.some(thought => thought.type === randomThoughtKey)).length >= 100;
            }
        },
        {
            name: "White Castle (Burger Stall Highest Possible)",
            slot: undefined,
            colors: "blank",
            status: "incomplete",
            checkCondition: () => map.rides.filter(
                ride => ride.classification === 'stall' &&
                    ride.type === 28 &&
                    ride.stations.some(station => station.start && station.start.z >= 2000)
            ).length >= 1
        }
    ];
    return goals;
}