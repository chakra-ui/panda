---
'@pandacss/generator': patch
---

Fix `css.d.ts` for `syntax: 'template-literal'` mode to match the runtime implementation.

Previously the generated `styled-system/css/css.d.ts` only declared a single tagged-template signature:

```ts
export declare function css(template: { raw: readonly string[] | ArrayLike<string> }): string
```

But the runtime already supported both multi-arg invocations (`css(styleA, styleB, ...)`) and a `css.raw` companion. Calling these features failed type-checking with `TS2554` ("Expected 1 arguments, but got N") and `TS2339` ("Property 'raw' does not exist").

The generated `dts` is now aligned with the object-syntax `css-fn` shape, exposing both overloads and `css.raw`:

```ts
type Styles = { raw: readonly string[] | ArrayLike<string> } | undefined | null | false

interface CssRawFunction {
  (styles: Styles): object
  (styles: Styles[]): object
  (...styles: Array<Styles | Styles[]>): object
}

interface CssFunction {
  (styles: Styles): string
  (styles: Styles[]): string
  (...styles: Array<Styles | Styles[]>): string

  raw: CssRawFunction
}

export declare const css: CssFunction;
```

Closes #3534.
