//! The `themes` artifact: one JSON file per configured theme plus an index
//! helper that lazy-loads and injects the selected theme CSS.

use pandacss_config::CodegenFormat;
use serde_json::json;

use crate::{
    Artifact, ArtifactFile, ArtifactId, CodegenContext, DependencySet, graph::GenerateOptions,
};

struct ThemeArtifact {
    name: String,
    css: String,
}

#[must_use]
pub fn generate(
    ctx: CodegenContext<'_>,
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Artifact {
    let mut files = Vec::new();
    if ctx.config.themes.is_empty() {
        return Artifact {
            id: ArtifactId::Themes,
            dependencies,
            files,
        };
    }

    let themes = theme_artifacts(ctx);
    for theme in &themes {
        let name = &theme.name;
        files.push(ArtifactFile {
            path: format!("themes/theme-{name}.json"),
            code: serde_json::to_string_pretty(&json!({
                "name": name,
                "id": format!("panda-theme-{name}"),
                "css": theme.css,
            }))
            .expect("theme json should serialize"),
            dependencies,
        });
    }

    files.extend(index_files(&themes, options, dependencies));

    Artifact {
        id: ArtifactId::Themes,
        dependencies,
        files,
    }
}

fn theme_artifacts(ctx: CodegenContext<'_>) -> Vec<ThemeArtifact> {
    let entries = if ctx.token_dictionary_provided {
        pandacss_stylesheet::theme_css_entries_from_dictionary(
            ctx.config,
            ctx.token_dictionary,
            false,
        )
    } else {
        pandacss_stylesheet::theme_css_entries(ctx.config, false)
            .expect("theme artifact token dictionary should build")
    };

    entries
        .into_iter()
        .map(|(name, css)| ThemeArtifact { name, css })
        .collect()
}

fn index_files(
    themes: &[ThemeArtifact],
    options: GenerateOptions,
    dependencies: DependencySet,
) -> Vec<ArtifactFile> {
    let runtime = runtime_code();
    let types = types_code(themes);
    match options.format {
        CodegenFormat::Ts => vec![ArtifactFile {
            path: "themes/index.ts".to_owned(),
            code: format!("{runtime}\n\n{types}"),
            dependencies,
        }],
        format => {
            let mut files = vec![ArtifactFile {
                path: format!("themes/index.{}", format.runtime_extension()),
                code: runtime,
                dependencies,
            }];
            if let Some(ext) = format.declaration_extension() {
                files.push(ArtifactFile {
                    path: format!("themes/index.{ext}"),
                    code: types,
                    dependencies,
                });
            }
            files
        }
    }
}

fn runtime_code() -> String {
    r#"export const getTheme = (themeName) => import(`./theme-${themeName}.json`).then((m) => m.default)

export function injectTheme(el, theme) {
  const doc = el.ownerDocument || document
  let sheet = doc.getElementById(theme.id)

  if (!sheet) {
    sheet = doc.createElement("style")
    sheet.setAttribute("type", "text/css")
    sheet.setAttribute("id", theme.id)
  }

  const head = doc.head || doc.getElementsByTagName("head")[0]
  if (!head) {
    throw new Error("No head found in doc")
  }

  el.dataset.pandaTheme = theme.name

  head.appendChild(sheet)
  sheet.innerHTML = theme.css

  return sheet
}"#
    .to_owned()
}

fn types_code(themes: &[ThemeArtifact]) -> String {
    let union = themes
        .iter()
        .map(|theme| serde_json::to_string(&theme.name).expect("theme name should serialize"))
        .collect::<Vec<_>>()
        .join(" | ");
    let entries = themes
        .iter()
        .filter(|theme| !theme.css.is_empty())
        .map(|theme| {
            let key = serde_json::to_string(&theme.name).expect("theme name should serialize");
            format!("  {key}: {{\n    id: string\n    name: {key}\n    css: string\n  }}")
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r"export type ThemeName = {union}
export type ThemeByName = {{
{entries}
}}

export type Theme<T extends ThemeName> = ThemeByName[T]

/**
 * Dynamically import a theme by name
 */
export declare function getTheme<T extends ThemeName>(themeName: T): Promise<ThemeByName[T]>

/**
 * Inject a theme stylesheet into the document
 */
export declare function injectTheme(el: HTMLElement, theme: Theme<any>): HTMLStyleElement"
    )
}
