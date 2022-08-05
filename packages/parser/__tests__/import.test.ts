import { describe, test, expect } from 'vitest';
import type * as swc from '@swc/core';
import Visitor from '@swc/core/Visitor';
import * as ast from '../src/ast';
import { transformSync } from '../src/transform';

class TestVisitor extends Visitor {
  constructor(private collector: Record<string, any>) {
    super();
  }

  visitImportDeclaration(node: swc.ImportDeclaration): swc.ImportDeclaration {
    this.collector.result = ast.importDeclaration(node, {
      name: 'css',
      module: '@panda/css',
    });
    return node;
  }
}

function plugin(c: Record<string, any>) {
  return (p: swc.Program) => {
    const visitor = new TestVisitor(c);
    return visitor.visitProgram(p);
  };
}

describe('extract imports', () => {
  test('should work', () => {
    const code = `
    import { css as nCss } from "@panda/css"

    css({ bg: "red" })
    `;

    const collect = {};

    transformSync(code, {
      plugins: [plugin(collect)],
    });

    expect(collect).toMatchInlineSnapshot(`
      {
        "result": {
          "alias": "nCss",
          "identifer": "css",
        },
      }
    `);
  });
});
