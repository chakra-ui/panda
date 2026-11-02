//! What a condition selector contributes to rule order.
//!
//! Atomic rules that set the same property with equal specificity are ordered
//! by the states their selectors require, using `StyleX`'s pseudo-class
//! priorities. A selector list ranks as its strongest alternative; the parts of
//! one complex selector add up, so `.group:hover &` ranks as hover. `:has()` and
//! `:nth-child(… of S)` count only their own priority: their arguments describe
//! other elements or filter the count.

use std::ops::Add;

use crate::selector_parts::{PartKind, selector_parts};

const PSEUDO_PRIORITIES: &[(&str, u16)] = &[
    ("is", 40),
    ("where", 40),
    ("not", 40),
    ("has", 45),
    ("dir", 50),
    ("lang", 51),
    ("first-child", 52),
    ("first-of-type", 53),
    ("last-child", 54),
    ("last-of-type", 55),
    ("only-child", 56),
    ("only-of-type", 57),
    ("nth-child", 60),
    ("nth-last-child", 61),
    ("nth-of-type", 62),
    ("nth-last-of-type", 63),
    ("empty", 70),
    ("link", 80),
    ("any-link", 81),
    ("local-link", 82),
    ("target-within", 83),
    ("target", 84),
    ("visited", 85),
    ("enabled", 91),
    ("disabled", 92),
    ("required", 93),
    ("optional", 94),
    ("read-only", 95),
    ("read-write", 96),
    ("placeholder-shown", 97),
    ("in-range", 98),
    ("out-of-range", 99),
    ("default", 100),
    ("checked", 101),
    ("indeterminate", 101),
    ("blank", 102),
    ("valid", 103),
    ("invalid", 104),
    ("user-valid", 105),
    ("user-invalid", 106),
    ("autofill", 110),
    ("picture-in-picture", 120),
    ("modal", 121),
    ("open", 121),
    ("popover-open", 121),
    ("fullscreen", 122),
    ("paused", 123),
    ("playing", 124),
    ("current", 125),
    ("past", 126),
    ("future", 127),
    ("focus-within", 130),
    ("hover", 140),
    ("focus", 150),
    ("focus-visible", 160),
    ("active", 170),
];

const UNKNOWN_PSEUDO_PRIORITY: u16 = 40;

const VENDOR_PREFIXES: [&str; 4] = ["-webkit-", "-moz-", "-ms-", "-o-"];

/// Selector specificity, compared as `(ids, classes, types)`.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) struct Specificity {
    ids: u16,
    classes: u16,
    types: u16,
}

impl Specificity {
    const ID: Self = Self {
        ids: 1,
        classes: 0,
        types: 0,
    };
    const CLASS: Self = Self {
        ids: 0,
        classes: 1,
        types: 0,
    };
    const TYPE: Self = Self {
        ids: 0,
        classes: 0,
        types: 1,
    };
}

impl Add for Specificity {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self {
            ids: self.ids.saturating_add(other.ids),
            classes: self.classes.saturating_add(other.classes),
            types: self.types.saturating_add(other.types),
        }
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub(crate) struct SelectorRank {
    /// Sum of the pseudo-class priorities the selector requires.
    pub(crate) rank: u16,
    pub(crate) pseudo_element: bool,
    /// Highest specificity among the list's alternatives.
    pub(crate) specificity: Specificity,
}

impl SelectorRank {
    fn strongest(self, other: Self) -> Self {
        Self {
            rank: self.rank.max(other.rank),
            pseudo_element: self.pseudo_element || other.pseudo_element,
            specificity: self.specificity.max(other.specificity),
        }
    }

