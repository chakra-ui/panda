# Astro fork rules (withastro/oxc @ 8bb526fc)

What a hand-written `.astro` tokenizer has to do to find the same boundaries the fork does. Paths are relative to
`crates/oxc_parser/src/`. Every `input → result` example was run through the fork, except where a line says
"(from code)". `[a..b)` means a byte span.

Three lexers take turns reading tokens, and most of the quirks below come from which one reads the *next* token:

- **child lexer** (`lexer/astro.rs:77`, `read_astro_jsx_child`): reads text runs, `<`, `{`, `}`.
- **JS lexer** (`next_token`): skips whitespace and JS comments. Used for tag names, attribute boundaries, and
  everything inside `{…}`.
- **byte scanners**: the frontmatter fences, raw-text bodies, `<script>` bodies, and `<!--…-->`.

The parser picks the lexer for the following token using `expect_jsx_child` / `parse_jsx_text` (child lexer) or
`bump_any` / `expect` (JS lexer) (`cursor.rs:170-228`, `jsx/mod.rs:509-517`). Any failed `expect` or `unexpected()`
is **fatal**: the body loop stops (`error_handler.rs:20-52`, `astro/mod.rs:43`).

---

## 1. Frontmatter (`astro/parse.rs:65-124`, `138-319`, `342-370`)

### Opening fence (`find_opening_fence`, parse.rs:97-124)

```
dash = 0
for i, b in bytes:
  if b == '-': dash += 1; if dash == 3: return i-2      # first run of 3 dashes, anywhere
  elif b in '<' '{' '}': return NONE                    # no frontmatter
  else: dash = 0
return NONE
```

- The fence does not need to start a line. Anything before it, BOM included, belongs to the frontmatter span but is
  neither parsed nor part of the body.
  `x ---\na\n--- y\n<p>` → frontmatter `[0..11)`, program content `[5..8)`, body starts at 11 (`" y\n"` is text).
- A run of 4 or more dashes: the fence is the first 3. `------\n<p/>` → frontmatter `[0..6)` with empty content.
  `-----\n<p/>` → no closing fence, so no frontmatter.
- Text in a frontmatter-less file can turn on a fence:
  `a --- b\n<p>c --- d</p>` → frontmatter `[0..16)`. The program `" b\n<p>c "` parses without errors as TSX. The body is
  `" d"`, then the top-level `</p>` ends the body (§4).

### Closing fence (`find_closing_fence`, parse.rs:138-319)

The scan runs over `src[content_start..]`, where `content_start = open+3`. Transcription:

```
state=Normal; re=true                       # re: a '/' here starts a regex
for i:
 Normal:
   if b=='-' && i+2<len && b[i+1]=='-' && b[i+2]=='-': return i   # anywhere: a---b, x--- all match
   ' " `      -> SQ/DQ/TPL, re=true
   '/' next '/' -> LINE, i++    ;  '/' next '*' -> BLOCK, i++
   '/' if re  -> REGEX
   = ( [ { } ; , ! & | ^ ~ ? : < > + - * % \n \r -> re=true
   ) ]        -> re=false
   [A-Za-z0-9_$] -> re=false
   ' ' '\t'   -> unchanged
   other (incl. '/' when !re, '.', '@', '#', non-ASCII bytes) -> re=true
 SQ: '\\'->i++ ; '\'' -> Normal,re=false ; '\n'|'\r' -> Normal,re=true
 DQ: same with '"'
 TPL: '\\'->i++ ; '`' -> Normal,re=false          # ${…} is NOT tracked; newlines allowed
 LINE: '\n' -> Normal,re=true                     # '\r' alone does not end it
 BLOCK: "*/" -> Normal (i++), re unchanged
 REGEX: '\\'->i++ ; '[' -> CLASS ; '/' -> Normal,re=false, skip [A-Za-z]* flags ; '\n'|'\r' -> Normal,re=true
 CLASS: '\\'->i++ ; ']' -> REGEX ; '\n'|'\r' -> Normal,re=true
 i++
