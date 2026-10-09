/*
 * Player budgets (PvP/Lockout). The park's cash is shared, so without budgets one player could
 * spend everything. Each colour gets the same starting budget (config.playerStartingBudget), plus the profit of the
 * rides and stalls in their own region, minus what they spent. Purchases that don't fit are
 * refused (buildingRestrictions.ts).
 *
 * Spending is tracked on the server from executed player actions (refunds, e.g. demolishing,
 * count back). Park-wide costs like staff wages still come out of the shared cash.
 */

import { config } from "../config";
import { GameManager } from "../managers/GameManager";
import { subscriptions } from "../subscriptions/manager";
import { getRideRegion } from "./goalScopes";
import { PLAYER_COLOURS } from "./playerColours";

const SPENT_KEY = "budgetSpent";

function getSpent(): { [colour: string]: number } {
    return context.getParkStorage().get(SPENT_KEY, {}) as { [colour: string]: number };
}

export interface Budget {
    share: number;
    income: number;
    spent: number;
    left: number;
}

/**
 * Park cash at the start of a PvP/Lockout game: one starting budget per colour
 */
export function getPvpStartingCash(): number {
    return config.playerStartingBudget * PLAYER_COLOURS.length;
}

/**
 * A colour's budget in money units (tenths, like park.cash)
 */
export function getBudget(colour: string): Budget {
    const share = config.playerStartingBudget;
    const player = GameManager.getInstance()
        .getAllPlayers()
        .filter((registered) => registered.colour === colour)[0];

    let income = 0;
    if (player) {
        const ground = GameManager.getInstance().getGroundDivisionManager();
        map.rides.forEach((ride) => {
            if (getRideRegion(ride, ground) === player.region) income += ride.totalProfit;
        });
    }

    const spent = getSpent()[colour] || 0;
    return { share, income, spent, left: share + income - spent };
}

/**
 * "$12,345" for an amount in money units (tenths)
 */
export function formatMoney(units: number): string {
    const dollars = Math.round(units / 10);
    const digits = String(Math.abs(dollars)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${dollars < 0 ? "-" : ""}$${digits}`;
}

/**
 * Server: a new game starts with nothing spent
 */
export function resetBudgets(): void {
    context.getParkStorage().set(SPENT_KEY, {});
}

/**
 * Server: add the cost of every executed player action to that player's spending
 */
export function subscribeToBudgetTracking(): void {
    subscriptions.upsert("budgetTracking", () =>
        context.subscribe("action.execute", (e) => {
            if (e.player === 0 || e.player === -1 || e.result.error || !e.result.cost) return;

            const mode: string = context.getParkStorage().get("gameMode", "coop");
            if (mode !== "pvp" && mode !== "lockout") return;

            const player = GameManager.getInstance().getPlayer(e.player.toString());
            if (!player) return;

            const spent = getSpent();
            spent[player.colour] = (spent[player.colour] || 0) + e.result.cost;
            context.getParkStorage().set(SPENT_KEY, spent);
        })
    );
}
