
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import flowbitePlugin from "flowbite/plugin";

const config: Config = {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}"
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
    extend: {}
  },
  plugins: [
    typography,
    flowbitePlugin
  ]
};

export default config;
