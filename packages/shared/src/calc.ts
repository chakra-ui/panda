import { isObject } from './assert'

type Operand = string | number | { ref: string }

type Operator = '+' | '-' | '*' | '/'

function isCssVar(value: unknown): value is { ref: string } {
  return isObject(value) && 'ref' in value
}

function getRef(operand: Operand): string {
  return isCssVar(operand) ? operand.ref : operand.toString()
}

const toExpression = (operator: Operator, ...operands: Array<Operand>) =>
  operands.map(getRef).join(` ${operator} `).replace(/calc/g, '')

const multiply = (...operands: Array<Operand>) => `calc(${toExpression('*', ...operands)})`

export const calc = {
  negate(x: Operand) {
    const value = getRef(x)
    if (value != null && !Number.isNaN(parseFloat(value))) {
      return String(value).startsWith('-') ? String(value).slice(1) : `-${value}`
    }
    return multiply(value, -1)
  },
}
