/*
 * PvP/Lockout game clock. It starts when the first player has picked a colour, not when the server
 * starts the game: the park may run empty for a long time before anyone joins. The start (in
 * months since the park opened) is kept in park storage, so a server restart keeps the clock.
 */

const TIMER_START_KEY = "timerStartMonth";
const MONTHS_PER_YEAR = 8;

/** Months since the park opened when the clock started; -1 while it hasn't started */
export function getTimerStartMonth(): number {
    return context.getParkStorage().get(TIMER_START_KEY, -1);
}

export function isTimerRunning(): boolean {
    return getTimerStartMonth() >= 0;
}

/** Whole and partial in-game years played since the clock started (0 before it started) */
export function getYearsPlayed(): number {
    const start = getTimerStartMonth();
    return start < 0 ? 0 : (date.monthsElapsed - start) / MONTHS_PER_YEAR;
}

/** Whole in-game years left; the full duration before the clock started */
export function getYearsLeft(duration: number): number {
    return Math.max(0, Math.ceil(duration - getYearsPlayed()));
}

/** Server: start the clock now (no-op when it's already running) */
export function startTimer(): void {
    if (isTimerRunning()) return;
    context.executeAction("setStorage", { args: { key: TIMER_START_KEY, value: date.monthsElapsed } });
}

/** A new game: the clock waits for the first player again */
export function resetTimer(): void {
    context.executeAction("setStorage", { args: { key: TIMER_START_KEY, value: -1 } });
}
