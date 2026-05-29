---
title: Domain Type Data Design
status: draft
scope:
  - crates/pandacss_codegen
  - crates/pandacss_config
  - crates/pandacss_core
---

# Domain Type Data Design

## Goal

Generated type artifacts should be emitted by `pandacss_codegen`, but the data used to generate them should come from
the resolved domain objects that already understand Panda semantics.

This note describes Option A: existing domain objects expose methods that return compact type-data views. We are not
adding a new crate for this. The plain data structs live at the existing config/codegen boundary, and methods are added
to the resolved structs/classes that already exist.

## Principle

Codegen should not become a second compiler.

The resolved domain objects already know the facts codegen needs:

- token dictionaries know token categories and token keys,
- utilities know shorthands, CSS fallbacks, token categories, literals, and deprecations,
- conditions know breakpoints and condition keys,
- patterns know merged pattern properties, strict flags, and blocklists,
- recipes know normalized variants and slot recipe parts.

`pandacss_codegen` should consume these facts after resolution. It should not re-derive them from raw user config.

## Shape

Each domain object exposes a type-data method:

```rust
impl TokenDictionary {
    pub fn type_data(&self) -> TokenTypeData {
        todo!()
    }
}

impl Utility {
    pub fn type_data(&self) -> UtilityTypeData {
        todo!()
    }
}

impl Conditions {
    pub fn type_data(&self) -> ConditionTypeData {
        todo!()
    }
}

impl Patterns {
    pub fn type_data(&self) -> PatternTypeData {
        todo!()
    }
}

impl Recipes {
    pub fn type_data(&self) -> RecipeTypeData {
        todo!()
    }
}
```

A higher-level compiler context assembles the complete codegen input:

```rust
impl CompilerContext {
    pub fn codegen_input(&self) -> CodegenInput {
        CodegenInput {
            config: self.config.codegen_config(),
            types: TypeData {
                options: self.config.typegen_options(),
                conditions: self.conditions.type_data(),
                selectors: self.selectors.type_data(),
                tokens: self.tokens.type_data(),
                utilities: self.utility.type_data(),
                patterns: self.patterns.type_data(),
                recipes: self.recipes.type_data(),
            },
            patterns: self.patterns.codegen_meta(),
        }
    }
}
```

## Type Data Structs

The returned structs should be plain data. They should be cheap to clone, serializable when useful, and free of compiler
internals. They currently live in `pandacss_config` because the resolved domain crates already depend on it, and
`pandacss_codegen` already consumes it. This avoids a new crate and avoids making codegen depend on compiler internals.

```rust
pub struct TypeData {
    pub options: TypegenOptions,
    pub conditions: ConditionTypeData,
    pub selectors: SelectorTypeData,
    pub tokens: TokenTypeData,
    pub utilities: UtilityTypeData,
    pub patterns: PatternTypeData,
    pub recipes: RecipeTypeData,
}

pub struct TypegenOptions {
    pub strict_tokens: bool,
    pub strict_property_values: bool,
    pub jsx_style_props: JsxStyleProps,
}
```

### Tokens

```rust
pub struct TokenTypeData {
    pub categories: BTreeMap<String, TokenCategoryTypeData>,
    pub color_palettes: Vec<String>,
}

pub struct TokenCategoryTypeData {
    pub name: String,
    pub type_name: String,
    pub values: Vec<String>,
}
```

### Utilities

```rust
pub struct UtilityTypeData {
    pub properties: BTreeMap<String, UtilityPropertyTypeData>,
    pub shorthands: BTreeMap<String, String>,
    pub deprecated: BTreeSet<String>,
}

pub struct UtilityPropertyTypeData {
    pub name: String,
    pub css_property: Option<String>,
    pub token_category: Option<String>,
    pub literals: Vec<String>,
    pub primitive: Option<PrimitiveType>,
    pub value_alias: Option<String>,
}
```

### Conditions And Selectors

```rust
pub struct ConditionTypeData {
    pub keys: Vec<String>,
    pub breakpoints: Vec<String>,
}

pub struct SelectorTypeData {
    pub selectors: Vec<String>,
    pub allow_arbitrary: bool,
}
```

### Patterns

```rust
pub struct PatternTypeData {
    pub patterns: BTreeMap<String, PatternTypeDefinition>,
}

pub struct PatternTypeDefinition {
    pub name: String,
    pub type_name: String,
    pub strict: bool,
    pub blocklist: Vec<String>,
    pub properties: BTreeMap<String, PatternPropertyTypeData>,
}

pub struct PatternPropertyTypeData {
    pub name: String,
    pub description: Option<String>,
    pub kind: PatternPropertyTypeKind,
}

pub enum PatternPropertyTypeKind {
    Enum { values: Vec<String> },
    Token { category: String, property: Option<String> },
    Property { property: String },
    Primitive { primitive: PrimitiveType },
    Unknown,
}
```

### Recipes

```rust
pub struct RecipeTypeData {
    pub recipes: BTreeMap<String, RecipeTypeDefinition>,
    pub slot_recipes: BTreeMap<String, SlotRecipeTypeDefinition>,
}

pub struct RecipeTypeDefinition {
    pub name: String,
    pub type_name: String,
    pub variants: BTreeMap<String, VariantTypeData>,
}

pub struct SlotRecipeTypeDefinition {
    pub name: String,
    pub type_name: String,
    pub slots: Vec<String>,
    pub variants: BTreeMap<String, VariantTypeData>,
}

pub struct VariantTypeData {
    pub values: Vec<String>,
    pub allows_boolean: bool,
}
```

## Ownership

The method lives on the domain object that owns the knowledge:

| Data                   | Owner method                    |
| ---------------------- | ------------------------------- |
| token category unions  | `TokenDictionary::type_data()`  |
| utility value metadata | `Utility::type_data()`          |
| condition keys         | `Conditions::type_data()`       |
| selector metadata      | `Selectors::type_data()`        |
| pattern properties     | `Patterns::type_data()`         |
| recipe variants        | `Recipes::type_data()`          |

The data structs live in `pandacss_config` for now. Domain crates return those structs from their existing resolved
objects, and `pandacss_codegen` consumes them.

The desired direction is:

```txt
resolved domain objects -> TypeData -> pandacss_codegen
```

Avoid:

```txt
pandacss_codegen -> raw config -> re-resolve tokens/utilities/patterns
```

## Watch Mode

Type-data ownership improves watch invalidation.

When a domain object changes, the compiler can map that change to `ConfigDependency` bits:

- token dictionary change -> `Tokens`
- condition change -> `Conditions`
- utility metadata change -> `Utilities`
- pattern merge/change -> `Patterns`
- recipe merge/change -> `Recipes`

`pandacss_codegen` then uses the artifact graph to regenerate only affected files.

## Pattern Transform Metadata

Pattern transform source is separate from type data.

`Patterns::type_data()` should expose the type shape of pattern props. Runtime transform source should come from a
separate codegen metadata method because it is JavaScript-source metadata prepared while config functions are still live:

```rust
impl Patterns {
    pub fn codegen_meta(&self) -> BTreeMap<String, PatternCodegenMeta> {
        todo!()
    }
}
```

This keeps type generation independent from trusted JavaScript function serialization.

## Non-Goals

- Do not make `pandacss_codegen` depend on full compiler internals.
- Do not re-derive utility or token semantics from raw config inside codegen.
- Do not use legacy `packages/types` as the source of truth.
- Do not add a second type system or an optimization mode.
