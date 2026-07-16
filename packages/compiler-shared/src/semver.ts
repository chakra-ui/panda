type Version = readonly [major: number, minor: number, patch: number]

// Panda-only npm range subset: exact/partial, wildcard, caret, tilde,
// comparators, intersections, hyphen ranges, and `||`. Prereleases use the
// compatibility contract of their target stable version.

const OR_SEPARATOR = '||'
const CLAUSE_SEPARATOR = /\s+/
const CLAUSE_PATTERN = /^(\^|~|>=|<=|>|<|=)?(.*)$/
const HYPHEN_RANGE_PATTERN = /^(\S+)\s+-\s+(\S+)$/
const VERSION_PATTERN = /^v?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/i
const NUMERIC_PATTERN = /^\d+$/

export function satisfiesVersionRange(version: string, range: string): boolean {
  const parsed = parseVersion(version)
  if (!parsed || parsed.precision !== 3) return false

  const alternatives = range.split(OR_SEPARATOR).map((part) => part.trim())
  if (alternatives.some((part) => part === '')) return false
  return alternatives.some((part) => satisfiesRangePart(parsed.version, part))
}

function satisfiesRangePart(version: Version, range: string): boolean {
  if (range === '*' || range.toLowerCase() === 'x') return true

  const hyphen = HYPHEN_RANGE_PATTERN.exec(range)
  if (hyphen) {
    const lower = parseVersion(hyphen[1])
    const upper = parseVersion(hyphen[2])
    if (!lower || !upper || compareVersions(version, lower.version) < 0) return false
    if (upper.precision === 3) return compareVersions(version, upper.version) <= 0

    const exclusiveUpper = rangeUpperBound(upper.version, upper.precision, '')
    return exclusiveUpper !== undefined && compareVersions(version, exclusiveUpper) < 0
  }

  return range.split(CLAUSE_SEPARATOR).every((clause) => satisfiesClause(version, clause))
}

function satisfiesClause(version: Version, clause: string): boolean {
  const match = CLAUSE_PATTERN.exec(clause)
  if (!match) return false

  const operator = match[1] ?? ''
  const parsed = parseVersion(match[2])
  if (!parsed) return false

  const lower = parsed.version
  const comparison = compareVersions(version, lower)
  if (operator === '>=') return comparison >= 0
  if (operator === '<=' && parsed.precision === 3) return comparison <= 0
  if (operator === '>' && parsed.precision === 3) return comparison > 0
  if (operator === '<') return comparison < 0
  if ((operator === '=' || operator === '') && parsed.precision === 3) return comparison === 0

  const upper = rangeUpperBound(lower, parsed.precision, operator)
  if (operator === '<=') return upper !== undefined && compareVersions(version, upper) < 0
  if (operator === '>') return upper !== undefined && compareVersions(version, upper) >= 0
  return comparison >= 0 && (upper === undefined || compareVersions(version, upper) < 0)
}

function rangeUpperBound(version: Version, precision: number, operator: string): Version | undefined {
  const [major, minor, patch] = version
  if (operator === '^') {
    if (precision === 1) return [major + 1, 0, 0]
    if (major > 0) return [major + 1, 0, 0]
    if (precision === 2) return [0, minor + 1, 0]
    if (minor > 0) return [0, minor + 1, 0]
    return [0, 0, patch + 1]
  }
  if (operator === '~') return precision === 1 ? [major + 1, 0, 0] : [major, minor + 1, 0]
  if (precision === 1) return [major + 1, 0, 0]
  if (precision === 2) return [major, minor + 1, 0]
  return undefined
}

function parseVersion(value: string): { version: Version; precision: number } | undefined {
  const match = VERSION_PATTERN.exec(value.trim())
  if (!match) return undefined

  const minor = numericPart(match[2])
  const patch = numericPart(match[3])
  if (minor === undefined && match[2] !== undefined && patch !== undefined) return undefined
  const precision =
    match[2] === undefined || minor === undefined ? 1 : match[3] === undefined || patch === undefined ? 2 : 3
  return { version: [Number(match[1]), minor ?? 0, patch ?? 0], precision }
}

function numericPart(value: string | undefined): number | undefined {
  return value !== undefined && NUMERIC_PATTERN.test(value) ? Number(value) : undefined
}

function compareVersions(left: Version, right: Version): number {
  for (let index = 0; index < left.length; index++) {
    const difference = left[index] - right[index]
    if (difference !== 0) return difference
  }
  return 0
}
