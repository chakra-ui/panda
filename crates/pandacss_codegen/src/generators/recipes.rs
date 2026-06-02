//! The `recipes/*` artifacts: one runtime + type per configured recipe / slot
//! recipe, wiring each to the `cva`/`sva` factories with its variant config.

use std::collections::BTreeMap;

use pandacss_config::{RecipeConfig, VariantTypeData};
use pandacss_shared::{file_stem, js_ident, pascal_case};
use serde_json::{Map, Value};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, ConfigDependency, ConstDecl, DependencySet,
    ExportDecl, Expr, ImportDecl, Item, ItemNode, Module, TsType,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::Recipes,
        dependencies,
        files: files(ctx, options),
    }
}

#[must_use]
pub fn files(ctx: CodegenContext<'_>, options: GenerateOptions) -> Vec<ArtifactFile> {
    let recipe_dependencies =
        DependencySet::from_slice(&[ConfigDependency::CodegenFormat, ConfigDependency::Recipes]);
    let runtime_dependencies = DependencySet::from_slice(&[
        ConfigDependency::CodegenFormat,
        ConfigDependency::Conditions,
        ConfigDependency::Hash,
        ConfigDependency::Prefix,
        ConfigDependency::Separator,
    ]);
    let mut files = Vec::new();
    let mut stems =
        Vec::with_capacity(ctx.config.theme.recipes.len() + ctx.config.theme.slot_recipes.len());

    files.extend(emit_module_files(
        "recipes/runtime",
        &runtime_module(ctx),
        options.format,
        false,
        options.specifiers,
        runtime_dependencies,
    ));

    for (name, recipe) in &ctx.config.theme.recipes {
        let stem = file_stem(name);
        stems.push(stem.clone());
        let type_name = ctx
            .types
            .recipes
            .recipes
            .get(name)
            .map_or_else(|| pascal_case(name), |recipe| recipe.type_name.clone());

        files.extend(emit_module_files(
            &format!("recipes/{stem}"),
            &recipe_module(ctx, name, recipe, &type_name, false),
            options.format,
            false,
            options.specifiers,
            recipe_dependencies,
        ));
    }

    for (name, recipe) in &ctx.config.theme.slot_recipes {
        let stem = file_stem(name);
        stems.push(stem.clone());
        let type_name = ctx
            .types
            .recipes
            .slot_recipes
            .get(name)
            .map_or_else(|| pascal_case(name), |recipe| recipe.type_name.clone());

        files.extend(emit_module_files(
            &format!("recipes/{stem}"),
            &recipe_module(ctx, name, recipe, &type_name, true),
            options.format,
            false,
            options.specifiers,
            recipe_dependencies,
        ));
    }

    files.extend(emit_module_files(
        "recipes/index",
        &index_module(&stems),
        options.format,
        false,
        options.specifiers,
        recipe_dependencies,
    ));

    files
}

fn recipe_module(
    ctx: CodegenContext<'_>,
    name: &str,
    recipe: &RecipeConfig,
    type_name: &str,
    slot: bool,
) -> Module {
    let export_name = js_ident(name);
    let config_name = format!("{export_name}Config");
    let recipe_type = format!("{type_name}Recipe");
    let (factory, runtime_fn) = if slot {
        ("createSlotRecipe", "SlotRecipeRuntimeFn")
    } else {
        ("createRecipe", "RecipeRuntimeFn")
    };

    let empty = BTreeMap::new();
    let variants = recipe_variant_data(ctx, name, slot).unwrap_or(&empty);
    let slots = slot.then_some(recipe.slots.as_slice());
    let type_code =
        crate::generators::types::concrete_recipe_types(type_name, slots, variants).join("\n\n");

    Module::new()
        .with_import(ImportDecl::value([factory], "./runtime"))
        .with_import(ImportDecl::ty(["ConditionalValue"], "../types/system"))
        .with_import(ImportDecl::ty(
            [runtime_fn, "RecipeVariantMap"],
            "../types/recipe",
        ))
        .with_item(Item::ty(ItemNode::RawStmt(type_code)))
        .with_item(Item::const_decl(ConstDecl {
            exported: false,
            declare: false,
            name: config_name.clone(),
            type_annotation: None,
            init: Some(Expr::Raw(recipe_config_code(ctx, name, recipe, slot))),
            js_doc: None,
        }))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: export_name,
            type_annotation: Some(TsType::Ref(recipe_type)),
            init: Some(Expr::Raw(format!("{factory}({config_name})"))),
            js_doc: None,
        })))
}

