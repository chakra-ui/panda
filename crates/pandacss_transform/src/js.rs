//! Printing rewritten source as JavaScript.

/// A string literal, escaping quotes and backslashes.
pub(crate) fn string(value: &str) -> String {
    serde_json::to_string(value).expect("string serializes as JSON")
}

/// Escape for use inside a single-quoted literal.
pub(crate) fn escape(value: &str) -> String {
    value.replace('\\', "\\\\").replace('\'', "\\'")
}

/// An object key: bare when it is an identifier, quoted otherwise.
pub(crate) fn key(name: &str) -> String {
    let is_identifier = !name.is_empty()
        && !name.starts_with(|ch: char| ch.is_ascii_digit())
        && name
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '$');
    if is_identifier {
        name.to_owned()
    } else {
        format!("'{}'", escape(name))
    }
}

pub(crate) fn field(name: &str, value: impl std::fmt::Display) -> String {
    format!("{}: {value}", key(name))
}

/// `{ a: 1, b: 2 }` from printed fields; `{}` when there are none.
pub(crate) fn object(fields: impl IntoIterator<Item = String>) -> String {
    let fields = fields.into_iter().collect::<Vec<_>>();
    if fields.is_empty() {
        "{}".to_owned()
    } else {
        format!("{{ {} }}", fields.join(", "))
    }
}
