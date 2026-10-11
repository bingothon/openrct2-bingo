export function moveToAction() {
  return {
    name: "moveTo",
    query: (event: GameActionEventArgs<{ x: number; y: number }>): GameActionResult => {
      console.log("Querying action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ x: number; y: number }>): GameActionResult => {
      if (!event.args || event.args.x === undefined || event.args.y === undefined) {
        return { error: 1, errorMessage: "X or Y position is missing." };
      }

      const x = event.args.x;
      const y = event.args.y;
      // Moves every player's view; a headless server has no view
      if (typeof ui !== "undefined") {
        ui.mainViewport.moveTo({ x: x, y: y });
      }
      return { error: 0 };
    }
  };
}


