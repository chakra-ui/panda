# Atlaskit Preset Generation Scripts

This directory contains scripts to automatically generate the Panda CSS preset from the official `@atlaskit/tokens`
package.

## Scripts

### `generate-theme.mjs`

Autogenerates the Panda CSS theme from `@atlaskit/tokens` package. This script reads the token data and converts it to
Panda CSS format.

**Usage:**

```bash
# Generate theme (keeps existing files)
pnpm generate

# Clean src/ directory first, then generate
pnpm generate:clean

# Or run directly with node
node scripts/generate-theme.mjs
node scripts/generate-theme.mjs --clean
```

**What it does:**

1. Reads token data from `@atlaskit/tokens` and `@atlaskit/motion` packages
2. Processes tokens with full TypeScript type safety (`Tokens`, `SemanticTokens`, `Theme` types)
3. Generates TypeScript files in the `src/` directory:
   - `colors/core.ts` - Core color tokens (`Tokens['colors']`)
   - `colors/semantic.ts` - Semantic colors with `_light`/`_dark` variants (`SemanticTokens['colors']`)
   - `opacity.ts` - Opacity tokens for disabled/loading states (`Tokens['opacity']`)
   - `spacing.ts` - Spacing scale including negative values (`Tokens['spacing']`)
   - `typography/sizes.ts` - Font sizes (`Tokens['fontSizes']`)
   - `typography/fonts.ts` - Font families (`Tokens['fonts']`)
   - `typography/weights.ts` - Font weights (`Tokens['fontWeights']`)
   - `typography/lineHeights.ts` - Line heights (`Tokens['lineHeights']`)
   - `textStyles.ts` - Semantic typography presets combining font properties (`Theme['textStyles']`)
   - `radii.ts` - Border radii (`Tokens['radii']`)
   - `shadows.ts` - Box shadows with `_light`/`_dark` variants (`SemanticTokens['shadows']`)
   - `durations.ts` - Animation durations from @atlaskit/motion (`Tokens['durations']`)
   - `easings.ts` - Easing curves from @atlaskit/motion (`Tokens['easings']`)
   - `breakpoints.ts` - Responsive breakpoints from Atlassian Design System (`Theme['breakpoints']`)
   - `index.ts` - Main preset export
4. Formats all generated files with Prettier for consistent code style

**Flags:**

- `--clean` - Remove all files in the `src/` directory before generating

### `explore-tokens.mjs`

Utility script to explore the structure of `@atlaskit/tokens` package. Useful for understanding the token format and
debugging.

**Usage:**

```bash
node scripts/explore-tokens.mjs
```

## Updating the Preset

When a new version of `@atlaskit/tokens` or `@atlaskit/motion` is released:

1. Update dependencies:

   ```bash
   pnpm update @atlaskit/tokens @atlaskit/motion --ignore-scripts
   ```

2. Regenerate the theme:

   ```bash
   pnpm generate:clean
   ```

3. Review the changes in `src/`

4. Build the preset:

   ```bash
   pnpm build
   ```

5. Test the preset in a Panda CSS project

6. Commit the changes

## Architecture

The generation script uses raw token data from multiple sources:

### From `@atlaskit/tokens`:

- **Light/Dark themes**: Colors, opacity, spacing, typography, shape, shadows
  - Semantic tokens use `_light`/`_dark` pattern (not `base`/`_dark`)
  - Regular tokens for values that are the same in both themes
- **Typography**: Font shorthand parsed into fonts, sizes, weights, lineHeights, and textStyles
  - Standalone weight/family tokens extracted separately
  - TextStyles combine all font properties for semantic usage
- **Shadow tokens**: Converted from array format to CSS box-shadow strings
- **Shape tokens**: Only `radius.*` used; `border.width` excluded

### From `@atlaskit/motion`:

- **Durations**: `@atlaskit/motion/dist/cjs/utils/durations.js` (none, small, medium, large)
- **Easing curves**: `@atlaskit/motion/dist/cjs/utils/curves.js` (dynamically extracted cubic-bezier values)
  - Imports from CJS files to avoid CSS import issues

### From Atlassian Design System:

- **Breakpoints**: Static values (30rem, 48rem, 64rem, 90rem, 110.5rem)

### Key Features:

- **Type Safety**: All tokens include proper TypeScript types (`Tokens`, `SemanticTokens`, `Theme`)
- **Dynamic Extraction**: Easing curves auto-detected by pattern matching `cubic-bezier(...)` strings
- **Graceful Fallback**: Script continues if `@atlaskit/motion` is not installed (skips motion tokens)

## Compatibility & Future-Proofing

### Version Compatibility

This script was **built for and tested with**:

- `@atlaskit/tokens` **v7.0.0**
- `@atlaskit/motion` **v5.3.8**

**Important:** The script uses internal paths:

- `@atlaskit/tokens/dist/esm/artifacts/tokens-raw/atlassian-*.js`
- `@atlaskit/motion/dist/cjs/utils/{durations,curves}.js`

These paths are **not part of the public API** and may change in future versions.

### Breaking Change Risks

The script may break if packages have:

1. **Package structure changes** - Internal paths reorganized
2. **Token format changes** - Different typography, shadow, or motion structures
3. **New major versions** - Breaking changes in v8+ (@atlaskit/tokens) or v6+ (@atlaskit/motion)

### Safety Features

- ✅ **Version checking** - Warns if major version mismatches
- ✅ **Validation** - Validates token structure before processing
- ✅ **Error handling** - Try/catch blocks with helpful error messages
- ✅ **Dynamic extraction** - Auto-detects new easing curves by pattern matching
- ✅ **Graceful fallback** - Continues without motion tokens if package missing

### Recommendations

1. **Pin versions** in `package.json`:

   ```json
   "@atlaskit/tokens": "7.0.0",
   "@atlaskit/motion": "5.3.8"
   ```

2. **Test after updates**:

   ```bash
   pnpm generate:clean
   pnpm build
   # Check for warnings or errors
   ```

3. **Review changes**: Check git diff before committing

4. **Check changelogs**: Review package CHANGELOGs before updating

## Token Coverage

The preset includes comprehensive token coverage from Atlassian Design System:

- ✅ **Colors** - Core + semantic with `_light`/`_dark` variants
- ✅ **Opacity** - `disabled`, `loading`
- ✅ **Spacing** - Full scale including negative values
- ✅ **Typography** - Sizes, fonts, weights, lineHeights
- ✅ **TextStyles** - Semantic presets (heading, body, code, metric)
- ✅ **Radii** - Border radius values
- ✅ **Shadows** - Elevation shadows with theme variants
- ✅ **Durations** - Animation timing (none, small, medium, large)
- ✅ **Easings** - Cubic-bezier curves (7 variants)
- ✅ **Breakpoints** - Responsive layout breakpoints

## Notes

- Generated files in `src/` should be committed to the repository
- All tokens include TypeScript type annotations for type safety
- Typography uses nested structure for better organization
- Motion tokens are optional (skipped if `@atlaskit/motion` not installed)