    fn add(&mut self, rank: u16, specificity: Specificity) {
        self.rank = self.rank.saturating_add(rank);
        self.specificity = self.specificity + specificity;
    }
}

/// Rank of a selector list such as `&:is(:hover, [data-hover])` or `.group:hover &`.
pub(crate) fn selector_rank(selector: &str) -> SelectorRank {
    let mut strongest = SelectorRank::default();
    let mut current = SelectorRank::default();
    for part in selector_parts(selector) {
        match part.kind {
            PartKind::Comma => {
                strongest = strongest.strongest(current);
                current = SelectorRank::default();
            }
            PartKind::Combinator => {}
            PartKind::Id => current.add(0, Specificity::ID),
            PartKind::Other => current.add(0, other_specificity(&selector[part.span])),
            PartKind::Pseudo {
                element: true,
                name,
                args,
            } => {
                current.pseudo_element = true;
                let inner = match args {
                    Some(args) if name.eq_ignore_ascii_case("slotted") => selector_rank(args),
                    _ => SelectorRank::default(),
                };
                current.add(inner.rank, Specificity::TYPE + inner.specificity);
            }
            PartKind::Pseudo {
                element: false,
                name,
                args,
            } => {
                let (rank, specificity) = pseudo_class(name, args);
                current.add(rank, specificity);
            }
        }
    }
    strongest.strongest(current)
}

fn pseudo_class(name: &str, args: Option<&str>) -> (u16, Specificity) {
    let name = unprefixed(name);
    let own = pseudo_priority(name);
    let Some(args) = args else {
        return (own, Specificity::CLASS);
    };
    let is = |expected: &str| name.eq_ignore_ascii_case(expected);
    if is("is") || is("matches") || is("any") || is("not") {
        let inner = selector_rank(args);
        (own.saturating_add(inner.rank), inner.specificity)
    } else if is("where") {
        (
            own.saturating_add(selector_rank(args).rank),
            Specificity::default(),
        )
    } else if is("has") {
        (own, selector_rank(args).specificity)
    } else if is("host") || is("host-context") {
        let inner = selector_rank(args);
        (
            own.saturating_add(inner.rank),
            Specificity::CLASS + inner.specificity,
        )
    } else if is("nth-child") || is("nth-last-child") {
        let of = nth_of_selector(args).map_or_else(Specificity::default, |selector| {
            selector_rank(selector).specificity
        });
        (own, Specificity::CLASS + of)
    } else {
        (own, Specificity::CLASS)
    }
}

fn pseudo_priority(name: &str) -> u16 {
    if name.eq_ignore_ascii_case("-moz-focusring") {
        return pseudo_priority("focus-visible");
    }
    PSEUDO_PRIORITIES
        .iter()
        .find_map(|(known, priority)| known.eq_ignore_ascii_case(name).then_some(*priority))
        .unwrap_or(UNKNOWN_PSEUDO_PRIORITY)
}

/// `-webkit-autofill` → `autofill`; `-moz-focusring` keeps its prefix.
fn unprefixed(name: &str) -> &str {
    if name.eq_ignore_ascii_case("-moz-focusring") {
        return name;
    }
    VENDOR_PREFIXES
        .iter()
        .find_map(|prefix| {
            name.get(..prefix.len())
                .filter(|head| head.eq_ignore_ascii_case(prefix))
                .map(|_| &name[prefix.len()..])
        })
        .unwrap_or(name)
}

/// `S` in `:nth-child(2n + 1 of S)`.
fn nth_of_selector(args: &str) -> Option<&str> {
    let mut words = args.split_ascii_whitespace();
    words.position(|word| word.eq_ignore_ascii_case("of"))?;
    let rest = words.next()?;
    let start = rest.as_ptr() as usize - args.as_ptr() as usize;
    Some(&args[start..])
}

/// `.class` and `[attr]` count as classes, `&` as the class it stands for,
/// `*` as nothing, and a type name as a type.
fn other_specificity(text: &str) -> Specificity {
    match text.as_bytes().first() {
        Some(b'.' | b'[' | b'&') => Specificity::CLASS,
        Some(b'*' | b'(') | None => Specificity::default(),
        Some(_) => Specificity::TYPE,
    }
}

#[cfg(test)]
mod tests {
    use super::{SelectorRank, Specificity, selector_rank};

    fn rank(selector: &str) -> u16 {
        selector_rank(selector).rank
    }

    fn specificity(selector: &str) -> (u16, u16, u16) {
        let Specificity {
            ids,
            classes,
            types,
        } = selector_rank(selector).specificity;
        (ids, classes, types)
    }

