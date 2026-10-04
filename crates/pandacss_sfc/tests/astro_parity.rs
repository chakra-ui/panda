const CASES: &[(&str, &str, &str)] = &[
    ("code_on_both_fence_lines", "---a---<p/>", "   a;[     ]"),
    (
        "dash_run_closes_immediately",
        "------\n<p/>",
        "   ;[ \n    ]",
    ),
    (
        "fence_opened_by_text",
        "a --- b\n<p>c --- d</p>",
        "      b\n<p>c;[        ]",
    ),
    (
        "lone_carriage_return_after_the_fence",
        "---\n---\r<p/>",
        "   \n0;[\r    ]",
    ),
    (
        "crlf_frontmatter",
        "---\r\nconst a = 1\r\n---\r\n<p class={a}/>\r\n",
        "   \r\nconst a = 1\r\n0;[\r\n         ,a   \r\n]",
    ),
    (
        "stray_less_than_in_text",
        "a > b < c 5<10 <-x <1 <é <$x <_y {z}",
        "[                                 ,z ]",
    ),
    (
        "top_level_closing_tag_ends_the_body",
        "x</p>y<b>z</b>",
        "[             ]",
    ),
    (
        "comment_with_dashes",
        "<!-->x--><p class={a}/>",
        "[                 ,a   ]",
    ),
    (
        "doctype_like_bang",
        "<!x {y}><p class={a}/>",
        "[                ,a   ]",
    ),
    (
        "drift_after_top_level_brace",
        "a } b c <p>{x}</p>",
        "[          ,x     ]",
    ),
    (
        "drift_keeps_containers",
        "a } {x} <p>q</p>",
        "[   ,x          ]",
    ),
    ("dash_names", "<x-/><x--y/>", "[           ]"),
    (
        "colon_is_not_a_name_character",
        "<svg:rect x=1 />",
        "[               ]",
    ),
    ("type_arguments_on_a_tag", "<Foo<T>/>", "[        ]"),
    (
        "js_comments_between_attributes",
        "<a /* c */ b // d\n c=1 />",
        "[                \n       ]",
    ),
    (
        "line_comment_eats_the_bracket",
        "<a b//c>\n/>",
        "[       \n  ]",
    ),
    ("quotes_in_attribute_names", "<a \"b c\" />", "[          ]"),
    (
        "unquoted_url_value",
        "<a href=/x/y?a=b&c#d class={x}/>",
        "[                          ,x   ]",
    ),
    (
        "unquoted_value_ending_in_slash",
        "<a x=1/>z</a>",
        "[            ]",
    ),
    (
        "self_close_with_space",
        "<br/ ><p class={a}/>",
        "[              ,a   ]",
    ),
    (
        "uppercase_void_name_stays_open",
        "<IMG>{x}</IMG>",
        "[    ,x       ]",
    ),
    (
        "is_raw_content_is_text",
        "<div is:raw>x</DIV>{y}</div>{z}",
        "[                           ,z ]",
    ),
    (
        "uppercase_style_is_markup",
        "<STYLE>a{b}</STYLE>",
        "[       ,b         ]",
    ),
    (
        "textarea_is_markup",
        "<textarea>{v} <div>t</div></textarea>",
        "[         ,v                         ]",
    ),
    (
        "math_braces_are_text",
        "<math>{x}<mi>{</mi></math>",
        "[                         ]",
    ),
    (
        "math_quirk_after_close",
        "<math>{a}</math>{z}<p/>{w}",
        "[                      ,w ]",
    ),
    (
        "markup_first_single_element",
        "{ <a class={x}/> }",
        "[ [        ,x  ]  ]",
    ),
    ("markup_first_siblings", "{ <a/> <b/> }", "[[          ]]"),
    ("markup_first_trailing_text", "{<a/> + 1}", "[[       ]]"),
    (
        "markup_first_comment",
        "{<!-- c --> <a class={x}/>}",
        "[[                   ,x   ]]",
    ),
    (
        "sibling_group_after_and",
        "{c && <a/><b class={x}/>}",
        "[c && [            ,x  ] ]",
    ),
    (
        "sibling_group_in_parens_with_newlines",
        "{c && (\n  <a/>\n  <b>{x}</b>\n)}",
        "[c && (\n  [   \n     ,x    ]\n) ]",
    ),
    (
        "sibling_group_in_attribute",
        "<p b={ <a/> <b/> }/>",
        "[    , [       ]    ]",
    ),
    (
        "sibling_group_across_js_comment",
        "{c && <a/> /* k */ <b class={x}/>}",
        "[c && [                     ,x  ] ]",
    ),
    (
        "sibling_group_with_html_comment",
        "{c && <a/><!-- k --><b class={x}/>}",
        "[c && [                      ,x  ] ]",
    ),
    (
        "less_equal_is_a_comparison",
        "{c && <a/> <= b}",
        "[c && [  ] <= b ]",
    ),
    (
        "markup_in_nested_attribute_and_spread",
        "{c && <a b={<i class={x}/>} {...{y: <j class={z}/>}} />}",
        "[c && [    ,[        ,x  ]  ,...{y: [        ,z  ]}   ] ]",
    ),
    (
        "tags_inside_a_template_string_are_text",
        "{`<b>${x}</b>`}",
        "[`<b>${x}</b>` ]",
    ),
    (
        "tags_inside_a_regex_are_text",
        "{a.filter(x => /<b>/.test(x))}",
        "[a.filter(x => /<b>/.test(x)) ]",
    ),
    (
        "markup_after_control_paren",
        "{(() => { if (x) <a class={y}/>; })()}",
        "[(() => { if (x) [        ,y  ]; })() ]",
    ),
    (
        "markup_after_block",
        "{(() => { if (x) {} return <a class={y}/> })()}",
        "[(() => { if (x) {} return [        ,y  ] })() ]",
    ),
    ("generic_call_is_not_markup", "{f<T,>(x)}", "[f<T,>(x) ]"),
    (
        "keyword_property_compares",
        "{x.return < y}",
        "[x.return < y ]",
    ),
    (
        "ternary_markup",
        "{a ? <b class={x}/> : <c class={y}/>}",
        "[a ? [        ,x  ] : [        ,y  ] ]",
    ),
    (
        "map_with_arrow_scope",
        "<ul>{items.map((item) => <li class={css({ color: item })}>{item}</li>)}</ul>",
        "[   ,items.map((item) => [         ,css({ color: item })  ,item     ])      ]",
    ),
    (
        "typescript_script_body_is_blank",
        "<script>\n  type L = { id: number };\n</script><p class={a}/>",
        "[       \n                          \n                  ,a   ]",
    ),
    (
        "module_script_is_blank",
        "<script type=\"module\">import a from 'x'</script><p class={a}/>",
        "[                                                        ,a   ]",
    ),
    (
        "json_script_is_blank",
        "<script type=\"application/json\">{\"a\": 1}</script><p class={a}/>",
        "[                                                         ,a   ]",
    ),
    (
        "expression_shorthand_object",
        "<C {{ a: 1 }} {...{ x: <br> }} />",
        "[  ,{ a: 1 }  ,...{ x: [  ] }    ]",
    ),
    (
        "template_literal_attribute",
        "<a title=`x ${y}` class={z}/>",
        "[       ,`x ${y}`       ,z   ]",
    ),
    (
        "element_attribute_value",
        "<a x=<b class={y}/> z=<>f</> />",
        "[   ,[        ,y  ]  ,[    ]   ]",
    ),
    (
        "directive_attributes",
        "<div class:list={[a]} set:html={b} @click=\"x\" :class=\"y\" x.data=\"z\" />",
        "[               ,[a]           ,b                                     ]",
    ),
    (
        "issue_3916_fence_in_template_literal",
        "---\nimport { css } from '../styled-system/css';\nconst sample = `---\nconst x = 1;\n---\n<div />`;\nconst before = css({ color: 'red' });\n---\n<pre class={before}>{sample}</pre>\n<p class={css({ color: 'green' })}>template</p>\n",
        "   \nimport { css } from '../styled-system/css';\nconst sample = `---\nconst x = 1;\n---\n<div />`;\nconst before = css({ color: 'red' });\n0;[\n           ,before  ,sample       \n         ,css({ color: 'green' })              \n]",
    ),
    (
        "issue_3917_shorthand_in_expression",
        "---\nimport { css } from '../styled-system/css';\nconst show = true;\nconst id = 'x';\n---\n{show && (\n  <Panel {id}>\n    <p class={css({ color: 'orange' })}>inside</p>\n  </Panel>\n)}\n<p class={css({ color: 'pink' })}>after</p>\n",
        "   \nimport { css } from '../styled-system/css';\nconst show = true;\nconst id = 'x';\n0;[\n,show && (\n  [      ,id  \n             ,css({ color: 'orange' })            \n         ]\n) \n         ,css({ color: 'pink' })           \n]",
    ),
    (
        "issue_3918_script_in_frontmatter_comment",
        "---\nimport { css } from '../styled-system/css';\n// The <script> below hydrates the list.\nconst a = css({ color: 'red' });\n---\n<p class={a}>t</p>\n<script>\n  type Log = { id: number };\n</script>\n",
        "   \nimport { css } from '../styled-system/css';\n// The <script> below hydrates the list.\nconst a = css({ color: 'red' });\n0;[\n         ,a       \n        \n                            \n         \n]",
    ),
    (
        "regex_with_a_closing_brace",
        "<p>{'a}b'.replace(/}/g, '')}</p><p class={x}/>",
        "[  ,'a}b'.replace(/}/g, '')              ,x   ]",
    ),
    (
        "title_keeps_expressions",
        "<title>{css({ color: 'red' })} - <b>x</b></title>",
        "[      ,css({ color: 'red' })                    ]",
    ),
    (
        "quoted_text_after_less_than",
        "<p>if a < b, say \"{css({ color: 'quoted' })}\"</p>",
        "[                 ,css({ color: 'quoted' })      ]",
    ),
    (
        "apostrophes_and_urls_in_text",
        "{ok && <a href=\"/x\">Don't miss https://x.dev</a>}<p class={y}/>",
        "[ok && [                                       ]          ,y   ]",
    ),
    (
        "comment_before_the_fence_is_not_frontmatter",
        "<!-- header -->\n---\nimport { css } from 'x';\n---\n<p class={css({ color: 'red' })} />\n",
        "[              \n   \n       , css            \n   \n         ,css({ color: 'red' })    \n]",
    ),
    (
        "line_comment_ends_at_carriage_return",
        "<p>{a // x\r}</p>",
        "[  ,a     \r     ]",
    ),
    (
        "line_comment_ends_at_crlf",
        "<p>{a // x\r\n}</p>",
        "[  ,a     \r\n     ]",
    ),
    (
        "line_comment_ends_at_line_separator",
        "<p>{a // x\u{2028}}</p>",
        "[  ,a             ]",
    ),
    (
        "line_comment_ends_at_paragraph_separator",
        "<p>{a // x\u{2029}}</p>",
        "[  ,a             ]",
    ),
    (
        "regex_after_a_control_paren",
        "<p>{(() => { if (x) /}/.test(y) })()}</p>",
        "[  ,(() => { if (x) /}/.test(y) })()     ]",
    ),
    ("binary_number_in_drift", "}0b1 <p/>", "     [   ]"),
    ("octal_number_in_drift", "}0o7 <p/>", "     [   ]"),
    ("binary_bigint_in_drift", "}0b1n <p/>", "      [   ]"),
    ("hex_number_in_drift", "}0x1f <p/>", "      [   ]"),
    ("zero_with_exponent_in_drift", "}0e5 <p/>", "     [   ]"),
    (
        "comma_sequence_in_a_template_attribute",
        "<p class=`${a, b}`/>",
        "[       ,`${a, b}`  ]",
    ),
    (
        "semicolon_in_a_block_inside_a_template_attribute",
        "<p class=`${() => {a;}}`/>",
        "[       ,`${() => {a;}}`  ]",
    ),
    (
        "line_separator_inside_a_string",
        "<p>{a ? 'x\u{2028}' : b}</p>",
        "[  ,a ? 'x\u{2028}' : b     ]",
    ),
    (
        "string_line_continuation_lf",
        "<p>{a ? 'x\\\ny' : b}</p>",
        "[  ,a ? 'x\\\ny' : b     ]",
    ),
    (
        "string_line_continuation_crlf",
        "<p>{a ? 'x\\\r\ny' : b}</p>",
        "[  ,a ? 'x\\\r\ny' : b     ]",
    ),
    (
        "string_line_continuation_cr",
        "<p>{a ? 'x\\\ry' : b}</p>",
        "[  ,a ? 'x\\\ry' : b     ]",
    ),
    (
        "string_line_continuation_in_drift",
        "}'a\\\nb' <p/>",
        "    \n   [   ]",
    ),
    (
        "regex_after_a_for_await_paren",
        "<p>{(async () => { for await (x of y) /}/.test(z) })()}</p>",
        "[  ,(async () => { for await (x of y) /}/.test(z) })()     ]",
    ),
    (
        "template_literal_across_lines_in_type_arguments",
        "<Foo<`a\n`>/>",
        "[      \n    ]",
    ),
];

#[test]
fn lowers_like_astros_parser_on_curated_inputs() {
    let mut failures = Vec::new();
    for (name, source, expected) in CASES {
        let document = pandacss_sfc::astro::lower(source);
        if let Some(diagnostic) = document.diagnostics.first() {
            failures.push(format!("{name}: rejected: {}", diagnostic.message));
        } else if document.canvas != *expected {
            failures.push(format!(
                "{name}:\n  expected {expected:?}\n  actual   {:?}",
                document.canvas
            ));
        }
    }
    assert!(failures.is_empty(), "{}", failures.join("\n"));
}
