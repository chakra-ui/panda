import { type Inspect, type RuleModuleLike, toEslintLoc } from './shared'

export const noShorthandLonghandMixRuleName = 'no-shorthand-longhand-mix'

/** Shorthand property -> the longhand pieces it expands to (Panda's list). */
const COMPOSITE_PROPERTIES: Record<string, string[]> = {
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
  borderBlock: ['borderBlockWidth', 'borderBlockStyle', 'borderBlockColor'],
  borderBlockColor: ['borderBlockStartColor', 'borderBlockEndColor'],
  borderBlockEnd: ['borderBlockEndWidth', 'borderBlockEndStyle', 'borderBlockEndColor'],
  borderBlockStart: ['borderBlockStartWidth', 'borderBlockStartStyle', 'borderBlockStartColor'],
  borderBlockStyle: ['borderBlockStartStyle', 'borderBlockEndStyle'],
  borderBlockWidth: ['borderBlockStartWidth', 'borderBlockEndWidth'],
  borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
  borderColor: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
  borderImage: ['borderImageSource', 'borderImageSlice', 'borderImageWidth', 'borderImageOutset', 'borderImageRepeat'],
  borderInline: ['borderInlineWidth', 'borderInlineStyle', 'borderInlineColor'],
  borderInlineColor: ['borderInlineStartColor', 'borderInlineEndColor'],
  borderInlineEnd: ['borderInlineEndWidth', 'borderInlineEndStyle', 'borderInlineEndColor'],
  borderInlineStart: ['borderInlineStartWidth', 'borderInlineStartStyle', 'borderInlineStartColor'],
  borderInlineStyle: ['borderInlineStartStyle', 'borderInlineEndStyle'],
  borderInlineWidth: ['borderInlineStartWidth', 'borderInlineEndWidth'],
  borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
  borderRadius: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'],
  borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
  borderStyle: ['borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle'],
  borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
  borderWidth: ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'],
  columnRule: ['columnRuleWidth', 'columnRuleStyle', 'columnRuleColor'],
  columns: ['columnWidth', 'columnCount'],
  containIntrinsicSize: ['containIntrinsicSizeInline', 'containIntrinsicSizeBlock'],
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
  insetBlock: ['insetBlockStart', 'insetBlockEnd'],
  insetInline: ['insetInlineStart', 'insetInlineEnd'],
  listStyle: ['listStyleType', 'listStylePosition', 'listStyleImage'],
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  marginBlock: ['marginBlockStart', 'marginBlockEnd'],
  marginInline: ['marginInlineStart', 'marginInlineEnd'],
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
  paddingBlock: ['paddingBlockStart', 'paddingBlockEnd'],
  paddingInline: ['paddingInlineStart', 'paddingInlineEnd'],
  placeContent: ['alignContent', 'justifyContent'],
  placeItems: ['alignItems', 'justifyItems'],
  placeSelf: ['alignSelf', 'justifySelf'],
  scrollMargin: ['scrollMarginTop', 'scrollMarginRight', 'scrollMarginBottom', 'scrollMarginLeft'],
  scrollMarginBlock: ['scrollMarginBlockStart', 'scrollMarginBlockEnd'],
  scrollMarginInline: ['scrollMarginInlineStart', 'scrollMarginInlineEnd'],
  scrollPadding: ['scrollPaddingTop', 'scrollPaddingRight', 'scrollPaddingBottom', 'scrollPaddingLeft'],
  scrollPaddingBlock: ['scrollPaddingBlockStart', 'scrollPaddingBlockEnd'],
  scrollPaddingInline: ['scrollPaddingInlineStart', 'scrollPaddingInlineEnd'],
  textDecoration: ['textDecorationLine', 'textDecorationStyle', 'textDecorationColor'],
  textEmphasis: ['textEmphasisStyle', 'textEmphasisColor'],
  transition: ['transitionProperty', 'transitionDuration', 'transitionTimingFunction', 'transitionDelay'],
}

export function createNoShorthandLonghandMixRule(options: { inspect: Inspect }): RuleModuleLike {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: 'Disallow mixing a shorthand property with its longhand pieces in the same style block.' },
      schema: [
        {
          type: 'object',
          properties: { ignore: { type: 'array', items: { type: 'string' }, uniqueItems: true } },
          additionalProperties: false,
        },
      ],
      messages: { mix: '{{message}}' },
    },
    create(context) {
      const configured = context.options?.[0] as { ignore?: string[] } | undefined
      const ignore = new Set(configured?.ignore ?? [])

      return {
        Program() {
          const inspection = options.inspect(context)
          if (!inspection) return

          // Group siblings by owner + nesting level; only same-block properties
          // interact in the cascade.
          const groups = new Map<string, Map<string, (typeof inspection.styleEntries)[number]>>()
          for (const entry of inspection.styleEntries) {
            if (entry.kind !== 'utility') continue
            const parent = entry.path.slice(0, -1).join('.')
            const key = [entry.owner.kind, entry.owner.index, parent].join('|')
            const group = groups.get(key) ?? new Map()
            group.set(entry.canonicalName ?? entry.name, entry)
            groups.set(key, group)
          }

          for (const group of groups.values()) {
            for (const [prop, entry] of group) {
              if (ignore.has(prop)) continue
              const pieces = COMPOSITE_PROPERTIES[prop]
              if (!pieces) continue
              const mixed = pieces.filter((piece) => group.has(piece))
              if (mixed.length === 0) continue
              const list = mixed.map((piece) => `"${piece}"`).join(', ')
              context.report({
                message: `"${prop}" is mixed with ${list}. Panda emits longhands after shorthands, so ${list} will win regardless of source order; use the longhand properties for a predictable result.`,
                loc: toEslintLoc(entry.range),
              })
            }
          }
        },
      }
    },
  }
}
