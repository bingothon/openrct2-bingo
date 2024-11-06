import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const build = process.env.BUILD || "development";
const isDev = build === "development";

const options = {
  /**
   * Change the file name of the output file here.
   */
  filename: "bingo.js",

  /**
   * Determines in what build mode the plugin should be build. The default here takes
   * from the environment (ex. CLI arguments) with "development" as fallback.
   */
  build: process.env.BUILD || "development",
};


async function getOutput() {
  if (options.build !== "development") {
    return `./dist/${options.filename}`;
  }

  const platform = process.platform;
  const pluginPath = `OpenRCT2/plugin/${options.filename}`;

  if (platform === "win32") {
    // Windows
    const { stdout } = await promisify(exec)(
      "powershell -command \"[Environment]::GetFolderPath('MyDocuments')\"",
    );
    return `${stdout.trim()}/${pluginPath}`;
  } else if (platform === "darwin") {
    // MacOS
    return `${homedir()}/Library/Application Support/${pluginPath}`;
  } else {
    // Linux
    const configFolder = process.env.XDG_CONFIG_HOME || `${homedir()}/.config`;
    return `${configFolder}/${pluginPath}`;
  }
}

/**
 * @type {import("rollup").RollupOptions}
 */
const config = [
  {
    // Regular ESNext build
    input: "./src/plugin.ts",
    output: {
      file: await getOutput(),
      format: "iife",
      compact: true,
    },
    plugins: [
      typescript(),
      terser({
        compress: {
          passes: 5,
          unsafe: true,
        },
        format: {
          comments: false,
          quote_style: 1,
          wrap_iife: false,
          preamble:
            "// Get the latest version: https://github.com/Basssiiie/OpenRCT2-FlexUI",
        },
      }),
    ],
  },
  {
    // Declaration file packaging
    input: "./src/plugin.ts",
    output: {
      file: "./dist/plugin.d.ts",
      format: "esm",
    },
    plugins: [
      dts({
        tsconfig: "./tsconfig.json",
        compilerOptions: {
          declaration: true,
          declarationDir: "./@types",
          emitDeclarationOnly: true,
          target: "ESNext",
        },
        exclude: ["./src/**/*.d.ts", "./tests/**/*"],
      }),
    ],
  },
];
export default config;
