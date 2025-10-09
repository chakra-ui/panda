# Panda CSS System Architecture

## Overview

Panda CSS is a universal, build-time, type-safe CSS-in-JS solution that extracts styles at compile time and generates optimized CSS and TypeScript utilities. The system follows a modular architecture built as a pnpm monorepo with distinct packages handling different aspects of the styling pipeline.

## Core Philosophy

- **Build-time extraction**: Styles are analyzed and extracted during the build process, not at runtime
- **Type safety**: Full TypeScript support with auto-generated types based on configuration
- **Zero runtime**: CSS is generated at build time, minimal JavaScript shipped to the browser
- **Framework agnostic**: Works with React, Vue, Svelte, Solid, Preact, Qwik, and more
- **Modern CSS**: Leverages CSS custom properties, cascade layers (`@layer`), and modern CSS features

## Repository Structure

```
panda/
├── packages/           # Core packages (published to npm)
├── sandbox/           # Framework integration examples
├── playground/        # Development testing environment
├── website/           # Documentation site
└── .changeset/        # Changeset-based versioning
```

## Package Architecture

### 1. User-Facing Packages

#### `@pandacss/dev` (packages/cli)
- **Purpose**: Main entry point for end users
- **Exports**: CLI binary (`panda` command), PostCSS plugin, presets
- **Key responsibilities**:
  - Command-line interface (init, codegen, build, analyze, debug, studio)
  - Interactive setup wizard
  - Update notifications
- **Dependencies**: Orchestrates all other packages

#### `@pandacss/postcss` (packages/postcss)
- **Purpose**: PostCSS plugin integration
- **Key responsibilities**:
  - Integrates Panda into PostCSS build pipeline
  - Uses `Builder` class to process CSS files
  - Registers file dependencies for hot module replacement
  - Validates and processes Panda-specific CSS

### 2. Core Processing Packages

#### `@pandacss/core` (packages/core)
- **Purpose**: Heart of the Panda system containing all core logic
- **Key classes**:
  - **Context**: Central orchestration class that manages all engines
  - **Utility**: CSS utility generation and processing
  - **Recipes**: Component recipe/variant system (like Stitches)
  - **Patterns**: Layout pattern generation (stack, flex, grid, etc.)
  - **Conditions**: Responsive/conditional style handling (breakpoints, pseudo-classes)
  - **Stylesheet**: CSS generation and optimization
  - **StyleEncoder/StyleDecoder**: Style serialization and deserialization
  - **TokenDictionary**: Design token management
  - **JsxEngine**: JSX component analysis
  - **ImportMap**: Import tracking for panda functions
- **Key responsibilities**:
  - Style transformation and serialization
  - CSS optimization and minification
  - Layer management (`@layer` directives)
  - Selector parsing and manipulation
  - Color mixing utilities

#### `@pandacss/parser` (packages/parser)
- **Purpose**: Static code analysis and extraction
- **Key responsibilities**:
  - TypeScript/JavaScript AST parsing (uses ts-morph)
  - Vue SFC parsing (uses @vue/compiler-sfc)
  - Svelte component parsing
  - Extracting style declarations from source code
  - Matching function calls and JSX props against Panda APIs
- **Key classes**:
  - **Project**: Manages ts-morph project for file analysis
  - **ParserResult**: Collects and organizes extraction results

#### `@pandacss/extractor` (packages/extractor)
- **Purpose**: Low-level AST extraction and evaluation
- **Key responsibilities**:
  - Extracting values from AST nodes
  - Static evaluation of expressions (uses ts-evaluator)
  - Box/unbox pattern for value wrapping
  - JSX attribute and spread analysis
  - Object literal analysis
- **Core concepts**:
  - **Boxing**: Wrapping AST nodes with metadata
  - **Evaluation**: Computing static values from code

#### `@pandacss/generator` (packages/generator)
- **Purpose**: Code generation for styled-system output
- **Directory structure**:
  ```
  artifacts/
  ├── css/           # CSS generation (tokens, reset, static, global, keyframes)
  ├── js/            # JavaScript utility functions
  ├── jsx/           # JSX factory functions (React, Solid, Vue, Preact, Qwik)
  ├── types/         # TypeScript type definitions
  └── generated/     # Generated helper files
  ```
- **Key responsibilities**:
  - Generating the `styled-system` directory
  - Type definition generation for autocomplete
  - CSS utility classes
  - Pattern and recipe types/functions
  - Framework-specific JSX factories

### 3. Configuration & Setup

