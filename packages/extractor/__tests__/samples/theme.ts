import type { NonUndefined } from 'pastable/typings'
import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import type { KnownKeys } from 'ts-toolbelt/out/Any/KnownKeys'
import type { UnionOf } from 'ts-toolbelt/out/Object/UnionOf'

export declare const tokens: {
  readonly colors: {
    readonly transparent: 'transparent'
    readonly current: 'currentColor'
    readonly black: '#000000'
    readonly white: '#FFFFFF'
    readonly whiteAlpha: {
      readonly 50: 'rgba(255, 255, 255, 0.04)'
      readonly 100: 'rgba(255, 255, 255, 0.06)'
      readonly 200: 'rgba(255, 255, 255, 0.08)'
      readonly 300: 'rgba(255, 255, 255, 0.16)'
      readonly 400: 'rgba(255, 255, 255, 0.24)'
      readonly 500: 'rgba(255, 255, 255, 0.36)'
      readonly 600: 'rgba(255, 255, 255, 0.48)'
      readonly 700: 'rgba(255, 255, 255, 0.64)'
      readonly 800: 'rgba(255, 255, 255, 0.80)'
      readonly 900: 'rgba(255, 255, 255, 0.92)'
    }
  }
  readonly radii: {
    readonly none: '0'
    readonly sm: '0.125rem'
    readonly base: '0.25rem'
    readonly md: '0.375rem'
    readonly lg: '0.5rem'
    readonly xl: '0.75rem'
    readonly '2xl': '1rem'
    readonly '3xl': '1.5rem'
    readonly full: '9999px'
  }
  readonly typography: {
    readonly letterSpacings: {
      readonly tighter: '-0.05em'
      readonly tight: '-0.025em'
      readonly normal: '0'
      readonly wide: '0.025em'
      readonly wider: '0.05em'
      readonly widest: '0.1em'
    }
    readonly lineHeights: {
      readonly normal: 'normal'
      readonly none: '1'
      readonly shorter: '1.25'
      readonly short: '1.375'
      readonly base: '1.5'
      readonly tall: '1.625'
      readonly taller: '2'
      readonly '3': '.75rem'
      readonly '4': '1rem'
      readonly '5': '1.25rem'
      readonly '6': '1.5rem'
      readonly '7': '1.75rem'
      readonly '8': '2rem'
      readonly '9': '2.25rem'
      readonly '10': '2.5rem'
    }
    readonly fontWeights: {
      readonly hairline: '100'
      readonly thin: '200'
      readonly light: '300'
      readonly normal: '400'
      readonly medium: '500'
      readonly semibold: '600'
      readonly bold: '700'
      readonly extrabold: '800'
      readonly black: '900'
    }
    readonly fonts: {
      readonly heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
      readonly body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
      readonly mono: 'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace'
    }
  }
  readonly shadows: {
    readonly xs: '0 0 0 1px rgba(0, 0, 0, 0.05)'
    readonly sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    readonly base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    readonly md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    readonly lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    readonly xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    readonly '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    readonly outline: '0 0 0 3px rgba(66, 153, 225, 0.6)'
    readonly inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)'
    readonly none: 'none'
    readonly 'dark-lg': 'rgba(0, 0, 0, 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 5px 10px, rgba(0, 0, 0, 0.4) 0px 15px 40px'
  }
  readonly positions: {
    readonly auto: 'auto'
    readonly '0': '0'
    readonly '-50%': '-50%'
    readonly '0%': '0%'
    readonly '50%': '50%'
    readonly '100%': '100%'
  }
}

const colors = tokens.colors
export declare const flatColors: AppThemeColorMap
type ChakraThemeColors = typeof colors
type PossibleThemeColorKey = SimpleColors | PossibleColorWithVariants
type AppThemeColorMap = {
  [P in keyof ChakraThemeColors[keyof ChakraThemeColors] as PossibleThemeColorKey]: string
}
type SimpleColors = NonObjectKeys<ChakraThemeColors>
type ColorsWithVariants = NonStringKeys<ChakraThemeColors>
type ColorsMapWithTheirVariants = {
  [Prop in ColorsWithVariants]: Exclude<KnownKeys<ChakraThemeColors[Prop]>, 'DEFAULT'>
}
type ColorsMapWithTheirVariantsAndDefault = {
  [Color in Keys<ColorsMapWithTheirVariants>]: `${Color}.${ColorsMapWithTheirVariants[Color]}`
}
type PossibleColorWithVariants = UnionOf<ColorsMapWithTheirVariantsAndDefault>
type NonObjectKeys<T extends object> = {
  [K in keyof T]-?: NonUndefined<T[K]> extends object ? never : K
}[keyof T]
type NonStringKeys<T extends object> = {
  [K in keyof T]-?: NonUndefined<T[K]> extends string ? never : K
}[keyof T]

type ConfigConditions = {
  [conditionName: string]: {
    '@media'?: string
    '@supports'?: string
    '@container'?: string
    selector?: string
  }
}

