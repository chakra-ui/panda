use std::time::Instant;

use pandacss_config::UserConfig;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use serde_json::{Value, json};

#[derive(Debug, Clone, Copy)]
struct Args {
    tokens: usize,
    warm: usize,
    lookup: usize,
}

fn main() {
    let args = parse_args();
    let config = generated_config(args.tokens);

    for _ in 0..args.warm {
        let _ = TokenDictionary::from_config(&config).expect("token dictionary");
    }

    let build_start = Instant::now();
    let dict = TokenDictionary::from_config(&config)
        .expect("token dictionary")
        .expect("non-empty dictionary");
    let build_ms = build_start.elapsed().as_secs_f64() * 1000.0;

    let lookup_start = Instant::now();
    let mut checksum = 0usize;
    for i in 0..args.lookup {
        let path = format!("colors.palette{}.500", i % args.tokens);
        if let Some(value) = dict.get_str(&path, None) {
            checksum = checksum.wrapping_add(value.len());
        }
    }
    let lookup_ms = lookup_start.elapsed().as_secs_f64() * 1000.0;

    let var_lookup_start = Instant::now();
    for i in 0..args.lookup {
        let path = format!("colors.palette{}.500", i % args.tokens);
        if let Some(value) = dict.get_var_str(&path, None) {
            checksum = checksum.wrapping_add(value.len());
        }
    }
    let var_lookup_ms = var_lookup_start.elapsed().as_secs_f64() * 1000.0;

    let category_start = Instant::now();
    let colors = dict
        .category_values_str(&TokenCategory::Colors)
        .expect("colors category");
    checksum = checksum.wrapping_add(colors.len());
    let category_ms = category_start.elapsed().as_secs_f64() * 1000.0;

    println!(
        "{}",
        json!({
            "engine": "rust",
            "inputTokens": args.tokens,
            "dictionaryTokens": dict.len(),
            "buildMs": build_ms,
            "lookupIterations": args.lookup,
            "lookupMs": lookup_ms,
            "varLookupMs": var_lookup_ms,
            "categoryValuesMs": category_ms,
            "checksum": checksum,
        })
    );
}

fn parse_args() -> Args {
    let mut args = Args {
        tokens: 1_000,
        warm: 5,
        lookup: 100_000,
    };
    let mut iter = std::env::args().skip(1);
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--tokens" => {
                args.tokens = iter
                    .next()
                    .and_then(|value| value.parse().ok())
                    .unwrap_or(args.tokens);
            }
            "--warm" => {
                args.warm = iter
                    .next()
                    .and_then(|value| value.parse().ok())
                    .unwrap_or(args.warm);
            }
            "--lookup" => {
                args.lookup = iter
                    .next()
                    .and_then(|value| value.parse().ok())
                    .unwrap_or(args.lookup);
            }
            _ => {}
        }
    }
    args
}

fn generated_config(tokens: usize) -> UserConfig {
    serde_json::from_value(json!({
        "theme": {
            "tokens": {
                "colors": generated_colors(tokens),
                "spacing": generated_spacing(tokens / 4),
            },
            "semanticTokens": {
                "colors": generated_semantic_colors(tokens / 4),
            },
            "breakpoints": {
                "sm": "640px",
                "md": "768px",
                "lg": "1024px",
            }
        }
    }))
    .expect("generated config")
}

fn generated_colors(count: usize) -> Value {
    let mut colors = serde_json::Map::with_capacity(count);
    for i in 0..count {
        colors.insert(
            format!("palette{i}"),
            json!({
                "500": {
                    "value": format!("#{:06x}", i % 0xFF_FFFF),
                }
            }),
        );
    }
    Value::Object(colors)
}

fn generated_spacing(count: usize) -> Value {
    let mut spacing = serde_json::Map::with_capacity(count);
    for i in 0..count {
        spacing.insert(
            i.to_string(),
            json!({
                "value": format!("{}rem", i + 1),
            }),
        );
    }
    Value::Object(spacing)
}

fn generated_semantic_colors(count: usize) -> Value {
    let mut colors = serde_json::Map::with_capacity(count);
    for i in 0..count {
        colors.insert(
            format!("fg{i}"),
            json!({
                "value": {
                    "base": format!("{{colors.palette{i}.500}}"),
                    "_dark": format!("#{:06x}", (i + 17) % 0xFF_FFFF),
                }
            }),
        );
    }
    Value::Object(colors)
}
