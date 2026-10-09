import { GameManager } from "../../managers/GameManager";
import { COLOR_TO_REGION } from "../../bingo/playerColours";
import { getPlayerIdentity } from "../../utils/playerIdentity";

type RegisterPlayerArgs = {
  colour: string;
  /** Player to register when the server acts on someone's behalf (the /register chat command) */
  playerId?: number;
};

const SERVER_PLAYER_IDS = [0, -1];

/**
 * Registers a player to a colour/region in PvP/Lockout. Runs on the server and every client, so
 * everyone knows which colours are taken (the region picker greys them out).
 */
export function registerPlayerAction() {
  // The player being registered: whoever ran the action, unless the server registers someone
  const getTargetId = (event: GameActionEventArgs<RegisterPlayerArgs>): number =>
    event.args.playerId !== undefined && SERVER_PLAYER_IDS.indexOf(event.player) !== -1
      ? event.args.playerId
      : event.player;

  const validate = (event: GameActionEventArgs<RegisterPlayerArgs>): GameActionResult => {
    const fail = (message: string): GameActionResult => ({
      error: 1,
      errorTitle: "Can't register",
      errorMessage: message,
    });

    if (!event.args || !event.args.colour) {
      return fail("No colour picked.");
    }

    const mode: string = context.getParkStorage().get("gameMode", "coop");
    if (mode !== "pvp" && mode !== "lockout") {
      return fail("Player registration is only available in PVP or Lockout modes!");
    }

    const colour = event.args.colour;
    if (!COLOR_TO_REGION[colour]) {
      return fail(`Invalid color! Available colors: ${Object.keys(COLOR_TO_REGION).join(", ")}`);
    }

    const gameManager = GameManager.getInstance();
    const players = gameManager.getAllPlayers();
    for (let i = 0; i < players.length; i++) {
      if (players[i].colour === colour) {
        return fail(`Color ${colour} is already taken by ${players[i].name}!`);
      }
    }

    const targetId = getTargetId(event);
    if (typeof targetId !== "number") {
      return fail("Couldn't tell which player you are.");
    }
    const identity = getPlayerIdentity(targetId);
    const existing =
      gameManager.getPlayer(targetId.toString()) ||
      (identity ? gameManager.getPlayerManager().getPlayerByIdentity(identity) : null);
    if (existing) {
      return fail(`You are already registered as ${existing.name} (${existing.colour})!`);
    }

    return { error: 0 };
  };

  return {
    name: "registerPlayer",
    query: (event: GameActionEventArgs<RegisterPlayerArgs>): GameActionResult => validate(event),
    execute: (event: GameActionEventArgs<RegisterPlayerArgs>): GameActionResult => {
      const result = validate(event);
      if (result.error) {
        return result;
      }

      const targetId = getTargetId(event);
      const colour = event.args.colour;
      const regionData = COLOR_TO_REGION[colour];
      const gameManager = GameManager.getInstance();
      gameManager.registerPlayer(
        targetId.toString(),
        regionData.name,
        colour,
        regionData.region,
        getPlayerIdentity(targetId) || undefined,
      );

      if (network.mode === "server") {
        network.sendMessage(`✅ ${regionData.name} (${colour}) registered in ${regionData.region} region!`);
        const list = gameManager.getAllPlayers().map((player) => `${player.name} (${player.colour})`);
        network.sendMessage(`📋 Registered players: ${list.join(", ")}`);
      }
      return { error: 0 };
    },
  };
}
