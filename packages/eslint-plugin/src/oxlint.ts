import { createPandaPlugin } from './plugin'

/**
 * oxlint entry point. oxlint loads this module via dynamic import and reads its
 * default export, so the top-level await below resolves before the plugin runs.
 * Point `.oxlintrc.json` `jsPlugins` at `@pandacss/eslint-plugin/oxlint`.
 *
 * The Panda config is auto-discovered from the working directory; set
 * `PANDA_CONFIG_PATH` to point at a config in a non-standard location.
 */
const configPath = process.env.PANDA_CONFIG_PATH
const { rules } = await createPandaPlugin(configPath ? { configPath } : {})

// `meta.name` is the oxlint rule prefix, kept as `@pandacss` so rule ids match
// the ESLint flat-config namespace (`@pandacss/no-debug`, …).
export default { meta: { name: '@pandacss' }, rules }