    #[test]
    fn a_state_on_the_styled_element_ranks_by_its_priority() {
        assert_eq!(rank("&:hover"), 140);
        assert_eq!(rank("&:active"), 170);
    }

    #[test]
    fn states_in_one_selector_add_up() {
        assert_eq!(rank("&:hover:focus"), 290);
    }

    #[test]
    fn a_group_or_peer_state_counts() {
        assert_eq!(rank(".group:hover &"), 140);
        assert_eq!(rank(".peer:checked ~ &"), 101);
    }

    #[test]
    fn a_selector_list_ranks_as_its_strongest_alternative() {
        assert_eq!(rank("&:is(:hover, :focus-visible)"), 40 + 160);
        assert_eq!(rank("&:focus-within, &[data-focus]"), 130);
    }

    #[test]
    fn where_and_not_rank_by_their_strongest_argument() {
        assert_eq!(rank("&:where(:hover, :active)"), 40 + 170);
        assert_eq!(rank("&:not(:hover)"), 40 + 140);
    }

    #[test]
    fn has_ignores_the_states_of_the_elements_it_looks_for() {
        assert_eq!(rank("&:has(> input:checked)"), 45);
        assert_eq!(rank("&:has(> input[aria-invalid=true])"), 45);
        assert_eq!(rank("&:not(:has(:focus))"), 40 + 45);
    }

    #[test]
    fn nth_child_ignores_its_of_selector() {
        assert_eq!(rank("&:nth-child(2n of :hover)"), 60);
    }

    #[test]
    fn host_counts_the_host_state() {
        assert_eq!(rank(":host(:hover) &"), 40 + 140);
        assert_eq!(rank(":host-context(.dark) &"), 40);
    }

    #[test]
    fn slotted_counts_the_slotted_element_state() {
        let slotted = selector_rank("&::slotted(span:hover)");
        assert_eq!((slotted.rank, slotted.pseudo_element), (140, true));
    }

    #[test]
    fn a_pseudo_class_after_a_part_counts() {
        let part = selector_rank("&::part(label):hover");
        assert_eq!((part.rank, part.pseudo_element), (140, true));
    }

    #[test]
    fn legacy_single_colon_pseudo_elements_are_pseudo_elements() {
        assert_eq!(
            selector_rank("&:before"),
            SelectorRank {
                rank: 0,
                pseudo_element: true,
                specificity: selector_rank("&::before").specificity,
            }
        );
    }

    #[test]
    fn pseudo_class_names_ignore_case() {
        assert_eq!(rank("&:HOVER"), 140);
    }

    #[test]
    fn vendor_prefixed_states_rank_like_the_standard_one() {
        assert_eq!(rank("&:-webkit-autofill"), 110);
        assert_eq!(rank("&:-moz-focusring"), 160);
    }

    #[test]
    fn unknown_pseudo_classes_rank_at_the_default() {
        assert_eq!(rank("&:state(loading)"), 40);
    }

    #[test]
    fn strings_and_escapes_do_not_end_arguments_early() {
        assert_eq!(rank(r#"&:has([data-x=")"]:hover)"#), 45);
        assert_eq!(rank(r"&.a\:hover"), 0);
    }

    #[test]
    fn specificity_follows_selectors_level_4() {
        assert_eq!(specificity("&:hover"), (0, 2, 0));
        assert_eq!(specificity("&:has(> input:checked)"), (0, 2, 1));
        assert_eq!(specificity("&:has(> input[aria-invalid=true])"), (0, 2, 1));
        assert_eq!(specificity("&:has(> .error)"), (0, 2, 0));
        assert_eq!(specificity("&:is(:hover, #a)"), (1, 1, 0));
        assert_eq!(specificity("&:where(#a)"), (0, 1, 0));
        assert_eq!(specificity("&:nth-child(2 of .x)"), (0, 3, 0));
        assert_eq!(specificity("&::before"), (0, 1, 1));
        assert_eq!(specificity("& > *"), (0, 1, 0));
    }
}
