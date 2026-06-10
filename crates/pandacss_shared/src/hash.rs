/// Canonical `key=value` pairs for a compound-variant definition (sorted keys).
#[must_use]
pub fn compound_combo_string(pairs: &[(impl AsRef<str>, impl AsRef<str>)]) -> String {
    let mut sorted: Vec<_> = pairs
        .iter()
        .map(|(key, value)| (key.as_ref(), value.as_ref()))
        .collect();
    sorted.sort_by_key(|(key, _)| *key);
    sorted
        .iter()
        .map(|(key, value)| format!("{key}={value}"))
        .collect::<Vec<_>>()
        .join(",")
}

/// Class name for a config-recipe compound variant: author `className` or
/// `{base}--{hash(combo)}` / `{base}--compound__{key}{separator}{value}__...`
/// when hashing is disabled.
#[must_use]
pub fn compound_class_name(
    base_class: &str,
    pairs: &[(impl AsRef<str>, impl AsRef<str>)],
    author_class_name: Option<&str>,
    separator: &str,
    hash_class_names: bool,
) -> String {
    if let Some(name) = author_class_name {
        return name.to_owned();
    }
    let combo = compound_combo_string(pairs);
    let suffix = if hash_class_names {
        to_hash(&combo)
    } else {
        compound_readable_suffix(pairs, separator)
    };
    format!("{base_class}--{suffix}")
}

fn compound_readable_suffix(
    pairs: &[(impl AsRef<str>, impl AsRef<str>)],
    separator: &str,
) -> String {
    let mut sorted: Vec<_> = pairs
        .iter()
        .map(|(key, value)| (key.as_ref(), value.as_ref()))
        .collect();
    sorted.sort_by_key(|(key, _)| *key);
    let pairs = sorted
        .iter()
        .map(|(key, value)| {
            format!(
                "{}{}{}",
                without_space(key),
                separator,
                without_space(value)
            )
        })
        .collect::<Vec<_>>()
        .join("__");
    format!("compound__{pairs}")
}

fn without_space(value: &str) -> String {
    value.replace(' ', "_")
}

/// JS-compatible hash used by Panda's CSS variable hashing.
///
/// This mirrors `packages/shared/src/hash.ts` but keeps the hot path
/// allocation-free for ASCII token names, which is the overwhelmingly
/// common case (`colors-red-500`, `spacing-sm`, ...).
#[must_use]
pub fn to_hash(value: &str) -> String {
    to_name(to_phash(5381, value).cast_unsigned())
}

/// DJB2-style rolling hash over the string in reverse, matching the JS source.
fn to_phash(mut h: i32, value: &str) -> i32 {
    // Fast path: a byte is its own char code for ASCII, so skip UTF-16 encoding.
    if value.is_ascii() {
        for byte in value.bytes().rev() {
            h = h.wrapping_mul(33) ^ i32::from(byte);
        }

        return h;
    }

    // Non-ASCII: hash UTF-16 code units to match JS `charCodeAt` semantics.
    for ch in value.chars().rev() {
        let mut units = [0u16; 2];
        let encoded = ch.encode_utf16(&mut units);

        for unit in encoded.iter().rev() {
            h = h.wrapping_mul(33) ^ i32::from(*unit);
        }
    }

    h
}

/// Encode the hash code as a base-52 `[a-zA-Z]` name, least-significant digit
/// first into a fixed buffer (filled back-to-front).
fn to_name(code: u32) -> String {
    let mut chars = [0u8; 8];
    let mut index = chars.len();
    let mut x = code;

    loop {
        index -= 1;
        chars[index] = to_char(x % 52);

        if x <= 52 {
            break;
        }

        x /= 52;
    }

    String::from_utf8_lossy(&chars[index..]).into_owned()
}

/// Map a base-52 digit to ASCII: `0..=25` -> `a-z`, `26..=51` -> `A-Z`.
fn to_char(code: u32) -> u8 {
    debug_assert!(code < 52);

    let byte = code + if code > 25 { 39 } else { 97 };
    u8::try_from(byte).expect("base52 hash character fits in ASCII")
}

#[cfg(test)]
mod tests {
    use super::{compound_class_name, to_hash};

    #[test]
    fn compound_class_name_uses_readable_variant_pairs_when_unhashed() {
        assert_eq!(
            compound_class_name(
                "badge",
                &[("size", "md"), ("raised", "true")],
                None,
                "_",
                false,
            ),
            "badge--compound__raised_true__size_md"
        );
    }

    #[test]
    fn compound_class_name_uses_configured_separator_when_unhashed() {
        assert_eq!(
            compound_class_name(
                "badge",
                &[("size", "md"), ("raised", "true")],
                None,
                "-",
                false,
            ),
            "badge--compound__raised-true__size-md"
        );
    }

    #[test]
    fn compound_class_name_does_not_collide_with_single_variant_class() {
        assert_eq!(
            compound_class_name("badge", &[("size", "md")], None, "_", false),
            "badge--compound__size_md"
        );
    }

    #[test]
    fn compound_class_name_hashes_canonical_pairs() {
        assert_eq!(
            compound_class_name(
                "badge",
                &[("size", "md"), ("raised", "true")],
                None,
                "_",
                true,
            ),
            format!("badge--{}", to_hash("raised=true,size=md"))
        );
    }

    #[test]
    fn compound_class_name_preserves_author_class_name() {
        assert_eq!(
            compound_class_name("badge", &[("size", "md")], Some("custom"), "_", false),
            "custom"
        );
    }
}
