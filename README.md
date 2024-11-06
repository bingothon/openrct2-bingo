# OpenRCT2 Bingo plugin


[OpenRCT2](https://openrct2.org/) plugin that enables playing of bingo via bingosync with automatic goal tracking.

![Screenshot of Bingosync with the goals loaded.](openrct2-bingo-screenshot.png)

## Installing

Clone this repository https://github.com/bingothon/openrct2-bingo.

Find your OpenRCT2 directory.

- Windows: `C:\Users\YourName\Documents\OpenRCT2`
- Mac: `/Users/YourName/Library/Application Support/OpenRCT2`
- Linux: `$XDG_CONFIG_HOME/OpenRCT2` or in its absence `$HOME/.config/OpenRCT2`

```
git clone https://github.com/bingothon/openrct2-bingo
```

This should be your final folder structure:

```
.
├── README.md
├── out
│   └── bingo.js
├── package-lock.json
├── package.json
├── src
│   └── index.ts
├── tsconfig.json
└── types
    └── openrct2.d.ts
```

Copy out\bingo.js to your OpenRCT2 directory

Start the game and you should see a window to connect to bingosync, if needed enter your username and room name and press connect.
Now copy the url and password to check the bingo board.

## Caveats

This plugin immediately creates a bingoboard on bingosync, should have some ui, it's also currently only working single player.

Client server optional to interact with bingosync, https://github.com/bingothon/openrct2-bingosync

## Usage

Open the board with the following key combination CTRL+SHIFT+B
Open the bingosync connection dialog with CTRL+SHIFT+C

## Important
Some goals are untested, if you want to talk about them join https://discord.com/invite/openrct2-264137540670324737 openrct2 official discord.