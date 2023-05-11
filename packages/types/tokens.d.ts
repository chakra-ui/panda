// we need that weird trick to make sure that:
// - the tokens types are exported here in the `dist`
// - the generated types (styled-system/tokens/tokens.ts) mirrored from `src/tokens.ts` correctly imports from "../tokens"

export * from './src/tokens'