return NONE
```

The flag is reset to `true` after *any* other byte, so the heuristic for keywords is coarse. Examples:

- `if (x) /---/.test(y)` → the `/` follows `)`, so it reads as division and the fence closes early at the `---`
  inside the regex. Frontmatter `[0..15)`.
- `b\n/---/` → the newline sets `re`, so this is a regex and the dashes are skipped.
- `` `${`---`}` `` → the inner backtick ends the template, so the fence closes early.
- `` `${"`"}` `` → recovers at the newline because the double-quote state ends there.
- `let a = 1; a---` → closes at `a---`, and the body starts with the text `"---\n"`.

### Results (parse.rs:72-89, 342-370)

```
content = [open+3 .. close)          frontmatter.span = [0 .. close+3)
body_start = close+3, plus 1 if next is '\n', or plus 2 if next is "\r\n"   (lone '\r' is not skipped)
```

- `---\n---\r<p/>` → body starts at 7 with Text `"\r"`.
- Code on the fence lines is allowed. `---a---<p/>` → content `"a"`, body starts at 7. Anything after the closing fence
  on the same line is body text.
- Unclosed (opening fence found, no closing fence): the file has **no frontmatter**. The body starts at offset 0, so
  the fence is plain text. `---\nconst a = 1\n<div/>` → Text `[0..16)`, Element `<div>`.
- No frontmatter: a synthetic frontmatter with span `[0..0)` (parse.rs:371-386).
- The frontmatter is parsed as TS + JSX (TSX), with `return` allowed. It is re-parsed with space padding, so
  `program.span = [0 .. content_end)`. **When that TS parse hits a fatal error, `program.span` is `[0..0)`**. Example:
  `---\nconst x = (\n---` → program `[0..0)`, frontmatter `[0..19)`. Take `content_end` from the fence scan, not from
  `program.span`. `reference/src/lib.rs` already uses the fence-scan end.

## 2. Body child dispatch

Body lexing starts at `body_start` (or 0) with `next_jsx_child` (`lib.rs:625-645`).

### Child lexer (`lexer/astro.rs:77-209`)

```
'<': if next byte is [A-Za-z] or '/' or '>' or '!'  -> LAngle  (also LAngle when '<' is the last byte -> fatal later)
     else -> Text: consume '<', then run to the next '{' '}' or a "valid" '<' (an invalid '<' keeps the run going)
'{': LCurly            (Text in foreign mode, see §5)
'}': RCurly            (Text in foreign mode)
else: Text run to the next '<' '{' '}' (or to EOF). '>' is ordinary text.   Foreign mode: the run ends only at '<'.
```

- `a > b < c 5<10 <-x <1 <é <$x <_y` → Text `"a > b "` and Text `"< c 5<10 … <_y"`. A stray `<` starts a *new* text
  token. Both are Text and both get blanked.
- No whitespace is allowed between `<` and a tag name: `< div>` is text in the child lexer.
- `&amp;` and other entities are plain text. No decoding happens and spans are not affected.

### Top-level dispatch (`astro/mod.rs:55-129`)

| token | action |
|---|---|
| `<` then `>` | fragment `<>…</>` (children loop, §4) |
| `<` then ident or keyword | `<script` special case (§7), otherwise element |
| `<` then `/` | **ends the body silently** (no error). `x</p>y<b>z</b>` → only Text `"x"` |
| `<` then `!` | top-level comment or doctype (below) |
| `<` then anything else (only `<` at EOF) | fatal |
| `{` | `{...` → spread child, otherwise container (§6) |
| Text | Text |
| `}` | **drift**: `bump_any` reads the following tokens with the JS lexer (below) |

Top-level `<!` (mod.rs:139-217). `p` is the index of the `!`.

- `src[p..]` starts with `!--`: find `-->` searching from `p+3` (so `<!-->x-->` is one comment `[..9)`). If found →
  AstroComment `[<, end of -->)`.
- Otherwise: everything up to the first `>` → AstroDoctype `[<, >+1)`. This covers `<!DOCTYPE html>`, `<!x {y}>` and
  `<![CDATA[ {x} ]]>`.
- Not closed (`<!--` with no `-->`, or `<!` with no `>`): fallback. Skip JS tokens until a `>` token, or until a `-`
  or `--` token followed by `>`. Then keep going in drift mode, with no error. `<!-- unclosed {x} <p>a</p>` → empty body.

**Drift mode.** It starts after a top-level `}` or a top-level unclosed `<!`. The JS lexer drops every token
(identifiers, punctuation, strings, templates) without creating Text nodes. `<` and `{` still start an element or a
container, and the body goes back to the child lexer when one of them closes.

- `a } b c <p>x</p>` → Text `"a "`, Element p.
- `a } {x} <p>q</p>` → Text `"a "`, Container, Text `" "`, p.
- `a } don't {x} <p>q</p>` → an unterminated string eats to EOF. The body is only Text `"a "`, plus one lexer error.

### Nested children loop (`astro/jsx.rs:262-351`)

This loop is used inside elements and fragments, in both template and JS context.

- `<>` → fragment.
- `<` + ident → `<script` if the JS token text is exactly `script` (§7), otherwise element.
- `<!` → a comment only, using the same `-->` search. Anything else (`<!doctype>`, unclosed `<!--`) is **fatal**.
- `</` → closing tag (§4).
- `{` → spread child or container.
- Text → Text.
- `}` or EOF → **fatal**. `<div>a } b</div>` panics.

