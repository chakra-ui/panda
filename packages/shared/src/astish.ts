const newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g
const ruleClean = /\/\*[^]*?\*\/|\s\s+|\n/g
const DASH = /-([a-z])/g
const MS = /^Ms/g

const camel = (val: string) => val.replace(DASH, (v) => v[1].toUpperCase()).replace(MS, 'ms')

export const astish = (val: string, tree: any[] = [{}]): Record<string, any> => {
  const block = newRule.exec(val.replace(ruleClean, ''))
  if (!block) return tree[0]
  if (block[4]) tree.shift()
  else if (block[3]) tree.unshift((tree[0][block[3]] = tree[0][block[3]] || {}))
  else tree[0][camel(block[1])] = block[2]
  return astish(val, tree)
}
