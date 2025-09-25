export function getRandomItemsByRideType(items: ResearchItem[]): ResearchItem[] {
    const rideTypeMap: { [key: number]: RideResearchItem[] } = {}; // Group RideResearchItems by rideType
    const uniqueItems: ResearchItem[] = [];

    // Separate and group RideResearchItems by rideType
    items.forEach((item) => {
        if (item.type === "ride" && item.category === "shop") {
            // Add all items in the "shop" category directly
            uniqueItems.push(item);
        } else if (item.type === "ride" && item.rideType !== undefined) {
            // Group RideResearchItems by rideType
            if (!rideTypeMap[item.rideType]) {
                rideTypeMap[item.rideType] = [];
            }
            rideTypeMap[item.rideType].push(item);
        } else if (item.type === "scenery") {
            // Add all SceneryResearchItems directly
            uniqueItems.push(item);
        }
    });

    // Randomly select one RideResearchItem per rideType
    for (const rideType in rideTypeMap) {
        const itemsForType = rideTypeMap[rideType];
        const randomIndex = Math.floor(Math.random() * itemsForType.length);
        uniqueItems.push(itemsForType[randomIndex]);
    }

    return uniqueItems;
}


