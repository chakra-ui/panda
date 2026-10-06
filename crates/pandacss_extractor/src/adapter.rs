//! Resolves a file's SFC format and lowers it through `pandacss_sfc` for Oxc.

use std::borrow::Cow;
use std::path::Path;

use oxc_diagnostics::OxcDiagnostic;
use oxc_parser::ParseOptions;
use oxc_span::SourceType;

use crate::{Diagnostic, Span};
use pandacss_sfc::markup::TagBlock;

/// Single-file-component container format, resolved once per file from its
/// extension. Distinct from the template `Framework` dialect: Astro is its own
/// container but reuses Svelte's attribute syntax.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub(crate) enum SfcFormat {
    Vue,
    Svelte,
    Astro,
    Mdx,
}

impl SfcFormat {
    #[must_use]
    pub(crate) fn from_path(path: &str) -> Option<Self> {
        let extension = Path::new(path).extension()?;
        [
            ("vue", Self::Vue),
            ("svelte", Self::Svelte),
            ("astro", Self::Astro),
            ("mdx", Self::Mdx),
        ]
        .into_iter()
        .find_map(|(candidate, format)| extension.eq_ignore_ascii_case(candidate).then_some(format))
    }
}

fn unclosed_fence_end(source: &str) -> Option<u32> {
    let bom = if source.starts_with('\u{feff}') { 3 } else { 0 };
    let trimmed = source[bom..].trim_start();
    let start = source.len() - trimmed.len();
    trimmed
        .starts_with("---")
        .then(|| u32::try_from(start + 3).ok())
        .flatten()
}

pub(crate) struct AdaptedSource<'a> {
    pub(crate) format: Option<SfcFormat>,
    pub(crate) code: Cow<'a, str>,
    pub(crate) template_elements: Vec<pandacss_sfc::TemplateElement>,
    pub(crate) astro_scripts: Vec<std::ops::Range<u32>>,
    mdx_diagnostics: Vec<Diagnostic>,
    astro_diagnostics: Vec<pandacss_sfc::ContainerDiagnostic>,
    astro_frontmatter: Option<std::ops::Range<u32>>,
    astro_open_fence: Option<u32>,
    astro_bom: u32,
    /// Vue with `<script lang="tsx">`; every other mask parses as TypeScript.
    jsx: bool,
    /// Svelte and Vue blocks, found once while masking and reused by the
    /// template style scan.
    pub(crate) scripts: Vec<TagBlock>,
    pub(crate) styles: Vec<TagBlock>,
    pub(crate) templates: Vec<TagBlock>,
    source_len: usize,
    original: &'a str,
}

impl<'a> AdaptedSource<'a> {
    #[must_use]
    pub(crate) fn new(source: &'a str, path: &str) -> Self {
        let format = SfcFormat::from_path(path);
        match format {
            Some(SfcFormat::Astro) => {
                let document = pandacss_sfc::astro::lower(source);
                Self {
                    format,
                    code: Cow::Owned(document.canvas),
                    template_elements: document.elements,
                    astro_scripts: document.scripts,
                    mdx_diagnostics: Vec::new(),
                    astro_diagnostics: document.diagnostics,
                    astro_open_fence: if document.frontmatter.is_none() {
                        unclosed_fence_end(source)
                    } else {
                        None
                    },
                    astro_bom: if source.starts_with('\u{feff}') { 3 } else { 0 },
                    astro_frontmatter: document.frontmatter,
                    jsx: true,
                    scripts: Vec::new(),
                    styles: Vec::new(),
                    templates: Vec::new(),
                    source_len: source.len(),
                    original: source,
                }
            }
            Some(SfcFormat::Mdx) => {
                let document = pandacss_sfc::mdx::lower(source);
                let mut adapted = Self::masked(
                    format,
                    document.extraction_source,
                    true,
                    Vec::new(),
                    Vec::new(),
                    Vec::new(),
                    source,
                );
                adapted.template_elements = document.elements;
                adapted.mdx_diagnostics = crate::imports::parse_error_diagnostics(
                    document.diagnostics.iter().map(|diagnostic| {
                        (
                            diagnostic.message.as_str(),
                            diagnostic.span.as_ref().map(|span| Span {
                                start: span.start,
                                end: span.end,
                            }),
                        )
                    }),
                    source,
                );
                adapted
            }
            Some(SfcFormat::Vue) => {
                let scripts = pandacss_sfc::vue::script_blocks(source);
                let templates = pandacss_sfc::vue::template_blocks(source);
                let code = pandacss_sfc::vue::mask_with(source, &scripts, &templates);
                let jsx = pandacss_sfc::vue::scripts_use_jsx(source, &scripts);
                Self::masked(format, code, jsx, scripts, Vec::new(), templates, source)
            }
            Some(SfcFormat::Svelte) => {
                let blocks = pandacss_sfc::svelte::blocks(source);
                let code = pandacss_sfc::svelte::mask_with(source, &blocks);
                Self::masked(
                    format,
                    code,
                    false,
                    blocks.scripts,
                    blocks.styles,
                    Vec::new(),
                    source,
                )
            }
            None => Self::masked(
                format,
                source,
                false,
                Vec::new(),
                Vec::new(),
                Vec::new(),
                source,
            ),
        }
    }