#### `@pandacss/config` (packages/config)
- **Purpose**: Configuration loading and merging
- **Key responsibilities**:
  - Finding and loading `panda.config.ts/js`
  - Dynamic config import with bundle-n-require
  - Merging user config with presets
  - Config diffing for incremental updates
  - TypeScript path mapping resolution

#### `@pandacss/preset-*` (packages/preset-*)
- **Available presets**:
  - `preset-base`: Minimal foundation preset
  - `preset-panda`: Default preset with design system tokens
  - `preset-atlaskit`: Atlassian design system integration
  - `preset-open-props`: Open Props design tokens
- **Purpose**: Shareable configuration and design tokens

### 4. Orchestration & Build

#### `@pandacss/node` (packages/node)
- **Purpose**: Node.js runtime and build orchestration
- **Key classes/functions**:
  - **PandaContext**: Extended context with build-time features
  - **Builder**: Incremental build system with file watching
  - **DiffEngine**: Detects configuration changes
  - **OutputEngine**: Manages file writing
- **Key responsibilities**:
  - File watching (chokidar)
  - Incremental builds
  - Config change detection
  - Git ignore management
  - CSS generation and optimization
  - Prettier formatting integration

### 5. Utilities & Infrastructure

#### `@pandacss/token-dictionary` (packages/token-dictionary)
- **Purpose**: Design token processing
- **Key responsibilities**:
  - Token transformation and references
  - Semantic token resolution
  - CSS variable generation
  - Token categorization (colors, spacing, typography, etc.)

#### `@pandacss/types` (packages/types)
- **Purpose**: Shared TypeScript types
- **Build process**: Generates complex conditional types from csstype
- **Exports**: All type definitions used across packages

#### `@pandacss/shared` (packages/shared)
- **Purpose**: Shared utility functions
- **Examples**: Object manipulation, string utilities, memoization, pattern functions

#### `@pandacss/is-valid-prop` (packages/is-valid-prop)
- **Purpose**: Validates CSS property names
- **Used by**: Core and generator for prop filtering

#### `@pandacss/logger` (packages/logger)
- **Purpose**: Centralized logging with log levels
- **Features**: Colored output, timing utilities, debug mode

#### `@pandacss/reporter` (packages/reporter)
- **Purpose**: User-friendly error and warning messages

### 6. Developer Experience

#### `@pandacss/studio` (packages/studio)
- **Purpose**: Visual documentation of design tokens
- **Technology**: Astro-based static site
- **Features**:
  - Token visualization
  - Color palette preview
  - Typography scale
  - Spacing scale
  - Interactive token explorer

#### `@pandacss/astro-plugin-studio` (packages/astro-plugin-studio)
- **Purpose**: Astro integration for Panda Studio

## System Flow

### 1. Initialization Flow (`panda init`)

```
User runs `panda init`
    ↓
CLI (packages/cli)
    ↓
Interactive wizard or flag parsing
    ↓
setupConfig() - Creates panda.config.ts
    ↓
setupPostcss() - Optional postcss.config.js
    ↓
loadConfigAndCreateContext() - Loads and validates config
    ↓
codegen() - Generates styled-system directory
    ↓
setupGitIgnore() - Updates .gitignore
```

### 2. Build/Watch Flow (`panda` or `panda --watch`)

```
User runs `panda`
    ↓
CLI (packages/cli)
    ↓
Builder.setup()
    ├─→ Find config (packages/config)
    ├─→ Load config with presets
    ├─→ Create Context (packages/core)
    │   ├─→ Initialize TokenDictionary
    │   ├─→ Initialize Utility engine
    │   ├─→ Initialize Recipes
    │   ├─→ Initialize Patterns
    │   └─→ Initialize Conditions
    ↓
Builder.emit() - Generate baseline CSS & JS
    ↓
Builder.extract() - Scan source files
    ├─→ Fast-glob finds files
    ├─→ Parser (packages/parser)
    │   ├─→ ts-morph creates AST
    │   ├─→ Extractor (packages/extractor)
    │   │   └─→ Extract style objects
    │   └─→ Returns ParserResult
    ↓
Generator (packages/generator)
    ├─→ Generate artifacts
    │   ├─→ CSS files (tokens, utilities, reset)
    │   ├─→ JS files (css, cva, sva, patterns)
    │   ├─→ TypeScript types
    │   └─→ Framework JSX factories
    ↓
Builder.write() - Write files to styled-system
    ↓
Optimize CSS (postcss plugins)
    └─→ Format with prettier
```

### 3. PostCSS Integration Flow

