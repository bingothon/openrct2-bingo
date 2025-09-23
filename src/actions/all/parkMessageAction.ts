export function parkMessageAction() {
  return {
    name: "parkMessage",
    query: (event: GameActionEventArgs<{ message: string }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ message: string }>): GameActionResult => {
      if (!event.args || event.args.message === undefined) {
        return { error: 1, errorMessage: "Message is missing." };
      }

      park.postMessage(event.args.message);
      return { error: 0 };
    }
  };
}


