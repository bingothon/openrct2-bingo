/**
 * Puts the park's date back to the start (March, year 1) when a PvP/Lockout game's clock starts,
 * so the time the server waited for players doesn't count. A game action, so the server and every
 * client change the date in the same tick.
 */
export function resetDateAction() {
  return {
    name: "resetDate",
    query: (): GameActionResult => ({ error: 0 }),
    execute: (): GameActionResult => {
      date.monthsElapsed = 0;
      return { error: 0 };
    },
  };
}