A text run ends at `<` (when it starts markup), `{`, `}`, or EOF.

## 3. Tags

### Element names (`astro/jsx.rs:227-258`, `jsx/mod.rs:495-507`)

The name comes from the JS lexer, starting at the letter.

- Name grammar: a JS IdentifierName (ASCII `[A-Za-z0-9_$]`, Unicode ID_Continue, `\uXXXX` escapes), then any number
  of `-`-joined ID_Continue segments. Trailing or doubled `-` is fine: `<x-/>` names `x-`, `<x--y/>` names `x--y`.
  Then optionally `.ident` members, and JS whitespace or comments may sit around the dots.
- In the child lexer the first character must be an ASCII letter: `<é-x/>` is text, `<x-é/>` is element `x-é`.
- In the JS lexer (inside expressions) the name can start with any ID_Start character, `_` or `$`, and can come after
  whitespace or comments: `{c && < div/>}` → `div`, `{c && </**/a/>}` → `a`.
- `:` is **not** a name character. `<svg:rect x=1 />` → element `svg` with attributes `:rect` (boolean) and `x="1"`.
- If the name is followed by `<`, TS type arguments are tried and swallowed: `<Foo<T>/>` → element `Foo`, opening
  `[0..9)`.

### Attribute loop (`astro/jsx.rs:426-471`)

Between attributes, the JS lexer reads one token. That skips JS whitespace (ASCII, `\v`, `\f`, NBSP, U+FEFF, Unicode
Zs, LS/PS) and **JS comments** (`/*…*/`, `//…EOL`).

- `<a /* c */ b // d\n c=1 />` → attributes `b` and `c`.
- `<a b//c>\n/>` → the `>` is swallowed by the line comment, and the `/>` on the next line closes the tag.

The loop stops at EOF, `<`, `>` or `/`. Otherwise:

- **`{` + `}`** (`{}`, `{/*c*/}`, `{ }`): dropped completely (jsx.rs:438-442).
- **`{...expr}`**: spread attribute. `parse_expr` in the JS lexer, then `}` (`jsx/mod.rs:440-447`). Whitespace is
  allowed (`{ ...c }`). Argument span = expression span.
- **`{ident}`** (ident or *any keyword*, comments allowed, then `}`): shorthand (jsx.rs:603-633). Name span = value
  span = ident span, container span = `{…}`. `{class}` and `{this}` are shorthands.
- **any other `{expr}`** (`{{a:1}}`, `{a.b}`, `{"s"}`, `{(x)}`): expression shorthand (jsx.rs:638-659). The name *and*
  the container span are both `[first token after { .. end of expr)`. The name is that text, trimmed.
