// TypeScript 6 is strict about side-effect imports of non-TS files.
// Next's bundled types don't declare *.css side-effect imports universally,
// so add a minimal ambient declaration so `import './globals.css'` type-checks.
declare module '*.css'
