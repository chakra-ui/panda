import { defineConfig } from '@pandacss/dev'
// import preset from "sandbox-custom-conditions-lib"

export default defineConfig({
  presets: ["sandbox-custom-conditions-lib"],
  // presets: [preset],
  include: ['src/**/*.tsx'],
  jsxFramework: 'react',
})