- **anything else**: rewind to the token start and read a raw name (jsx.rs:662-679, lexer/astro.rs:221-242). The name
  ends at `=` `>` `/` `{` `}` `<` space `\t` `\n` `\r`. `\f`, `\v`, NBSP and quotes are name bytes. If the first byte
  is already a terminator, one byte is taken (so a stray `}` or `=` becomes an attribute named `}` or `=`).
  - Valid names include `@click`, `:class`, `x.data`, `x-y:z`, `is:raw`, `'q`, `"b`, `` `x ``, `#x`, `©`, `★`, `1`,
    `42`, `data-1`.
  - The JS token is lexed *first*, though. A number followed straight away by identifier characters (`<a 1x=2 />`) is
    **fatal**. A `\` produces a non-fatal error.
  - `<a "b c" />` → two attributes, `"b` and `c"`.

### Value after `=` (jsx.rs:687-754)

`=` is a JS token, so `y =2` is fine. Skip `[ \t\r\n]` after it and look at the byte `v`:

| `v` | value |
|---|---|
| EOF, `>` or `}` | **fatal**. `<a x= >` panics |
| `"` or `'` | JSX string: no escapes, newlines allowed. StringLiteral with raw, span includes the quotes |
| `` ` `` | JS template literal. Container span = template span (no braces) |
| `{` | container parsed with `parse_expr` (**not** the markup-first path, §6). `{}` → EmptyExpression `[{+1..}-1)` |
| `<` | element or fragment value (JS-context element, §6). `x=<b/> y=<>f</>` both work |
| anything else | **unquoted**: the value runs to `>` `{` `}` `<` space `\t` `\n` `\r` (lexer/astro.rs:54-57). StringLiteral with no raw, span = the value |

Unquoted values include `/`, `"`, `'`, `` ` ``, `=` and `\f`:

- `href=/x/y?a=b&c#d` and `title=a"b`c` are whole values.
- `b=/*c*/"1"` → the value is `/*c*/"1"`. `b=// c` → the value is `//`.
- **`x=1/>` → the value is `1/`, so the tag is *not* self-closing.** `<a x=/>` panics.

Attributes can sit right next to each other: `b="1"c=2` and `b={1}c` give two attributes each. `b=x}` gives `b="x"`
plus an attribute named `}`.

### End of the opening tag (jsx.rs:188-223)

- After the loop: if the token is `/`, it is an explicit self-close, then a `>` token must follow. JS whitespace is
  allowed in between: `<br/ >`, `<a b="1"/ >`.
- `<` → fatal (`<a b="1" <b/>`). EOF → fatal.
- Void elements, matched case-sensitively on Identifier names only:
  `area base br col embed hr img input link meta param source track wbr` (jsx.rs:757-780). They are self-closing
  without `/`.
  - `Img` and `IMG` are not void (they are IdentifierReferences, or just not in the list), so `<IMG>` stays open.
  - A later `</img>` is a stray closing tag (§4).
- Opening span = `<` up to the end of the `>` token. Element span = opening span when self-closing.

## 4. Closing and recovery (`astro/jsx.rs:115-174`, `262-377`; `lib.rs:473-476`)

`astro_open_elements` is a parser-wide stack holding the **source text** of each open element name. Fragments are not
pushed. Elements are pushed before their children (including raw-text ones) and popped afterwards. The stack is shared
across JS nesting.

In the children loop, `</` starts a closing tag:

```
'</' then (JS lexer: ws/comments ok) '>'        -> closing fragment
'</' name '>'                                    -> name = parse_astro_jsx_element_name; '>' must follow (else fatal)
if closing is an element and its name text is not in the stack:
    error "Closing tag '</X>' has no matching opening tag"   # non-fatal; skip it and keep looping
else: return the closing to the innermost open element E
    element vs element: names differ (case-sensitive, by AST shape) -> error, but E still closes at </X>
    element vs </>: FATAL
    fragment vs </X>: error, fragment closes
```

- No implicit closing at all. `<p>a<p>b` and `<ul><li>a<li>b</ul>` are fatal: EOF in the children loop is fatal.
- `<div><p>a</div></p></div>`: `<p>` closes at `</div>` (error). `</p>` is then stray (error, skipped). The last
  `</div>` closes `div`. Tree: div[p["a"]].
- `<DIV>a</div>`: `div` is not in the stack → stray → then EOF → fatal.
- `<a . b>x</a.b>`: `"a . b"` ≠ `"a.b"` → stray.
- Top level: `</anything>` ends the body silently, whatever the name. `<img></img>x<p/>` → body is `[img]` only.
  Nested, the same `</img>` gives a stray error and is skipped.
- `</ p >` is accepted.

**After a fatal error** (parse.rs:337, mod.rs:43): the body loop stops and `panicked = true`. Each element whose
children loop saw the fatal error returns a dummy element (span `[0..0)`, empty name), and so do all of its
ancestors. So the entire top-level child that contained the error becomes `Element <> 0..0`, and nothing after it is
parsed. Earlier siblings survive: `x<p>y</p><div>a } b</div><i/>` → Text, p, dummy.

Raw-text closing failures keep the half-built element instead: `<style>a{` → element with closing `">a{"`. Containers
keep their partial expression. Recommendation: treat `panicked` as "file failed" and don't chase tree parity inside
it. If parity is required, replicate "the top-level child becomes a dummy and nothing follows".

## 5. Raw text, foreign content, no-expression elements

- **The only raw-text elements are `style`** (Identifier, exact, case-sensitive; jsx.rs:783-788) **and any element
  with an `is:raw` attribute** (attribute name text exactly `is:raw`, value ignored; jsx.rs:853-866).
  `<STYLE>a{}</STYLE>` is a normal element whose `{}` is a container.
- Not special in the fork: `textarea`, `title`, `iframe`, `noembed`, `noframes`, `plaintext`, `xmp`. Their children
  are parsed as markup with expressions. `<textarea>{v} <div>t</div></textarea>` → Container + Element. This differs
  from SYNTAX_SPEC §§ "disable expression parsing" and "title/textarea".
- Raw body (jsx.rs:1118-1158): the content starts right after the opening `>`. The end is the first occurrence of
  `"</" + name source text`, case-sensitive and **prefix-only**: no `>` or boundary is required.
  - `<style>a{}</stylex>` → content `a{}`, then the closing name `stylex` mismatches (error).
  - `<div is:raw>x</DIV></div>` → content `x</DIV>`.
  - Then `<`, `/`, and the closing tag is parsed normally (JS whitespace allowed: `</style >`).
  - The content becomes one Text child, only when it's non-empty.
- Raw-text detection only applies when the tag isn't explicitly self-closed (`<style/>`, `<p is:raw/>` have no
  content). A void element with `is:raw` (`<img is:raw>`) never consumes its `>`, so it's fatal when nested.
