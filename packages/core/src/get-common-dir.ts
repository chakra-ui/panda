import path from 'path'

function commonSequence(a: string[], b: string[]) {
  const result: string[] = []
  for (var i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) {
      result.push(a[i])
    } else {
      break
    }
  }
  return result
}

export function getCommonDir(paths: string[]) {
  return paths
    .map(path.dirname)
    .map((dir) => dir.split(path.sep))
    .reduce(commonSequence)
    .concat([''])
    .join(path.sep)
}
