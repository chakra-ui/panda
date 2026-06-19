#!/usr/bin/env python3
"""Generate property value entries for strict_props.rs (keywords + composite kinds).

Usage (from repo root):
  python3 crates/pandacss_codegen/scripts/sync_strict_props.py [--write]
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CSSTYPE = ROOT / "packages/types/src/csstype.d.ts"
CSS_NAMES = ROOT / "crates/pandacss_shared/src/css_properties.rs"
STRICT_PROPS = ROOT / "crates/pandacss_codegen/src/artifacts/types/strict_props.rs"

GLOBALS = {"inherit", "initial", "revert", "revert-layer", "unset"}
MAX_KEYWORD_ENTRIES = 120

SHORTHAND_EXACT = {
    "background",
    "border",
    "borderTop",
    "borderRight",
    "borderBottom",
    "borderLeft",
    "borderBlock",
    "borderInline",
    "outline",
    "mask",
    "transition",
    "animation",
    "font",
    "grid",
    "gridTemplate",
    "gridTemplateAreas",
    "gridTemplateColumns",
    "gridTemplateRows",
    "listStyle",
    "columns",
    "columnRule",
    "flex",
    "scrollMargin",
    "scrollPadding",
    "scrollTimeline",
    "viewTimeline",
    "timelineScope",
    "offset",
    "textDecoration",
    "textEmphasis",
    "textShadow",
    "boxShadow",
    "filter",
    "backdropFilter",
    "transform",
    "translate",
    "rotate",
    "scale",
    "content",
    "cursor",
}

KEYWORD_EXCLUDE = {
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    "positionArea",
    "positionTry",
    "positionTryFallbacks",
    "textDecoration",
    "fontVariant",
    "alignTracks",
    "justifyTracks",
    "backgroundBlendMode",
}

NUMERIC_EXACT = {
    "opacity",
    "flexGrow",
    "flexShrink",
    "order",
    "zoom",
    "lineHeight",
    "orphans",
    "widows",
    "zIndex",
}

FONT_WEIGHT_EXACT = {"fontWeight"}
FONT_FAMILY_EXACT = {"fontFamily"}
FONT_SIZE_EXACT = {"fontSize"}
BG_SIZE_EXACT = {"backgroundSize"}
POSITION_EXACT = {
    "backgroundPosition",
    "objectPosition",
    "perspectiveOrigin",
    "maskPosition",
    "scrollSnapDestination",
    "offsetPosition",
    "offsetAnchor",
}

LINE_STYLE_EXACT = {
    "borderBlockEndStyle",
    "borderBlockStartStyle",
    "borderBlockStyle",
    "borderBottomStyle",
    "borderInlineEndStyle",
    "borderInlineStartStyle",
    "borderInlineStyle",
    "borderLeftStyle",
    "borderRightStyle",
    "borderStyle",
    "borderTopStyle",
    "columnRuleStyle",
}
REPEAT_STYLE_EXACT = {"backgroundRepeat", "maskRepeat"}
FONT_STRETCH_EXACT = {"fontStretch", "fontWidth"}
FONT_STRETCH_KEYWORD_VALUES = [
    "condensed",
    "expanded",
    "extra-condensed",
    "extra-expanded",
    "normal",
    "semi-condensed",
    "semi-expanded",
    "ultra-condensed",
    "ultra-expanded",
]
OVERFLOW_EXACT = {"overflow", "overflowX", "overflowY"}
OVERFLOW_SHORT_EXACT = {"overflowBlock", "overflowInline"}
OVERSCROLL_BEHAVIOR_EXACT = {
    "overscrollBehavior",
    "overscrollBehaviorX",
    "overscrollBehaviorY",
}

OVERFLOW_KEYWORDS = [
    "-moz-hidden-unscrollable",
    "auto",
    "clip",
    "hidden",
    "overlay",
    "scroll",
    "visible",
]
OVERFLOW_SHORT_KEYWORDS = ["auto", "clip", "hidden", "scroll", "visible"]
OVERSCROLL_BEHAVIOR_KEYWORDS = ["auto", "contain", "none"]

COLOR_NAME_BLOCK = {
    "colorScheme",
    "colorRendering",
    "colorInterpolation",
    "colorInterpolationFilters",
    "caretShape",
}


def to_camel(name: str) -> str:
    return name[0].lower() + name[1:] if name else name


def load_namespace_block(source: str, namespace: str) -> str:
    marker = f"export namespace {namespace}"
    start = source.find(marker)
    if start == -1:
        raise SystemExit(f"missing namespace {namespace}")
    start = source.find("{", start) + 1
    depth = 1
    i = start
    while i < len(source) and depth:
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
        i += 1
    return source[start : i - 1]


def parse_type_aliases(block: str) -> dict[str, str]:
    aliases: dict[str, str] = {}
    for match in re.finditer(
        r"(?:export )?type (\w+)(?:<[^>]*>)?\s*=\s*([^;]+);",
        block,
        re.MULTILINE,
    ):
        aliases[match.group(1)] = " ".join(match.group(2).split())
    return aliases


def load_property_types(source: str) -> dict[str, str]:
    block = load_namespace_block(source, "Property")
    return {to_camel(name): body for name, body in parse_type_aliases(block).items()}


def load_data_types(source: str) -> dict[str, str]:
    return parse_type_aliases(load_namespace_block(source, "DataType"))


def split_union(type_expr: str) -> list[str]:
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    for ch in type_expr:
        if ch == "<":
            depth += 1
        elif ch == ">":
            depth -= 1
        if ch == "|" and depth == 0:
            part = "".join(current).strip()
            if part:
                parts.append(part)
            current = []
            continue
        current.append(ch)
    tail = "".join(current).strip()
    if tail:
        parts.append(tail)
    return parts


def expand_type(
    type_expr: str,
    data_types: dict[str, str],
    seen: set[str] | None = None,
) -> tuple[set[str], bool]:
    if seen is None:
        seen = set()
    type_expr = " ".join(type_expr.split())
    open_union = "(string & {})" in type_expr
    keywords: set[str] = set()
    for part in split_union(type_expr):
        part = part.strip()
        if not part or part == "Globals":
            continue
        if part.startswith('"') and part.endswith('"'):
            keywords.add(part[1:-1])
            continue
        if part in ("(string & {})", "(number & {})"):
            continue
        if re.match(r"T\w+$", part):
            continue
        if part.startswith("DataType."):
            dt_name = part.removeprefix("DataType.")
            if dt_name in seen:
                continue
            seen.add(dt_name)
            if dt_name not in data_types:
                continue
            nested_kw, nested_open = expand_type(data_types[dt_name], data_types, seen)
            keywords |= nested_kw
            open_union = open_union or nested_open
            continue
        if part in data_types:
            if part in seen:
                continue
            seen.add(part)
            nested_kw, nested_open = expand_type(data_types[part], data_types, seen)
            keywords |= nested_kw
            open_union = open_union or nested_open
            continue
        if "<" in part:
            continue
    keywords -= GLOBALS
    return keywords, open_union


def load_css_property_names() -> set[str]:
    return set(re.findall(r'"(\w+)"', CSS_NAMES.read_text()))


def is_length_name(name: str) -> bool:
    if name in SHORTHAND_EXACT:
        return False
    if name in NUMERIC_EXACT:
        return False
    exact = {
        "width",
        "height",
        "top",
        "right",
        "bottom",
        "left",
        "inset",
        "gap",
        "margin",
        "padding",
        "flexBasis",
        "blockSize",
        "inlineSize",
        "tabSize",
        "perspective",
    }
    if name in exact:
        return True
    hints = (
        "Width",
        "Height",
        "Size",
        "Top",
        "Right",
        "Bottom",
        "Left",
        "Inset",
        "Gap",
        "Radius",
        "Spacing",
        "Thickness",
        "Indent",
        "Offset",
        "Basis",
        "Margin",
        "Padding",
        "Translate",
        "Perspective",
        "Shift",
    )
    return any(h in name for h in hints)


def is_color_name(name: str) -> bool:
    if name in SHORTHAND_EXACT or name in COLOR_NAME_BLOCK:
        return False
    if name in ("color", "fill", "stroke", "caretColor", "accentColor"):
        return True
    return name.endswith("Color")


def classify_family(name: str, body: str) -> str | None:
    if name in SHORTHAND_EXACT:
        return None
    if name == "zIndex":
        return "ZIndex"
    if name in FONT_WEIGHT_EXACT:
        return "FontWeight"
    if name in FONT_FAMILY_EXACT:
        return "FontFamily"
    if name in FONT_SIZE_EXACT:
        return "FontSize"
    if name in BG_SIZE_EXACT:
        return "BgSize"
    if name in POSITION_EXACT and (
        "DataType.BgPosition" in body or "DataType.Position" in body
    ):
        return "Position"
    if name in NUMERIC_EXACT and name != "zIndex":
        return "Numeric"
    if name.endswith("Width") and "DataType.LineWidth" in body:
        return "LineWidth"
    if is_color_name(name) and "DataType.Color" in body:
        return "Color"
    if is_length_name(name) and ("TLength" in body or "number & {}" in body or "string & {}" in body):
        return "Length"
    return None


def classify_keyword_family(
    name: str,
    body: str,
    keywords: list[str],
    open_: bool,
) -> str | None:
    keyword_set = set(keywords)
    if name in LINE_STYLE_EXACT and "DataType.LineStyle" in body:
        return f"LineStyle {{ open: {str(open_).lower()} }}"
    if name in REPEAT_STYLE_EXACT and "DataType.RepeatStyle" in body:
        return "RepeatStyle"
    if name in FONT_STRETCH_EXACT and (
        "DataType.FontStretchAbsolute" in body
        or keyword_set == set(FONT_STRETCH_KEYWORD_VALUES)
    ):
        return "FontStretch"
    if name in OVERFLOW_EXACT and keyword_set == set(OVERFLOW_KEYWORDS):
        return f"Overflow {{ open: {str(open_).lower()} }}"
    if name in OVERFLOW_SHORT_EXACT and keyword_set == set(OVERFLOW_SHORT_KEYWORDS):
        return "OverflowShort"
    if name in OVERSCROLL_BEHAVIOR_EXACT and keyword_set == set(OVERSCROLL_BEHAVIOR_KEYWORDS):
        return f"OverscrollBehavior {{ open: {str(open_).lower()} }}"
    return None


def rust_keywords_entry(name: str, keywords: list[str], open_: bool) -> str:
    kw = ", ".join(f'"{k}"' for k in keywords)
    return (
        f'    PropertyValueEntry {{ name: "{name}", kind: PropertyValueKind::Keywords '
        f"{{ keywords: &[{kw}], open: {str(open_).lower()} }} }},"
    )


def rust_family_entry(name: str, family: str) -> str:
    return f'    PropertyValueEntry {{ name: "{name}", kind: PropertyValueKind::{family} }},'


def parse_existing_keywords(text: str) -> dict[str, tuple[list[str], bool]]:
    merged: dict[str, tuple[list[str], bool]] = {}
    for match in re.finditer(
        r'PropertyValueEntry \{ name: "(\w+)", kind: PropertyValueKind::Keywords \{ keywords: &\[(.*?)\], open: (\w+) \} \}',
        text,
        re.DOTALL,
    ):
        name = match.group(1)
        open_ = match.group(3) == "true"
        keywords = re.findall(r'"([^"]+)"', match.group(2))
        merged[name] = (keywords, open_)
    # legacy StrictPropertyEntry rows (first run after refactor)
    for match in re.finditer(
        r'StrictPropertyEntry \{ name: "(\w+)", open: (\w+), keywords: &\[(.*?)\] \}',
        text,
        re.DOTALL,
    ):
        name = match.group(1)
        if name in merged:
            continue
        open_ = match.group(2) == "true"
        keywords = re.findall(r'"([^"]+)"', match.group(3))
        merged[name] = (keywords, open_)
    return merged


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    source = CSSTYPE.read_text()
    properties = load_property_types(source)
    data_types = load_data_types(source)
    css_names = load_css_property_names()
    text = STRICT_PROPS.read_text()

    priority = {
        "textAlign",
        "textAlignLast",
        "textTransform",
        "textDecorationLine",
        "textDecorationStyle",
        "textOverflow",
        "textRendering",
        "textWrap",
        "textWrapMode",
        "textWrapStyle",
        "textOrientation",
        "textJustify",
        "whiteSpace",
        "whiteSpaceCollapse",
        "wordWrap",
        "verticalAlign",
        "cursor",
        "listStyleType",
        "listStylePosition",
        "listStyleImage",
        "justifyContent",
        "justifyItems",
        "justifySelf",
        "placeContent",
        "placeItems",
        "placeSelf",
        "gridAutoFlow",
        "overscrollBehavior",
        "overscrollBehaviorX",
        "overscrollBehaviorY",
        "scrollSnapType",
        "scrollSnapAlign",
        "scrollSnapStop",
        "fontStyle",
        "tableLayout",
        "unicodeBidi",
        "contain",
        "containerType",
        "fieldSizing",
        "colorScheme",
        "flexFlow",
        "imageRendering",
        "dominantBaseline",
        "borderStyle",
        "textEmphasisPosition",
        "textDecorationSkipInk",
        "transitionBehavior",
        "transitionProperty",
        "hyphens",
    }

    keywords_map = parse_existing_keywords(text)

    new_keywords: dict[str, tuple[list[str], bool]] = {}
    for name in sorted(css_names):
        if name in KEYWORD_EXCLUDE or name not in properties:
            continue
        body = properties[name]
        if "TLength" in body and name not in priority:
            continue
        kws, open_ = expand_type(body, data_types)
        if not kws and not open_:
            continue
        if len(kws) <= 1 and open_ and name not in priority:
            continue
        if "DataType.Color" in body and len(kws) == 0:
            continue
        if name in priority or len(kws) >= 2 or (len(kws) >= 1 and not open_):
            new_keywords[name] = (sorted(kws), open_)

    if len(keywords_map) < MAX_KEYWORD_ENTRIES:
        slots = MAX_KEYWORD_ENTRIES - len(keywords_map)
        ranked = sorted(
            new_keywords.items(),
            key=lambda item: (item[0] not in priority, -len(item[1][0]), item[0]),
        )
        for name, data in ranked[:slots]:
            keywords_map.setdefault(name, data)

    family_map: dict[str, str] = {}
    for name in sorted(css_names):
        if name not in properties:
            continue
        body = properties[name]
        kws, open_ = expand_type(body, data_types)
        family = classify_keyword_family(name, body, sorted(kws), open_)
        if family:
            family_map[name] = family
            continue
        if name in keywords_map:
            keywords, open_ = keywords_map[name]
            family = classify_keyword_family(name, body, keywords, open_)
            if family:
                family_map[name] = family
            continue
        family = classify_family(name, body)
        if family:
            family_map[name] = family

    lines: list[str] = []
    for name in sorted(set(keywords_map) | set(family_map)):
        if name in family_map:
            lines.append(rust_family_entry(name, family_map[name]))
        elif name in keywords_map:
            kws, open_ = keywords_map[name]
            lines.append(rust_keywords_entry(name, kws, open_))

    print(f"keywords={len(keywords_map)} families={len(family_map)} total={len(lines)}")
    for name, family in sorted(family_map.items())[:15]:
        print(f"  family {name}: {family}")
    if len(family_map) > 15:
        print(f"  ... +{len(family_map) - 15} more family entries")

    if not args.write:
        print("\n(dry run — pass --write to update strict_props.rs)")
        return

    start = text.find("// @generated-start")
    end = text.find("// @generated-end")
    if start == -1 or end == -1:
        raise SystemExit("strict_props.rs: missing @generated markers")

    body = "\n".join(lines)
    new_text = (
        text[: start + len("// @generated-start — sync_strict_props.py\n")]
        + "#[rustfmt::skip]\n"
        + f"pub(crate) const PROPERTY_VALUES: &[PropertyValueEntry] = &[\n{body}\n];\n"
        + text[end:]
    )
    STRICT_PROPS.write_text(new_text)
    write_data_type(source, data_types)
    print(f"wrote {STRICT_PROPS}")


def quoted_literals(type_expr: str) -> list[str]:
    return re.findall(r'"([^"]+)"', type_expr)


def datatype_keyword_literals(data_types: dict[str, str], type_name: str) -> list[str]:
    body = data_types.get(type_name)
    if not body:
        raise SystemExit(f"csstype: missing DataType.{type_name}")
    return sorted(set(quoted_literals(body)))


def expanded_datatype_literals(data_types: dict[str, str], type_name: str) -> list[str]:
    body = data_types.get(type_name)
    if not body:
        raise SystemExit(f"csstype: missing DataType.{type_name}")
    keywords, _ = expand_type(body, data_types)
    return sorted(keywords)


def extract_named_colors(source: str) -> list[str]:
    block = load_namespace_block(source, "DataType")
    match = re.search(r"type NamedColor\s*=(.+?);", block, re.S)
    if not match:
        raise SystemExit("csstype: missing DataType.NamedColor")
    return quoted_literals(match.group(1))


def write_data_type(source: str, data_types: dict[str, str]) -> None:
    path = ROOT / "crates/pandacss_codegen/src/artifacts/types/data_type.rs"
    named_colors = extract_named_colors(source)
    system_colors = datatype_keyword_literals(data_types, "SystemColor")
    absolute_sizes = datatype_keyword_literals(data_types, "AbsoluteSize")
    generic_families = expanded_datatype_literals(data_types, "GenericFamily")
    bg_size_keywords = [
        keyword
        for keyword in datatype_keyword_literals(data_types, "BgSize")
        if keyword in {"auto", "contain", "cover"}
    ]
    font_weight_keywords = datatype_keyword_literals(data_types, "FontWeightAbsolute")
    line_width_keywords = datatype_keyword_literals(data_types, "LineWidth")
    position_keywords = datatype_keyword_literals(data_types, "BgPosition")
    line_style_keywords = datatype_keyword_literals(data_types, "LineStyle")
    repeat_style_keywords = datatype_keyword_literals(data_types, "RepeatStyle")
    font_stretch_keywords = datatype_keyword_literals(data_types, "FontStretchAbsolute")

    sections = [
        ("NAMED_COLORS", named_colors),
        ("SYSTEM_COLORS", system_colors),
        ("ABSOLUTE_SIZES", absolute_sizes),
        ("BG_SIZE_KEYWORDS", bg_size_keywords),
        ("FONT_WEIGHT_KEYWORDS", font_weight_keywords),
        ("LINE_WIDTH_KEYWORDS", line_width_keywords),
        ("POSITION_KEYWORDS", position_keywords),
        ("LINE_STYLE_KEYWORDS", line_style_keywords),
        ("REPEAT_STYLE_KEYWORDS", repeat_style_keywords),
        ("FONT_STRETCH_KEYWORDS", font_stretch_keywords),
        ("OVERFLOW_KEYWORDS", OVERFLOW_KEYWORDS),
        ("OVERFLOW_SHORT_KEYWORDS", OVERFLOW_SHORT_KEYWORDS),
        ("OVERSCROLL_BEHAVIOR_KEYWORDS", OVERSCROLL_BEHAVIOR_KEYWORDS),
        ("GENERIC_FAMILIES", generic_families),
    ]

    lines = [
        "//! csstype `DataType.*` literal unions synced for generated TypeScript.",
        "//! Regenerate: `python3 crates/pandacss_codegen/scripts/sync_strict_props.py --write`",
        "",
    ]
    for const_name, values in sections:
        joined = ", ".join(f'"{value}"' for value in values)
        lines.append(f"pub(crate) static {const_name}: &[&str] = &[{joined}];")
        lines.append("")

    lines.extend(
        [
            "pub(crate) fn literals_union(values: &[&str]) -> String {",
            "    values",
            "        .iter()",
            '        .map(|value| format!("{value:?}"))',
            "        .collect::<Vec<_>>()",
            '        .join(" | ")',
            "}",
        ]
    )

    path.write_text("\n".join(lines) + "\n")
    print(
        "wrote "
        f"{path} ({len(named_colors)} named colors, {len(system_colors)} system colors, "
        f"{len(generic_families)} generic families)"
    )


if __name__ == "__main__":
    main()
