export function removeAllLitterAction() {
  return {
    name: "removeAllLitter",
    query: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      console.log("Removing all litter from the map...");

      const litters = map.getAllEntities("litter");
      for (const litter of litters) {
        litter.remove();
      }

      return { error: 0 };
    },
  };
}


