import { main } from "./main";

registerPlugin({
    name: "Bingo Plugin",
    version: "1.0",
    authors: ["Tr1cks"],
    type: "remote",
    licence: "MIT",
    // 77+: custom actions get the acting player (68) and network APIs take player ids (77)
    targetApiVersion: 77,
    main: main,
});