use regex::Regex;

/// Compiles a JS `(source, flags)` regex pair into Rust `regex`. `i`/`m`/`s`
/// map directly; `g`/`u`/`y`/`d` are accepted but ignored — irrelevant for
/// the simple `test()`-style matching used here.
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
