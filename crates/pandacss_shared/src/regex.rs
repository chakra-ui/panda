use regex::Regex;

/// Compile a JavaScript-style regex source and flags pair into Rust `regex`.
///
/// Supported semantic flags are `i`, `m`, and `s`. JS-only stateful/unicode
/// flags (`g`, `u`, `y`, `d`) are accepted and ignored because they don't
/// change simple `test()`-style matching for JSX component names here.
#[must_use]
pub fn compile_js_regex(source: &str, flags: &str) -> Option<Regex> {
    let mut options = String::new();
    for flag in flags.chars() {
        match flag {
            'i' | 'm' | 's' => options.push(flag),
            'g' | 'u' | 'y' | 'd' => {}
            _ => return None,
        }
    }
    if options.is_empty() {
        Regex::new(source).ok()
    } else {
        Regex::new(&format!("(?{options}:{source})")).ok()
    }
}
