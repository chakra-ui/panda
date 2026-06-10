//! React JSX artifacts: styled factory, helpers, pattern components, and the
//! recipe context helpers used by React projects.

use std::collections::BTreeSet;

use pandacss_config::{
    DEFAULT_PATTERN_JSX_ELEMENT, JsxFramework, JsxStylePropsConfig, PatternConfig,
    PatternTypeDefinition,
};
use pandacss_shared::{file_stem, js_ident, pascal_case};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, DependencySet, ExportDecl, ImportDecl,
    ImportKind, ImportSpecifier, Item, ItemNode, Module,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate_is_valid_prop(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::JsxIsValidProp,
        dependencies,
        files: react_files(
            ctx,
            options,
            dependencies,
            "jsx/is-valid-prop",
            is_valid_prop_module,
        ),
    }
}

#[must_use]
pub fn generate_factory(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::JsxFactory,
        dependencies,
        files: react_files(ctx, options, dependencies, "jsx/factory", factory_module),
    }
}

#[must_use]
pub fn generate_patterns(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    let files = if is_react(ctx) {
        pattern_files(ctx, options, dependencies)
    } else {
        Vec::new()
    };

    Artifact {
        id: ArtifactId::JsxPatterns,
        dependencies,
        files,
    }
}

#[must_use]
pub fn generate_create_recipe_context(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::JsxCreateRecipeContext,
        dependencies,
        files: react_files(
            ctx,
            options,
            dependencies,
            "jsx/create-recipe-context",
            create_recipe_context_module,
        ),
    }
}

#[must_use]
pub fn generate_create_slot_recipe_context(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::JsxCreateSlotRecipeContext,
        dependencies,
        files: react_files(
            ctx,
            options,
            dependencies,
            "jsx/create-slot-recipe-context",
            create_slot_recipe_context_module,
        ),
    }
}

#[must_use]
pub fn generate_index(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::JsxIndex,
        dependencies,
        files: react_files(ctx, options, dependencies, "jsx/index", index_module),
    }
}

fn react_files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
    stem: &str,
    module: fn(CodegenContext<'_>) -> Module,
) -> Vec<ArtifactFile> {
    if !is_react(ctx) {
        return Vec::new();
    }

    client_files(emit_module_files(
        stem,
        &module(ctx),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    ))
}

fn pattern_files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    let mut files = Vec::new();
    for (name, pattern) in &ctx.config.patterns {
        let stem = file_stem(name);
        files.extend(client_files(emit_module_files(
            &format!("jsx/{stem}"),
            &pattern_module(ctx, name, pattern),
            options.format,
            false,
            options.import_extensions,
            dependencies,
        )));
    }
    files
}

fn client_files(files: Vec<ArtifactFile>) -> Vec<ArtifactFile> {
    files
        .into_iter()
        .map(|mut file| {
            if is_runtime_file(&file.path) && !file.code.starts_with("\"use client\"") {
                file.code = format!("\"use client\";\n\n{}", file.code);
            }
            file
        })
        .collect()
}

fn is_runtime_file(path: &str) -> bool {
    let path = std::path::Path::new(path);
    let Some(extension) = path.extension().and_then(|extension| extension.to_str()) else {
        return false;
    };
    let extension = extension.to_ascii_lowercase();
    let Some(stem) = path.file_stem().and_then(|stem| stem.to_str()) else {
        return false;
    };

    let is_declaration = matches!(extension.as_str(), "ts" | "mts" | "cts")
        && stem
            .rsplit('.')
            .next()
            .is_some_and(|part| part.eq_ignore_ascii_case("d"));
    if is_declaration {
        return false;
    }

    matches!(extension.as_str(), "js" | "mjs" | "cjs" | "ts" | "tsx")
}

fn is_react(ctx: CodegenContext<'_>) -> bool {
    matches!(ctx.config.jsx_framework.as_ref(), Some(JsxFramework::React))
}

fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}

fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn factory_upper(ctx: CodegenContext<'_>) -> String {
    pascal_case(&factory_name(ctx))
}