```
Build tool runs PostCSS
    ↓
@pandacss/postcss plugin
    ↓
Builder.setup() - Same as above
    ↓
Builder.isValidRoot() - Check for Panda CSS
    ↓
Builder.emit() - Generate artifacts
    ↓
Builder.extract() - Extract from changed files
    ↓
Builder.write(root) - Inject CSS into PostCSS AST
    ↓
Register dependencies for HMR
```

### 4. Parser Extraction Flow

```
Source file (e.g., App.tsx)
    ↓
ts-morph creates SourceFile
    ↓
getImportDeclarations() - Find panda imports
    ├─→ css(), cva(), styled(), etc.
    ↓
extract() from @pandacss/extractor
    ├─→ Scan for function calls
    │   └─→ Match against ImportMap
    ├─→ Scan for JSX elements
    │   ├─→ Match styled.div, panda.div
    │   └─→ Match JSX props (if jsxStyleProps enabled)
    ↓
For each match:
    ├─→ box() - Wrap AST node
    ├─→ Evaluate statically
    └─→ unbox() - Extract value
    ↓
ParserResult
    ├─→ StyleEncoder - Encode to atomic classes
    ├─→ Store in StyleDecoder
    └─→ Return extracted styles
```

### 5. Code Generation Flow

```
Generator.getArtifacts()
    ↓
generateArtifacts() dispatches to:
    ├─→ CSS Artifacts
    │   ├─→ generateResetCss() - Preflight/reset
    │   ├─→ generateTokenCss() - CSS variables
    │   ├─→ generateStaticCss() - Static utilities
    │   ├─→ generateGlobalCss() - Global styles
    │   └─→ generateKeyframeCss() - @keyframes
    ├─→ JS Artifacts
    │   ├─→ css.mjs - Main styling API
    │   ├─→ cva.mjs - Component variants
    │   ├─→ sva.mjs - Slot variants
    │   ├─→ patterns/*.mjs - Layout patterns
    │   └─→ recipes/*.mjs - Recipe functions
    ├─→ JSX Artifacts (framework-specific)
    │   ├─→ styled.mjs - styled('div') API
    │   └─→ factory.mjs - JSX factory
    └─→ Type Artifacts
        ├─→ style-props.d.ts
        ├─→ pattern.d.ts
        └─→ recipes/types.d.ts
```

## Key Design Patterns

### 1. Context Pattern
- **Context** class is the central orchestrator
- All engines (Utility, Recipes, Patterns, etc.) are initialized in Context
- Context is passed down to all subsystems
- Provides unified access to configuration, tokens, and utilities

### 2. Engine Pattern
- Specialized engines handle different concerns:
  - **Utility**: CSS utility generation
  - **Recipes**: Component recipes
  - **Patterns**: Layout patterns
  - **JsxEngine**: JSX analysis
  - **PathEngine**: File path management
  - **FileEngine**: File template management

### 3. Builder Pattern
- **Builder** class manages incremental builds
- Tracks file changes and config diffs
- Coordinates setup → extract → generate → write cycle
- Handles file watching and HMR

### 4. Encoder/Decoder Pattern
- **StyleEncoder**: Converts style objects to atomic class names
- **StyleDecoder**: Collects all encoded styles for CSS generation
- Enables atomic CSS with automatic deduplication

### 5. Box/Unbox Pattern (Extractor)
- **Boxing**: Wraps AST nodes with metadata and utilities
- **Evaluation**: Computes static values
- **Unboxing**: Extracts final values
- Handles complex expressions, spreads, and conditionals

## Build Optimization

### Incremental Builds
- **File tracking**: Tracks modified times of source and config files
- **Dependency graph**: Knows which files affect what artifacts
- **Smart invalidation**: Only regenerates changed artifacts
- **Config diffing**: Detects specific config changes to minimize regeneration

### CSS Optimization
- **Atomic CSS**: Each unique style gets one class
- **Layer ordering**: Uses `@layer` for predictable cascade
- **PostCSS pipeline**:
  - `postcss-nested` - Unwrap nested rules
  - `postcss-merge-rules` - Merge duplicate selectors
  - `postcss-discard-duplicates` - Remove duplicate rules
  - `postcss-minify-selectors` - Optimize selectors
  - `lightningcss` - Fast minification and vendor prefixing

### Code Splitting
- Separate artifacts for different concerns
- Lazy-loadable pattern and recipe functions
- Tree-shakeable exports

## Type System

### Generated Types
```typescript
// Utility props
css({ color: 'red.500' })  // Autocomplete for 'red.500'

// Pattern props
stack({ gap: '4' })  // Autocomplete for spacing tokens

// Recipe variants
button({ size: 'lg', variant: 'solid' })  // Autocomplete variants
```

