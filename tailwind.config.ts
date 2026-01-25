
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
  safelist: [
    // Calendar dynamic backgrounds
    "bg-gray-50",
    "bg-gray-100",
    "bg-gray-900",
    "bg-gray-900/50",
    "bg-gray-800",
    "bg-gray-200",
    "bg-gray-300",
    "bg-blue-300",
    "bg-blue-700",
    "bg-green-400",
    "bg-green-600",
    "text-white",
    "font-bold",
    "hover:ring-2",
    "hover:ring-blue-400",
    "dark:bg-gray-900",
    "dark:bg-gray-900/50",
    "dark:bg-gray-800",
    "dark:bg-gray-600",
    "dark:bg-blue-700",
    "dark:bg-green-600",
    "border-gray-200",
    "border-gray-300",
    "border-gray-600",
    "border-gray-700",
    "rounded",
    "rounded-lg",
    "rounded-full",
    "shadow-sm",
    "min-h-[80px]",
    "aspect-square",
    "transition"
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
