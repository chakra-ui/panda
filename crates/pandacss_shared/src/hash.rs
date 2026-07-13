/// Sorted `key=value,...` string identifying a compound-variant combo.
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

/// Compound-variant class name: author `className`, else `{base}--{hash(combo)}`
/// or `{base}--compound__{key}{separator}{value}__...` when hashing is off.
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

#[must_use]
pub fn without_space(value: &str) -> String {
    value.replace(' ', "_")
}

/// `FxHasher`-backed hash; not adversary-resistant, so only for internal
/// cache keys and fingerprints (`design-notes/performance-budget.md`).
#[must_use]
pub fn fx_hash(value: impl std::hash::Hash) -> u64 {
    use std::hash::Hasher;
    let mut hasher = rustc_hash::FxHasher::default();
    value.hash(&mut hasher);
    hasher.finish()
}

/// JS-compatible hash for CSS variable naming; mirrors `packages/shared/src/hash.ts`.
/// Allocation-free on the hot path for ASCII token names (`colors-red-500`, `spacing-sm`).
#[must_use]
pub fn to_hash(value: &str) -> String {
    to_name(to_phash(5381, value).cast_unsigned())
}

/// DJB2 rolling hash over the string in reverse, matching the JS source.
fn to_phash(mut h: i32, value: &str) -> i32 {
    // ASCII bytes are their own char codes, so skip UTF-16 encoding.
    if value.is_ascii() {
        for byte in value.bytes().rev() {
            h = h.wrapping_mul(33) ^ i32::from(byte);
        }

        return h;
    }

    // Non-ASCII: hash UTF-16 code units to match JS `charCodeAt`.
    for ch in value.chars().rev() {
        let mut units = [0u16; 2];
        let encoded = ch.encode_utf16(&mut units);

        for unit in encoded.iter().rev() {
            h = h.wrapping_mul(33) ^ i32::from(*unit);
        }
    }

    h
}

/// Base-52 `[a-zA-Z]` encoding of the hash code, least-significant digit first.
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
