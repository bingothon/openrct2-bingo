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
        createScoreboard();
        console.log("Scoreboard created successfully");
        return { error: 0 };
      } catch (error) {
        console.log("Failed to create scoreboard:", error);
        return { error: 1, errorMessage: "Failed to create scoreboard" };
      }
    }
  };
}


