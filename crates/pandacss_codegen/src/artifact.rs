use pandacss_config::{CodegenFormat, UserConfig};

use crate::{
    CodegenContext, CodegenInput, EmitMode, Module, ModuleSpecifierPolicy, SourceExt, emit_module,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum ArtifactId {
    Conditions,
    CssIndex,
    Cx,
    Helpers,
    Patterns,
    Selectors,
    Types,
}

impl ArtifactId {
    #[must_use]
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Conditions => "conditions",
            Self::CssIndex => "css-index",
            Self::Cx => "cx",
            Self::Helpers => "helpers",
            Self::Patterns => "patterns",
            Self::Selectors => "selectors",
            Self::Types => "types",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum ConfigDependency {
    CodegenFormat = 0,
    Conditions,
    Hash,
    JsxFactory,
    JsxFramework,
    JsxStyleProps,
    Patterns,
    Prefix,
    Recipes,
    Separator,
    Syntax,
    Themes,
    Tokens,
    Utilities,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct DependencySet(u128);

impl DependencySet {
    pub const EMPTY: Self = Self(0);

    #[must_use]
    pub const fn one(dependency: ConfigDependency) -> Self {
        Self(1u128 << dependency as u8)
    }

    #[must_use]
    pub const fn from_slice(dependencies: &[ConfigDependency]) -> Self {
        let mut bits = 0;
        let mut index = 0;
        while index < dependencies.len() {
            bits |= 1u128 << dependencies[index] as u8;
            index += 1;
        }
        Self(bits)
    }

    #[must_use]
    pub const fn intersects(self, other: Self) -> bool {
        self.0 & other.0 != 0
    }

    #[must_use]
    pub const fn contains(self, dependency: ConfigDependency) -> bool {
        self.0 & Self::one(dependency).0 != 0
    }

    #[must_use]
    pub const fn union(self, other: Self) -> Self {
        Self(self.0 | other.0)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ArtifactNode {
    pub id: ArtifactId,
    pub dependencies: DependencySet,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Artifact {
    pub id: ArtifactId,
    pub dependencies: DependencySet,
    pub files: Vec<ArtifactFile>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ArtifactFile {
    pub path: String,
    pub code: String,
    pub dependencies: DependencySet,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GenerateOptions {
    pub format: CodegenFormat,
    pub specifiers: ModuleSpecifierPolicy,
}

impl Default for GenerateOptions {
    fn default() -> Self {
        Self {
            format: CodegenFormat::Mjs,
            specifiers: ModuleSpecifierPolicy::Extensionless,
        }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ArtifactGraph;

impl ArtifactGraph {
    pub const NODES: &'static [ArtifactNode] = &[
        ArtifactNode {
            id: ArtifactId::Helpers,
            dependencies: DependencySet::one(ConfigDependency::CodegenFormat),
        },
        ArtifactNode {
            id: ArtifactId::Selectors,
            dependencies: DependencySet::one(ConfigDependency::CodegenFormat),
        },
        ArtifactNode {
            id: ArtifactId::Patterns,
            dependencies: DependencySet::from_slice(&[
                ConfigDependency::CodegenFormat,
                ConfigDependency::Patterns,
                ConfigDependency::Tokens,
                ConfigDependency::Utilities,
            ]),
        },
        ArtifactNode {
            id: ArtifactId::Types,
            dependencies: DependencySet::from_slice(&[
                ConfigDependency::CodegenFormat,
                ConfigDependency::Conditions,
                ConfigDependency::JsxStyleProps,
                ConfigDependency::Patterns,
                ConfigDependency::Recipes,
                ConfigDependency::Syntax,
                ConfigDependency::Themes,
                ConfigDependency::Tokens,
                ConfigDependency::Utilities,
            ]),
        },
        ArtifactNode {
            id: ArtifactId::Cx,
            dependencies: DependencySet::one(ConfigDependency::CodegenFormat),
        },
        ArtifactNode {
            id: ArtifactId::CssIndex,
            dependencies: DependencySet::one(ConfigDependency::CodegenFormat),
        },
        ArtifactNode {
            id: ArtifactId::Conditions,
            dependencies: DependencySet::from_slice(&[
                ConfigDependency::CodegenFormat,
                ConfigDependency::Conditions,
                ConfigDependency::Tokens,
            ]),
        },
    ];

    #[must_use]
    pub fn nodes(self) -> &'static [ArtifactNode] {
        Self::NODES
    }

    #[must_use]
    pub fn affected(self, changed: DependencySet) -> Vec<ArtifactNode> {
        Self::NODES
            .iter()
            .copied()
            .filter(|node| node.dependencies.intersects(changed))
            .collect()
    }

    #[must_use]
    pub fn generate(self, options: GenerateOptions) -> Vec<Artifact> {
        self.generate_with_config(&UserConfig::default(), options)
    }

    #[must_use]
    pub fn generate_with_config(
        self,
        config: &UserConfig,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let ctx = CodegenContext::new(config);
        Self::NODES
            .iter()
            .map(|node| generate_node(ctx, *node, options))
            .collect()
    }

    #[must_use]
    pub fn generate_with_input(
        self,
        input: &CodegenInput,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let ctx = CodegenContext::from_input(input);
        Self::NODES
            .iter()
            .map(|node| generate_node(ctx, *node, options))
            .collect()
    }

    #[must_use]
    pub fn generate_affected(
        self,
        changed: DependencySet,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        self.generate_affected_with_config(&UserConfig::default(), changed, options)
    }

    #[must_use]
    pub fn generate_affected_with_config(
        self,
        config: &UserConfig,
        changed: DependencySet,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let ctx = CodegenContext::new(config);
        self.affected(changed)
            .into_iter()
            .map(|node| generate_node(ctx, node, options))
            .collect()
    }

    #[must_use]
    pub fn generate_affected_with_input(
        self,
        input: &CodegenInput,
        changed: DependencySet,
        options: GenerateOptions,
    ) -> Vec<Artifact> {
        let ctx = CodegenContext::from_input(input);
        self.affected(changed)
            .into_iter()
            .map(|node| generate_node(ctx, node, options))
            .collect()
    }
}

#[must_use]
pub fn emit_module_files(
    stem: &str,
    module: &Module,
    format: CodegenFormat,
    has_jsx: bool,
    specifiers: ModuleSpecifierPolicy,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    let mode = EmitMode::from_codegen_format(format, has_jsx, specifiers);
    let printed = emit_module(module, mode);

    match mode {
        EmitMode::SourceTs { ext, .. } => printed.source_ts.map_or_else(Vec::new, |code| {
            vec![ArtifactFile {
                path: format!("{stem}.{}", source_extension(ext)),
                code,
                dependencies,
            }]
        }),
        EmitMode::Split { format, .. } => {
            let mut files = Vec::with_capacity(2);
            if let Some(code) = printed.runtime.filter(|code| !code.is_empty()) {
                files.push(ArtifactFile {
                    path: format!("{stem}.{}", format.runtime_extension()),
                    code,
                    dependencies,
                });
            }
            if let (Some(ext), Some(code)) = (
                format.declaration_extension(),
                printed.types.filter(|code| !code.is_empty()),
            ) {
                files.push(ArtifactFile {
                    path: format!("{stem}.{ext}"),
                    code,
                    dependencies,
                });
            }
            files
        }
    }
}

fn generate_node(
    ctx: CodegenContext<'_>,
    node: ArtifactNode,
    options: GenerateOptions,
) -> Artifact {
    match node.id {
        ArtifactId::Conditions => {
            crate::generators::conditions::generate(ctx, options, node.dependencies)
        }
        ArtifactId::CssIndex => crate::generators::css_index::generate(options, node.dependencies),
        ArtifactId::Cx => crate::generators::cx::generate(options, node.dependencies),
        ArtifactId::Helpers => crate::generators::helpers::generate(options, node.dependencies),
        ArtifactId::Patterns => {
            crate::generators::patterns::generate(ctx, options, node.dependencies)
        }
        ArtifactId::Selectors => crate::generators::selectors::generate(options, node.dependencies),
        ArtifactId::Types => crate::generators::types::generate(ctx, options, node.dependencies),
    }
}

fn source_extension(ext: SourceExt) -> &'static str {
    match ext {
        SourceExt::Ts => "ts",
        SourceExt::Tsx => "tsx",
    }
}