- Not found: usually fatal (`<style>a{`), but the fork's recovery sometimes accepts the file. `<style><style>` is
  accepted. Panda reports `Unexpected end of file` and drops the top-level child instead. This is a known fail-safe
  divergence: no corpus file has an unclosed raw-text element.
- **Foreign content: only `math`** (Identifier, exact; jsx.rs:845-850). It is not raw. While it's open (not
  self-closing), the child lexer runs in foreign mode for all descendants: `{` and `}` are text and a text run ends only
  at `<`. Tags still parse.
  - `<math>{x}<mi>{</mi></math>` → Text `{x}`, mi[Text `{`].
  - **Quirk:** the flag is restored only *after* the closing `>` already lexed the next token in foreign mode.
    `<math>{a}</math>{z}<p/>{w}` → `{z}` is **Text** `[16..19)` and `{w}` is a container.

## 6. Expressions

### Where a `{` container starts

| position | entry | first token after `{` (JS lexer, ws/comments skipped) |
|---|---|---|
| template child (top-level, nested, markup-first child) | `parse_astro_jsx_expression_container(in_jsx_child=true)` (jsx.rs:381-422) | `...` → spread child. `<` (incl. `<!--`) → **markup-first** path. `}` → EmptyExpression `[{+1..}-1)`. Otherwise `parse_expr`, then `}` (child lexer next) |
| attribute value | same, `in_jsx_child=false` | `<` → **JS** path (no markup-first). `}` → empty |
| nested `{}` inside markup-first | inline (jsx.rs:1249-1265) | `...` → spread. Otherwise `parse_expr` (JS) — never markup-first |

The end of `{…}` is wherever the full TS-JSX expression grammar stops, and that **must** be `}`. Otherwise it's fatal:
`{a b}`, and `{a\n<div/>}` (the newline does not trigger ASI before `<`: it parses as `a < div / >`, which fails). The
expression is the whole comma sequence. Inside it are strings, templates with nested `${…}`, regexes, comments,
`as`/`satisfies`/`!`, and JSX with its own children, containers and raw text. `` {`<b>${x}</b>`} `` and
`{a.filter(x => /<b>/.test(x))}` contain no markup.

### Markup-first containers (jsx.rs:1192-1301)

These are template-child containers whose first token is `<`. The contents are read as **JSX children**, not JS:

```
loop:
  '<' '>'      -> fragment       '<' ident -> script(§7) | element (in_jsx_child=true)
  '<' '/'      -> FATAL          '<' '!'   -> comment, or (no -->) drop one child-lexer token
  '<' other    -> FATAL ({<5})
  Text -> Text ; '}' -> stop ; EOF -> stop then FATAL ; other -> drop one child-lexer token
  '{' -> nested spread/JS container, then *** read one extra child-lexer token and DROP it ***
expect '}'
pop the last child if it is Text made only of ASCII whitespace (space \t \n \f \r)
1 child that is an Element or Fragment -> that node is the expression
otherwise -> implicit Fragment span [ '{'+1 .. end of '}' )   (it includes the '}' byte; open/close spans are empty)
```

- `{<a/>}` → Element. `{ <a/> }` → Element: the leading space was skipped by the JS lexer and the trailing space was
  popped.
- `{<a/> <b/>}` → Fragment `[1..11)` = [a, Text " ", b].
- `{ <a/> <b/> }` → Fragment `[1..13)`. No leading Text, and the trailing `" "` is popped.
- `{<a/> + 1}` → Fragment [a, Text `" + 1"`]. `{<a/>.x}` → [a, Text `".x"`]. Anything after the first element is
  *text*, not JS.
- `{<!-- c -->}` → Fragment [Comment]. `{<!-- c --> <a/>}` → [Comment, Text, a].
- **Drop-one-token quirk** (jsx.rs:1258 + 1264). After a nested `{…}` or `{...x}`, the token right after its `}` is
  thrown away:
  - `{<a/>{x}<b c="1"/>}` → [a, {x}, Text `b c="1"/>`]: the `<` was dropped.
  - `{<a/>{x}text<b/>}` → `text` is dropped.
  - `{<a/>{x}{y}<b/>}` → the `{` is dropped, `y` is text, and the outer container ends at that `}` (offset 11). `<b/>`
    becomes a body sibling, and the final `}` triggers drift.
  - `{<a/>{x}}` → fatal.

