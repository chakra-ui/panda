export function validateSelector(value: string) {
  const thisCount = value.match(/&/g)?.length ?? 0

  if (thisCount !== 0) return

  throw new Error(`
    Invalid selector: ${value}

    Style selectors must target the '&' character (along with any modifiers), e.g. ${'`parent &`'} or ${'`parent &:hover`'}.
  
    This is to ensure that each style block only affects the styling of a single class.
  `)
}