fn component_name(ctx: CodegenContext<'_>) -> String {
    format!("{}Component", factory_upper(ctx))
}

fn html_props_name(ctx: CodegenContext<'_>) -> String {
    format!("HTML{}Props", factory_upper(ctx))
}

fn value_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Value,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
}

fn namespace_import(local: &str, source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Value,
        specifiers: vec![ImportSpecifier::Namespace(local.into())],
        source: source.into(),
    }
}

fn type_import(names: &[&str], source: &str) -> ImportDecl {
    ImportDecl {
        kind: ImportKind::Type,
        specifiers: names
            .iter()
            .map(|name| ImportSpecifier::Named((*name).into()))
            .collect(),
        source: source.into(),
    }
}

fn raw_runtime(code: impl Into<String>) -> Item {
    Item::runtime(ItemNode::RawStmt(code.into()))
}

fn raw_type(code: impl Into<String>) -> Item {
    Item::ty(ItemNode::RawStmt(code.into()))
}

fn is_valid_prop_module(ctx: CodegenContext<'_>) -> Module {
    Module::new()
        .with_import(ImportDecl::value(["splitProps"], "../helpers"))
        .with_import(type_import(
            &["DistributiveOmit", "JsxStyleProps"],
            "../types/system",
        ))
        .with_item(raw_runtime(is_valid_prop_runtime(ctx)))
        .with_item(raw_type(
            r"declare const isCssProperty: (value: string) => boolean

type CssPropKey = keyof JsxStyleProps
type OmittedCssProps<T> = DistributiveOmit<T, CssPropKey>

declare const splitCssProps: <T>(props: T) => [JsxStyleProps, OmittedCssProps<T>]

export { isCssProperty, splitCssProps }",
        ))
}

fn is_valid_prop_runtime(ctx: CodegenContext<'_>) -> String {
    let props = css_prop_names(ctx);
    let props = serde_json::to_string(&props).expect("css prop names should serialize");

    format!(
        r"const cssPropertySet = new Set({props})

export function isCssProperty(value) {{
  return cssPropertySet.has(value)
}}

export function splitCssProps(props) {{
  return splitProps(props, isCssProperty)
}}"
    )
}

fn css_prop_names(ctx: CodegenContext<'_>) -> Vec<String> {
    let mut names = BTreeSet::from(["css".to_owned()]);

    if matches!(style_props(ctx), JsxStylePropsConfig::All) {
        names.extend(
            pandacss_shared::css_properties::CSS_PROPERTY_NAMES
                .iter()
                .map(|name| (*name).to_owned()),
        );
        names.extend(
            ctx.types
                .utilities
                .properties
                .values()
                .map(|property| property.name.clone()),
        );
    }

    names.into_iter().collect()
}

fn factory_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let component = component_name(ctx);
    let upper = factory_upper(ctx);

    Module::new()
        .with_import(value_import(&["createElement", "forwardRef"], "react"))
        .with_import(ImportDecl::value(["css", "cx", "cva"], "../css/index"))
        .with_import(ImportDecl::value(["splitProps"], "../helpers"))
        .with_import(ImportDecl::value(["isCssProperty"], "./is-valid-prop"))
        .with_import(type_import(&[upper.as_str()], "../types/jsx"))
        .with_item(raw_runtime(
            FACTORY_RUNTIME
                .replace("__FACTORY__", &factory)
                .replace("__COMPONENT__", &component),
        ))
        .with_item(raw_type(format!("export declare const {factory}: {upper}")))
}

const FACTORY_RUNTIME: &str = r"const defaultShouldForwardProp = (prop, variantKeys) => variantKeys.indexOf(prop) === -1 && !isCssProperty(prop)

const composeShouldForwardProps = (tag, shouldForwardProp) => {
  if (!tag.__shouldForwardProps__ || !shouldForwardProp) return shouldForwardProp
  return (prop) => tag.__shouldForwardProps__(prop) && shouldForwardProp(prop)
}