### `<` inside JS (expression.rs:1121-1123, 1641-1645, 1223-1233; jsx/mod.rs:24-28; astro/jsx.rs:43-82)

Astro counts as JSX (`source_type.rs:478`), so:

- **Operand position** (any place an expression may start: after `(` `[` `{` `,` `;` `=` `=>` `?` `:` `...`,
  operators, `return` `typeof` `await` `yield` `case` `else` …, and at statement start, including after `if (x)` and
  after a block `}`): `<` is markup.
  - Next token `>` → fragment. Ident or keyword → element (`script` → §7). Anything else (`<!--`, `<5`) is **fatal**:
    `{x && <!-- c -->}` panics.
  - Before that, an arrow-generic check runs (arrow.rs:58-63, 166-190): `<` [const] Ident followed by
    - `,` or `=` → generic arrow (`<T,>(x)=>x`).
    - `extends` then `=`/`>`/`/` → JSX.
    - `extends` then an identifier → try arrow, fall back to JSX.
    - `extends` then anything else → arrow.
    - anything else (`<T>(x)=>1`) → JSX, which then fails.
- **Operator position** (after an identifier, literal, `)`, `]`, template, regex, postfix `++`/`--`, or a closed JSX
  element): `<` is less-than, `<=`/`<<` are their own tokens, and `f<T,>(x)` / `a<b>(c)` are TS type arguments. There
  is one exception, sibling grouping, described next.
- Types are never markup: `(i: Array<string>) =>`, `new Map<string, number>()`, `x as Array<T>`,
  `let f: <T>(a: T) => T`.
- `<!--` is lexed as `<` in Astro, never as an Annex-B comment (punctuation.rs:36-43). `a <!--b` is a comparison.

### Sibling grouping in JS (expression.rs:1223-1233, astro/jsx.rs:478-577)

In the binary-expression loop, when the left operand is *exactly* a JSXElement or JSXFragment (not parenthesized, not
a member access) and the current token is `<`, the parser looks one token ahead (JS lexer). If that token is `>`, an
ident or a keyword, or the bytes right after `<` are `!--` with a `-->` *anywhere* later in the file, it collects
siblings:

```
children=[lhs]; while at '<':
   gap=[prev_token_end .. '<')        # push Text(gap) if non-empty and all ASCII-whitespace
   '<>' -> fragment ; '<' ident -> script | element(in_jsx_child=false) ; '<!--' -> comment
   else rewind, break
1 child -> unchanged ; else Fragment [start of the first sibling '<' .. end of the last sibling)   # does NOT include '}'
```

- `{c && <a/><b/>}` → Fragment `[6..14)`.
- `{c && (\n  <a/>\n  <b>x</b>\n)}` → Fragment `[10..25)` = [a, Text `"\n  "`, b].
- `<p b={ <a/> <b/> }/>` → Fragment `[7..16)`. Compare markup-first, which spans up to `}`.
- `{c && <a/> /* k */ <b/>}` → [a, b]: the gap holds a comment, so no Text.
- `{c && <a/> <b/>}` → no Text, because NBSP is not ASCII whitespace.
- `{c && <a/><!-- k --><b/>}` → [a, Comment, b].
- `{c && <a/> < b}` → markup: the JS lexer skips the space and sees ident `b`, which then panics.
- `{c && <a/> <= b}` → comparison.
- `{c && <a/> text}` → fatal. In JS context, plain text never joins the run.
- `x=<a/><b/>` as an attribute value → fatal. Element values don't group.

### In JS context

- Elements parsed in JS context have `in_jsx_child=false`. Their children use the child lexer, but the token after a
  self-closing `/>` or after the final `</x>` is read by the JS lexer.
- Attributes, raw text and `math` work the same as in templates. Nested attribute values and spreads parse as JS, with
  the same markup rules: `{c && <a b={<i/>} {...{x: <j/>}} />}` → elements `i` and `j`.
- JS comments inside expressions are skipped as trivia. They never become nodes (`body_comments` only).

## 7. Scripts (`astro/mod.rs:230-433`, `astro/jsx.rs:918-1115`, `scripts.rs:15-65`)

### Detection

- **Top level**: the JS token after `<` starts with `script`, and the next source byte is one of
  ` ` `>` `/` `\n` `\r` `\t` or EOF (mod.rs:72-85).
  - `<script-x>`, `<scripts>`, `<script\f>` and `<script{…}>` are ordinary elements, so their bodies are markup.
- **Nested / JS / markup-first**: the JS token is exactly `script` (jsx.rs:51, 289, 537, 1216). A JS identifier stops
  at `-` or `.`.
  - So `<div><script-x>a</script-x></div>` **is a script**, and it breaks: attribute `-x`, then fatal.
  - `<div><script\f>` is also a script.
