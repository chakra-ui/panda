/// JS-compatible hash used by Panda's CSS variable hashing.
///
/// This mirrors `packages/shared/src/hash.ts` but keeps the hot path
/// allocation-free for ASCII token names, which is the overwhelmingly
/// common case (`colors-red-500`, `spacing-sm`, ...).
#[must_use]
pub fn to_hash(value: &str) -> String {
    to_name(to_phash(5381, value).cast_unsigned())
}

fn to_phash(mut h: i32, value: &str) -> i32 {
    if value.is_ascii() {
        for byte in value.bytes().rev() {
            h = h.wrapping_mul(33) ^ i32::from(byte);
        }
        return h;
    }

    for ch in value.chars().rev() {
        let mut units = [0u16; 2];
        let encoded = ch.encode_utf16(&mut units);
        for unit in encoded.iter().rev() {
            h = h.wrapping_mul(33) ^ i32::from(*unit);
        }
    }
    h
}

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

fn to_char(code: u32) -> u8 {
    debug_assert!(code < 52);
    let byte = code + if code > 25 { 39 } else { 97 };
    u8::try_from(byte).expect("base52 hash character fits in ASCII")
}
