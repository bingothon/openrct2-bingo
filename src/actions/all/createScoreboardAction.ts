import { createScoreboard } from "../../bingo/notifications/scoreboard";

export function createScoreboardAction() {
  return {
    name: "createScoreboard",
    query: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      console.log("Querying createScoreboard action");
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs): GameActionResult => {
      // Dummy usage to avoid TypeScript warning
      void event;
      try {
        const success = createScoreboard();
        if (success) {
          console.log("Scoreboard created successfully");
          return { error: 0 };
        } else {
          console.log("Failed to create scoreboard");
          return { error: 1, errorMessage: "Failed to create scoreboard" };
        }
      } catch (error) {
        console.log("Failed to create scoreboard:", error);
        return { error: 1, errorMessage: "Failed to create scoreboard" };
      }
    }
  };
}


