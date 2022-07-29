import type * as swc from '@swc/core';
import Visitor from '@swc/core/Visitor';
import merge from 'lodash/merge';
import * as ast from '../ast-utils';

class CSSVisitor extends Visitor {
  constructor(private collector: Record<string, any>) {
    super();
  }

  visitCallExpression(node: swc.CallExpression): swc.Expression {
    const expression = ast.callExpression(node, 'css');
    if (!expression) return node;

    const args = expression.arguments;
    if (!args.length) {
      throw Error('RecipeVisitor: accepts at least one argument');
    }
    const [config] = args;

    if (config.expression.type === 'ObjectExpression') {
      merge(this.collector, ast.objectExpression(config.expression));
    }

    return node;
  }
}

export function cssPlugin(collector: Record<string, any>) {
  return function (program: swc.Program) {
    const visitor = new CSSVisitor(collector);
    return visitor.visitProgram(program);
  };
}
