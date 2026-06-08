use fast_glob::glob_match;
use pandacss_shared::regex::compile_js_regex;

#[derive(Debug, Clone, Default)]
pub struct HookFilter {
    id_include: Vec<IdPattern>,
    id_exclude: Vec<IdPattern>,
    code_include: Vec<CodePattern>,
    code_exclude: Vec<CodePattern>,
}

impl HookFilter {
    #[must_use]
    pub fn admits(&self, path: &str, source: &str) -> bool {
        if !self.id_exclude.is_empty() && self.id_exclude.iter().any(|pat| pat.matches(path)) {
            return false;
        }
        if !self.id_include.is_empty() && !self.id_include.iter().any(|pat| pat.matches(path)) {
            return false;
        }
        if !self.code_exclude.is_empty() && self.code_exclude.iter().any(|pat| pat.matches(source))
        {
            return false;
        }
        if !self.code_include.is_empty() && !self.code_include.iter().any(|pat| pat.matches(source))
        {
            return false;
        }
        true
    }

    /// # Errors
    /// Returns an error when a regex filter cannot be compiled or the filter
    /// shape is not supported by the Rust hot-path matcher.
    pub fn from_json(value: &serde_json::Value) -> std::result::Result<Self, String> {
        if value.is_null() {
            return Ok(Self::default());
        }
        let Some(object) = value.as_object() else {
            return Err("hook filter must be an object".to_owned());
        };

        let mut filter = Self::default();
        if let Some(id) = object.get("id") {
            let (include, exclude) = parse_id_patterns(id)?;
            filter.id_include = include;
            filter.id_exclude = exclude;
        }
        if let Some(code) = object.get("code") {
            let Some(code) = code.as_object() else {
                return Err("hook filter `code` must be an object".to_owned());
            };
            if let Some(include) = code.get("include") {
                filter.code_include = parse_code_patterns(include)?;
            }
            if let Some(exclude) = code.get("exclude") {
                filter.code_exclude = parse_code_patterns(exclude)?;
            }
        }
        Ok(filter)
    }
}

#[derive(Debug, Clone)]
enum IdPattern {
    Glob(String),
    Regex(regex::Regex),
}

impl IdPattern {
    fn matches(&self, path: &str) -> bool {
        match self {
            Self::Glob(pattern) => glob_match(normalize_glob(pattern).as_bytes(), path.as_bytes()),
            Self::Regex(regex) => regex.is_match(path),
        }
    }
}

#[derive(Debug, Clone)]
enum CodePattern {
    Text(String),
    Regex(regex::Regex),
}

impl CodePattern {
    fn matches(&self, source: &str) -> bool {
        match self {
            Self::Text(text) => source.contains(text),
            Self::Regex(regex) => regex.is_match(source),
        }
    }
}

fn parse_id_patterns(
    value: &serde_json::Value,
) -> std::result::Result<(Vec<IdPattern>, Vec<IdPattern>), String> {
    if let Some(object) = value
        .as_object()
        .filter(|object| object.contains_key("include") || object.contains_key("exclude"))
    {
        let include = object
            .get("include")
            .map(parse_id_pattern_list)
            .transpose()?
            .unwrap_or_default();
        let exclude = object
            .get("exclude")
            .map(parse_id_pattern_list)
            .transpose()?
            .unwrap_or_default();
        return Ok((include, exclude));
    }

    Ok((parse_id_pattern_list(value)?, Vec::new()))
}

fn parse_id_pattern_list(value: &serde_json::Value) -> std::result::Result<Vec<IdPattern>, String> {
    match value {
        serde_json::Value::Array(items) => items.iter().map(parse_id_pattern).collect(),
        _ => Ok(vec![parse_id_pattern(value)?]),
    }
}

fn parse_id_pattern(value: &serde_json::Value) -> std::result::Result<IdPattern, String> {
    if let Some(pattern) = value.as_str() {
        return Ok(IdPattern::Glob(pattern.to_owned()));
    }
    let regex = parse_regex(value)?;
    Ok(IdPattern::Regex(regex))
}

fn parse_code_patterns(value: &serde_json::Value) -> std::result::Result<Vec<CodePattern>, String> {
    match value {
        serde_json::Value::Array(items) => items.iter().map(parse_code_pattern).collect(),
        _ => Ok(vec![parse_code_pattern(value)?]),
    }
}

fn parse_code_pattern(value: &serde_json::Value) -> std::result::Result<CodePattern, String> {
    if let Some(text) = value.as_str() {
        return Ok(CodePattern::Text(text.to_owned()));
    }
    let regex = parse_regex(value)?;
    Ok(CodePattern::Regex(regex))
}

fn parse_regex(value: &serde_json::Value) -> std::result::Result<regex::Regex, String> {
    let Some(object) = value.as_object() else {
        return Err("hook filter pattern must be a string or regex object".to_owned());
    };
    if object.get("kind").and_then(serde_json::Value::as_str) != Some("regex") {
        return Err("hook filter pattern object must have kind: \"regex\"".to_owned());
    }
    let source = object
        .get("source")
        .and_then(serde_json::Value::as_str)
        .ok_or_else(|| "hook filter regex is missing `source`".to_owned())?;
    let flags = object
        .get("flags")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();
    compile_js_regex(source, flags)
        .ok_or_else(|| format!("invalid hook filter regex /{source}/{flags}"))
}

fn normalize_glob(pattern: &str) -> &str {
    pattern.strip_prefix("./").unwrap_or(pattern)
}
