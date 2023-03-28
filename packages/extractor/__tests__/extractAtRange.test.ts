import { ts } from 'ts-morph'
import { expect, test } from 'vitest'
import { extractAtRange, getTsNodeAtPosition } from '../src/extractAtRange'
import { createProject } from './createProject'

const project = createProject()
const getSourceFile = (code: string) => {
  return project.createSourceFile('file.tsx', code, { overwrite: true, scriptKind: ts.ScriptKind.TSX })
}

const codeSample = `import Cylinder from "@/cylinder";
import Box from "src/box";
import { RoundedBox } from "@react-three/drei";
import Sphere from "./sphere";

export function SceneAlt() {
  return (
    <>
      <Box />
    </>
  );
}

export default function Scene() {
    const oui = abc({ prop: 123 });

  return (
    <>
      <factory.div className="aa" />
      <SceneAlt />
      <Box
        position={[
          -1.2466866852487384, 0.3325255778835592, -0.6517939595349769,
        ]}
        rotation={[
          2.1533738875424957, -0.4755261514452274, 0.22680789335122342,
        ]}
        scale={[1, 1, 1.977327619564505]}
        {...{ aaa: 123 }}
      />
      <Cylinder
        position={[0.47835635435693047, 0, -0.5445324755430057]}
      ></Cylinder>

      <Sphere
        scale={[0.6302165233139577, 0.6302165233139577, 0.6302165233139577]}
        position={[-1.6195773093872396, 0, 1.1107193822625767]}
      />

      <RoundedBox position={[1, 0, 2]}>
        <meshStandardMaterial color="purple" />
      </RoundedBox>
    </>
  );
}`

test('getTsNodeAtPosition', () => {
  const sourceFile = getSourceFile(codeSample)
  let node = getTsNodeAtPosition(sourceFile, 1, 1)!
  expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot(`
    [
      "import",
      "ImportKeyword",
    ]
  `)

  node = getTsNodeAtPosition(sourceFile, 15, 19)!
  expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot(`
    [
      "abc",
      "Identifier",
    ]
  `)

  node = getTsNodeAtPosition(sourceFile, 19, 12)!
  expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot(`
    [
      "factory",
      "Identifier",
    ]
  `)

  node = getTsNodeAtPosition(sourceFile, 20, 12)!
  expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot(`
    [
      "SceneAlt",
      "Identifier",
    ]
  `)

  node = getTsNodeAtPosition(sourceFile, 31, 13)!
  expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot(`
    [
      "Cylinder",
      "Identifier",
    ]
  `)

  node = getTsNodeAtPosition(sourceFile, 37, 14)!
  expect([node.getText(), node.getKindName()]).toMatchInlineSnapshot(`
    [
      "position",
      "Identifier",
    ]
  `)
})

test('extractAtRange', () => {
  const sourceFile = getSourceFile(codeSample)
  let extracted

  extracted = extractAtRange(sourceFile, 1, 1)
  expect(extracted).toMatchInlineSnapshot('undefined')

  extracted = extractAtRange(sourceFile, 15, 19)
  expect(extracted).toMatchInlineSnapshot(`
    BoxNodeList {
      "node": CallExpression,
      "stack": [],
      "type": "list",
      "value": [
        BoxNodeMap {
          "node": ObjectLiteralExpression,
          "spreadConditions": undefined,
          "stack": [
            CallExpression,
            ObjectLiteralExpression,
          ],
          "type": "map",
          "value": Map {
            "prop" => BoxNodeLiteral {
              "kind": "number",
              "node": NumericLiteral,
              "stack": [
                CallExpression,
                ObjectLiteralExpression,
                PropertyAssignment,
                NumericLiteral,
              ],
              "type": "literal",
              "value": 123,
            },
          },
        },
      ],
    }
  `)

  extracted = extractAtRange(sourceFile, 19, 12)
  expect(extracted).toMatchInlineSnapshot(`
    {
      "node": JsxSelfClosingElement,
      "props": Map {
        "className" => BoxNodeLiteral {
          "kind": "string",
          "node": StringLiteral,
          "stack": [
            JsxAttribute,
            StringLiteral,
          ],
          "type": "literal",
          "value": "aa",
        },
      },
      "tagName": "factory.div",
      "type": "component",
    }
  `)

  extracted = extractAtRange(sourceFile, 20, 12)
  expect(extracted).toMatchInlineSnapshot(`
    {
      "node": JsxSelfClosingElement,
      "props": Map {},
      "tagName": "SceneAlt",
      "type": "component",
    }
  `)

  extracted = extractAtRange(sourceFile, 31, 13)
  expect(extracted).toMatchInlineSnapshot(`
    {
      "node": JsxOpeningElement,
      "props": Map {
        "position" => BoxNodeList {
          "node": ArrayLiteralExpression,
          "stack": [
            JsxAttribute,
            JsxExpression,
            ArrayLiteralExpression,
          ],
          "type": "list",
          "value": [
            BoxNodeLiteral {
              "kind": "number",
              "node": NumericLiteral,
              "stack": [
                JsxAttribute,
                JsxExpression,
                ArrayLiteralExpression,
              ],
              "type": "literal",
              "value": 0.47835635435693047,
            },
            BoxNodeLiteral {
              "kind": "number",
              "node": NumericLiteral,
              "stack": [
                JsxAttribute,
                JsxExpression,
                ArrayLiteralExpression,
              ],
              "type": "literal",
              "value": 0,
            },
            BoxNodeLiteral {
              "kind": "number",
              "node": PrefixUnaryExpression,
              "stack": [
                JsxAttribute,
                JsxExpression,
                ArrayLiteralExpression,
              ],
              "type": "literal",
              "value": -0.5445324755430057,
            },
          ],
        },
      },
      "tagName": "Cylinder",
      "type": "component",
    }
  `)

  extracted = extractAtRange(sourceFile, 37, 14)
  expect(extracted).toMatchInlineSnapshot('undefined')
})
