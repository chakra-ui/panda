use std::borrow::Cow;

#[must_use]
pub fn is_important(value: &str) -> bool {
    important_marker(value).is_some()
}

#[must_use]
pub fn without_important(value: &str) -> Cow<'_, str> {
    let Some((start, end)) = important_marker(value) else {
        return Cow::Borrowed(value);
    };

    let mut out = String::with_capacity(value.len().saturating_sub(end - start));
    out.push_str(value[..start].trim_end());
    out.push_str(&value[end..]);
    Cow::Owned(out.trim().to_owned())
}

#[must_use]
pub fn split_important(value: &str) -> (Cow<'_, str>, bool) {
    let important = is_important(value);
    (without_important(value), important)
}

fn important_marker(value: &str) -> Option<(usize, usize)> {
    let bytes = value.as_bytes();
    let bang = bytes.iter().position(|byte| *byte == b'!')?;
    let mut start = bang;
    while start > 0 && bytes[start - 1].is_ascii_whitespace() {
        start -= 1;
    }

    let after_bang = bang + 1;
    let important = "important";
    if value
        .get(after_bang..after_bang + important.len())
        .is_some_and(|candidate| candidate.eq_ignore_ascii_case(important))
    {
        Some((start, after_bang + important.len()))
    } else {
        Some((start, after_bang))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_bang_important_marker() {
        assert!(is_important("red !important"));
        assert_eq!(without_important("red !important").as_ref(), "red");
        assert_eq!(without_important("red!important").as_ref(), "red");
        assert_eq!(without_important("red !IMPORTANT").as_ref(), "red");
    }

    #[test]
    fn strips_bang_marker() {
        assert!(is_important("red!"));
        assert_eq!(without_important("red!").as_ref(), "red");
        assert_eq!(without_important("red !").as_ref(), "red");
    }

    #[test]
    fn returns_borrowed_when_marker_is_absent() {
        let value = "red";
        assert!(!is_important(value));
        assert!(matches!(without_important(value), Cow::Borrowed("red")));
    }
}