    fn masked(
        format: Option<SfcFormat>,
        code: impl Into<Cow<'a, str>>,
        jsx: bool,
        scripts: Vec<TagBlock>,
        styles: Vec<TagBlock>,
        templates: Vec<TagBlock>,
        source: &'a str,
    ) -> Self {
        Self {
            format,
            code: code.into(),
            template_elements: Vec::new(),
            astro_scripts: Vec::new(),
            mdx_diagnostics: Vec::new(),
            astro_diagnostics: Vec::new(),
            astro_frontmatter: None,
            astro_open_fence: None,
            astro_bom: 0,
            jsx,
            scripts,
            styles,
            templates,
            source_len: source.len(),
            original: source,
        }
    }

    #[must_use]
    pub(crate) fn astro_insertion(&self, after_directives: u32) -> (u32, bool) {
        if self.format != Some(SfcFormat::Astro) || after_directives != 0 {
            return (after_directives, false);
        }
        let content_start = match (&self.astro_frontmatter, self.astro_open_fence) {
            (Some(frontmatter), _) => frontmatter.start,
            (None, Some(fence)) => fence,
            (None, None) => return (self.astro_bom, true),
        };
        let rest = self.code.get(content_start as usize..).unwrap_or_default();
        let skipped = if rest.starts_with("\r\n") {
            2
        } else {
            usize::from(rest.starts_with(['\n', '\r']))
        };
        (content_start + u32::try_from(skipped).unwrap_or(0), false)
    }

    #[must_use]
    pub(crate) fn source_type(&self, path: &str) -> SourceType {
        match self.format {
            Some(SfcFormat::Astro | SfcFormat::Mdx) => SourceType::tsx().with_module(true),
            Some(SfcFormat::Vue | SfcFormat::Svelte) if self.jsx => {
                SourceType::tsx().with_module(true)
            }
            Some(SfcFormat::Vue | SfcFormat::Svelte) => SourceType::ts().with_module(true),
            None => SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx()),
        }
    }

    #[must_use]
    pub(crate) fn parse_options(&self) -> ParseOptions {
        ParseOptions {
            allow_return_outside_function: matches!(self.format, Some(SfcFormat::Astro)),
            ..ParseOptions::default()
        }
    }

    #[must_use]
    pub(crate) fn parse_diagnostics(&self, errors: &[OxcDiagnostic]) -> Vec<Diagnostic> {
        let limit = u32::try_from(self.source_len).unwrap_or(u32::MAX);
        let mut diagnostics = crate::imports::parse_error_diagnostics(
            self.astro_diagnostics.iter().map(|diagnostic| {
                (
                    diagnostic.message.as_str(),
                    diagnostic.span.as_ref().map(|span| Span {
                        start: span.start.min(limit),
                        end: span.end.min(limit),
                    }),
                )
            }),
            &self.code,
        );
        diagnostics.extend(self.mdx_diagnostics.iter().cloned());
        let diagnostic_source = if self.format == Some(SfcFormat::Mdx) {
            self.original
        } else {
            &self.code
        };
        diagnostics.extend(crate::collect_parser_diagnostics(
            errors,
            diagnostic_source,
            limit,
        ));
        diagnostics
    }
}

#[cfg(test)]
mod tests {
    use super::SfcFormat;

    #[test]
    fn sfc_formats_are_resolved_from_the_extension() {
        assert_eq!(SfcFormat::from_path("Card.vue"), Some(SfcFormat::Vue));
        assert_eq!(SfcFormat::from_path("Card.SVELTE"), Some(SfcFormat::Svelte));
        assert_eq!(SfcFormat::from_path("Card.astro"), Some(SfcFormat::Astro));
    }

    #[test]
    fn script_files_are_not_sfc_containers() {
        for path in ["Card.ts", "Card.tsx", "Card.jsx", "Card.vue.ts", "Card"] {
            assert_eq!(
                SfcFormat::from_path(path),
                None,
                "expected {path} to be skipped"
            );
        }
    }
}
