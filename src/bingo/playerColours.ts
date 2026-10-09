import type { PlayerRegionKey } from "../managers/GroundDivisionManager";

/**
 * Colour to map region - must match the coloured corner markers placed on the ground
 * (playerSections.ts, config.playerColors.player1..4). The scoreboard has its own layout;
 * ScoreManager picks the scoreboard slot by colour.
 */
export const COLOR_TO_REGION: { [colour: string]: { region: PlayerRegionKey; name: string } } = {
  red: { region: "top-left", name: "Player 1" },
  blue: { region: "top-right", name: "Player 2" },
  green: { region: "bottom-left", name: "Player 3" },
  yellow: { region: "bottom-right", name: "Player 4" },
};

export const PLAYER_COLOURS = Object.keys(COLOR_TO_REGION);

/** "red" -> "Red", used as the staff name prefix */
export function colourLabel(colour: string): string {
  return colour.charAt(0).toUpperCase() + colour.slice(1);
}

/**
 * Colour of the player that hired a staff member: hired staff are renamed to "<Colour> <name>"
 * (staffNaming.ts). Names are synchronised, so server and clients agree. Null for unowned staff.
 */
export function getStaffOwner(staffName: string): string | null {
  for (let i = 0; i < PLAYER_COLOURS.length; i++) {
    if (staffName.indexOf(`${colourLabel(PLAYER_COLOURS[i])} `) === 0) return PLAYER_COLOURS[i];
  }
  return null;
}
