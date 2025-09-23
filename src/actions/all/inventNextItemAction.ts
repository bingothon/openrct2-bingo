export function inventNextItemAction() {
  return {
    name: "inventNextItem",
    query: (event: GameActionEventArgs): GameActionResult => {
      console.log("Querying inventNextItem action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      const research = park.research;

      if (research.uninventedItems.length > 0) {
        research.progress = 65534;
        return { error: 0 };
      } else {
        console.log("No more items to invent.");
        return { error: 0, errorMessage: "No uninvented items remaining." };
      }
    }
  };
}