const composeCvaFn = (cvaA, cvaB) => {
  if (cvaA && !cvaB) return cvaA
  if (!cvaA && cvaB) return cvaB
  if ((cvaA.__cva__ && cvaB.__cva__) || (cvaA.__recipe__ && cvaB.__recipe__)) return cvaA.merge(cvaB)
  const error = new TypeError('Cannot merge cva with recipe. Please use either cva or recipe.')
  TypeError.captureStackTrace?.(error)
  throw error
}

export const getDisplayName = (Component) => {
  if (typeof Component === 'string') return Component
  return Component?.displayName || Component?.name || 'Component'
}

const htmlPropsMap = {
  htmlWidth: 'width',
  htmlHeight: 'height',
  htmlTranslate: 'translate',
  htmlContent: 'content',
}
const htmlPropsKeys = Object.keys(htmlPropsMap)

function normalizeHTMLProps(props) {
  const out = {}
  for (const key in props) out[htmlPropsMap[key] || key] = props[key]
  return out
}

function styledFn(BaseComponent, recipeOrConfig = {}, options = {}) {
  const recipeFn = recipeOrConfig.__cva__ || recipeOrConfig.__recipe__ ? recipeOrConfig : cva(recipeOrConfig)
  const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
  const forwardProps = options.forwardProps
  const shouldForwardProp = forwardProps?.length
    ? (prop) => forwardProps.indexOf(prop) !== -1 || forwardFn(prop, recipeFn.variantKeys)
    : (prop) => forwardFn(prop, recipeFn.variantKeys)

  const dataProps = options.dataAttr && recipeOrConfig.__name__ ? Object.assign({}, { 'data-recipe': recipeOrConfig.__name__ }) : {}
  const defaultProps = Object.assign(dataProps, options.defaultProps)
  const hasDefaultProps = Object.keys(defaultProps).length > 0

  const composedRecipeFn = composeCvaFn(BaseComponent.__cva__, recipeFn)
  const shouldForward = composeShouldForwardProps(BaseComponent, shouldForwardProp)
  const DefaultElement = BaseComponent.__base__ || BaseComponent

  const __COMPONENT__ = /* @__PURE__ */ forwardRef(function __COMPONENT__(props, ref) {
    const { as: Element = DefaultElement, unstyled, children, ...restProps } = props
    const combinedProps = hasDefaultProps ? Object.assign({}, defaultProps, restProps) : restProps
    const [htmlProps, forwardedProps, variantProps, styleProps, elementProps] = splitProps(
      combinedProps,
      htmlPropsKeys,
      shouldForward,
      composedRecipeFn.variantKeys,
      isCssProperty,
    )

    const { css: cssStyles, ...propStyles } = styleProps
    let className
    if (unstyled) {
      className = cx(css(propStyles, cssStyles), combinedProps.className)
    } else if (recipeOrConfig.__recipe__) {
      className = cx(
        composedRecipeFn(variantProps, false),
        composedRecipeFn.__getCompoundVariantCss__?.(variantProps),
        css(propStyles, cssStyles),
        combinedProps.className,
      )
    } else {
      className = cx(css(composedRecipeFn.raw(variantProps), propStyles, cssStyles), combinedProps.className)
    }

    return createElement(Element, {
      ref,
      ...forwardedProps,
      ...elementProps,
      ...normalizeHTMLProps(htmlProps),
      className,
    }, children ?? combinedProps.children)
  })

  const name = getDisplayName(DefaultElement)
  __COMPONENT__.displayName = `__FACTORY__.${name}`
  __COMPONENT__.__cva__ = composedRecipeFn
  __COMPONENT__.__base__ = DefaultElement
  __COMPONENT__.__shouldForwardProps__ = shouldForwardProp

  return __COMPONENT__
}

function createJsxFactory() {
  const cache = new Map()
  return new Proxy(styledFn, {
    apply(_, __, args) {
      return styledFn(...args)
    },
    get(_, el) {
      if (!cache.has(el)) cache.set(el, styledFn(el))
      return cache.get(el)
    },
  })
}

export const __FACTORY__ = /* @__PURE__ */ createJsxFactory()";

