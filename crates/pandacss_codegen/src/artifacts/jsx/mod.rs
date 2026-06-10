//! JSX artifacts: styled factory, helpers, pattern components, and the recipe
//! context helpers used by JSX projects.

mod jsx_helper;
mod preact_jsx;
mod preact_jsx_literal;
mod preact_pattern_jsx;
mod preact_recipe_context;
mod qwik_jsx;
mod qwik_jsx_literal;
mod qwik_pattern_jsx;
mod react_jsx;
mod react_jsx_literal;
mod react_pattern_jsx;
mod react_recipe_context;
mod solid_jsx;
mod solid_jsx_literal;
mod solid_pattern_jsx;
mod solid_recipe_context;
mod vue_jsx;
mod vue_jsx_literal;
mod vue_pattern_jsx;
mod vue_recipe_context;

use std::collections::BTreeSet;

use pandacss_config::{CssSyntaxKind, JsxFramework, JsxStylePropsConfig};
use pandacss_shared::{file_stem, pascal_case};

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, DependencySet, ExportDecl, ImportDecl,
    Item, ItemNode, Module,
    graph::{GenerateOptions, emit_module_files},
};

use self::jsx_helper::{raw_runtime, raw_type, type_import};

#[must_use]
pub fn generate_is_valid_prop(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    let files = if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        Vec::new()
    } else {
        framework_files(
            ctx,
            options,
            dependencies,
            "jsx/is-valid-prop",
            is_valid_prop_module,
        )
    };

    Artifact {
        id: ArtifactId::JsxIsValidProp,
        dependencies,
        files,
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
        files: framework_files(ctx, options, dependencies, "jsx/factory", factory_module),
    }
}

#[must_use]
pub fn generate_jsx_helper(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    Artifact {
        id: ArtifactId::JsxHelper,
        dependencies,
        files: framework_files(ctx, options, dependencies, "jsx/helper", jsx_helper::module),
    }
}

#[must_use]
pub fn generate_patterns(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    let files =
        if has_jsx_framework(ctx) && !matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
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
    let files = if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        Vec::new()
    } else {
        context_files(
            ctx,
            options,
            dependencies,
            "jsx/create-recipe-context",
            recipe_context_module,
        )
    };

    Artifact {
        id: ArtifactId::JsxCreateRecipeContext,
        dependencies,
        files,
    }
}

#[must_use]
pub fn generate_create_slot_recipe_context(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    let files = if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        Vec::new()
    } else {
        context_files(
            ctx,
            options,
            dependencies,
            "jsx/create-slot-recipe-context",
            slot_recipe_context_module,
        )
    };

    Artifact {
        id: ArtifactId::JsxCreateSlotRecipeContext,
        dependencies,
        files,
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
        files: framework_files(ctx, options, dependencies, "jsx/index", index_module),
    }
}

// Factory/helper/pattern/index modules stay server-safe (no hooks or context),
// so they carry no "use client" directive — server components can use the jsx
// factory at module scope, and the re-export index keeps `export *` (which RSC
// bundlers reject inside a client boundary). Only the react recipe-context
// modules are client boundaries (they call `createContext`) and declare it
// themselves via `Module::with_directive`.
fn framework_files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
    stem: &str,
    module: fn(CodegenContext<'_>) -> Module,
) -> Vec<ArtifactFile> {
    if !matches!(
        ctx.config.jsx_framework.as_ref(),
        Some(
            JsxFramework::React
                | JsxFramework::Preact
                | JsxFramework::Qwik
                | JsxFramework::Solid
                | JsxFramework::Vue
        )
    ) {
        return Vec::new();
    }

    emit_module_files(
        stem,
        &module(ctx),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    )
}

fn context_files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
    stem: &str,
    module: fn(CodegenContext<'_>) -> Module,
) -> Vec<ArtifactFile> {
    if !matches!(
        ctx.config.jsx_framework.as_ref(),
        Some(JsxFramework::React | JsxFramework::Preact | JsxFramework::Solid | JsxFramework::Vue)
    ) {
        return Vec::new();
    }

    emit_module_files(
        stem,
        &module(ctx),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    )
}

fn pattern_files(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    let mut files = Vec::new();
    for (name, pattern) in &ctx.config.patterns {
        let stem = file_stem(name);
        let module = match ctx.config.jsx_framework.as_ref() {
            Some(JsxFramework::React) => react_pattern_jsx::module(ctx, name, pattern),
            Some(JsxFramework::Preact) => preact_pattern_jsx::module(ctx, name, pattern),
            Some(JsxFramework::Qwik) => qwik_pattern_jsx::module(ctx, name, pattern),
            Some(JsxFramework::Solid) => solid_pattern_jsx::module(ctx, name, pattern),
            Some(JsxFramework::Vue) => vue_pattern_jsx::module(ctx, name, pattern),
            _ => Module::new(),
        };
        let emitted_files = emit_module_files(
            &format!("jsx/{stem}"),
            &module,
            options.format,
            false,
            options.import_extensions,
            dependencies,
        );
        files.extend(emitted_files);
    }
    files
}

