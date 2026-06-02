//! The `cva` artifact: the recipe-creator factory `cva()`. Config-independent —
//! the runtime impl is a fixed string; recipe data lives in the `recipes` artifact.

use crate::{
    Artifact, ArtifactFile, ArtifactId, ConstDecl, DependencySet, Expr, ImportDecl, Item, ItemNode,
    Module, TsType,
    artifact::{GenerateOptions, emit_module_files},
};

#[must_use]
pub fn generate(options: GenerateOptions, dependencies: DependencySet) -> Artifact {
    Artifact {
        id: ArtifactId::Cva,
        dependencies,
        files: files(options, dependencies),
    }
}

#[must_use]
pub fn files(options: GenerateOptions, dependencies: DependencySet) -> Vec<ArtifactFile> {
    emit_module_files(
        "css/cva",
        &module(),
        options.format,
        false,
        options.import_extensions,
        dependencies,
    )
}

fn module() -> Module {
    Module::new()
        .with_import(ImportDecl::value(
            [
                "getCompoundVariantCss",
                "memo",
                "mergeProps",
                "splitProps",
                "toVariantMap",
                "uniq",
                "withDefaults",
            ],
            "../helpers",
        ))
        .with_import(ImportDecl::value(["css", "mergeCss"], "./css"))
        .with_import(ImportDecl::ty(["RecipeCreatorFn"], "../types/recipe"))
        .with_item(Item::both(ItemNode::Const(ConstDecl {
            exported: true,
            declare: false,
            name: "cva".into(),
            type_annotation: Some(TsType::Ref("RecipeCreatorFn".into())),
            init: Some(Expr::Raw(CVA_IMPL.into())),
            js_doc: None,
        })))
}

const CVA_IMPL: &str = r"(config) => {
  const defaults = (c: Record<string, any>) => ({ base: {}, variants: {}, defaultVariants: {}, compoundVariants: [], ...c })
  const { base, variants, defaultVariants, compoundVariants } = defaults(config)

  const getVariantProps = (props: Record<string, any>) => withDefaults(defaultVariants, props)

  const resolve = (props: Record<string, any> = {}) => {
    const computed = getVariantProps(props)
    const styles = [base]
    for (const key in computed) {
      const value = computed[key]
      if (variants[key]?.[value]) styles.push(variants[key][value])
    }
    styles.push(getCompoundVariantCss(compoundVariants, computed))
    return mergeCss(...styles)
  }

  const variantKeys = Object.keys(variants)
  const variantMap = toVariantMap(variants)

  const merge = (other: Record<string, any>) => {
    const override = defaults(other.config)
    const keys = uniq(other.variantKeys, variantKeys)
    return cva({
      base: mergeCss(base, override.base),
      variants: Object.fromEntries(keys.map((key) => [key, mergeCss(variants[key], override.variants[key])])),
      defaultVariants: mergeProps(defaultVariants, override.defaultVariants),
      compoundVariants: [...compoundVariants, ...override.compoundVariants],
    })
  }

  return Object.assign(memo(function cvaFn(props: Record<string, any>) {
    return css(resolve(props))
  }), {
    __cva__: true,
    variantMap,
    variantKeys,
    raw: resolve,
    config,
    merge,
    splitVariantProps(props: Record<string, any>) {
      return splitProps(props, variantKeys)
    },
    getVariantProps,
  })
}";
