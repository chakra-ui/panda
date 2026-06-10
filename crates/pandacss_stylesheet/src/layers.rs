//! Cascade-layer declaration detection over raw CSS — used by bundler hosts to
//! find the stylesheet root (the file declaring `@layer reset, base, …;`) to
//! inject the compiled CSS into.

/// `true` when `css` contains an `@layer a, b, c;` *statement* (not a
/// `@layer x { … }` block) whose comma list includes every name in `layers`.
/// A declared sub-layer (`recipes.base`) satisfies a root-layer lookup
/// (`recipes`) so host code can still find the stylesheet root after recipe
/// sub-layers are expanded in the declaration.
#[must_use]
pub fn has_layer_declaration(css: &str, layers: &[&str]) -> bool {
    let mut rest = css;
    while let Some(idx) = rest.find("@layer") {
        let after = &rest[idx + "@layer".len()..];
        // Require whitespace after the keyword so names like `@layered` don't match.
        if !after.starts_with(char::is_whitespace) {
            rest = after;
            continue;
        }
        let semi = after.find(';');
        let brace = after.find('{');
        // A declaration statement ends in `;` before any `{` (which would be a block).
        if semi.is_some_and(|s| brace.is_none_or(|b| s < b)) {
            let declared: Vec<&str> = after[..semi.unwrap_or(0)]
                .split(',')
                .map(str::trim)
                .collect();
            if layers.iter().all(|name| declared_contains(&declared, name)) {
                return true;
            }
        }
        rest = after;
    }
    false
}

fn declared_contains(declared: &[&str], name: &str) -> bool {
    declared.iter().any(|declared| {
        *declared == name
            || declared
                .strip_prefix(name)
                .is_some_and(|rest| rest.starts_with('.'))
    })
}
