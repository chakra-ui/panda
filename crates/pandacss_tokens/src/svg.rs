//! SVG asset serialization: encode an inline SVG into a `data:` URI matching
//! the JS asset transformer byte-for-byte.

pub(crate) fn svg_to_data_uri(svg: &str) -> String {
    let svg = svg.strip_prefix('\u{feff}').unwrap_or(svg);
    let collapsed = collapse_whitespace(svg);
    let body = color_code_to_shorter_names(&collapsed).replace('"', "'");
    let mut out = String::from("data:image/svg+xml,");
    percent_encode_svg(&body, &mut out);
    out
}

fn collapse_whitespace(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut in_whitespace = false;
    for ch in value.trim().chars() {
        if ch.is_whitespace() {
            if !in_whitespace {
                out.push(' ');
                in_whitespace = true;
            }
        } else {
            out.push(ch);
            in_whitespace = false;
        }
    }
    out
}

/// CSS named colors that are shorter than their URL-encoded hex (`#` → `%23`).
///
/// Each row is `(name, six_digit_hex, optional_short_hex)`; the `(ff)?` / `(f)?`
/// alpha forms are derived. Order matches the JS `shorterNames` table so that on
/// hex collisions (aqua/cyan share `#00ffff`) the first-listed name wins.
const SHORTER_NAMES: &[(&str, &str, Option<&str>)] = &[
    ("aqua", "#00ffff", Some("#0ff")),
    ("azure", "#f0ffff", None),
    ("beige", "#f5f5dc", None),
    ("bisque", "#ffe4c4", None),
    ("black", "#000000", Some("#000")),
    ("blue", "#0000ff", Some("#00f")),
    ("brown", "#a52a2a", None),
    ("coral", "#ff7f50", None),
    ("cornsilk", "#fff8dc", None),
    ("crimson", "#dc143c", None),
    ("cyan", "#00ffff", Some("#0ff")),
    ("darkblue", "#00008b", None),
    ("darkcyan", "#008b8b", None),
    ("darkgrey", "#a9a9a9", None),
    ("darkred", "#8b0000", None),
    ("deeppink", "#ff1493", None),
    ("dimgrey", "#696969", None),
    ("gold", "#ffd700", None),
    ("green", "#008000", None),
    ("grey", "#808080", None),
    ("honeydew", "#f0fff0", None),
    ("hotpink", "#ff69b4", None),
    ("indigo", "#4b0082", None),
    ("ivory", "#fffff0", None),
    ("khaki", "#f0e68c", None),
    ("lavender", "#e6e6fa", None),
    ("lime", "#00ff00", Some("#0f0")),
    ("linen", "#faf0e6", None),
    ("maroon", "#800000", None),
    ("moccasin", "#ffe4b5", None),
    ("navy", "#000080", None),
    ("oldlace", "#fdf5e6", None),
    ("olive", "#808000", None),
    ("orange", "#ffa500", None),
    ("orchid", "#da70d6", None),
    ("peru", "#cd853f", None),
    ("pink", "#ffc0cb", None),
    ("plum", "#dda0dd", None),
    ("purple", "#800080", None),
    ("red", "#ff0000", Some("#f00")),
    ("salmon", "#fa8072", None),
    ("seagreen", "#2e8b57", None),
    ("seashell", "#fff5ee", None),
    ("sienna", "#a0522d", None),
    ("silver", "#c0c0c0", None),
    ("skyblue", "#87ceeb", None),
    ("snow", "#fffafa", None),
    ("tan", "#d2b48c", None),
    ("teal", "#008080", None),
    ("thistle", "#d8bfd8", None),
    ("tomato", "#ff6347", None),
    ("violet", "#ee82ee", None),
    ("wheat", "#f5deb3", None),
    ("white", "#ffffff", Some("#fff")),
];

/// Look up a lowercased `#hex` literal (with its `ff`/`f` alpha variants) against
/// the table, returning the first-listed name on a collision (`aqua` over `cyan`).
fn shorter_name_for(hex: &str) -> Option<&'static str> {
    for &(name, six, short) in SHORTER_NAMES {
        let eight = format!("{six}ff");
        if hex == six || hex == eight {
            return Some(name);
        }
        if let Some(short) = short {
            let short_alpha = format!("{short}f");
            if hex == short || hex == short_alpha {
                return Some(name);
            }
        }
    }
    None
}

