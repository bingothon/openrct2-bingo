export function addCashAction() {
  return {
    name: "addCash",
    query: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ cash: number }>): GameActionResult => {
      if (!event.args || event.args.cash === undefined) {
        return { error: 1, errorMessage: "Cash amount is missing." };
      }

      park.cash += event.args.cash;
      return { error: 0 };
    }
  };
}