### Type Generation Flow
```
User config (theme.tokens)
    ↓
TokenDictionary processes tokens
    ↓
Generator creates type definitions
    ├─→ Token paths as string literals
    ├─→ Recipe variant types
    ├─→ Pattern prop types
    └─→ Utility prop types
    ↓
TypeScript provides autocomplete
```

## Framework Integration

### JSX Factory Pattern
Each framework gets a custom JSX factory:

```typescript
// React
import { styled } from './styled-system/jsx'
<styled.div color="red.500" />

// Solid
import { styled } from './styled-system/jsx/solid'
<styled.div color="red.500" />

// Vue
import { styled } from './styled-system/jsx/vue'
<styled.div :color="'red.500'" />
```

### Framework-Specific Parsing
- **React/Preact**: Standard JSX
- **Vue**: SFC parsing with `@vue/compiler-sfc`
- **Svelte**: Component parsing with custom transformer
- **Solid**: JSX with Solid-specific patterns

## Plugin System

### Hooks API
Panda provides a hookable API for extensibility:

```typescript
hooks: {
  'tokens:created': (args) => { /* Modify tokens */ },
  'parser:before': (args) => { /* Pre-parsing */ },
  'parser:after': (args) => { /* Post-parsing */ },
  'cssgen:done': (args) => { /* Post-CSS generation */ },
  'codegen:prepare': (args) => { /* Pre-codegen */ },
}
```

### Plugin Architecture
Plugins can:
- Modify token dictionary
- Add custom utilities
- Transform generated code
- Integrate with build tools

## Testing Strategy

### Test Infrastructure
- **Vitest**: Test runner with globals
- **Happy-dom**: Browser environment simulation
- **Unit tests**: Per-package in `__tests__` directories
- **Integration tests**: In sandbox directories
- **Fixtures**: Sample projects in `packages/fixture`

### Test Coverage Areas
1. **Config loading**: Various config formats and merging
2. **Token processing**: Token transformation and references
3. **Parser**: AST extraction accuracy
4. **Generator**: Artifact generation correctness
5. **CSS output**: Style transformation and optimization
6. **Type generation**: TypeScript type correctness

## Development Workflow

### Local Development
```bash
pnpm install              # Install dependencies
pnpm build-fast          # Quick build without types
pnpm dev                 # Watch mode for packages
pnpm playground          # Run playground examples
```

### Package Scripts
- `build`: Full build with types
- `build-fast`: Quick build, no type generation
- `dev`: Watch mode
- `test`: Run tests
- `typecheck`: TypeScript validation

### Release Process
1. Changes tracked with Changesets (`.changeset/`)
2. Run `pnpm changeset` to document changes
3. Changesets generates changelog and version bumps
4. `pnpm release` publishes to npm

## Performance Considerations

### Build Performance
- **Lazy imports**: Delays loading until needed
- **Parallel processing**: Uses `pnpm --parallel` for multi-package builds
- **Caching**: ts-morph caches parsed ASTs
- **Fast glob**: Efficient file scanning

### Runtime Performance
- **Zero runtime**: All styles generated at build time
- **Minimal JS**: Only necessary utility functions shipped
- **CSS variables**: Dynamic theming without JS
- **Tree-shaking**: Unused utilities eliminated

### Memory Management
- **Memoization**: Expensive computations cached
- **Streaming**: Large file processing in chunks
- **Context cleanup**: Proper disposal of resources

## Error Handling

### User-Facing Errors
- **Reporter package**: Formatted, helpful error messages
- **Logger levels**: debug, info, warn, error, silent
- **Stack traces**: Preserved for debugging
- **Suggestions**: Actionable error messages

### Error Categories
1. **Config errors**: Invalid configuration
2. **Parse errors**: Malformed source code
3. **Generation errors**: Failed artifact creation
4. **File system errors**: Permission/access issues

## Future Architecture Considerations

### Extensibility Points
- Custom pattern definitions
- Plugin marketplace
- Framework adapters
- Build tool integrations

### Scalability
- Multi-threaded parsing for large codebases
- Distributed caching for monorepos
- Incremental type checking
- Remote artifact caching

## Conclusion

Panda CSS architecture emphasizes:
- **Modularity**: Clear separation of concerns across packages
- **Performance**: Build-time optimization and zero runtime overhead
- **Type safety**: Full TypeScript integration with generated types
- **Flexibility**: Framework-agnostic with multiple integration points
- **Developer experience**: Autocomplete, helpful errors, and visual tools

The system is designed to scale from small projects to large monorepos while maintaining fast build times and excellent developer experience.
