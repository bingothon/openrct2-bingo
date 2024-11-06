import { main } from "./main";

registerPlugin({
    name: "Bingo Plugin",
    version: "1.0",
    authors: ["Tr1cks"],
    type: "remote",
    licence: "MIT",
    targetApiVersion: 34,
    main: main,
});