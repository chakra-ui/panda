export function validateSelector(value: string) {
  const thisCount = value.match(/&/g)?.length ?? 0

  if (thisCount === 0) {
    throw new Error(`Invalid selector: ${value}. must have & or an at-rule. Ignoring...`)
  }

  if (thisCount > 1) {
    throw new Error(`Invalid selector: ${value}. You can only have one self selector`)
  }

  if (value.includes(',')) {
    throw new Error("Invalid selector: can't have multiple selectors in one rule. Ignoring...")
  }
}