fn pattern_module(ctx: CodegenContext<'_>, name: &str, pattern: &PatternConfig) -> Module {
    let factory = factory_name(ctx);
    let stem = file_stem(name);
    // The JSX component spreads the pattern's *style object* into the element,
    // so it uses the raw getter (`stackRaw`), not the public `stack()` (which
    // returns a className string).
    let raw_name = format!("{}Raw", js_ident(name));
    let upper_name = pascal_case(name);
    let jsx_name = pattern
        .jsx_name
        .clone()
        .unwrap_or_else(|| pascal_case(name));
    let jsx_element = pattern_jsx_element(pattern);
    let props_name = format!("{upper_name}Properties");
    let component_props = format!("{upper_name}Props");
    let html_props = html_props_name(ctx);
    let pattern_keys = pattern.properties.keys().cloned().collect::<Vec<_>>();
    let pattern_keys_json = serde_json::to_string(&pattern_keys).expect("pattern keys serialize");
    let definition = ctx.types.patterns.patterns.get(name);
    let blocklist = pattern_blocklist(pattern, definition);
    let omit_keys = pattern_omit_keys(&props_name, &blocklist);

    let mut module = Module::new()
        .with_import(value_import(&["createElement", "forwardRef"], "react"))
        .with_import(ImportDecl::value(["splitProps"], "../helpers"))
        .with_import(value_import(
            &[raw_name.as_str()],
            &format!("../patterns/{stem}"),
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(type_import(&["FunctionComponent"], "react"))
        .with_import(type_import(
            &[props_name.as_str()],
            &format!("../patterns/{stem}"),
        ))
        .with_import(type_import(&[html_props.as_str()], "../types/jsx"))
        .with_import(type_import(&["DistributiveOmit"], "../types/system"));

    if matches!(style_props(ctx), JsxStylePropsConfig::Minimal) {
        module = module.with_import(ImportDecl::value(["mergeCss"], "../css/css"));
    }

    module
        .with_item(raw_runtime(pattern_runtime_body(
            &jsx_name,
            &factory,
            &jsx_element,
            &raw_name,
            &pattern_keys_json,
            style_props(ctx),
        )))
        .with_item(raw_type(format!(
            "export interface {component_props} extends {props_name}, DistributiveOmit<{html_props}<{jsx_element:?}>, {omit_keys}> {{}}\n\nexport declare const {jsx_name}: FunctionComponent<{component_props}>",
        )))
}

fn pattern_runtime_body(
    jsx_name: &str,
    factory: &str,
    jsx_element: &str,
    style_getter: &str,
    pattern_keys_json: &str,
    mode: JsxStylePropsConfig,
) -> String {
    let body = match mode {
        JsxStylePropsConfig::All => {
            "const mergedProps = { ref, ...styleProps, ...restProps }".to_owned()
        }
        JsxStylePropsConfig::Minimal => {
            "const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }"
                .to_owned()
        }
        JsxStylePropsConfig::None => {
            "const mergedProps = { ref, ...restProps, css: styleProps }".to_owned()
        }
    };

    format!(
        r"export const {jsx_name} = /* @__PURE__ */ forwardRef(function {jsx_name}(props, ref) {{
  const [patternProps, restProps] = splitProps(props, {pattern_keys_json})
  const styleProps = {style_getter}(patternProps)
  {body}
  return createElement({factory}[{jsx_element:?}], mergedProps)
}})"
    )
}

fn pattern_jsx_element(pattern: &PatternConfig) -> String {
    pattern
        .extra
        .get("jsxElement")
        .and_then(serde_json::Value::as_str)
        .unwrap_or(DEFAULT_PATTERN_JSX_ELEMENT)
        .to_owned()
}

fn pattern_blocklist(
    pattern: &PatternConfig,
    definition: Option<&PatternTypeDefinition>,
) -> Vec<String> {
    definition.map_or_else(
        || pattern.blocklist.clone(),
        |definition| definition.blocklist.clone(),
    )
}

fn pattern_omit_keys(properties_name: &str, blocklist: &[String]) -> String {
    let mut keys = vec![format!("keyof {properties_name}")];
    keys.extend(blocklist.iter().map(|key| format!("{key:?}")));
    keys.join(" | ")
}

