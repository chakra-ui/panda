import type { SemanticTokens } from '@pandacss/types'
import { neutralColors } from './neutral'

export const semanticColors: SemanticTokens['colors'] = {
  neutral: neutralColors,
  text: {
    DEFAULT: { value: '{colors.Neutral1000}' },
    accent: {
      blue: {
        DEFAULT: {
          value: { _light: '{colors.Blue800}', _dark: '{colors.Blue300}' },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Blue200}' } },
        },
        red: {
          DEFAULT: { value: { _light: '{colors.Red800}', _dark: '{colors.Red300}' } },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Red200}' } },
        },
        orange: {
          DEFAULT: { value: { _light: '{colors.Orange800}', _dark: '{colors.Orange300}' } },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Orange200}' } },
        },
        yellow: {
          DEFAULT: { value: { _light: '{colors.Yellow800}', _dark: '{colors.Yellow300}' } },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Yellow200}' } },
        },
        green: {
          DEFAULT: { value: { _light: '{colors.Green800}', _dark: '{colors.Green300}' } },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Green200}' } },
        },
        purple: {
          DEFAULT: { value: { _light: '{colors.Purple800}', _dark: '{colors.Purple300}' } },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Purple200}' } },
        },
        teal: {
          DEFAULT: { value: { _light: '{colors.Teal800}', _dark: '{colors.Teal300}' } },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Teal200}' } },
        },
        magenta: {
          DEFAULT: { value: { _light: '{colors.Magenta800}', _dark: '{colors.Magenta300}' } },
          bolder: { value: { _light: '{colors.900}', _dark: '{colors.Magenta200}' } },
        },
        gray: {
          DEFAULT: { value: '{colors.Neutral800}' },
          bolder: { value: '{colors.Neutral1100}' },
        },
      },
    },
    disabled: {
      value: '{colors.Neutral400}',
    },
    inverse: {
      value: '{colors.Neutral10}',
    },
    selected: {
      value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
    },
    brand: {
      value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
    },
    danger: {
      value: { _light: '{colors.Red800}', _dark: '{colors.Red300}' },
    },
    warning: {
      DEFAULT: {
        value: { _light: '{colors.Orange800}', _dark: '{colors.Orange300}' },
      },
      inverse: {
        value: { _light: '{colors.Neutral1000}', _dark: '{colors.Neutral0}' },
      },
    },
    success: {
      value: { _light: '{colors.Green800}', _dark: '{colors.Green300}' },
    },
    discovery: {
      value: { _light: '{colors.Purple800}', _dark: '{colors.Purple300}' },
    },
    information: {
      value: { _light: '{colors.Blue800}', _dark: '{colors.Blue300}' },
    },
    subtle: {
      value: '{colors.Neutral800}',
    },
    subtlest: {
      value: '{colors.Neutral700}',
    },
  },
  icon: {
    DEFAULT: {
      value: '{colors.Neutral600}',
    },
    accent: {
      blue: {
        value: '{colors.Blue500}',
      },
      red: {
        value: { _light: '{colors.Red600}', _dark: '{colors.Red500}' },
      },
      orange: {
        value: { _light: '{colors.Orange600}', _dark: '{colors.Orange500}' },
      },
      yellow: {
        value: { _light: '{colors.Yellow600}', _dark: '{colors.Yellow500}' },
      },
      green: {
        value: { _light: '{colors.Green600}', _dark: '{colors.Green500}' },
      },
      purple: {
        value: { _light: '{colors.Purple600}', _dark: '{colors.Purple500}' },
      },
      teal: {
        value: { _light: '{colors.Teal600}', _dark: '{colors.Teal500}' },
      },
      magenta: {
        value: { _light: '{colors.Magenta600}', _dark: '{colors.Magenta500}' },
      },
      gray: {
        value: '{colors.Neutral600}',
      },
    },
    disabled: {
      value: '{colors.Neutral400A}',
    },
    inverse: {
      value: '{colors.Neutral0}',
    },
    selected: {
      value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
    },
    brand: {
      value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
    },
    danger: {
      value: { _light: '{colors.Red600}', _dark: '{colors.Red500}' },
    },
    warning: {
      DEFAULT: {
        value: { _light: '{colors.Orange600}', _dark: '{colors.Orange500}' },
      },
      inverse: {
        value: { _light: '{colors.Neutral1000}', _dark: '{colors.Neutral0}' },
      },
    },
    success: {
      value: { _light: '{colors.Green600}', _dark: '{colors.Green500}' },
    },
    discovery: {
      value: { _light: '{colors.Purple600}', _dark: '{colors.Purple500}' },
    },
    information: {
      value: { _light: '{colors.Blue600}', _dark: '{colors.Blue500}' },
    },
    subtle: {
      value: '{colors.Neutral700}',
    },
  },
  border: {
    DEFAULT: {
      value: '{colors.Neutral300A}',
    },
    bold: {
      value: '{colors.Neutral600}',
    },
    accent: {
      blue: {
        value: 'Blue500',
      },
      red: {
        value: { _light: '{colors.Red600}', _dark: '{colors.Red500}' },
      },
      orange: {
        value: { _light: '{colors.Orange600}', _dark: '{colors.Orange500}' },
      },
      yellow: {
        value: { _light: '{colors.Yellow600}', _dark: '{colors.Yellow500}' },
      },
      green: {
        value: { _light: '{colors.Green600}', _dark: '{colors.Green500}' },
      },
      purple: {
        value: { _light: '{colors.Purple600}', _dark: '{colors.Purple500}' },
      },
      teal: {
        value: { _light: '{colors.Teal600}', _dark: '{colors.Teal500}' },
      },
      magenta: {
        value: { _light: '{colors.Magenta600}', _dark: '{colors.Magenta500}' },
      },
      gray: {
        value: '{colors.Neutral600}',
      },
    },
    disabled: {
      value: '{colors.Neutral200A}',
    },
    focused: {
      value: { _light: '{colors.Blue500}', _dark: '{colors.Blue300}' },
    },
    input: {
      value: '{colors.Neutral300A}',
    },
    inverse: {
      value: '{colors.Neutral0}',
    },
    selected: {
      value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
    },
    brand: {
      value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
    },
    danger: {
      value: { _light: '{colors.Red600}', _dark: '{colors.Red500}' },
    },
    warning: {
      value: { _light: '{colors.Orange600}', _dark: '{colors.Orange500}' },
    },
    success: {
      value: { _light: '{colors.Green600}', _dark: '{colors.Green500}' },
    },
    discovery: {
      value: { _light: '{colors.Purple600}', _dark: '{colors.Purple500}' },
    },
    information: {
      value: { _light: '{colors.Blue600}', _dark: '{colors.Blue500}' },
    },
  },
  background: {
    accent: {
      blue: {
        subtlest: {
          value: { _light: '{colors.Blue100}', _dark: '{colors.Blue1000}' },
        },
        subtler: {
          value: { _light: '{colors.Blue200}', _dark: '{colors.Blue900}' },
        },
        subtle: {
          value: { _light: '{colors.Blue400}', _dark: '{colors.Blue800}' },
        },
        bolder: {
          value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
        },
      },
      red: {
        subtlest: {
          value: { _light: '{colors.Red100}', _dark: '{colors.Red1000}' },
        },
        subtler: {
          value: { _light: '{colors.Red200}', _dark: '{colors.Red900}' },
        },
        subtle: {
          value: { _light: '{colors.Red400}', _dark: '{colors.Red800}' },
        },
        bolder: {
          value: { _light: '{colors.Red700}', _dark: '{colors.Red400}' },
        },
      },
      orange: {
        subtlest: {
          value: { _light: '{colors.Orange100}', _dark: '{colors.Orange1000}' },
        },
        subtler: {
          value: { _light: '{colors.Orange200}', _dark: '{colors.Orange900}' },
        },
        subtle: {
          value: { _light: '{colors.Orange400}', _dark: '{colors.Orange800}' },
        },
        bolder: {
          value: { _light: '{colors.Orange700}', _dark: '{colors.Orange400}' },
        },
      },
      yellow: {
        subtlest: {
          value: { _light: '{colors.Yellow100}', _dark: '{colors.Yellow1000}' },
        },
        subtler: {
          value: { _light: '{colors.Yellow200}', _dark: '{colors.Yellow900}' },
        },
        subtle: {
          value: { _light: '{colors.Yellow400}', _dark: '{colors.Yellow800}' },
        },
        bolder: {
          value: { _light: '{colors.Yellow700}', _dark: '{colors.Yellow400}' },
        },
      },
      green: {
        subtlest: {
          value: { _light: '{colors.Green100}', _dark: '{colors.Green1000}' },
        },
        subtler: {
          value: { _light: '{colors.Green200}', _dark: '{colors.Green900}' },
        },
        subtle: {
          value: { _light: '{colors.Green400}', _dark: '{colors.Green800}' },
        },
        bolder: {
          value: { _light: '{colors.Green700}', _dark: '{colors.Green400}' },
        },
      },
      purple: {
        subtlest: {
          value: { _light: '{colors.Purple100}', _dark: '{colors.Purple1000}' },
        },
        subtler: {
          value: { _light: '{colors.Purple200}', _dark: '{colors.Purple900}' },
        },
        subtle: {
          value: { _light: '{colors.Purple400}', _dark: '{colors.Purple800}' },
        },
        bolder: {
          value: { _light: '{colors.Purple700}', _dark: '{colors.Purple400}' },
        },
      },
      teal: {
        subtlest: {
          value: { _light: '{colors.Teal100}', _dark: '{colors.Teal1000}' },
        },
        subtler: {
          value: { _light: '{colors.Teal200}', _dark: '{colors.Teal900}' },
        },
        subtle: {
          value: { _light: '{colors.Teal400}', _dark: '{colors.Teal800}' },
        },
        bolder: {
          value: { _light: '{colors.Teal700}', _dark: '{colors.Teal400}' },
        },
      },
      magenta: {
        subtlest: {
          value: { _light: '{colors.Magenta100}', _dark: '{colors.Magenta1000}' },
        },
        subtler: {
          value: { _light: '{colors.Magenta200}', _dark: '{colors.Magenta900}' },
        },
        subtle: {
          value: { _light: '{colors.Magenta400}', _dark: '{colors.Magenta800}' },
        },
        bolder: {
          value: { _light: '{colors.Magenta700}', _dark: '{colors.Magenta400}' },
        },
      },
      gray: {
        subtlest: {
          value: { _light: '{colors.Neutral200}', _dark: '{colors.Neutral300}' },
        },
        subtler: {
          value: { _light: '{colors.Neutral300}', _dark: '{colors.Neutral400}' },
        },
        subtle: {
          value: { _light: '{colors.Neutral400}', _dark: '{colors.Neutral500}' },
        },
        bolder: {
          value: '{colors.Neutral700}',
        },
      },
    },
    disabled: {
      value: '{colors.Neutral100A}',
    },
    neutral: {
      DEFAULT: {
        value: '{colors.Neutral200A}',
      },
      hovered: {
        value: '{colors.Neutral300A}',
      },
      pressed: {
        value: '{colors.Neutral400A}',
      },
      subtle: {
        DEFAULT: {
          value: 'transparent',
        },
        hovered: {
          value: '{colors.Neutral200A}',
        },
        pressed: {
          value: '{colors.Neutral300A}',
        },
      },
      bold: {
        DEFAULT: {
          value: '{colors.Neutral800}',
        },
        hovered: {
          value: '{colors.Neutral900}',
        },
        pressed: {
          value: '{colors.Neutral1000}',
        },
      },
    },
    inverse: {
      subtle: {
        DEFAULT: {
          value: { _light: '#00000029', _dark: '#FFFFFF29' },
        },
        hovered: {
          value: { _light: '#0000003D', _dark: '#FFFFFF3D' },
        },
        pressed: {
          value: { _light: '#00000052', _dark: '#FFFFFF52' },
        },
      },
    },
    selected: {
      DEFAULT: {
        value: { _light: '{colors.Blue100}', _dark: '{colors.Blue1000}' },
      },
      hovered: {
        value: { _light: '{colors.Blue200}', _dark: '{colors.Blue900}' },
      },
      pressed: {
        value: { _light: '{colors.Blue300}', _dark: '{colors.Blue800}' },
      },
      bold: {
        DEFAULT: {
          value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
        },
        hovered: {
          value: { _light: '{colors.Blue800}', _dark: '{colors.Blue300}' },
        },
        pressed: {
          value: { _light: '{colors.Blue900}', _dark: '{colors.Blue200}' },
        },
      },
    },
    brand: {
      bold: {
        DEFAULT: {
          value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
        },
        hovered: {
          value: { _light: '{colors.Blue800}', _dark: '{colors.Blue300}' },
        },
        pressed: {
          value: { _light: '{colors.Blue900}', _dark: '{colors.Blue200}' },
        },
      },
    },
    input: {
      DEFAULT: {
        value: { _light: '{colors.Neutral0}', _dark: '{colors.Neutral100A}' },
      },
      hovered: {
        value: { _light: '{colors.Neutral100}', _dark: '{colors.Neutral200}' },
      },
      pressed: {
        value: { _light: '{colors.Neutral0}', _dark: '{colors.Neutral100}' },
      },
    },
    warning: {
      DEFAULT: {
        value: { _light: '{colors.Yellow100}', _dark: '{colors.Yellow1000}' },
      },
      hovered: {
        value: { _light: '{colors.Yellow200}', _dark: '{colors.Yellow900}' },
      },
      pressed: {
        value: { _light: '{colors.Yellow300}', _dark: '{colors.Yellow800}' },
      },
      bold: {
        DEFAULT: {
          value: { _light: '{colors.Yellow400}', _dark: '{colors.Yellow400}' },
        },
        hovered: {
          value: { _light: '{colors.Yellow500}', _dark: '{colors.Yellow300}' },
        },
        pressed: {
          value: { _light: '{colors.Yellow600}', _dark: '{colors.Yellow200}' },
        },
      },
    },
    success: {
      DEFAULT: {
        value: { _light: '{colors.Green100}', _dark: '{colors.Green1000}' },
      },
      hovered: {
        value: { _light: '{colors.Green200}', _dark: '{colors.Green900}' },
      },
      pressed: {
        value: { _light: '{colors.Green300}', _dark: '{colors.Green800}' },
      },
      bold: {
        DEFAULT: {
          value: { _light: '{colors.Green700}', _dark: '{colors.Green400}' },
        },
        hovered: {
          value: { _light: '{colors.Green800}', _dark: '{colors.Green300}' },
        },
        pressed: {
          value: { _light: '{colors.Green900}', _dark: '{colors.Green200}' },
        },
      },
    },
    discovery: {
      DEFAULT: {
        value: { _light: '{colors.Purple100}', _dark: '{colors.Purple1000}' },
      },
      hovered: {
        value: { _light: '{colors.Purple200}', _dark: '{colors.Purple900}' },
      },
      pressed: {
        value: { _light: '{colors.Purple300}', _dark: '{colors.Purple800}' },
      },
      bold: {
        DEFAULT: {
          value: { _light: '{colors.Purple700}', _dark: '{colors.Purple400}' },
        },
        hovered: {
          value: { _light: '{colors.Purple800}', _dark: '{colors.Purple300}' },
        },
        pressed: {
          value: { _light: '{colors.Purple900}', _dark: '{colors.Purple200}' },
        },
      },
    },
    information: {
      DEFAULT: {
        value: { _light: '{colors.Blue100}', _dark: '{colors.Blue1000}' },
      },
      hovered: {
        value: { _light: '{colors.Blue200}', _dark: '{colors.Blue900}' },
      },
      pressed: {
        value: { _light: '{colors.Blue300}', _dark: '{colors.Blue800}' },
      },
      bold: {
        DEFAULT: {
          value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
        },
        hovered: {
          value: { _light: '{colors.Blue800}', _dark: '{colors.Blue300}' },
        },
        pressed: {
          value: { _light: '{colors.Blue900}', _dark: '{colors.Blue200}' },
        },
      },
    },
    danger: {
      DEFAULT: {
        value: { _light: '{colors.Red100}', _dark: '{colors.Red1000}' },
      },
      hovered: {
        value: { _light: '{colors.Red200}', _dark: '{colors.Red900}' },
      },
      pressed: {
        value: { _light: '{colors.Red300}', _dark: '{colors.Red800}' },
      },
      bold: {
        DEFAULT: {
          value: { _light: '{colors.Red700}', _dark: '{colors.Red400}' },
        },
        hovered: {
          value: { _light: '{colors.Red800}', _dark: '{colors.Red300}' },
        },
        pressed: {
          value: { _light: '{colors.Red900}', _dark: '{colors.Red200}' },
        },
      },
    },
  },
  blanket: {
    DEFAULT: {
      value: { _light: '{colors.Neutral500A}', _dark: '{colors.Neutral-100A}' },
    },
    selected: {
      value: { _light: '#388BFF14', _dark: '#1D7AFC14' },
    },
    danger: {
      value: { _light: '#EF5C4814', _dark: '#E3493514' },
    },
  },
  interaction: {
    hovered: {
      value: { _light: '#00000029', _dark: '#ffffff33' },
    },
    pressed: {
      value: { _light: '#00000052', _dark: '#ffffff5c' },
    },
  },
  skeleton: {
    DEFAULT: {
      value: '{colors.Neutral200A}',
    },
    subtle: {
      value: '{colors.Neutral100A}',
    },
  },
  link: {
    DEFAULT: {
      value: { _light: '{colors.Blue700}', _dark: '{colors.Blue400}' },
    },
    pressed: {
      value: { _light: '{colors.Blue800}', _dark: '{colors.Blue300}' },
    },
  },
}
