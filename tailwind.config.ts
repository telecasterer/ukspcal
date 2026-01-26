
import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import typography from "@tailwindcss/typography";
import flowbitePlugin from "flowbite/plugin";

const config: Config = {
  content: [
    "./src/**/*.{html,js,svelte,ts}",

    // Flowbite + Flowbite-Svelte
    "node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
    "node_modules/flowbite/**/*.js",

    // Flowbite datepicker templates include utility classes (e.g. `bg-blue-700`, `!bg-primary-700`)
    // that need to be present in the generated CSS.
    "node_modules/flowbite-datepicker/**/*.js",
    "node_modules/flowbite-svelte/node_modules/flowbite-datepicker/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Flowbite uses `primary` utility classes in its templates.
      colors: {
        primary: colors.blue
      }
    }
  },
  plugins: [
    typography,
    flowbitePlugin
  ]
};

export default config;
