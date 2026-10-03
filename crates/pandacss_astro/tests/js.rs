use pandacss_astro::js::{Lexer, Token, TokenKind, find_closing_brace};

fn token(kind: TokenKind, start: usize, end: usize) -> Token {
    Token { kind, start, end }
}

fn closes_at_end(source: &str) {
    assert_eq!(
        find_closing_brace(source, 0),
        Some(source.len() - 1),
        "{source}"
    );
}

#[test]
fn braces_inside_strings_templates_comments_and_regexes_are_skipped() {
    closes_at_end("{'a}b'}");
    closes_at_end(r#"{"say \"}\""}"#);
    closes_at_end("{`a ${b} c`}");
    closes_at_end("{`a ${`b ${c}`} d`}");
    closes_at_end("{`${ \"`\" }`}");
    closes_at_end("{x // }\n}");
    closes_at_end("{/* } */ x}");
    closes_at_end("{'a}b'.replace(/}/g, '')}");
    closes_at_end("{/[/}]/.test(x)}");
    closes_at_end("{(() => { return /}/ })()}");
    closes_at_end("{ a: '}', b: `${'}'}`, c: /}/ }");
}

#[test]
fn slash_after_an_operand_is_division() {
    closes_at_end("{a / 2 / b}");
    closes_at_end("{x.return / 2 / y}");
}

#[test]
fn first_closing_brace_wins_between_siblings() {
    assert_eq!(find_closing_brace("{x}{y}", 0), Some(2));
}

#[test]
fn unterminated_input_has_no_closing_brace() {
    assert_eq!(find_closing_brace("{'abc", 0), None);
    assert_eq!(find_closing_brace("{`${", 0), None);
    assert_eq!(find_closing_brace("{/* }", 0), None);
}

#[test]
fn regex_versus_division_follows_the_caller() {
    assert_eq!(
        Lexer::new("/}/g + x", 0).next_token(true),
        token(TokenKind::Regex, 0, 4)
    );
    assert_eq!(
        Lexer::new("/ 2", 0).next_token(false),
        token(TokenKind::Punctuator, 0, 1)
    );
    assert_eq!(
        Lexer::new("/[/}]/ x", 0).next_token(true),
        token(TokenKind::Regex, 0, 6)
    );
}

#[test]
fn templates_split_around_interpolations() {
    let source = "`a ${b} c ${d}`";
    let mut lexer = Lexer::new(source, 0);
    assert_eq!(lexer.next_token(true), token(TokenKind::TemplateHead, 0, 5));
    assert_eq!(lexer.next_token(true), token(TokenKind::Identifier, 5, 6));
    assert_eq!(
        lexer.continue_template(),
        token(TokenKind::TemplateMiddle, 6, 12)
    );
    assert_eq!(lexer.next_token(true), token(TokenKind::Identifier, 12, 13));
    assert_eq!(
        lexer.continue_template(),
        token(TokenKind::TemplateTail, 13, 15)
    );
    assert_eq!(
        Lexer::new("`plain`", 0).next_token(true),
        token(TokenKind::NoSubstitutionTemplate, 0, 7)
    );
}

#[test]
fn whitespace_and_comments_are_skipped() {
    assert_eq!(
        Lexer::new("/* c */ x", 0).next_token(true),
        token(TokenKind::Identifier, 8, 9)
    );
    assert_eq!(
        Lexer::new("// c\n x", 0).next_token(true),
        token(TokenKind::Identifier, 6, 7)
    );
    assert_eq!(
        Lexer::new("\u{a0}x", 0).next_token(true),
        token(TokenKind::Identifier, 2, 3)
    );
}

#[test]
fn punctuators_use_maximal_munch() {
    for (source, end) in [
        ("=>", 2),
        ("...", 3),
        ("?.", 2),
        ("<=", 2),
        ("===", 3),
        ("<<=", 3),
        ("??=", 3),
    ] {
        assert_eq!(
            Lexer::new(source, 0).next_token(false),
            token(TokenKind::Punctuator, 0, end),
            "{source}"
        );
    }
}

#[test]
fn unterminated_tokens_run_to_the_end_without_panicking() {
    let mut lexer = Lexer::new("'abc", 0);
    assert_eq!(lexer.next_token(true), token(TokenKind::String, 0, 4));
    assert_eq!(lexer.next_token(true), token(TokenKind::Eof, 4, 4));
    assert_eq!(
        Lexer::new("/* x", 0).next_token(true),
        token(TokenKind::Eof, 4, 4)
    );
}
