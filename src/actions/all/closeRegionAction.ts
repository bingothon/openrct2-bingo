import { GameManager } from "../../managers/GameManager";
import { COLOR_TO_REGION } from "../../bingo/playerColours";
import { markColourClosed, markColourOpen } from "../../bingo/closedRegions";
import type { PlayerRegionKey } from "../../managers/GroundDivisionManager";

/*
 * PvP/Lockout actions for a player who left (leavingPlayers.ts). They run on the server and every
 * client, so everyone's game agrees; the server does the rest of the cleanup with normal actions.
 */

const validate = (event: GameActionEventArgs<{ colour: string }>): GameActionResult =>
  event.args && COLOR_TO_REGION[event.args.colour] ? { error: 0 } : { error: 1, errorMessage: "Unknown colour." };

/** Drops the registration; the colour can't be picked while its region is being cleared */
export function closeRegionAction() {
  return {
    name: "closeRegion",
    query: validate,
    execute: (event: GameActionEventArgs<{ colour: string }>): GameActionResult => {
      const result = validate(event);
      if (result.error) return result;
      markColourClosed(event.args.colour);
      GameManager.getInstance().getPlayerManager().unregisterPlayerFromRegion(COLOR_TO_REGION[event.args.colour].region);
      return { error: 0 };
    },
  };
}

/** The region is cleared: a new player can pick the colour */
export function reopenRegionAction() {
  return {
    name: "reopenRegion",
    query: validate,
    execute: (event: GameActionEventArgs<{ colour: string }>): GameActionResult => {
      const result = validate(event);
      if (result.error) return result;
      markColourOpen(event.args.colour);
      return { error: 0 };
    },
  };
}

/**
 * Removes the guests in a region. Not those on a ride, which OpenRCT2 can't remove: the region's
 * rides are demolished before, which puts their riders back on the ground.
 */
export function removeRegionGuestsAction() {
  return {
    name: "removeRegionGuests",
    query: validate,
    execute: (event: GameActionEventArgs<{ colour: string }>): GameActionResult => {
      const result = validate(event);
      if (result.error) return result;
      const region: PlayerRegionKey = COLOR_TO_REGION[event.args.colour].region;
      const ground = GameManager.getInstance().getGroundDivisionManager();
      map.getAllEntities("guest").forEach((guest) => {
        if (ground.getRegionForTile({ x: Math.floor(guest.x / 32), y: Math.floor(guest.y / 32) }) !== region) return;
        try {
          guest.remove();
        } catch (error) {
          // On a ride: stays (same on every client, so nobody desyncs)
        }
      });
      return { error: 0 };
    },
  };
}
