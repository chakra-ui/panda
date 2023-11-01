const newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g
const ruleClean = /\/\*[^]*?\*\/|  +/g
const ruleNewline = /\n+/g
const empty = ' '

export const astish = (val: string, tree: any[] = [{}]): Record<string, any> => {
  if (!val) return tree[0]
  let block, left
  while ((block = newRule.exec(val.replace(ruleClean, '')))) {
    if (block[4]) tree.shift()
    else if (block[3]) {
      left = block[3].replace(ruleNewline, empty).trim()
      tree.unshift((tree[0][left] = tree[0][left] || {}))
    } else tree[0][block[1]] = block[2].replace(ruleNewline, empty).trim()
  }

  return tree[0]
}
