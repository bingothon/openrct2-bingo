export function clearAllRidesAction() {
  return {
    name: "clearAllRides",
    query: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      const rides = map.rides;
      if (rides.length === 0) {
        console.log("No rides to clear.");
        return { error: 0 };
      }
      for (const ride of rides) {
        context.executeAction("ridesetstatus", { ride: ride.id, status: 0 }, () => {
          context.executeAction("ridesetstatus", { ride: ride.id, status: 0 }, () => {
            context.executeAction("ridedemolish", { ride: ride.id, modifyType: 0 }, () => {
              console.log(`Ride ${ride.id} demolished.`);
              return { error: 0 };
            });
          });
        });
      }
      return { error: 0 };
    }
  }
}