fn create_recipe_context_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let has_recipes = has_recipes(ctx);
    let mut module = Module::new()
        .with_import(value_import(
            &["createContext", "useContext", "createElement", "forwardRef"],
            "react",
        ))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(ImportDecl::value(["getDisplayName"], "./factory"))
        .with_import(type_import(
            &[
                "RecipeDefinition",
                "RecipeRuntimeFn",
                "RecipeSelection",
                "RecipeVariantRecord",
            ],
            "../types/recipe",
        ))
        .with_import(type_import(
            &["Assign", "JsxHTMLProps", "JsxStyleProps"],
            "../types/system",
        ))
        .with_import(type_import(
            &[
                "AsProps",
                "ComponentProps",
                "DataAttrs",
                "JsxFactoryOptions",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(&["ElementType", "JSX", "Provider"], "react"));

    if has_recipes {
        module = module.with_import(namespace_import("recipes", "../recipes/index"));
    }

    module
        .with_item(raw_runtime(create_recipe_context_runtime(
            &factory,
            has_recipes,
        )))
        .with_item(raw_type(CREATE_RECIPE_CONTEXT_TYPES))
}

fn create_recipe_context_runtime(factory: &str, has_recipes: bool) -> String {
    CREATE_RECIPE_CONTEXT_RUNTIME
        .replace("__FACTORY__", factory)
        .replace(
            "__RECIPE_LOOKUP__",
            if has_recipes {
                "if (options.key && recipes[options.key]) return recipes[options.key]"
            } else {
                ""
            },
        )
}

const CREATE_RECIPE_CONTEXT_RUNTIME: &str = r"function resolveRecipe(options) {
  if (options == null) throw new Error('createRecipeContext requires a recipe or { key }')
  if (options.__recipe__ === true || options.__cva__ === true) return options
  __RECIPE_LOOKUP__
  if (options.recipe) return options.recipe
  if (options.base || options.variants || options.defaultVariants || options.compoundVariants) return options
  throw new Error('createRecipeContext requires a recipe or { key }')
}

export function createRecipeContext(options) {
  const recipe = resolveRecipe(options)
  const PropsContext = createContext(undefined)
  const usePropsContext = () => useContext(PropsContext)

  const withContext = (Component, options) => {
    const StyledComponent = __FACTORY__(Component, recipe, options)
    const componentName = getDisplayName(Component)

    const WithContext = forwardRef(function WithContext(inProps, ref) {
      const propsContext = usePropsContext()
      const props = propsContext ? Object.assign({}, propsContext, inProps) : inProps
      return createElement(StyledComponent, { ...props, ref })
    })

    WithContext.displayName = `withContext(${componentName})`
    return WithContext
  }

  return {
    withContext,
    PropsProvider: PropsContext.Provider,
    usePropsContext,
  }
}";

const CREATE_RECIPE_CONTEXT_TYPES: &str = r"interface UnstyledProps {
  unstyled?: boolean | undefined
}

type AnyRecipeDefinition = RecipeDefinition<RecipeVariantRecord>

interface RuntimeRecipeFn {
  __type: any
  (props?: any): string
}

type RecipeContextRecipe = RecipeRuntimeFn<any, any> | RuntimeRecipeFn | AnyRecipeDefinition

type RecipePropsOf<R extends RecipeContextRecipe> = R extends RuntimeRecipeFn
  ? R['__type']
  : R extends RecipeRuntimeFn<infer P, any>
    ? P
    : R extends RecipeDefinition<infer T>
      ? RecipeSelection<T>
      : never

interface RecipeContextOptions<R extends RecipeContextRecipe = RecipeContextRecipe> {
  key?: string
  recipe?: R
}

type RecipeContextComponentProps<T extends ElementType, R extends RecipeContextRecipe> = JsxHTMLProps<
  ComponentProps<T> & UnstyledProps & AsProps & DataAttrs,
  Assign<RecipePropsOf<R>, JsxStyleProps>
>

type RecipeContextComponent<T extends ElementType, R extends RecipeContextRecipe> = (
  props: RecipeContextComponentProps<T, R>
) => JSX.Element

