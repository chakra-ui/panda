# @pandacss/extractor

## 0.13.1

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.1

## 0.11.0

## 0.10.0

## 0.9.0

### Patch Changes

- 3269b411: Fix extractor issue where we didn't explore both branches when using a default value as the condition
  expression

  In the example below, only the `yellow` color would be generated although the `blue` color should also be generated in
  case the `disabled` prop is `true`.

  ```tsx
  const CompB = ({ disabled = false }: { disabled: boolean }) => {
    return <div className={css({ color: disabled ? 'blue' : 'yellow' })}>Component B is disabled</div>
  }
  ```

## 0.8.0

### Patch Changes

- fb449016: Fix cases where Stitches `styled.withConfig` would be misinterpreted as a panda fn and lead to this error:

  ```ts
  TypeError: Cannot read properties of undefined (reading 'startsWith')
      at /panda/packages/shared/dist/index.js:433:16
      at get (/panda/packages/shared/dist/index.js:116:20)
      at Utility.setClassName (/panda/packages/core/dist/index.js:1682:66)
      at inner (/panda/packages/core/dist/index.js:1705:14)
      at Utility.getOrCreateClassName (/panda/packages/core/dist/index.js:1709:12)
      at AtomicRule.transform (/panda/packages/core/dist/index.js:1729:23)
      at /panda/packages/core/dist/index.js:323:32
      at inner (/panda/packages/shared/dist/index.js:219:12)
      at walkObject (/panda/packages/shared/dist/index.js:221:10)
      at AtomicRule.process (/panda/packages/core/dist/index.js:317:35)
  ```

- 78612d7f: Fix node evaluation in extractor process (can happen when using a BinaryExpression, simple CallExpression or
  conditions)

## 0.7.0

### Patch Changes

- f2abf34d: Fix extractor behaviour when encoutering operation tokens, try to evaluate them instead of resolving them as
  string

  before:

  ```tsx
  <AspectRatio ratio={1 / 2} asterisk={1 * 5} exp={1 ** 4} minus={5 - 1} />
  ```

  would be extracted to:

  ```json
  {
    "asterisk": "1 *5",
    "exp": "1**4",
    "minus": "5 -1",
    "ratio": "1 / 2"
  }
  ```

  now, it will be extracted to the actual values:

  ```json
  {
    "asterisk": 5,
    "exp": 1,
    "minus": 4,
    "ratio": 0.5
  }
  ```

- 7bc69e4b: Fix issue where extraction does not work when the spread syntax is used or prop contains string that ends
  with ':'
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 21295f2e: Resolve identifier default value from parameter, code like `position` and `inset` here:

  ```tsx
  export const Positioned: React.FC<PositionedProps> = ({ children, position = 'absolute', inset = 0, ...rest }) => (
    <styled.div position={position} inset={inset} {...rest}>
      {children}
    </styled.div>
  )
  ```

  - @pandacss/logger@0.6.0

## 0.5.1

### Patch Changes

- 6f03ead3: Fix issue where operation tokens did not get extracted.

  This means that values such as `1 / 2`, `3*5`, `2 **4`, `8- 1` will now properly be extracted

- e48b130a: - Remove `stack` from `box.toJSON()` so that generated JSON files have less noise, mostly useful to get make
  the `panda debug` command easier to read

  - Also use the `ParserResult.toJSON()` method on `panda debug` command for the same reason

  instead of:

  ```json
  [
    {
      "type": "map",
      "value": {
        "padding": {
          "type": "literal",
          "value": "25px",
          "node": "StringLiteral",
          "stack": [
            "CallExpression",
            "ObjectLiteralExpression",
            "PropertyAssignment",
            "Identifier",
            "Identifier",
            "VariableDeclaration",
            "StringLiteral"
          ],
          "line": 10,
          "column": 20
        },
        "fontSize": {
          "type": "literal",
          "value": "2xl",
          "node": "StringLiteral",
          "stack": [
            "CallExpression",
            "ObjectLiteralExpression",
            "PropertyAssignment",
            "ConditionalExpression"
          ],
          "line": 11,
          "column": 67
        }
      },
      "node": "CallExpression",
      "stack": [
        "CallExpression",
        "ObjectLiteralExpression"
      ],
      "line": 11,
      "column": 21
    },
  ```

  we now have:

  ```json
  {
    "css": [
      {
        "type": "object",
        "name": "css",
        "box": {
          "type": "map",
          "value": {},
          "node": "CallExpression",
          "line": 15,
          "column": 27
        },
        "data": [
          {
            "alignItems": "center",
            "backgroundColor": "white",
            "border": "1px solid black",
            "borderRadius": "8px",
            "display": "flex",
            "gap": "16px",
            "p": "8px",
            "pr": "16px"
          }
        ]
      }
    ],
    "cva": [],
    "recipe": {
      "checkboxRoot": [
        {
          "type": "recipe",
          "name": "checkboxRoot",
          "box": {
            "type": "map",
            "value": {},
            "node": "CallExpression",
            "line": 38,
            "column": 47
          },
          "data": [
            {}
          ]
        }
      ],
  ```

- d9bc63e7: Fix `ShorthandPropertyAssignment` handling on root objects, it was only handled when accessing an object
  from a prop acces / element access

  this was fine:

  ```ts
  const aliased = 'green.600'
  const colorMap = { aliased }
  const className = css({ color: colorMap['aliased'] })
  ```

  this was not (weirdly):

  ```ts
  const color = 'green.600'
  const className = css({ color })
  ```

- Updated dependencies [f9247e52]
  - @pandacss/logger@0.5.1

## 0.5.0

### Minor Changes

- ead9eaa3: Add support for tagged template literal version.

  This features is pure css approach to writing styles, and can be a great way to migrate from styled-components and
  emotion.

  Set the `syntax` option to `template-literal` in the panda config to enable this feature.

  ```js
  // panda.config.ts
  export default defineConfig({
    //...
    syntax: 'template-literal',
  })
  ```

  > For existing projects, you might need to run the `panda codegen --clean`

  You can also use the `--syntax` option to specify the syntax type when using the CLI.

  ```sh
  panda init -p --syntax template-literal
  ```

  To get autocomplete for token variables, consider using the
  [CSS Var Autocomplete](https://marketplace.visualstudio.com/items?itemName=phoenisx.cssvar) extension.

### Patch Changes

- @pandacss/logger@0.5.0

## 0.4.0

### Patch Changes

- @pandacss/logger@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/logger@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/logger@0.3.1

## 0.3.0

### Patch Changes

- @pandacss/logger@0.3.0

## 0.0.2

### Patch Changes

- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.

- Updated dependencies [fb40fff2]
  - @pandacss/logger@0.0.2