/// Replace `#rrggbb`/`#rgb` (with optional `ff`/`f` alpha) hex colors with their
/// shorter CSS names, mirroring the JS `colorCodeToShorterNames` regex semantics:
/// case-insensitive, only `{3,4,6,8}`-digit runs, and a `(?!\w)` word boundary.
fn color_code_to_shorter_names(value: &str) -> String {
    let bytes = value.as_bytes();
    // Byte buffer: we only push ASCII names or copy original byte ranges, so
    // UTF-8 sequences are preserved intact.
    let mut out: Vec<u8> = Vec::with_capacity(value.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] != b'#' {
            // Copy the whole non-`#` run (including any UTF-8 multibyte chars).
            let start = i;
            while i < bytes.len() && bytes[i] != b'#' {
                i += 1;
            }
            out.extend_from_slice(&bytes[start..i]);
            continue;
        }

        let mut end = i + 1;
        while end < bytes.len() && end - (i + 1) < 8 && bytes[end].is_ascii_hexdigit() {
            end += 1;
        }
        let len = end - (i + 1);
        let boundary_ok =
            !matches!(bytes.get(end), Some(b) if b.is_ascii_alphanumeric() || *b == b'_');

        if matches!(len, 3 | 4 | 6 | 8) && boundary_ok {
            let hex = value[i..end].to_ascii_lowercase();
            if let Some(name) = shorter_name_for(&hex) {
                out.extend_from_slice(name.as_bytes());
                i = end;
                continue;
            }
        }

        out.push(b'#');
        i += 1;
    }
    // All input bytes were valid UTF-8 and we only added ASCII; the result is too.
    String::from_utf8(out).unwrap_or_else(|_| value.to_string())
}

fn percent_encode_svg(value: &str, out: &mut String) {
    const HEX: &[u8; 16] = b"0123456789ABCDEF";
    for byte in value.bytes() {
        match byte {
            b' ' | b'=' | b':' | b'/' => out.push(byte as char),
            b'A'..=b'Z'
            | b'a'..=b'z'
            | b'0'..=b'9'
            | b'-'
            | b'_'
            | b'.'
            | b'!'
            | b'~'
            | b'*'
            | b'\''
            | b'('
            | b')' => {
                out.push(byte as char);
            }
            byte => {
                out.push('%');
                out.push(HEX[(byte >> 4) as usize] as char);
                out.push(HEX[(byte & 0x0f) as usize].to_ascii_lowercase() as char);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{color_code_to_shorter_names, svg_to_data_uri};

    #[test]
    fn shortens_six_digit_hex() {
        assert_eq!(color_code_to_shorter_names("#008000"), "green");
        assert_eq!(color_code_to_shorter_names("#ffa500"), "orange");
    }

    #[test]
    fn shortens_short_form_hex() {
        assert_eq!(color_code_to_shorter_names("#000"), "black");
        assert_eq!(color_code_to_shorter_names("#fff"), "white");
    }

    #[test]
    fn shortens_alpha_form_hex() {
        assert_eq!(color_code_to_shorter_names("#ffffffff"), "white");
    }

    #[test]
    fn does_not_match_non_alpha_eight_digit() {
        assert_eq!(color_code_to_shorter_names("#00ffffaa"), "#00ffffaa");
    }

    #[test]
    fn respects_word_boundary() {
        // `#fff` is followed by `000`, so it is a 6-digit hex, not the short form.
        assert_eq!(color_code_to_shorter_names("#fff000"), "#fff000");
    }

    #[test]
    fn leaves_unnamed_colors_untouched() {
        assert_eq!(color_code_to_shorter_names("#abcdef"), "#abcdef");
    }

    #[test]
    fn is_case_insensitive() {
        assert_eq!(color_code_to_shorter_names("#FFFFFF"), "white");
        assert_eq!(color_code_to_shorter_names("#FF0000"), "red");
    }

    #[test]
    fn aqua_wins_over_cyan_on_collision() {
        assert_eq!(color_code_to_shorter_names("#00ffff"), "aqua");
        assert_eq!(color_code_to_shorter_names("#0ff"), "aqua");
        assert_eq!(color_code_to_shorter_names("#00ffffff"), "aqua");
    }

    #[test]
    fn handles_realistic_snippet() {
        assert_eq!(
            color_code_to_shorter_names(r##"fill="#ff0000" stroke="#000""##),
            r#"fill="red" stroke="black""#
        );
    }

    #[test]
    fn preserves_non_ascii_text() {
        assert_eq!(color_code_to_shorter_names("café #000 ☃"), "café black ☃");
    }

    #[test]
    fn end_to_end_data_uri_shortens_hex() {
        let uri = svg_to_data_uri(r##"<svg><path fill="#ff0000"/></svg>"##);
        assert!(uri.starts_with("data:image/svg+xml,"));
        assert!(uri.contains("red"), "expected shortened color in {uri}");
        assert!(!uri.contains("ff0000"), "hex should be replaced in {uri}");
    }
}