export interface RecipeContext<R extends RecipeContextRecipe> {
  withContext: <T extends ElementType>(
    Component: T,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => RecipeContextComponent<T, R>
  PropsProvider: Provider<Partial<RecipePropsOf<R>> & DataAttrs>
  usePropsContext: () => RecipePropsOf<R> | undefined
}

export declare function createRecipeContext<R extends RecipeContextRecipe>(recipe: R): RecipeContext<R>
export declare function createRecipeContext<R extends RecipeContextRecipe>(options: RecipeContextOptions<R>): RecipeContext<R>";

fn create_slot_recipe_context_module(ctx: CodegenContext<'_>) -> Module {
    let factory = factory_name(ctx);
    let has_recipes = has_recipes(ctx);
    let css_imports = match style_props(ctx) {
        JsxStylePropsConfig::All => vec!["cx", "sva"],
        JsxStylePropsConfig::Minimal | JsxStylePropsConfig::None => vec!["cx", "css", "sva"],
    };
    let mut module = Module::new()
        .with_import(value_import(
            &["createContext", "useContext", "createElement", "forwardRef"],
            "react",
        ))
        .with_import(value_import(&css_imports, "../css/index"))
        .with_import(value_import(&[factory.as_str()], "./factory"))
        .with_import(ImportDecl::value(["getDisplayName"], "./factory"))
        .with_import(type_import(
            &[
                "RecipeSelection",
                "SlotRecipeDefinition",
                "SlotRecipeRuntimeFn",
                "SlotRecipeVariantRecord",
            ],
            "../types/recipe",
        ))
        .with_import(type_import(
            &["Assign", "JsxHTMLProps", "JsxStyleProps"],
            "../types/system",
        ))
        .with_import(type_import(
            &[
                "AsProps",
                "ComponentProps",
                "DataAttrs",
                "JsxFactoryOptions",
            ],
            "../types/jsx",
        ))
        .with_import(type_import(&["ElementType", "JSX"], "react"));

    if has_recipes {
        module = module.with_import(namespace_import("recipes", "../recipes/index"));
    }

    module
        .with_item(raw_runtime(create_slot_recipe_context_runtime(
            &factory,
            has_recipes,
            style_props(ctx),
        )))
        .with_item(raw_type(CREATE_SLOT_RECIPE_CONTEXT_TYPES))
}

fn create_slot_recipe_context_runtime(
    factory: &str,
    has_recipes: bool,
    mode: JsxStylePropsConfig,
) -> String {
    CREATE_SLOT_RECIPE_CONTEXT_RUNTIME
        .replace("__FACTORY__", factory)
        .replace(
            "__RECIPE_LOOKUP__",
            if has_recipes {
                "if (options.key && recipes[options.key]) return recipes[options.key]"
            } else {
                ""
            },
        )
        .replace("__RESOLVE_PROPS__", slot_resolve_props(mode))
}

fn slot_resolve_props(mode: JsxStylePropsConfig) -> &'static str {
    match mode {
        JsxStylePropsConfig::All => "return { ...slotStyles, ...restProps }",
        JsxStylePropsConfig::Minimal => {
            "return { ...restProps, css: css.raw(slotStyles, restProps.css) }"
        }
        JsxStylePropsConfig::None => {
            "return { ...restProps, className: cx(css(slotStyles), restProps.className) }"
        }
    }
}

const CREATE_SLOT_RECIPE_CONTEXT_RUNTIME: &str = r#"function createSafeContext(contextName) {
  const Context = createContext(undefined)
  const useStyleContext = (componentName, slot) => {
    const context = useContext(Context)
    if (context === undefined) {
      const componentInfo = componentName ? `Component "${componentName}"` : 'A component'
      const slotInfo = slot ? ` (slot: "${slot}")` : ''
      throw new Error(`${componentInfo}${slotInfo} cannot access ${contextName} because it's missing its Provider.`)
    }
    return context
  }
  return [Context, useStyleContext]
}

