export function setStorageAction() {
  return {
    name: "setStorage",
    query: (event: GameActionEventArgs<{ key: string; value: any }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ key: string; value: any }>): GameActionResult => {
      if (!event.args || event.args.key === undefined || event.args.value === undefined) {
        return { error: 1, errorMessage: "Key or value is missing." };
      }

      const parkStorage = context.getParkStorage();
      parkStorage.set(event.args.key, event.args.value);
      console.log(`Set storage key ${event.args.key} to: ${event.args.value}`);
      return { error: 0 };
    }
  };
}


