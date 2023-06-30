---
'@pandacss/extractor': patch
'@pandacss/node': patch
---

- Remove `stack` from `box.toJSON()` so that generated JSON files have less noise, mostly useful to get make the
  `panda debug` command easier to read
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
