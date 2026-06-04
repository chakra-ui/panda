#![allow(dead_code)]

use pandacss_extractor::{
    ExtractUsage, ExtractorConfig, ImportScanResult, JsxExtractionConfig, Literal, Matcher,
    Matchers, NameMatcher, TokenDictionary,
};
use serde::Serialize;

pub fn matcher<const N: usize>(module: &str, names: [&str; N]) -> Matcher {
    Matcher {
        modules: vec![module.into()],
        names: NameMatcher::only(names),
    }
}

pub fn any_matcher(module: &str) -> Matcher {
    Matcher {
        modules: vec![module.into()],
        names: NameMatcher::Any,
    }
}

pub fn panda_matchers() -> Matchers {
    Matchers {
        css: matcher("@panda/css", ["css", "cva", "sva"]),
        recipe: any_matcher("@panda/recipes"),
        pattern: any_matcher("@panda/patterns"),
        jsx: Some(matcher("@panda/jsx", ["styled", "Box"])),
        tokens: matcher("@panda/tokens", ["token"]),
        jsx_factories: Some(vec!["styled".into()]),
    }
}

pub fn panda_config() -> ExtractorConfig {
    ExtractorConfig::new(panda_matchers())
}

pub fn panda_config_with_jsx(jsx: JsxExtractionConfig) -> ExtractorConfig {
    panda_config().with_jsx(jsx)
}

pub fn panda_config_with_token_dictionary(dictionary: TokenDictionary) -> ExtractorConfig {
    panda_config().with_token_dictionary(dictionary)
}

pub fn css_matchers() -> Matchers {
    Matchers {
        css: matcher("@panda/css", ["css", "cva", "sva"]),
        ..Default::default()
    }
}

pub fn css_config() -> ExtractorConfig {
    ExtractorConfig::new(css_matchers())
}

pub fn jsx_matchers<const N: usize>(names: [&str; N]) -> Matchers {
    Matchers {
        jsx: Some(matcher("@panda/jsx", names)),
        jsx_factories: Some(vec!["styled".into()]),
        ..Default::default()
    }
}

pub fn jsx_config<const N: usize>(names: [&str; N]) -> ExtractorConfig {
    ExtractorConfig::new(jsx_matchers(names))
}

#[derive(Serialize)]
pub struct ExtractShape {
    pub calls: Vec<CallShape>,
    pub jsx: Vec<JsxShape>,
}

#[derive(Serialize)]
pub struct CallShape {
    pub name: String,
    pub data: serde_json::Value,
}

#[derive(Serialize)]
pub struct JsxShape {
    pub name: String,
    pub data: serde_json::Value,
}

pub fn extract_shape(result: &ExtractUsage) -> ExtractShape {
    ExtractShape {
        calls: result
            .calls
            .iter()
            .map(|call| CallShape {
                name: call.name.clone(),
                data: call
                    .data
                    .first()
                    .and_then(Option::as_ref)
                    .map_or(serde_json::Value::Null, Literal::to_json),
            })
            .collect(),
        jsx: result
            .jsx
            .iter()
            .map(|jsx| JsxShape {
                name: jsx.name.clone(),
                data: jsx.data.to_json(),
            })
            .collect(),
    }
}

#[derive(Serialize)]
pub struct ImportShape {
    pub module: String,
    pub specifiers: Vec<String>,
}

pub fn import_shape(scan: &ImportScanResult) -> Vec<ImportShape> {
    scan.imports
        .iter()
        .map(|import| ImportShape {
            module: import.module.clone(),
            specifiers: import
                .specifiers
                .iter()
                .map(|specifier| format!("{}:{}", specifier.imported, specifier.local))
                .collect(),
        })
        .collect()
}
