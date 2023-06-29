const newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g
const ruleClean = /\/\*[^]*?\*\/|\s\s+|\n/g

export const astish = (val: string, tree: any[] = [{}]): Record<string, any> => {
  const block = newRule.exec((val ?? '').replace(ruleClean, ''))
  if (!block) return tree[0]
  if (block[4]) tree.shift()
  else if (block[3]) tree.unshift((tree[0][block[3]] = tree[0][block[3]] || {}))
  else tree[0][block[1]] = block[2]
  return astish(val, tree)
}
