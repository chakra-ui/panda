const shorthandProperties = {
  animation: [
    'animationName',
    'animationDuration',
    'animationTimingFunction',
    'animationDelay',
    'animationIterationCount',
    'animationDirection',
    'animationFillMode',
    'animationPlayState',
  ],
  background: [
    'backgroundImage',
    'backgroundPosition',
    'backgroundSize',
    'backgroundRepeat',
    'backgroundAttachment',
    'backgroundOrigin',
    'backgroundClip',
    'backgroundColor',
  ],
  backgroundPosition: ['backgroundPositionX', 'backgroundPositionY'],
  border: ['borderWidth', 'borderStyle', 'borderColor'],
  borderBlockEnd: ['borderBlockEndWidth', 'borderBlockEndStyle', 'borderBlockEndColor'],
  borderBlockStart: ['borderBlockStartWidth', 'borderBlockStartStyle', 'borderBlockStartColor'],
  borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
  borderColor: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
  borderImage: ['borderImageSource', 'borderImageSlice', 'borderImageWidth', 'borderImageOutset', 'borderImageRepeat'],
  borderInlineEnd: ['borderInlineEndWidth', 'borderInlineEndStyle', 'borderInlineEndColor'],
  borderInlineStart: ['borderInlineStartWidth', 'borderInlineStartStyle', 'borderInlineStartColor'],
  borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
  borderRadius: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'],
  borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
  borderStyle: ['borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle'],
  borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
  borderWidth: ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'],
  columnRule: ['columnRuleWidth', 'columnRuleStyle', 'columnRuleColor'],
  columns: ['columnWidth', 'columnCount'],
  container: ['contain', 'content'],
  containIntrinsicSize: ['containIntrinsicSizeInline', 'containIntrinsicSizeBlock'],
  cue: ['cueBefore', 'cueAfter'],
  flex: ['flexGrow', 'flexShrink', 'flexBasis'],
  flexFlow: ['flexDirection', 'flexWrap'],
  font: [
    'fontStyle',
    'fontVariantCaps',
    'fontVariantEastAsian',
    'fontVariantLigatures',
    'fontVariantNumeric',
    'fontVariantPosition',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'lineHeight',
    'fontFamily',
  ],
  fontSynthesis: ['fontSynthesisWeight', 'fontSynthesisStyle', 'fontSynthesisSmallCaps'],
  fontVariant: [
    'fontVariantCaps',
    'fontVariantEastAsian',
    'fontVariantLigatures',
    'fontVariantNumeric',
    'fontVariantPosition',
  ],
  gap: ['columnGap', 'rowGap'],
  grid: [
    'gridTemplateColumns',
    'gridTemplateRows',
    'gridTemplateAreas',
    'gridAutoColumns',
    'gridAutoRows',
    'gridAutoFlow',
  ],
  gridArea: ['gridRowStart', 'gridColumnStart', 'gridRowEnd', 'gridColumnEnd'],
  gridColumn: ['gridColumnStart', 'gridColumnEnd'],
  gridGap: ['gridColumnGap', 'gridRowGap'],
  gridRow: ['gridRowStart', 'gridRowEnd'],
  gridTemplate: ['gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas'],
  inset: ['top', 'right', 'bottom', 'left'],
  listStyle: ['listStyleType', 'listStylePosition', 'listStyleImage'],
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  mask: ['maskImage', 'maskMode', 'maskRepeat', 'maskPosition', 'maskClip', 'maskOrigin', 'maskSize', 'maskComposite'],
  maskBorder: [
    'maskBorderSource',
    'maskBorderMode',
    'maskBorderSlice',
    'maskBorderWidth',
    'maskBorderOutset',
    'maskBorderRepeat',
  ],
  offset: ['offsetPosition', 'offsetPath', 'offsetDistance', 'offsetRotate', 'offsetAnchor'],
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor'],
  overflow: ['overflowX', 'overflowY'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  pause: ['pauseBefore', 'pauseAfter'],
  placeContent: ['alignContent', 'justifyContent'],
  placeItems: ['alignItems', 'justifyItems'],
  placeSelf: ['alignSelf', 'justifySelf'],
  rest: ['restBefore', 'restAfter'],
  scrollMargin: ['scrollMarginTop', 'scrollMarginRight', 'scrollMarginBottom', 'scrollMarginLeft'],
  scrollPadding: ['scrollPaddingTop', 'scrollPaddingRight', 'scrollPaddingBottom', 'scrollPaddingLeft'],
  scrollPaddingBlock: ['scrollPaddingBlockStart', 'scrollPaddingBlockEnd'],
  scrollPaddingInline: ['scrollPaddingInlineStart', 'scrollPaddingInlineEnd'],
  scrollSnapMargin: ['scrollSnapMarginTop', 'scrollSnapMarginRight', 'scrollSnapMarginBottom', 'scrollSnapMarginLeft'],
  scrollSnapMarginBlock: ['scrollSnapMarginBlockStart', 'scrollSnapMarginBlockEnd'],
  scrollSnapMarginInline: ['scrollSnapMarginInlineStart', 'scrollSnapMarginInlineEnd'],
  scrollTimeline: ['scrollTimelineSource', 'scrollTimelineOrientation'],
  textDecoration: ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor'],
  textEmphasis: ['textEmphasisStyle', 'textEmphasisColor'],
  transition: ['transitionProperty', 'transitionDuration', 'transitionTimingFunction', 'transitionDelay'],
}

const longhands = Object.values(shorthandProperties).reduce((a, b) => [...a, ...b], [])

/**
 * Get the property priority: the higher the priority, the higher the resulting
 * specificity of the atom. For example, if we had:
 *
 * ```tsx
 * import { css } from '@pandacss/dev';
 *
 * css({
 *   backgroundColor: 'blue',
 *   background: 'red',
 * })
 *
 * ```
 *
 * and so the more specific selector would win
 *
 * Taken from
 * @see https://github.com/callstack/linaria/blob/049a4ccb77e29f3628353352db21bd446fa04a2e/packages/atomic/src/processors/helpers/propertyPriority.ts
 */
export function getPropertyPriority(property: string) {
  if (property === 'all') return 0
  return longhands.includes(property) ? 2 : 1
}
