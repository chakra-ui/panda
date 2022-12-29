import type { Properties as CSSProperties } from '../src/csstype'

type BasePropTypes = {
  aspectRatio: 'square' | 'landscape' | 'portrait' | 'wide' | 'ultrawide' | 'golden'
  top: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  left: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetInline: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetBlock: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  inset: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetBlockEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetBlockStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetInlineEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetInlineStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  start: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  right: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  end: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  bottom: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  insetY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  float: 'left' | 'right' | 'start' | 'end'
  flexBasis: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  flex: '1' | 'auto' | 'initial' | 'none'
  gridTemplateColumns: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  gridTemplateRows: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
  gridColumn: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'full'
  gridRow: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'full'
  gridAutoColumns: 'min' | 'max' | 'fr'
  gridAutoRows: 'min' | 'max' | 'fr'
  gap: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  gridGap: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  gridRowGap: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  gridColumnGap: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  rowGap: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  columnGap: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  padding: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingLeft: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingRight: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingTop: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingBottom: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingBlock: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingBlockEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingBlockStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingInline: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingInlineEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingInlineStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  paddingY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginLeft: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginRight: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginTop: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginBottom: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  margin: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginBlock: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginBlockEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginBlockStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginInline: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginInlineEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  marginInlineStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  spaceX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  spaceY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  width: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  height: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  minHeight: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16'
  maxHeight: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16'
  minWidth: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16'
  maxWidth: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16'
  color: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  fontFamily: 'sans' | 'serif' | 'mono'
  fontSize: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl'
  fontWeight: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'
  fontSmoothing: 'antialiased' | 'subpixel-antialiased'
  letterSpacing: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'
  lineHeight: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
  textDecorationColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  textEmphasisColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  textIndent: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  textShadow: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner'
  textOverflow: 'ellipsis' | 'clip' | 'truncate'
  truncate: boolean
  background: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  backgroundColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  backgroundGradient: 'to-t' | 'to-tr' | 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl'
  textGradient: 'to-t' | 'to-tr' | 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl'
  gradientFrom: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  gradientTo: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  gradientVia: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderTopLeftRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderTopRightRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderBottomRightRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderBottomLeftRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderTopRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderRightRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderBottomRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderLeftRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderStartStartRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderStartEndRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderStartRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderEndStartRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderEndEndRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  borderEndRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  border: string
  borderColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderXColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderYColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderLeft: string
  borderLeftColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderRight: string
  borderRightColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderTop: string
  borderTopColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderBottom: string
  borderBottomColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  borderX: CSSProperties['border']
  borderY: CSSProperties['border']
  outlineColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  divideX: string
  divideY: string
  divideColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  divideStyle: CSSProperties['borderStyle']
  boxShadow: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner'
  boxShadowColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  filter: 'auto'
  dropShadow: string
  blur: 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  backdropFilter: 'auto'
  backdropBlur: 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  borderSpacing: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  borderSpacingX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  borderSpacingY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  transitionTimingFunction: 'default' | 'linear' | 'in' | 'out' | 'in-out'
  transitionDelay: '75' | '100' | '150'
  transitionDuration: '75' | '100' | '150'
  transitionProperty: 'all' | 'none' | 'opacity' | 'shadow' | 'transform' | 'base' | 'background' | 'colors'
  animation: 'spin' | 'ping' | 'pulse' | 'bounce'
  transform: 'auto' | 'auto-gpu'
  translateX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '1/2' | '1/3' | '2/3' | '1/4' | '2/4' | '3/4' | 'full'
  translateY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '1/2' | '1/3' | '2/3' | '1/4' | '2/4' | '3/4' | 'full'
  accentColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  caretColor: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  scrollMargin: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginLeft: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginRight: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginTop: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginBottom: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginBlock: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginBlockEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginBlockStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginInline: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginInlineEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollMarginInlineStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPadding: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingBlock: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingBlockStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingBlockEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingInline: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingInlineEnd: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingInlineStart: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingX: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingY: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingLeft: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingRight: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingTop: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollPaddingBottom: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollSnapType: 'none' | 'x' | 'y' | 'both'
  scrollSnapStrictness: 'mandatory' | 'proximity'
  scrollSnapMargin: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollSnapMarginTop: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollSnapMarginBottom: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollSnapMarginLeft: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  scrollSnapMarginRight: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  fill: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  stroke: 'current' | 'black' | 'white' | 'transparent' | 'rose.50' | 'rose.100' | 'rose.200'
  srOnly: 'true' | 'false'
  debug: boolean
  colorPalette: 'rose' | 'pink' | 'fuchsia' | 'purple'
  textStyle: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl'
}

type CssProp<T> = T extends keyof CSSProperties ? CSSProperties[T] : string & {}

type BaseProp<T> = T extends keyof BasePropTypes ? BasePropTypes[T] : string & {}

type Shorthand<T> = CssProp<T> | BaseProp<T>

export type PropTypes = BasePropTypes & {
  pos: Shorthand<'position'>
  flexDir: Shorthand<'flexDirection'>
  p: Shorthand<'padding'>
  pl: Shorthand<'paddingLeft'>
  pr: Shorthand<'paddingRight'>
  pt: Shorthand<'paddingTop'>
  pb: Shorthand<'paddingBottom'>
  pe: Shorthand<'paddingInlineEnd'>
  ps: Shorthand<'paddingInlineStart'>
  px: Shorthand<'paddingX'>
  py: Shorthand<'paddingY'>
  ml: Shorthand<'marginLeft'>
  mr: Shorthand<'marginRight'>
  mt: Shorthand<'marginTop'>
  mb: Shorthand<'marginBottom'>
  m: Shorthand<'margin'>
  mx: Shorthand<'marginX'>
  my: Shorthand<'marginY'>
  me: Shorthand<'marginInlineEnd'>
  ms: Shorthand<'marginInlineStart'>
  w: Shorthand<'width'>
  h: Shorthand<'height'>
  minH: Shorthand<'minHeight'>
  maxH: Shorthand<'maxHeight'>
  minW: Shorthand<'minWidth'>
  maxW: Shorthand<'maxWidth'>
  bgAttachment: Shorthand<'backgroundAttachment'>
  bgClip: Shorthand<'backgroundClip'>
  bg: Shorthand<'background'>
  bgColor: Shorthand<'backgroundColor'>
  bgPos: Shorthand<'backgroundPosition'>
  bgOrigin: Shorthand<'backgroundOrigin'>
  bgImage: Shorthand<'backgroundImage'>
  bgRepeat: Shorthand<'backgroundRepeat'>
  bgBlend: Shorthand<'backgroundBlendMode'>
  bgSize: Shorthand<'backgroundSize'>
  bgGradient: Shorthand<'backgroundGradient'>
  shadow: Shorthand<'boxShadow'>
  shadowColor: Shorthand<'boxShadowColor'>
  x: Shorthand<'translateX'>
  y: Shorthand<'translateY'>
}
