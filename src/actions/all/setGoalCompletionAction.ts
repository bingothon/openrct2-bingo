import { notifyTextGoal } from "../../bingo/notifications/text";

export function setGoalCompletionAction() {
  return {
    name: "setGoalCompletion",
    query: (event: GameActionEventArgs<{ goalKey: string; completed: boolean, goalName?: string }>): GameActionResult => {
      console.log("Querying goal completion action with event args:", event.args);
      return { error: 0 };
    },
    execute: (event: GameActionEventArgs<{ goalKey: string; completed: boolean, goalName?: string }>): GameActionResult => {
      if (!event.args || event.args.goalKey === undefined || event.args.completed === undefined) {
        return { error: 1, errorMessage: "Goal key or completion status is missing." };
      }
      const parkStorage = context.getParkStorage();
      console.log(`Setting goal completion status for ${event.args.goalKey}: ${event.args.completed}`);
      parkStorage.set(event.args.goalKey, event.args.completed);
      if (event.args.goalName) {
        notifyTextGoal(event.args.goalName);
      }
      console.log(`Goal completion status set for ${event.args.goalKey}: ${event.args.completed}`);
      return { error: 0 };
    }
  };
}