fn recipe_variant_data<'a>(
    ctx: CodegenContext<'a>,
    name: &str,
    slot: bool,
) -> Option<&'a BTreeMap<String, VariantTypeData>> {
    if slot {
        ctx.types
            .recipes
            .slot_recipes
            .get(name)
            .map(|recipe| &recipe.variants)
    } else {
        ctx.types
            .recipes
            .recipes
            .get(name)
            .map(|recipe| &recipe.variants)
    }
}

fn runtime_module(ctx: CodegenContext<'_>) -> Module {
    Module::new()
        .with_import(ImportDecl::value(
            [
                "createCss",
                "getCompoundVariantCss",
                "getSlotCompoundVariant",
                "memo",
                "splitProps",
                "toHash",
                "uniq",
                "withDefaults",
                "withoutSpace",
            ],
            "../helpers",
        ))
        .with_import(ImportDecl::value(
            ["finalizeConditions", "sortConditions"],
            "../css/conditions",
        ))
        .with_item(Item::runtime(ItemNode::RawStmt(recipe_runtime_code(ctx))))
}

fn index_module(stems: &[String]) -> Module {
    stems.iter().fold(Module::new(), |module, stem| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star {
            source: format!("./{stem}"),
        })))
    })
}

fn recipe_config_code(
    ctx: CodegenContext<'_>,
    name: &str,
    recipe: &RecipeConfig,
    slot: bool,
) -> String {
    let variant_map = if slot {
        ctx.types
            .recipes
            .slot_recipes
            .get(name)
            .map(|recipe| &recipe.variants)
    } else {
        ctx.types
            .recipes
            .recipes
            .get(name)
            .map(|recipe| &recipe.variants)
    };

    let mut config = Map::new();
    config.insert("name".into(), Value::String(name.into()));

    if let Some(class_name) = recipe.class_name.as_deref()
        && class_name != name
    {
        config.insert("className".into(), Value::String(class_name.into()));
    }

    if slot && !recipe.slots.is_empty() {
        config.insert(
            "slots".into(),
            Value::Array(recipe.slots.iter().cloned().map(Value::String).collect()),
        );
    }

    if !recipe.default_variants.is_empty() {
        config.insert(
            "defaultVariants".into(),
            serde_json::to_value(&recipe.default_variants)
                .expect("default variants should serialize"),
        );
    }

    if !recipe.compound_variants.is_empty() {
        config.insert(
            "compoundVariants".into(),
            serde_json::to_value(&recipe.compound_variants)
                .expect("compound variants should serialize"),
        );
    }

    let variant_map = variant_map.map_or_else(BTreeMap::new, variant_map_json);
    if !variant_map.is_empty() {
        config.insert(
            "variantMap".into(),
            serde_json::to_value(variant_map).expect("variant map should serialize"),
        );
    }

    serde_json::to_string(&config).expect("recipe config should serialize")
}

fn recipe_runtime_code(ctx: CodegenContext<'_>) -> String {
    let breakpoints = serde_json::to_string(&ctx.config.theme.breakpoint_names())
        .expect("breakpoints should serialize");
    let prefix =
        serde_json::to_string(&ctx.config.prefix.class_name()).expect("prefix should serialize");
    let separator = ctx.config.separator.as_deref().unwrap_or("_");
    let hash = if ctx.config.hash.class_name() {
        "true"
    } else {
        "false"
    };

    RECIPE_RUNTIME_TEMPLATE
        .replace("__BREAKPOINTS__", &breakpoints)
        .replace("__PREFIX__", &prefix)
        .replace("__SEPARATOR__", separator)
        .replace("__HASH__", hash)
}