function resolveSlotRecipe(options) {
  if (options == null) throw new Error('createSlotRecipeContext requires a slot recipe or { key }')
  if (typeof options.splitVariantProps === 'function') return options
  __RECIPE_LOOKUP__
  if (options.recipe) return options.recipe
  if (options.slots) return options
  throw new Error('createSlotRecipeContext requires a slot recipe or { key }')
}

export function createSlotRecipeContext(options) {
  const recipe = resolveSlotRecipe(options)
  const isRuntimeRecipe = typeof recipe.splitVariantProps === 'function'
  const isConfigRecipe = isRuntimeRecipe && recipe.__recipe__ !== undefined
  const recipeName = isRuntimeRecipe && recipe.__name__ ? recipe.__name__ : undefined
  const contextName = recipeName ? `createSlotRecipeContext("${recipeName}")` : 'createSlotRecipeContext'
  const [SlotStylesContext, useSlotStylesContext] = createSafeContext(contextName)
  const slotRecipeFn = isRuntimeRecipe ? recipe : sva(recipe.config ?? recipe)

  const resolveProps = (props, slotStyles) => {
    const { unstyled, ...restProps } = props
    if (unstyled) return restProps
    if (isConfigRecipe) return { ...restProps, className: cx(slotStyles, restProps.className) }
    __RESOLVE_PROPS__
  }

  const withRootProvider = (Component, options) => {
    const WithRootProvider = (props) => {
      const [variantProps, otherProps] = slotRecipeFn.splitVariantProps(props)
      const resolvedSlots = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
      resolvedSlots._classNameMap = slotRecipeFn.classNameMap || {}
      const mergedProps = options?.defaultProps ? Object.assign({}, options.defaultProps, otherProps) : otherProps
      return createElement(SlotStylesContext.Provider, {
        value: resolvedSlots,
        children: createElement(Component, mergedProps),
      })
    }
    const componentName = getDisplayName(Component)
    WithRootProvider.displayName = `withRootProvider(${componentName})`
    return WithRootProvider
  }

  const withProvider = (Component, slot, options) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const WithProvider = forwardRef(function WithProvider(props, ref) {
      const [variantProps, restProps] = slotRecipeFn.splitVariantProps(props)
      const resolvedSlots = isConfigRecipe ? slotRecipeFn(variantProps) : slotRecipeFn.raw(variantProps)
      resolvedSlots._classNameMap = slotRecipeFn.classNameMap || {}
      if (restProps.className == null && options?.defaultProps?.className) restProps.className = options.defaultProps.className
      const resolvedProps = resolveProps(restProps, resolvedSlots[slot])
      return createElement(SlotStylesContext.Provider, {
        value: resolvedSlots,
        children: createElement(StyledComponent, {
          ...resolvedProps,
          className: cx(resolvedProps.className, resolvedSlots._classNameMap[slot]),
          ref,
        }),
      })
    })
    const componentName = getDisplayName(Component)
    WithProvider.displayName = `withProvider(${componentName})`
    return WithProvider
  }

  const withContext = (Component, slot, options) => {
    const StyledComponent = __FACTORY__(Component, {}, options)
    const componentName = getDisplayName(Component)
    const WithContext = forwardRef(function WithContext(props, ref) {
      const resolvedSlots = useSlotStylesContext(componentName, slot)
      const nextProps = props.className == null && options?.defaultProps?.className
        ? { ...props, className: options.defaultProps.className }
        : props
      const resolvedProps = resolveProps(nextProps, resolvedSlots[slot])
      return createElement(StyledComponent, {
        ...resolvedProps,
        className: cx(resolvedProps.className, resolvedSlots._classNameMap[slot]),
        ref,
      })
    })
    WithContext.displayName = `withContext(${componentName})`
    return WithContext
  }

  return {
    withRootProvider,
    withProvider,
    withContext,
  }
}"#;

const CREATE_SLOT_RECIPE_CONTEXT_TYPES: &str = r"interface UnstyledProps {
  unstyled?: boolean | undefined
}

type AnySlotRecipeDefinition = SlotRecipeDefinition<string, SlotRecipeVariantRecord<string>>

