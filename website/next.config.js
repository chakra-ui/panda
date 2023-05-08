const withNextra = require("nextra")({
  // Tell Nextra to use the custom theme as the layout
  // theme: "./theme.tsx",
  theme: "./src/index.tsx",
});

module.exports = withNextra({
  // Other Next.js configurations
  i18n: {
    locales: ["default", "en", "de"],
    defaultLocale: "default",
  },
});
