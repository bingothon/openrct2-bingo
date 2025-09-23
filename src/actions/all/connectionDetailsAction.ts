export function connectionDetailsAction() {
  return {
    name: "connectionDetails",
    query: (event: GameActionEventArgs<{ roomUrl: string; roomPassword: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ roomUrl: string; roomPassword: string }>): GameActionResult => {
      context.getParkStorage().set('roomUrl', event.args.roomUrl);
      context.getParkStorage().set('roomPassword', event.args.roomPassword);
      return { error: 0 };
    }
  };
}


