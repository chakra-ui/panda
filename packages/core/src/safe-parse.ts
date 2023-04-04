import postcss from 'postcss'

export function safeParse(str: Parameters<typeof postcss.parse>[0]) {
  try {
    return postcss.parse(str)
  } catch (error) {
    return postcss.root()
  }
}
