import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  presets: ["@pandacss/dev/presets"],
  // define the content to scan 👇🏻
  include: ["./src/**/*.{tsx,jsx}", "./pages/**/*.{jsx,tsx}", "./theme.tsx"],
  exclude: [],
  outdir: "styled-system",
});
