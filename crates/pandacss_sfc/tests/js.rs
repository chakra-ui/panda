use pandacss_sfc::js::{Lexer, Token, TokenKind, find_closing_brace};

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

#[test]
fn regexes_and_line_comments_end_at_line_terminators() {
    for terminator in ["\n", "\r", "\u{2028}", "\u{2029}"] {
        let regex = format!("/x{terminator}/");
        assert_eq!(
            Lexer::new(&regex, 0).next_token(true),
            token(TokenKind::Regex, 0, 2),
            "{regex:?}"
        );
        let comment = format!("// c{terminator}x");
        let x = comment.len() - 1;
        assert_eq!(
            Lexer::new(&comment, 0).next_token(true),
            token(TokenKind::Identifier, x, x + 1),
            "{comment:?}"
        );
        closes_at_end(&format!("{{x // }}{terminator}}}"));
    }
    assert_eq!(
        Lexer::new("/[x\n]/", 0).next_token(true),
        token(TokenKind::Regex, 0, 3)
    );
    assert_eq!(
        Lexer::new("/\\\n/", 0).next_token(true),
        token(TokenKind::Regex, 0, 2)
    );
}

#[test]
fn svelte_block_close_ends_at_its_own_brace_since_an_unterminated_regex_is_division() {
    assert_eq!(find_closing_brace("{/if}\n<p>{a}</p>", 0), Some(4));
    assert_eq!(find_closing_brace("{a ? /x\n/ : b}", 0), Some(13));
}

#[test]
fn slash_after_a_control_paren_is_a_regex() {
    closes_at_end("{(() => { if (x) /}/.test(y) })()}");
    closes_at_end("{(() => { while ((x)) /}/.test(y) })()}");
    assert_eq!(find_closing_brace("{f(x) /}/ 2}", 0), Some(7));
    assert_eq!(find_closing_brace("{a.if(x) /}/ 2}", 0), Some(10));
    closes_at_end("{(async () => { for await (x of y) /}/.test(z) })()}");
    assert_eq!(
        find_closing_brace("{:else if (a) / 2 > b}<a href=\"/x\">y</a>{/if}", 0),
        Some(21)
    );
}

#[test]
fn strings_end_before_a_line_break_unless_it_is_escaped() {
    for terminator in ["\n", "\r"] {
        let source = format!("'x{terminator}'");
        assert_eq!(
            Lexer::new(&source, 0).next_token(true),
            token(TokenKind::String, 0, 2),
            "{source:?}"
        );
    }
    assert_eq!(
        Lexer::new("'x\u{2028}'", 0).next_token(true),
        token(TokenKind::String, 0, 6)
    );
    for continuation in ["\\\n", "\\\r\n", "\\\r"] {
        let source = format!("'x{continuation}y' z");
        let end = source.len() - 2;
        assert_eq!(
            Lexer::new(&source, 0).next_token(true),
            token(TokenKind::String, 0, end),
            "{source:?}"
        );
    }
}

#[test]
fn unterminated_string_closes_at_the_first_brace_after_the_line_break() {
    assert_eq!(find_closing_brace("{a ? 'x\n} : 1}", 0), Some(8));
    closes_at_end("{a ? 'x\\\n}' : 1}");
}
