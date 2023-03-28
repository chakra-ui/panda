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
    readonly blackAlpha: {
      readonly 50: 'rgba(0, 0, 0, 0.04)'
      readonly 100: 'rgba(0, 0, 0, 0.06)'
      readonly 200: 'rgba(0, 0, 0, 0.08)'
      readonly 300: 'rgba(0, 0, 0, 0.16)'
      readonly 400: 'rgba(0, 0, 0, 0.24)'
      readonly 500: 'rgba(0, 0, 0, 0.36)'
      readonly 600: 'rgba(0, 0, 0, 0.48)'
      readonly 700: 'rgba(0, 0, 0, 0.64)'
      readonly 800: 'rgba(0, 0, 0, 0.80)'
      readonly 900: 'rgba(0, 0, 0, 0.92)'
    }
    readonly gray: {
      readonly 50: '#F7FAFC'
      readonly 100: '#EDF2F7'
      readonly 200: '#E2E8F0'
      readonly 300: '#CBD5E0'
      readonly 400: '#A0AEC0'
      readonly 500: '#718096'
      readonly 600: '#4A5568'
      readonly 700: '#2D3748'
      readonly 800: '#1A202C'
      readonly 900: '#171923'
    }
    readonly red: {
      readonly 50: '#FFF5F5'
      readonly 100: '#FED7D7'
      readonly 200: '#FEB2B2'
      readonly 300: '#FC8181'
      readonly 400: '#F56565'
      readonly 500: '#E53E3E'
      readonly 600: '#C53030'
      readonly 700: '#9B2C2C'
      readonly 800: '#822727'
      readonly 900: '#63171B'
    }
    readonly orange: {
      readonly 50: '#FFFAF0'
      readonly 100: '#FEEBC8'
      readonly 200: '#FBD38D'
      readonly 300: '#F6AD55'
      readonly 400: '#ED8936'
      readonly 500: '#DD6B20'
      readonly 600: '#C05621'
      readonly 700: '#9C4221'
      readonly 800: '#7B341E'
      readonly 900: '#652B19'
    }
    readonly yellow: {
      readonly 50: '#FFFFF0'
      readonly 100: '#FEFCBF'
      readonly 200: '#FAF089'
      readonly 300: '#F6E05E'
      readonly 400: '#ECC94B'
      readonly 500: '#D69E2E'
      readonly 600: '#B7791F'
      readonly 700: '#975A16'
      readonly 800: '#744210'
      readonly 900: '#5F370E'
    }
    readonly green: {
      readonly 50: '#F0FFF4'
      readonly 100: '#C6F6D5'
      readonly 200: '#9AE6B4'
      readonly 300: '#68D391'
      readonly 400: '#48BB78'
      readonly 500: '#38A169'
      readonly 600: '#2F855A'
      readonly 700: '#276749'
      readonly 800: '#22543D'
      readonly 900: '#1C4532'
    }
    readonly teal: {
      readonly 50: '#E6FFFA'
      readonly 100: '#B2F5EA'
      readonly 200: '#81E6D9'
      readonly 300: '#4FD1C5'
      readonly 400: '#38B2AC'
      readonly 500: '#319795'
      readonly 600: '#2C7A7B'
      readonly 700: '#285E61'
      readonly 800: '#234E52'
      readonly 900: '#1D4044'
    }
    readonly blue: {
      readonly 50: '#ebf8ff'
      readonly 100: '#bee3f8'
      readonly 200: '#90cdf4'
      readonly 300: '#63b3ed'
      readonly 400: '#4299e1'
      readonly 500: '#3182ce'
      readonly 600: '#2b6cb0'
      readonly 700: '#2c5282'
      readonly 800: '#2a4365'
      readonly 900: '#1A365D'
    }
    readonly cyan: {
      readonly 50: '#EDFDFD'
      readonly 100: '#C4F1F9'
      readonly 200: '#9DECF9'
      readonly 300: '#76E4F7'
      readonly 400: '#0BC5EA'
      readonly 500: '#00B5D8'
      readonly 600: '#00A3C4'
      readonly 700: '#0987A0'
      readonly 800: '#086F83'
      readonly 900: '#065666'
    }
    readonly purple: {
      readonly 50: '#FAF5FF'
      readonly 100: '#E9D8FD'
      readonly 200: '#D6BCFA'
      readonly 300: '#B794F4'
      readonly 400: '#9F7AEA'
      readonly 500: '#805AD5'
      readonly 600: '#6B46C1'
      readonly 700: '#553C9A'
      readonly 800: '#44337A'
      readonly 900: '#322659'
    }
    readonly pink: {
      readonly 50: '#FFF5F7'
      readonly 100: '#FED7E2'
      readonly 200: '#FBB6CE'
      readonly 300: '#F687B3'
      readonly 400: '#ED64A6'
      readonly 500: '#D53F8C'
      readonly 600: '#B83280'
      readonly 700: '#97266D'
      readonly 800: '#702459'
      readonly 900: '#521B41'
    }
    readonly linkedin: {
      readonly 50: '#E8F4F9'
      readonly 100: '#CFEDFB'
      readonly 200: '#9BDAF3'
      readonly 300: '#68C7EC'
      readonly 400: '#34B3E4'
      readonly 500: '#00A0DC'
      readonly 600: '#008CC9'
      readonly 700: '#0077B5'
      readonly 800: '#005E93'
      readonly 900: '#004471'
    }
    readonly facebook: {
      readonly 50: '#E8F4F9'
      readonly 100: '#D9DEE9'
      readonly 200: '#B7C2DA'
      readonly 300: '#6482C0'
      readonly 400: '#4267B2'
      readonly 500: '#385898'
      readonly 600: '#314E89'
      readonly 700: '#29487D'
      readonly 800: '#223B67'
      readonly 900: '#1E355B'
    }
    readonly messenger: {
      readonly 50: '#D0E6FF'
      readonly 100: '#B9DAFF'
      readonly 200: '#A2CDFF'
      readonly 300: '#7AB8FF'
      readonly 400: '#2E90FF'
      readonly 500: '#0078FF'
      readonly 600: '#0063D1'
      readonly 700: '#0052AC'
      readonly 800: '#003C7E'
      readonly 900: '#002C5C'
    }
    readonly whatsapp: {
      readonly 50: '#dffeec'
      readonly 100: '#b9f5d0'
      readonly 200: '#90edb3'
      readonly 300: '#65e495'
      readonly 400: '#3cdd78'
      readonly 500: '#22c35e'
      readonly 600: '#179848'
      readonly 700: '#0c6c33'
      readonly 800: '#01421c'
      readonly 900: '#001803'
    }
    readonly twitter: {
      readonly 50: '#E5F4FD'
      readonly 100: '#C8E9FB'
      readonly 200: '#A8DCFA'
      readonly 300: '#83CDF7'
      readonly 400: '#57BBF5'
      readonly 500: '#1DA1F2'
      readonly 600: '#1A94DA'
      readonly 700: '#1681BF'
      readonly 800: '#136B9E'
      readonly 900: '#0D4D71'
    }
    readonly telegram: {
      readonly 50: '#E3F2F9'
      readonly 100: '#C5E4F3'
      readonly 200: '#A2D4EC'
      readonly 300: '#7AC1E4'
      readonly 400: '#47A9DA'
      readonly 500: '#0088CC'
      readonly 600: '#007AB8'
      readonly 700: '#006BA1'
      readonly 800: '#005885'
      readonly 900: '#003F5E'
    }
  }
  readonly space: {
    readonly auto: 'auto'
    readonly none: 'none'
    readonly px: '1px'
    readonly 0: '0'
    readonly 0.5: '0.125rem'
    readonly 1: '0.25rem'
    readonly 1.5: '0.375rem'
    readonly 2: '0.5rem'
    readonly 2.5: '0.625rem'
    readonly 3: '0.75rem'
    readonly 3.5: '0.875rem'
    readonly 4: '1rem'
    readonly 5: '1.25rem'
    readonly 6: '1.5rem'
    readonly 7: '1.75rem'
    readonly 8: '2rem'
    readonly 9: '2.25rem'
    readonly 10: '2.5rem'
    readonly 12: '3rem'
    readonly 14: '3.5rem'
    readonly 16: '4rem'
    readonly 20: '5rem'
    readonly 24: '6rem'
    readonly 28: '7rem'
    readonly 32: '8rem'
    readonly 36: '9rem'
    readonly 40: '10rem'
    readonly 44: '11rem'
    readonly 48: '12rem'
    readonly 52: '13rem'
    readonly 56: '14rem'
    readonly 60: '15rem'
    readonly 64: '16rem'
    readonly 72: '18rem'
    readonly 80: '20rem'
    readonly 96: '24rem'
  }
  readonly container: {
    readonly sm: '640px'
    readonly md: '768px'
    readonly lg: '1024px'
    readonly xl: '1280px'
  }
  readonly borders: {
    readonly none: '0'
    readonly '1px': '1px'
    readonly '2px': '2px'
    readonly '4px': '4px'
    readonly '8px': '8px'
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
  readonly sizes: {
    readonly auto: 'auto'
    readonly '0%': '0%'
    readonly '25%': '25%'
    readonly '50%': '50%'
    readonly '75%': '75%'
    readonly '100%': '100%'
    readonly '100vh': '100vh'
    readonly '100vw': '100vw'
    readonly max: 'max-content'
    readonly min: 'min-content'
    readonly full: '100%'
    readonly '3xs': '14rem'
    readonly '2xs': '16rem'
    readonly xs: '20rem'
    readonly sm: '24rem'
    readonly md: '28rem'
    readonly lg: '32rem'
    readonly xl: '36rem'
    readonly '2xl': '42rem'
    readonly '3xl': '48rem'
    readonly '4xl': '56rem'
    readonly '5xl': '64rem'
    readonly '6xl': '72rem'
    readonly '7xl': '80rem'
    readonly '8xl': '90rem'
    readonly prose: '60ch'
    readonly none: 'none'
    readonly px: '1px'
    readonly 0: '0'
    readonly 0.5: '0.125rem'
    readonly 1: '0.25rem'
    readonly 1.5: '0.375rem'
    readonly 2: '0.5rem'
    readonly 2.5: '0.625rem'
    readonly 3: '0.75rem'
    readonly 3.5: '0.875rem'
    readonly 4: '1rem'
    readonly 5: '1.25rem'
    readonly 6: '1.5rem'
    readonly 7: '1.75rem'
    readonly 8: '2rem'
    readonly 9: '2.25rem'
    readonly 10: '2.5rem'
    readonly 12: '3rem'
    readonly 14: '3.5rem'
    readonly 16: '4rem'
    readonly 20: '5rem'
    readonly 24: '6rem'
    readonly 28: '7rem'
    readonly 32: '8rem'
    readonly 36: '9rem'
    readonly 40: '10rem'
    readonly 44: '11rem'
    readonly 48: '12rem'
    readonly 52: '13rem'
    readonly 56: '14rem'
    readonly 60: '15rem'
    readonly 64: '16rem'
    readonly 72: '18rem'
    readonly 80: '20rem'
    readonly 96: '24rem'
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
    readonly fontSizes: {
      readonly '3xs': '0.45rem'
      readonly '2xs': '0.625rem'
      readonly xs: '0.75rem'
      readonly sm: '0.875rem'
      readonly md: '1rem'
      readonly lg: '1.125rem'
      readonly xl: '1.25rem'
      readonly '2xl': '1.5rem'
      readonly '3xl': '1.875rem'
      readonly '4xl': '2.25rem'
      readonly '5xl': '3rem'
      readonly '6xl': '3.75rem'
      readonly '7xl': '4.5rem'
      readonly '8xl': '6rem'
      readonly '9xl': '8rem'
    }
  }
  readonly zIndices: {
    readonly hide: '-1'
    readonly auto: 'auto'
    readonly base: '0'
    readonly docked: '10'
    readonly dropdown: '1000'
    readonly sticky: '1100'
    readonly banner: '1200'
    readonly overlay: '1300'
    readonly modal: '1400'
    readonly popover: '1500'
    readonly skipLink: '1600'
    readonly toast: '1700'
    readonly tooltip: '1800'
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
  readonly aligns: {
    readonly stretch: 'stretch'
    readonly start: 'flex-start'
    readonly center: 'center'
    readonly end: 'flex-end'
    readonly baseline: 'baseline'
    readonly 'space-around': 'space-around'
    readonly 'space-between': 'space-between'
    readonly 'space-evenly': 'space-evenly'
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

const space = tokens.space as Record<keyof typeof tokens.space | `${keyof typeof tokens.space}`, string>

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

const defineProperties = (props: any) => ''

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
    fontSize: tokens.typography.fontSizes,
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
    gap: space,
    rowGap: space,
    columnGap: space,
    padding: space,
    paddingTop: space,
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    paddingInlineStart: space,
    paddingInlineEnd: space,
    margin: space,
    marginTop: space,
    marginBottom: space,
    marginLeft: space,
    marginRight: space,
    marginInlineStart: space,
    marginInlineEnd: space,
    border: tokens.borders,
    borderStyle: true,
    borderWidth: tokens.borders,
    borderTopWidth: tokens.borders,
    borderRightWidth: tokens.borders,
    borderBottomWidth: tokens.borders,
    borderLeftWidth: tokens.borders,
    borderTop: tokens.borders,
    borderBottom: tokens.borders,
    borderLeft: tokens.borders,
    borderRight: tokens.borders,
    borderRadius: tokens.radii,
    borderTopLeftRadius: tokens.radii,
    borderTopRightRadius: tokens.radii,
    borderBottomLeftRadius: tokens.radii,
    borderBottomRightRadius: tokens.radii,
    outline: tokens.borders,
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