interface RuntimeSlotRecipeFn {
  __type: any
  __slot: string
  (props?: any): any
}

type SlotRecipeContextInput = SlotRecipeRuntimeFn<string, any, any> | RuntimeSlotRecipeFn | AnySlotRecipeDefinition

type SlotNameOf<R extends SlotRecipeContextInput> = R extends RuntimeSlotRecipeFn
  ? R['__slot']
  : R extends SlotRecipeRuntimeFn<infer S, any, any>
    ? S
    : R extends SlotRecipeDefinition<infer S, any>
      ? S
      : string

type SlotRecipePropsOf<R extends SlotRecipeContextInput> = R extends RuntimeSlotRecipeFn
  ? R['__type']
  : R extends SlotRecipeRuntimeFn<any, infer P, any>
    ? P
    : R extends SlotRecipeDefinition<any, infer T>
      ? RecipeSelection<T>
      : never

interface WithProviderOptions<P = {}> {
  defaultProps?: (Partial<P> & DataAttrs) | undefined
}

interface SlotRecipeContextOptions<R extends SlotRecipeContextInput = SlotRecipeContextInput> {
  key?: string
  recipe?: R
}

type SlotRecipeProviderProps<T extends ElementType, R extends SlotRecipeContextInput> = JsxHTMLProps<
  ComponentProps<T> & UnstyledProps & AsProps & DataAttrs,
  Assign<SlotRecipePropsOf<R>, JsxStyleProps>
>

type SlotRecipeProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = (
  props: SlotRecipeProviderProps<T, R>
) => JSX.Element

type SlotRecipeRootProviderComponent<T extends ElementType, R extends SlotRecipeContextInput> = (
  props: ComponentProps<T> & UnstyledProps & DataAttrs & SlotRecipePropsOf<R>
) => JSX.Element

type SlotRecipeConsumerComponent<T extends ElementType> = (
  props: JsxHTMLProps<ComponentProps<T> & UnstyledProps & AsProps & DataAttrs, JsxStyleProps>
) => JSX.Element

export interface SlotRecipeContext<R extends SlotRecipeContextInput> {
  withRootProvider: <T extends ElementType>(
    Component: T,
    options?: WithProviderOptions<ComponentProps<T>> | undefined
  ) => SlotRecipeRootProviderComponent<T, R>
  withProvider: <T extends ElementType>(
    Component: T,
    slot: SlotNameOf<R>,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => SlotRecipeProviderComponent<T, R>
  withContext: <T extends ElementType>(
    Component: T,
    slot: SlotNameOf<R>,
    options?: JsxFactoryOptions<ComponentProps<T>> | undefined
  ) => SlotRecipeConsumerComponent<T>
}

export declare function createSlotRecipeContext<R extends SlotRecipeContextInput>(recipe: R): SlotRecipeContext<R>
export declare function createSlotRecipeContext<R extends SlotRecipeContextInput>(options: SlotRecipeContextOptions<R>): SlotRecipeContext<R>";

fn has_recipes(ctx: CodegenContext<'_>) -> bool {
    !ctx.config.theme.recipes.is_empty() || !ctx.config.theme.slot_recipes.is_empty()
}

fn index_module(ctx: CodegenContext<'_>) -> Module {
    let mut sources = vec![
        "./factory".to_owned(),
        "./is-valid-prop".to_owned(),
        "./create-recipe-context".to_owned(),
        "./create-slot-recipe-context".to_owned(),
    ];
    sources.extend(
        ctx.config
            .patterns
            .keys()
            .map(|name| format!("./{}", file_stem(name))),
    );

    let mut module = sources.into_iter().fold(Module::new(), |module, source| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star { source })))
    });

    module = module.with_item(Item::ty(ItemNode::Export(ExportDecl::TypeNamed {
        names: vec![
            html_props_name(ctx),
            component_name(ctx),
            factory_upper(ctx),
            "StyledVariantProps".into(),
            "JsxFactoryOptions".into(),
            "ComponentProps".into(),
            "DataAttrs".into(),
            "AsProps".into(),
        ],
        source: "../types/jsx".into(),
    })));

    module
}
