export function findAll (re: RegExp, str: string): RegExpMatchArray[] {
  let match: RegExpMatchArray
  const matches: RegExpMatchArray[] = []
  while ((match = re.exec(str)) !== null) {
    matches.push({ ...match })
  }
  return matches
}