fn has_jsx_framework(ctx: CodegenContext<'_>) -> bool {
    matches!(
        ctx.config.jsx_framework.as_ref(),
        Some(
            JsxFramework::React
                | JsxFramework::Preact
                | JsxFramework::Qwik
                | JsxFramework::Solid
                | JsxFramework::Vue
        )
    )
}

fn has_context_framework(ctx: CodegenContext<'_>) -> bool {
    matches!(
        ctx.config.jsx_framework.as_ref(),
        Some(JsxFramework::React | JsxFramework::Preact | JsxFramework::Solid | JsxFramework::Vue)
    )
}

pub(super) fn style_props(ctx: CodegenContext<'_>) -> JsxStylePropsConfig {
    ctx.config.jsx_style_props.unwrap_or_default()
}

pub(super) fn factory_name(ctx: CodegenContext<'_>) -> String {
    ctx.jsx_factory().to_owned()
}

fn factory_upper(ctx: CodegenContext<'_>) -> String {
    pascal_case(&factory_name(ctx))
}

fn component_name(ctx: CodegenContext<'_>) -> String {
    format!("{}Component", factory_upper(ctx))
}

pub(super) fn html_props_name(ctx: CodegenContext<'_>) -> String {
    format!("HTML{}Props", factory_upper(ctx))
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

    if matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral) {
        return match ctx.config.jsx_framework.as_ref() {
            Some(JsxFramework::React) => react_jsx_literal::module(&factory, &component, &upper),
            Some(JsxFramework::Preact) => preact_jsx_literal::module(&factory, &component, &upper),
            Some(JsxFramework::Qwik) => qwik_jsx_literal::module(&factory, &component, &upper),
            Some(JsxFramework::Solid) => solid_jsx_literal::module(&factory, &component, &upper),
            Some(JsxFramework::Vue) => vue_jsx_literal::module(&factory, &component, &upper),
            _ => Module::new(),
        };
    }

    match ctx.config.jsx_framework.as_ref() {
        Some(JsxFramework::React) => react_jsx::module(&factory, &component, &upper),
        Some(JsxFramework::Preact) => preact_jsx::module(&factory, &component, &upper),
        Some(JsxFramework::Qwik) => qwik_jsx::module(&factory, &component, &upper),
        Some(JsxFramework::Solid) => solid_jsx::module(&factory, &component, &upper),
        Some(JsxFramework::Vue) => vue_jsx::module(&factory, &component, &upper),
        _ => Module::new(),
    }
}

fn recipe_context_module(ctx: CodegenContext<'_>) -> Module {
    match ctx.config.jsx_framework.as_ref() {
        Some(JsxFramework::React) => react_recipe_context::recipe_module(ctx),
        Some(JsxFramework::Preact) => preact_recipe_context::recipe_module(ctx),
        Some(JsxFramework::Solid) => solid_recipe_context::recipe_module(ctx),
        Some(JsxFramework::Vue) => vue_recipe_context::recipe_module(ctx),
        _ => Module::new(),
    }
}

fn slot_recipe_context_module(ctx: CodegenContext<'_>) -> Module {
    match ctx.config.jsx_framework.as_ref() {
        Some(JsxFramework::React) => react_recipe_context::slot_recipe_module(ctx),
        Some(JsxFramework::Preact) => preact_recipe_context::slot_recipe_module(ctx),
        Some(JsxFramework::Solid) => solid_recipe_context::slot_recipe_module(ctx),
        Some(JsxFramework::Vue) => vue_recipe_context::slot_recipe_module(ctx),
        _ => Module::new(),
    }
}

fn index_module(ctx: CodegenContext<'_>) -> Module {
    let template_literal = matches!(ctx.config.syntax, CssSyntaxKind::TemplateLiteral);
    let mut sources = vec!["./factory".to_owned()];
    if !template_literal {
        sources.push("./is-valid-prop".to_owned());
        if has_context_framework(ctx) {
            sources.extend([
                "./create-recipe-context".to_owned(),
                "./create-slot-recipe-context".to_owned(),
            ]);
        }
        sources.extend(
            ctx.config
                .patterns
                .keys()
                .map(|name| format!("./{}", file_stem(name))),
        );
    }

    let mut module = sources.into_iter().fold(Module::new(), |module, source| {
        module.with_item(Item::both(ItemNode::Export(ExportDecl::Star { source })))
    });

    let type_names = if template_literal {
        vec![
            html_props_name(ctx),
            component_name(ctx),
            factory_upper(ctx),
        ]
    } else {
        vec![
            html_props_name(ctx),
            component_name(ctx),
            factory_upper(ctx),
            "StyledVariantProps".into(),
            "JsxFactoryOptions".into(),
            "ComponentProps".into(),
            "DataAttrs".into(),
            "AsProps".into(),
        ]
    };

    module = module.with_item(Item::ty(ItemNode::Export(ExportDecl::TypeNamed {
        names: type_names,
        source: "../types/jsx".into(),
    })));

    module
}
