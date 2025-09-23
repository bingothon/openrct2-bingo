export function setCashAction() {
  return {
    name: "setCash",
    query: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      if (!event.args || event.args.cash === undefined) {
        return { error: 1, errorMessage: "Cash amount is missing." };
      }

      park.cash = event.args.cash;
      console.log(`Set cash to: ${event.args.cash}`);
      return { error: 0 };
    }
  };
}