- Case-sensitive. `<SCRIPT>` is a normal element with markup children.

### Parsing

Attributes go through the normal attribute loop and are lowered normally. Then an optional `/`, then `>` if present.

- Self-closing → element `[<..>]` with no closing tag.
- Otherwise the content is `[after '>' .. first "</script")`, case-sensitive and prefix-only. JS-looking content such
  as `` `</div>` `` is not special.
- Closing tag:
  - Top level: up to the first `>` byte after `</script`, anywhere (`</script\n>` works). Then the child lexer.
  - Nested: tokens `<`, `/`, one JS token, then an optional `>`.
- Not found: usually fatal (`<script>a`), but the fork's recovery sometimes accepts the file:
  `<div><script></div><p class={x}/>`, `{<script>}<p class={b}/>`, `{c && <script>}` and `<script>x/>` are all
  accepted. Panda does not port that recovery. It reports `Unexpected end of file` and drops the top-level child. This
  is a known fail-safe divergence: no corpus file has an unclosed `<script>`.
- Element: opening `[< .. content_start)`, closing `[content_end .. end)`, name `[<+1 .. <+7)`.

### What the child is (`is_raw_text_script`, jsx.rs:804-842)

The first attribute named exactly `type` decides:

- No such attribute → `AstroScript` child.
- `type` whose StringLiteral value is exactly one of `text/javascript`, `text/ecmascript`, `application/javascript`,
  `application/ecmascript`, `application/x-javascript` or `module` (quoted or unquoted, no trimming, case-sensitive) →
  `AstroScript` child.
- `type` with no value, a `{…}` value, or any other value → a Text child holding the raw content.
- Self-closing: the AstroScript program is empty at `end`. For the raw `type` case there are no children.

AstroScript span = the whole element span. Its program is re-parsed as TSX with padding (scripts.rs:37-65), so
`program.span = [0..content_end)`. It is `[0..0)` if that parse is fatal (`<script>a</SCRIPT></script>`), and stays
empty when the content is empty. Spread attributes don't make a script raw: `<script {...x}>` still gets an
AstroScript.

### Token-mode quirk

After a **nested** `</script>` (jsx.rs:999-1007), the next token is read by the JS lexer:

- Whitespace and JS comments are skipped, so no Text node.
- `<` and `{` still work.
- Text or a quote is **fatal**: `<div><script>a</script> some text</div>` panics, as does `…</script>it's`.
- In markup-first, the token is silently dropped instead: `{<a/><script>a</script> t}` loses ` t`.
- A top-level `</script>` goes back to the child lexer cleanly.

## 8. Other byte-level facts

- **CRLF**: matters only in the frontmatter (`\r\n` after the closing fence, and `\r` as a regex or string terminator)
  and as a terminator in attribute names and unquoted values. Nothing is normalized. A lone `\r` after the fence
  becomes body text.
- **BOM**: no special handling anywhere. With frontmatter it is "content before the fence". Without frontmatter it is
  a body Text node: `﻿<div/>` → Text `[0..3)`.
- **Non-ASCII**:
  - Text is opaque.
  - Tag names need an ASCII first letter in the child lexer, then JS ID_Continue.
  - Attribute names take any bytes except the terminators, but start after JS whitespace (NBSP, U+3000 … are
    skipped). Mid-name, NBSP is part of the name: `~y z` is one name.
  - U+2028/2029 in text are plain text.
- **Entities**: never decoded and never boundaries.
- **Comments in templates**: `<!--…-->` is a node (AstroComment). JS comments count only inside JS-lexed regions:
  between attributes, after `{`, inside expressions, inside closing tags, and in drift mode.
- **Empty containers** produce no lowering (EmptyExpression), but their bytes are inside the container span.

## What the lowering consumes (`reference/src/lib.rs`)

The tokenizer must reproduce these spans:

- Elements (non-empty name only): name span, opening span.
- Attributes:
  - name span (for an expression shorthand, the trimmed expression span);
  - value: Boolean; Static (quoted → inner span, unquoted → value span); Expression (container expression span,
    template span, or element/fragment value span); Empty; Spread (argument span; the reference widens it back to `...`).
- Container expression spans, then every JSXElement or JSXFragment reachable inside JS (including implicit fragments,
  per §6).
- Text, AstroScript, comment, doctype, and raw-text content are blanked and only need their extents. The frontmatter
  needs `[open+3 .. content_end)`.

---

## Hard to emulate with a byte scanner