const screens = {
  mobile: { max: '599px' },
  tablet: { min: '600px', max: '1023px' },
  desktop: { min: '1024px' },
} as const
type TwResponsiveBreakpoints = keyof typeof screens
type TwResponsiveBreakpointsMap = Record<TwResponsiveBreakpoints, { min?: string; max?: string }>

const twBreakpointsToAppBreakpoints = (breakpointsMap: TwResponsiveBreakpointsMap) =>
  Object.fromEntries(
    Object.entries(breakpointsMap).map(([key, { min, max }]) => [
      key,
      {
        '@media': ['screen', min ? `(min-width: ${min})` : '', max ? `(max-width: ${max})` : '']
          .filter(Boolean)
          .join(' and '),
      },
    ]),
  ) as Record<TwResponsiveBreakpoints, ConfigConditions[string]>

const defineProperties = (_props: any) => ''

export const tw = defineProperties({
  conditions: {
    ...twBreakpointsToAppBreakpoints(screens),
    default: {},
    hover: { selector: '&:hover,&[data-hover]' },
    active: { selector: '&:active,&[data-active]' },
    focus: { selector: '&:focus,&[data-focus]' },
    highlighted: { selector: '&[data-highlighted]' },
    focusWithin: { selector: '&:focus-within' },
    focusVisible: { selector: '&:focus-visible' },
    disabled: {
      selector: '&[disabled],&[aria-disabled=true],&[data-disabled]',
    },
    readOnly: {
      selector: '&[aria-readonly=true],&[readonly],&[data-readonly]',
    },
    before: { selector: '&::before' },
    after: { selector: '&::after' },
    empty: { selector: '&:empty' },
    expanded: { selector: '&[aria-expanded=true]' },
    checked: { selector: '&[aria-checked=true],&[data-checked]' },
    grabbed: { selector: '&[aria-grabbed=true],&[data-grabbed]' },
    pressed: { selector: '&[aria-pressed=true],&[data-pressed]' },
    invalid: { selector: '&[aria-invalid=true],&[data-invalid]' },
    valid: { selector: '&[aria-invalid=false],&[data-valid]' },
    loading: { selector: '&[aria-busy=true],&[data-loading]' },
    selected: { selector: '&[aria-selected=true],&[data-selected]' },
    hidden: { selector: '&[aria-hidden=true],&[data-hidden]' },
    autofill: { selector: '&:-webkit-autofill' },
    even: { selector: '&:nth-of-type(even)' },
    odd: { selector: '&:nth-of-type(odd)' },
    first: { selector: '&:first-of-type' },
    last: { selector: '&:last-of-type' },
    notFirst: { selector: '&:not(:first-of-type)' },
    notLast: { selector: '&:not(:last-of-type)' },
    visited: { selector: '&:visited' },
    activeLink: { selector: '&[aria-current=page]' },
    activeStep: { selector: '&[aria-current=step]' },
    indeterminate: {
      selector: '&:indeterminate,&[aria-checked=mixed],&[data-indeterminate]',
    },
    groupHover: {
      selector:
        '[role=group]:hover &,[role=group][data-hover] &,[data-group]:hover &,[data-group][data-hover] &,.group:hover &,.group[data-hover] &',
    },
    peerHover: {
      selector: '[data-peer]:hover ~ &, [data-peer][data-hover] ~ &, .peer:hover ~ &, .peer[data-hover] ~ &',
    },
    groupFocus: {
      selector:
        '[role=group]:focus &,[role=group][data-focus] &,[data-group]:focus &,[data-group][data-focus] &,.group:focus &,.group[data-focus] &',
    },
    peerFocus: {
      selector: '[data-peer]:focus ~ &, [data-peer][data-focus] ~ &, .peer:focus ~ &, .peer[data-focus] ~ &',
    },
    groupFocusVisible: {
      selector: '&[role=group]:focus-visible[data-group]:focus-visible.group:focus-visible',
    },
    peerFocusVisible: {
      selector: '[data-peer]:focus-visible ~ &, .peer:focus-visible ~ &',
    },
    groupActive: {
      selector:
        '[role=group]:active &,[role=group][data-active] &,[data-group]:active &,[data-group][data-active] &,.group:active &,.group[data-active] &',
    },
    peerActive: {
      selector: '[data-peer]:active ~ &, [data-peer][data-active] ~ &, .peer:active ~ &, .peer[data-active] ~ &',
    },
    groupDisabled: {
      selector:
        '[role=group]:disabled &,[role=group][data-disabled] &,[data-group]:disabled &,[data-group][data-disabled] &,.group:disabled &,.group[data-disabled] &',
    },
    peerDisabled: {
      selector: '&[data-peer]:disabled ~ &,[data-peer][data-disabled] ~ &,.peer:disabled ~ &,.peer[data-disabled] ~ &',
    },
    groupInvalid: {
      selector:
        '[role=group]:invalid &,[role=group][data-invalid] &,[data-group]:invalid &,[data-group][data-invalid] &,.group:invalid &,.group[data-invalid] &',
    },
    peerInvalid: {
      selector: '&[data-peer]:invalid ~ &,[data-peer][data-invalid] ~ &,.peer:invalid ~ &,.peer[data-invalid] ~ &',
    },
    groupChecked: {
      selector:
        '[role=group]:checked &,[role=group][data-checked] &,[data-group]:checked &,[data-group][data-checked] &,.group:checked &,.group[data-checked] &',
    },
    peerChecked: {
      selector: '&[data-peer]:checked ~ &,[data-peer][data-checked] ~ &,.peer:checked ~ &,.peer[data-checked] ~ &',
    },
    groupFocusWithin: {
      selector: '&[role=group]:focus-within &, [data-group]:focus-within &, .group:focus-within &',
    },
    peerFocusWithin: {
      selector: '&[data-peer]:focus-within ~ &,.peer:focus-within ~ &',
    },
    peerPlaceholderShown: {
      selector: '&[data-peer]::placeholder-shown ~ &,.peer::placeholder-shown ~ &',
    },
    placeholder: { selector: '&::placeholder' },
    placeholderShown: { selector: '&::placeholder-shown' },
    fullScreen: { selector: '&:fullscreen' },
    selection: { selector: '&::selection' },
    rtl: { selector: '&[dir=rtl] &,&[dir=rtl]' },
    ltr: { selector: '&[dir=ltr] &,&[dir=ltr]' },
    mediaDark: { '@media': '(prefers-color-scheme: dark)' },
    mediaReduceMotion: { '@media': '(prefers-reduced-motion: reduce)' },
    dark: { selector: '&[data-theme=dark] &,&[data-theme=dark]' },
    light: { selector: '&[data-theme=light] &,&[data-theme=light]' },
  },
  properties: {
    boxShadow: tokens.shadows,
    textShadow: tokens.shadows,
    opacity: {
      '0': '0',
      '0.4': '0.6',
      '0.6': '0.6',
      '1': '1',
    },
    cursor: true,
    pointerEvents: true,
    userSelect: true,
    //
    fontFamily: tokens.typography.fonts,
    fontWeight: tokens.typography.fontWeights,
    lineHeight: tokens.typography.lineHeights,
    letterSpacing: tokens.typography.letterSpacings,
    textAlign: true,
    fontStyle: true,
    textTransform: true,
    textDecoration: true,
    //
    position: true,
    display: true,
    flexDirection: true,
    flexShrink: true,
    flexGrow: true,
    flex: true,
    flexWrap: true,
    justifyContent: true,
    justifySelf: true,
    alignItems: true,
    alignSelf: true,
    top: true,
    bottom: true,
    left: true,
    right: true,
    inset: true,
    // base props
    width: true,
    minWidth: true,
    maxWidth: true,
    height: true,
    minHeight: true,
    maxHeight: true,
    whiteSpace: true,
    textOverflow: true,
    overflow: true,
    overflowX: true,
    overflowY: true,
    visibility: true,
    verticalAlign: true,
    // spacing props
    // TODO negative values
    // https://github.com/vanilla-extract-css/vanilla-extract/blob/master/site/src/system/styles/sprinkles.css.ts
    borderStyle: true,
    borderRadius: tokens.radii,
    borderTopLeftRadius: tokens.radii,
    borderTopRightRadius: tokens.radii,
    borderBottomLeftRadius: tokens.radii,
    borderBottomRightRadius: tokens.radii,
    color: colors,
    background: colors,
    backgroundColor: colors,
    borderColor: colors,
    borderTopColor: colors,
    borderBottomColor: colors,
    borderLeftColor: colors,
    borderRightColor: colors,
    outlineColor: colors,
    fill: colors,
    stroke: colors,
    // transform props
    transform: true,
    transformOrigin: true,
  },
  shorthands: {
    // base props
    d: ['display'],
    pos: ['position'],
    t: ['top'],
    b: ['bottom'],
    l: ['left'],
    r: ['right'],
    boxSize: ['width', 'height'],
    w: ['width'],
    h: ['height'],
    minW: ['minWidth'],
    maxW: ['maxWidth'],
    minH: ['minHeight'],
    maxH: ['maxHeight'],
    placeItems: ['justifyContent', 'alignItems'],
    ta: ['textAlign'],
    tt: ['textTransform'],
    fs: ['fontSize'],
    fw: ['fontWeight'],
    // spacing props
    m: ['margin'],
    mt: ['marginTop'],
    mr: ['marginRight'],
    mb: ['marginBottom'],
    ml: ['marginLeft'],
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],
    ms: ['marginInlineStart'],
    me: ['marginInlineEnd'],
    p: ['padding'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom'],
    pt: ['paddingTop'],
    pr: ['paddingRight'],
    pb: ['paddingBottom'],
    pl: ['paddingLeft'],
    px: ['paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    ps: ['paddingInlineStart'],
    pe: ['paddingInlineEnd'],
    py: ['paddingTop', 'paddingBottom'],
    bw: ['borderWidth'],
    bx: ['borderLeft', 'borderRight'],
    borderX: ['borderLeft', 'borderRight'],
    by: ['borderTop', 'borderBottom'],
    borderY: ['borderTop', 'borderBottom'],
    // colors props
    bg: ['background'],
    bgColor: ['backgroundColor'],
    borderXColor: ['borderLeftColor', 'borderRightColor'],
  },
})