fn variant_map_json(variants: &BTreeMap<String, VariantTypeData>) -> BTreeMap<String, Vec<String>> {
    variants
        .iter()
        .map(|(name, data)| (name.clone(), data.values.clone()))
        .collect()
}

const RECIPE_RUNTIME_TEMPLATE: &str = r#"const conditions = {
  shift: sortConditions,
  finalize: finalizeConditions,
  breakpoints: { keys: __BREAKPOINTS__ },
}

function normalize(config: Record<string, any>) {
  const variantMap = config.variantMap ?? {}
  return {
    name: config.name,
    className: config.className ?? config.name,
    slots: config.slots ?? [],
    variantMap,
    variantKeys: Object.keys(variantMap),
    defaults: config.defaultVariants ?? {},
    compounds: config.compoundVariants ?? [],
  }
}

export function createRecipe(config: Record<string, any>) {
  const { name, className, variantMap, variantKeys, defaults, compounds } = normalize(config)

  const recipeCss = createCss({
    hash: __HASH__,
    conditions,
    utility: {
      prefix: __PREFIX__,
      toHash,
      transform(prop: string, value: string) {
        return { className: value === "__ignore__" ? className : `${className}--${prop}__SEPARATOR__${withoutSpace(value)}` }
      },
    },
  })

  function resolve(props: Record<string, any> = {}) {
    const result = withDefaults(defaults, props)
    result[className] = "__ignore__"
    return result
  }

  const recipe = attach(memo(function recipeFn(props: Record<string, any> = {}) {
    return recipeCss(resolve(props))
  }), name, variantKeys, variantMap, resolve)
  recipe.__recipe__ = true
  recipe.__getCompoundVariantCss__ = function compoundVariantCss(props: Record<string, any>) {
    return getCompoundVariantCss(compounds, resolve(props))
  }
  recipe.merge = function merge(other: any) {
    return mergeRecipes(recipe, other)
  }
  return recipe
}

export function createSlotRecipe(config: Record<string, any>) {
  const { name, className, slots, variantMap, variantKeys, defaults, compounds } = normalize(config)

  const slotFns = slots.map(function toSlotRecipe(slot: string) {
    return [slot, createRecipe({
      name,
      className: `${className}__${slot}`,
      variantMap,
      defaultVariants: defaults,
      compoundVariants: getSlotCompoundVariant(compounds, slot),
    })]
  })

  const recipe = memo(function slotRecipeFn(props: Record<string, any> = {}) {
    const result: Record<string, any> = {}
    for (const [slot, slotFn] of slotFns) result[slot] = slotFn(props)
    return result
  })
  attach(recipe, name, variantKeys, variantMap, function getVariantProps(props: Record<string, any> = {}) {
    return withDefaults(defaults, props)
  })
  recipe.__recipe__ = false
  recipe.classNameMap = {}
  return recipe
}

function mergeRecipes(recipeA: any, recipeB: any) {
  if (recipeA && !recipeB) return recipeA
  if (!recipeA && recipeB) return recipeB
  function merged(...args: any[]) {
    const classA = recipeA(...args)
    const classB = recipeB(...args)
    return classA && classB ? `${classA} ${classB}` : classA || classB
  }
  const variantKeys = uniq(recipeA.variantKeys, recipeB.variantKeys)
  const variantMap: Record<string, any> = {}
  for (const key of variantKeys) variantMap[key] = uniq(recipeA.variantMap[key], recipeB.variantMap[key])
  attach(merged, `${recipeA.__name__} ${recipeB.__name__}`, variantKeys, variantMap, function getVariantProps(props: any) {
    return props
  })
  merged.__recipe__ = true
  return merged
}

function attach(recipe: any, name: string, variantKeys: string[], variantMap: Record<string, any>, getVariantProps: any) {
  recipe.__name__ = name
  recipe.raw = function raw(props: any) {
    return props
  }
  recipe.variantKeys = variantKeys
  recipe.variantMap = variantMap
  recipe.splitVariantProps = function splitVariantProps(props: any) {
    return splitProps(props, variantKeys)
  }
  recipe.getVariantProps = getVariantProps
  return recipe
}"#;