1. **End of a JS expression (`}` and `<` decisions inside `{…}`).** The fork runs the full TS-JSX grammar. A scanner
   needs a JS lexer (strings, templates with `${` nesting, comments) plus regex-vs-division and markup-vs-operator
   decisions.
   *Heuristic:* use the classic previous-significant-token rule.
   - Operand position after: start, `( [ { , ; : ? = => ...`, any operator, and the keywords
     `return typeof void delete await yield new in of instanceof case else do throw extends`.
   - Operator position after: an identifier or keyword used as a value (`this` `true` `null` …), a number, a string,
     a template, a regex, `) ] }`, postfix `++`/`--`.
   - Differences from the fork:
     - `{(() => { if (x) <a/>; })()}`: the fork sees JSX after `)`, the heuristic sees an operator.
     - `{(() => { if (x) {} <a/> })()}`: after a block `}` the fork sees JSX, the heuristic an operator.
     - `{(() => { let f: <T>(a: T) => T; return <a/> })()}`: after `:` the fork sees a type, the heuristic markup.
     - `{x.return < y}`: after a keyword used as a property, the fork compares, the heuristic sees markup. Fix: treat
       a keyword after `.` or `?.` as an identifier.
     - Regex after `)`: `{if (a) /<b>/.test(c)}`-style code inside arrow bodies. The heuristic reads division, then
       sees `<b>` as markup.
   - Mitigation: track a small bracket stack that tags `(` as control-paren (after `if` `while` `for` `with`) or
     expression-paren, and `{` as block or object. Track `:` after `(ident` or `let/const ident` as a type annotation,
     and skip type tokens until `=`, `,`, `)` or `;` at depth 0.
2. **Generic arrows vs elements in operand position** (arrow.rs:166-190).
   *Heuristic:* look ahead through tokens: `<` [`const`] Ident then `,` or `=` → arrow. `extends` → arrow unless the
   next token is `=`, `>` or `/`. Otherwise markup.
   - Difference: `<T extends U>(x)` with no `=>`. The fork tries an arrow and falls back to JSX, while the heuristic
     says arrow. This is rare.
   - At the start of a template-child container this check never runs: markup-first wins. `{<T,>(x)=>x}` is fatal in
     the fork, so mirror that.
3. **Sibling grouping needs "the left operand is exactly a JSX node"** (expression.rs:1226-1233). Precedence matters:
   `c && <a/><b/>` groups inside the `&&` right side. `(<a/>)<b/>` and `<a/>.x <b/>` don't group.
   *Heuristic:* set a flag when a JSX node closes in operand position. Clear it on any token other than whitespace or
   comments. Clear it if the node was inside parens that just closed. Group on the next `<` if the flag is set and the
   lookahead is ident, keyword, `>`, or `!--` with a `-->` anywhere later.
   - Difference: `typeof <a/><b/>`, `await <a/><b/>` — unary operators wrap the JSX first in the fork (from code). The
     heuristic would group them. Rare.
4. **Which lexer reads the next token.** The places where the fork switches lexer mid-stream:
   - drift after a top-level `}` or an unclosed top-level `<!`;
   - JS-lexed token after a nested `</script>`;
   - drop-one-token after a nested `{}` in markup-first;
   - foreign-mode token after `</math>`;
   - JS-lexed tokens between attributes, where `//` and `/*` eat `>` (`<a b//c>`) and `1x` is fatal;
   - JS-lexed first token after `{` (whitespace and comments skipped before deciding markup-first).

   All of these are deterministic and portable, but only if the port models a "next token via child/JS lexer" switch
   instead of a single cursor. Example divergence for a naive port: `<div><script>…</script> hi</div>` (fork: fatal),
   or `{<a/>{x} <b/>}` (fork: the `" "` is dropped).
5. **Fatal-error tree shape.**
   *Heuristic:* on any fatal condition, mark the file as panicked and keep the earlier top-level siblings. Replace the
   current top-level child with nothing.
   - Raw-text closing failures keep a partial node in the fork.
   - The frontmatter `program.span` becomes `[0..0)` on a fatal TS parse, which only a real TS parser can detect.
     Recommendation: change the reference lowering to use the fence-scan `content_end` instead of `program.span.end`,
     so the port doesn't need a TS parser.
6. **Attribute token boundaries through the JS lexer.** Whitespace skipping uses JS whitespace (NBSP, U+FEFF, Zs)
   while name bytes use the raw table. Number-led names like `1x` are fatal. Strings and templates in name position
   are re-read as names.
   *Heuristic:* a port can emulate this exactly with a tiny JS-trivia skipper (whitespace + comments) and an "ASCII
   digit followed by `[A-Za-z_$]`" fatal check. Risk: other JS lexer errors that aren't popped, such as malformed
   numbers like `0x`, `1e`, `1_`, also panic. Enumerate them from the JS number lexer.
