#![allow(dead_code)]

use pandacss_extractor::{
    ExtractorConfig, JsxExtractionConfig, Matcher, Matchers, NameMatcher, TokenDictionary,
};

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
        jsx_factories: None,
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
        ..Default::default()
    }
}

pub fn jsx_config<const N: usize>(names: [&str; N]) -> ExtractorConfig {
    ExtractorConfig::new(jsx_matchers(names))
}
