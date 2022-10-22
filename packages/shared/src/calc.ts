type Operand = string | number | { ref: string }

type Operator = '+' | '-' | '*' | '/'

function isCssVar(value: unknown): value is { reference: string } {
  return typeof value === 'object' && value !== null && 'ref' in value
}

function getRef(operand: Operand): string {
  return isCssVar(operand) ? operand.reference : operand.toString()
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
