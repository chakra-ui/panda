import type { SemanticTokens } from '@pandacss/types'

export const semanticColors: SemanticTokens['colors'] = {
  text: {
    DEFAULT: {
      value: {
        _light: '#172B4D',
        _dark: '#B6C2CF',
      },
    },
    accent: {
      lime: {
        DEFAULT: {
          value: {
            _light: '#4C6B1F',
            _dark: '#B3DF72',
          },
        },
        bolder: {
          value: {
            _light: '#37471F',
            _dark: '#D3F1A7',
          },
        },
      },
      red: {
        DEFAULT: {
          value: {
            _light: '#AE2E24',
            _dark: '#FD9891',
          },
        },
        bolder: {
          value: {
            _light: '#5D1F1A',
            _dark: '#FFD5D2',
          },
        },
      },
      orange: {
        DEFAULT: {
          value: {
            _light: '#A54800',
            _dark: '#FEC195',
          },
        },
        bolder: {
          value: {
            _light: '#702E00',
            _dark: '#FEDEC8',
          },
        },
      },
      yellow: {
        DEFAULT: {
          value: {
            _light: '#7F5F01',
            _dark: '#F5CD47',
          },
        },
        bolder: {
          value: {
            _light: '#533F04',
            _dark: '#F8E6A0',
          },
        },
      },
      green: {
        DEFAULT: {
          value: {
            _light: '#216E4E',
            _dark: '#7EE2B8',
          },
        },
        bolder: {
          value: {
            _light: '#164B35',
            _dark: '#BAF3DB',
          },
        },
      },
      teal: {
        DEFAULT: {
          value: {
            _light: '#206A83',
            _dark: '#9DD9EE',
          },
        },
        bolder: {
          value: {
            _light: '#164555',
            _dark: '#C6EDFB',
          },
        },
      },
      blue: {
        DEFAULT: {
          value: {
            _light: '#0055CC',
            _dark: '#85B8FF',
          },
        },
        bolder: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
      },
      purple: {
        DEFAULT: {
          value: {
            _light: '#5E4DB2',
            _dark: '#B8ACF6',
          },
        },
        bolder: {
          value: {
            _light: '#352C63',
            _dark: '#DFD8FD',
          },
        },
      },
      magenta: {
        DEFAULT: {
          value: {
            _light: '#943D73',
            _dark: '#F797D2',
          },
        },
        bolder: {
          value: {
            _light: '#50253F',
            _dark: '#FDD0EC',
          },
        },
      },
      gray: {
        DEFAULT: {
          value: {
            _light: '#44546F',
            _dark: '#9FADBC',
          },
        },
        bolder: {
          value: {
            _light: '#091E42',
            _dark: '#DEE4EA',
          },
        },
      },
    },
    disabled: {
      value: {
        _light: '#091E424F',
        _dark: '#BFDBF847',
      },
    },
    inverse: {
      value: {
        _light: '#FFFFFF',
        _dark: '#1D2125',
      },
    },
    selected: {
      value: {
        _light: '#0C66E4',
        _dark: '#579DFF',
      },
    },
    brand: {
      value: {
        _light: '#0C66E4',
        _dark: '#579DFF',
      },
    },
    danger: {
      value: {
        _light: '#AE2E24',
        _dark: '#FD9891',
      },
    },
    warning: {
      DEFAULT: {
        value: {
          _light: '#A54800',
          _dark: '#F5CD47',
        },
      },
      inverse: {
        value: {
          _light: '#172B4D',
          _dark: '#1D2125',
        },
      },
    },
    success: {
      value: {
        _light: '#216E4E',
        _dark: '#7EE2B8',
      },
    },
    discovery: {
      value: {
        _light: '#5E4DB2',
        _dark: '#B8ACF6',
      },
    },
    information: {
      value: {
        _light: '#0055CC',
        _dark: '#85B8FF',
      },
    },
    subtlest: {
      value: {
        _light: '#626F86',
        _dark: '#8C9BAB',
      },
    },
    subtle: {
      value: {
        _light: '#44546F',
        _dark: '#9FADBC',
      },
    },
  },
  link: {
    DEFAULT: {
      value: {
        _light: '#0C66E4',
        _dark: '#579DFF',
      },
    },
    pressed: {
      value: {
        _light: '#0055CC',
        _dark: '#85B8FF',
      },
    },
    visited: {
      DEFAULT: {
        value: {
          _light: '#5E4DB2',
          _dark: '#B8ACF6',
        },
      },
      pressed: {
        value: {
          _light: '#352C63',
          _dark: '#DFD8FD',
        },
      },
    },
  },
  icon: {
    DEFAULT: {
      value: {
        _light: '#44546F',
        _dark: '#9FADBC',
      },
    },
    accent: {
      lime: {
        value: {
          _light: '#6A9A23',
          _dark: '#82B536',
        },
      },
      red: {
        value: {
          _light: '#C9372C',
          _dark: '#E2483D',
        },
      },
      orange: {
        value: {
          _light: '#E56910',
          _dark: '#F38A3F',
        },
      },
      yellow: {
        value: {
          _light: '#B38600',
          _dark: '#F5CD47',
        },
      },
      green: {
        value: {
          _light: '#22A06B',
          _dark: '#2ABB7F',
        },
      },
      teal: {
        value: {
          _light: '#2898BD',
          _dark: '#42B2D7',
        },
      },
      blue: {
        value: {
          _light: '#1D7AFC',
          _dark: '#388BFF',
        },
      },
      purple: {
        value: {
          _light: '#8270DB',
          _dark: '#8F7EE7',
        },
      },
      magenta: {
        value: {
          _light: '#CD519D',
          _dark: '#DA62AC',
        },
      },
      gray: {
        value: {
          _light: '#758195',
          _dark: '#738496',
        },
      },
    },
    disabled: {
      value: {
        _light: '#091E424F',
        _dark: '#BFDBF847',
      },
    },
    inverse: {
      value: {
        _light: '#FFFFFF',
        _dark: '#1D2125',
      },
    },
    selected: {
      value: {
        _light: '#0C66E4',
        _dark: '#579DFF',
      },
    },
    brand: {
      value: {
        _light: '#0C66E4',
        _dark: '#579DFF',
      },
    },
    danger: {
      value: {
        _light: '#C9372C',
        _dark: '#F15B50',
      },
    },
    warning: {
      DEFAULT: {
        value: {
          _light: '#E56910',
          _dark: '#F5CD47',
        },
      },
      inverse: {
        value: {
          _light: '#172B4D',
          _dark: '#1D2125',
        },
      },
    },
    success: {
      value: {
        _light: '#22A06B',
        _dark: '#2ABB7F',
      },
    },
    discovery: {
      value: {
        _light: '#8270DB',
        _dark: '#8F7EE7',
      },
    },
    information: {
      value: {
        _light: '#1D7AFC',
        _dark: '#388BFF',
      },
    },
    subtlest: {
      value: {
        _light: '#626F86',
        _dark: '#8C9BAB',
      },
    },
    subtle: {
      value: {
        _light: '#626F86',
        _dark: '#8C9BAB',
      },
    },
  },
  border: {
    DEFAULT: {
      value: {
        _light: '#091E4224',
        _dark: '#A6C5E229',
      },
    },
    accent: {
      lime: {
        value: {
          _light: '#6A9A23',
          _dark: '#82B536',
        },
      },
      red: {
        value: {
          _light: '#E2483D',
          _dark: '#F15B50',
        },
      },
      orange: {
        value: {
          _light: '#E56910',
          _dark: '#F38A3F',
        },
      },
      yellow: {
        value: {
          _light: '#B38600',
          _dark: '#CF9F02',
        },
      },
      green: {
        value: {
          _light: '#22A06B',
          _dark: '#2ABB7F',
        },
      },
      teal: {
        value: {
          _light: '#2898BD',
          _dark: '#42B2D7',
        },
      },
      blue: {
        value: {
          _light: '#1D7AFC',
          _dark: '#388BFF',
        },
      },
      purple: {
        value: {
          _light: '#8270DB',
          _dark: '#8F7EE7',
        },
      },
      magenta: {
        value: {
          _light: '#CD519D',
          _dark: '#DA62AC',
        },
      },
      gray: {
        value: {
          _light: '#758195',
          _dark: '#738496',
        },
      },
    },
    disabled: {
      value: {
        _light: '#091E420F',
        _dark: '#A1BDD914',
      },
    },
    focused: {
      value: {
        _light: '#388BFF',
        _dark: '#85B8FF',
      },
    },
    input: {
      value: {
        _light: '#8590A2',
        _dark: '#738496',
      },
    },
    inverse: {
      value: {
        _light: '#FFFFFF',
        _dark: '#161A1D',
      },
    },
    selected: {
      value: {
        _light: '#0C66E4',
        _dark: '#579DFF',
      },
    },
    brand: {
      value: {
        _light: '#0C66E4',
        _dark: '#579DFF',
      },
    },
    danger: {
      value: {
        _light: '#E2483D',
        _dark: '#F15B50',
      },
    },
    warning: {
      value: {
        _light: '#E56910',
        _dark: '#CF9F02',
      },
    },
    success: {
      value: {
        _light: '#22A06B',
        _dark: '#2ABB7F',
      },
    },
    discovery: {
      value: {
        _light: '#8270DB',
        _dark: '#8F7EE7',
      },
    },
    information: {
      value: {
        _light: '#1D7AFC',
        _dark: '#388BFF',
      },
    },
    bold: {
      value: {
        _light: '#758195',
        _dark: '#738496',
      },
    },
  },
  background: {
    accent: {
      lime: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#EFFFD6',
              _dark: '#28311B',
            },
          },
          hovered: {
            value: {
              _light: '#D3F1A7',
              _dark: '#37471F',
            },
          },
          pressed: {
            value: {
              _light: '#B3DF72',
              _dark: '#4C6B1F',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#D3F1A7',
              _dark: '#37471F',
            },
          },
          hovered: {
            value: {
              _light: '#B3DF72',
              _dark: '#4C6B1F',
            },
          },
          pressed: {
            value: {
              _light: '#94C748',
              _dark: '#5B7F24',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#94C748',
              _dark: '#4C6B1F',
            },
          },
          hovered: {
            value: {
              _light: '#B3DF72',
              _dark: '#37471F',
            },
          },
          pressed: {
            value: {
              _light: '#D3F1A7',
              _dark: '#28311B',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#5B7F24',
              _dark: '#94C748',
            },
          },
          hovered: {
            value: {
              _light: '#4C6B1F',
              _dark: '#B3DF72',
            },
          },
          pressed: {
            value: {
              _light: '#37471F',
              _dark: '#D3F1A7',
            },
          },
        },
      },
      red: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#FFECEB',
              _dark: '#42221F',
            },
          },
          hovered: {
            value: {
              _light: '#FFD5D2',
              _dark: '#5D1F1A',
            },
          },
          pressed: {
            value: {
              _light: '#FD9891',
              _dark: '#AE2E24',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#FFD5D2',
              _dark: '#5D1F1A',
            },
          },
          hovered: {
            value: {
              _light: '#FD9891',
              _dark: '#AE2E24',
            },
          },
          pressed: {
            value: {
              _light: '#F87168',
              _dark: '#C9372C',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#F87168',
              _dark: '#AE2E24',
            },
          },
          hovered: {
            value: {
              _light: '#FD9891',
              _dark: '#5D1F1A',
            },
          },
          pressed: {
            value: {
              _light: '#FFD5D2',
              _dark: '#42221F',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#C9372C',
              _dark: '#F87168',
            },
          },
          hovered: {
            value: {
              _light: '#AE2E24',
              _dark: '#FD9891',
            },
          },
          pressed: {
            value: {
              _light: '#5D1F1A',
              _dark: '#FFD5D2',
            },
          },
        },
      },
      orange: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#FFF3EB',
              _dark: '#38291E',
            },
          },
          hovered: {
            value: {
              _light: '#FEDEC8',
              _dark: '#702E00',
            },
          },
          pressed: {
            value: {
              _light: '#FEC195',
              _dark: '#A54800',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#FEDEC8',
              _dark: '#702E00',
            },
          },
          hovered: {
            value: {
              _light: '#FEC195',
              _dark: '#A54800',
            },
          },
          pressed: {
            value: {
              _light: '#FEA362',
              _dark: '#C25100',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#FEA362',
              _dark: '#A54800',
            },
          },
          hovered: {
            value: {
              _light: '#FEC195',
              _dark: '#702E00',
            },
          },
          pressed: {
            value: {
              _light: '#FEDEC8',
              _dark: '#38291E',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#C25100',
              _dark: '#FEA362',
            },
          },
          hovered: {
            value: {
              _light: '#A54800',
              _dark: '#FEC195',
            },
          },
          pressed: {
            value: {
              _light: '#702E00',
              _dark: '#FEDEC8',
            },
          },
        },
      },
      yellow: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#FFF7D6',
              _dark: '#332E1B',
            },
          },
          hovered: {
            value: {
              _light: '#F8E6A0',
              _dark: '#533F04',
            },
          },
          pressed: {
            value: {
              _light: '#F5CD47',
              _dark: '#7F5F01',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#F8E6A0',
              _dark: '#533F04',
            },
          },
          hovered: {
            value: {
              _light: '#F5CD47',
              _dark: '#7F5F01',
            },
          },
          pressed: {
            value: {
              _light: '#E2B203',
              _dark: '#946F00',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#F5CD47',
              _dark: '#7F5F01',
            },
          },
          hovered: {
            value: {
              _light: '#E2B203',
              _dark: '#533F04',
            },
          },
          pressed: {
            value: {
              _light: '#CF9F02',
              _dark: '#332E1B',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#946F00',
              _dark: '#E2B203',
            },
          },
          hovered: {
            value: {
              _light: '#7F5F01',
              _dark: '#F5CD47',
            },
          },
          pressed: {
            value: {
              _light: '#533F04',
              _dark: '#F8E6A0',
            },
          },
        },
      },
      green: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#DCFFF1',
              _dark: '#1C3329',
            },
          },
          hovered: {
            value: {
              _light: '#BAF3DB',
              _dark: '#164B35',
            },
          },
          pressed: {
            value: {
              _light: '#7EE2B8',
              _dark: '#216E4E',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#BAF3DB',
              _dark: '#164B35',
            },
          },
          hovered: {
            value: {
              _light: '#7EE2B8',
              _dark: '#216E4E',
            },
          },
          pressed: {
            value: {
              _light: '#4BCE97',
              _dark: '#1F845A',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#4BCE97',
              _dark: '#216E4E',
            },
          },
          hovered: {
            value: {
              _light: '#7EE2B8',
              _dark: '#164B35',
            },
          },
          pressed: {
            value: {
              _light: '#BAF3DB',
              _dark: '#1C3329',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#1F845A',
              _dark: '#4BCE97',
            },
          },
          hovered: {
            value: {
              _light: '#216E4E',
              _dark: '#7EE2B8',
            },
          },
          pressed: {
            value: {
              _light: '#164B35',
              _dark: '#BAF3DB',
            },
          },
        },
      },
      teal: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#E7F9FF',
              _dark: '#1E3137',
            },
          },
          hovered: {
            value: {
              _light: '#C6EDFB',
              _dark: '#164555',
            },
          },
          pressed: {
            value: {
              _light: '#9DD9EE',
              _dark: '#206A83',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#C6EDFB',
              _dark: '#164555',
            },
          },
          hovered: {
            value: {
              _light: '#9DD9EE',
              _dark: '#206A83',
            },
          },
          pressed: {
            value: {
              _light: '#6CC3E0',
              _dark: '#227D9B',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#6CC3E0',
              _dark: '#206A83',
            },
          },
          hovered: {
            value: {
              _light: '#9DD9EE',
              _dark: '#164555',
            },
          },
          pressed: {
            value: {
              _light: '#C6EDFB',
              _dark: '#1E3137',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#227D9B',
              _dark: '#6CC3E0',
            },
          },
          hovered: {
            value: {
              _light: '#206A83',
              _dark: '#9DD9EE',
            },
          },
          pressed: {
            value: {
              _light: '#164555',
              _dark: '#C6EDFB',
            },
          },
        },
      },
      blue: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#E9F2FF',
              _dark: '#1C2B41',
            },
          },
          hovered: {
            value: {
              _light: '#CCE0FF',
              _dark: '#09326C',
            },
          },
          pressed: {
            value: {
              _light: '#85B8FF',
              _dark: '#0055CC',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#CCE0FF',
              _dark: '#09326C',
            },
          },
          hovered: {
            value: {
              _light: '#85B8FF',
              _dark: '#0055CC',
            },
          },
          pressed: {
            value: {
              _light: '#579DFF',
              _dark: '#0C66E4',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#579DFF',
              _dark: '#0055CC',
            },
          },
          hovered: {
            value: {
              _light: '#85B8FF',
              _dark: '#09326C',
            },
          },
          pressed: {
            value: {
              _light: '#CCE0FF',
              _dark: '#1C2B41',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#0C66E4',
              _dark: '#579DFF',
            },
          },
          hovered: {
            value: {
              _light: '#0055CC',
              _dark: '#85B8FF',
            },
          },
          pressed: {
            value: {
              _light: '#09326C',
              _dark: '#CCE0FF',
            },
          },
        },
      },
      purple: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#F3F0FF',
              _dark: '#2B273F',
            },
          },
          hovered: {
            value: {
              _light: '#DFD8FD',
              _dark: '#352C63',
            },
          },
          pressed: {
            value: {
              _light: '#B8ACF6',
              _dark: '#5E4DB2',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#DFD8FD',
              _dark: '#352C63',
            },
          },
          hovered: {
            value: {
              _light: '#B8ACF6',
              _dark: '#5E4DB2',
            },
          },
          pressed: {
            value: {
              _light: '#9F8FEF',
              _dark: '#6E5DC6',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#9F8FEF',
              _dark: '#5E4DB2',
            },
          },
          hovered: {
            value: {
              _light: '#B8ACF6',
              _dark: '#352C63',
            },
          },
          pressed: {
            value: {
              _light: '#DFD8FD',
              _dark: '#2B273F',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#6E5DC6',
              _dark: '#9F8FEF',
            },
          },
          hovered: {
            value: {
              _light: '#5E4DB2',
              _dark: '#B8ACF6',
            },
          },
          pressed: {
            value: {
              _light: '#352C63',
              _dark: '#DFD8FD',
            },
          },
        },
      },
      magenta: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#FFECF8',
              _dark: '#3D2232',
            },
          },
          hovered: {
            value: {
              _light: '#FDD0EC',
              _dark: '#50253F',
            },
          },
          pressed: {
            value: {
              _light: '#F797D2',
              _dark: '#943D73',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#FDD0EC',
              _dark: '#50253F',
            },
          },
          hovered: {
            value: {
              _light: '#F797D2',
              _dark: '#943D73',
            },
          },
          pressed: {
            value: {
              _light: '#E774BB',
              _dark: '#AE4787',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#E774BB',
              _dark: '#943D73',
            },
          },
          hovered: {
            value: {
              _light: '#F797D2',
              _dark: '#50253F',
            },
          },
          pressed: {
            value: {
              _light: '#FDD0EC',
              _dark: '#3D2232',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#AE4787',
              _dark: '#E774BB',
            },
          },
          hovered: {
            value: {
              _light: '#943D73',
              _dark: '#F797D2',
            },
          },
          pressed: {
            value: {
              _light: '#50253F',
              _dark: '#FDD0EC',
            },
          },
        },
      },
      gray: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#F1F2F4',
              _dark: '#2C333A',
            },
          },
          hovered: {
            value: {
              _light: '#DCDFE4',
              _dark: '#38414A',
            },
          },
          pressed: {
            value: {
              _light: '#B3B9C4',
              _dark: '#454F59',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#DCDFE4',
              _dark: '#454F59',
            },
          },
          hovered: {
            value: {
              _light: '#B3B9C4',
              _dark: '#596773',
            },
          },
          pressed: {
            value: {
              _light: '#8590A2',
              _dark: '#738496',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#8590A2',
              _dark: '#596773',
            },
          },
          hovered: {
            value: {
              _light: '#B3B9C4',
              _dark: '#454F59',
            },
          },
          pressed: {
            value: {
              _light: '#DCDFE4',
              _dark: '#38414A',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#626F86',
              _dark: '#8C9BAB',
            },
          },
          hovered: {
            value: {
              _light: '#44546F',
              _dark: '#9FADBC',
            },
          },
          pressed: {
            value: {
              _light: '#2C3E5D',
              _dark: '#B6C2CF',
            },
          },
        },
      },
    },
    disabled: {
      value: {
        _light: '#091E4208',
        _dark: '#BCD6F00A',
      },
    },
    input: {
      DEFAULT: {
        value: {
          _light: '#FFFFFF',
          _dark: '#22272B',
        },
      },
      hovered: {
        value: {
          _light: '#F7F8F9',
          _dark: '#282E33',
        },
      },
      pressed: {
        value: {
          _light: '#FFFFFF',
          _dark: '#22272B',
        },
      },
    },
    inverse: {
      subtle: {
        DEFAULT: {
          value: {
            _light: '#00000029',
            _dark: '#FFFFFF29',
          },
        },
        hovered: {
          value: {
            _light: '#0000003D',
            _dark: '#FFFFFF3D',
          },
        },
        pressed: {
          value: {
            _light: '#00000052',
            _dark: '#FFFFFF52',
          },
        },
      },
    },
    neutral: {
      DEFAULT: {
        value: {
          _light: '#091E420F',
          _dark: '#A1BDD914',
        },
      },
      hovered: {
        value: {
          _light: '#091E4224',
          _dark: '#A6C5E229',
        },
      },
      pressed: {
        value: {
          _light: '#091E424F',
          _dark: '#BFDBF847',
        },
      },
      subtle: {
        hovered: {
          value: {
            _light: '#091E420F',
            _dark: '#A1BDD914',
          },
        },
        pressed: {
          value: {
            _light: '#091E4224',
            _dark: '#A6C5E229',
          },
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#44546F',
            _dark: '#9FADBC',
          },
        },
        hovered: {
          value: {
            _light: '#2C3E5D',
            _dark: '#B6C2CF',
          },
        },
        pressed: {
          value: {
            _light: '#172B4D',
            _dark: '#C7D1DB',
          },
        },
      },
    },
    selected: {
      DEFAULT: {
        value: {
          _light: '#E9F2FF',
          _dark: '#1C2B41',
        },
      },
      hovered: {
        value: {
          _light: '#CCE0FF',
          _dark: '#09326C',
        },
      },
      pressed: {
        value: {
          _light: '#85B8FF',
          _dark: '#0055CC',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#0C66E4',
            _dark: '#579DFF',
          },
        },
        hovered: {
          value: {
            _light: '#0055CC',
            _dark: '#85B8FF',
          },
        },
        pressed: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
      },
    },
    brand: {
      subtlest: {
        DEFAULT: {
          value: {
            _light: '#E9F2FF',
            _dark: '#1C2B41',
          },
        },
        hovered: {
          value: {
            _light: '#CCE0FF',
            _dark: '#09326C',
          },
        },
        pressed: {
          value: {
            _light: '#85B8FF',
            _dark: '#0055CC',
          },
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#0C66E4',
            _dark: '#579DFF',
          },
        },
        hovered: {
          value: {
            _light: '#0055CC',
            _dark: '#85B8FF',
          },
        },
        pressed: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#1C2B41',
            _dark: '#E9F2FF',
          },
        },
        hovered: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
        pressed: {
          value: {
            _light: '#0055CC',
            _dark: '#85B8FF',
          },
        },
      },
    },
    danger: {
      DEFAULT: {
        value: {
          _light: '#FFECEB',
          _dark: '#42221F',
        },
      },
      hovered: {
        value: {
          _light: '#FFD5D2',
          _dark: '#5D1F1A',
        },
      },
      pressed: {
        value: {
          _light: '#FD9891',
          _dark: '#AE2E24',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#C9372C',
            _dark: '#F87168',
          },
        },
        hovered: {
          value: {
            _light: '#AE2E24',
            _dark: '#FD9891',
          },
        },
        pressed: {
          value: {
            _light: '#5D1F1A',
            _dark: '#FFD5D2',
          },
        },
      },
    },
    warning: {
      DEFAULT: {
        value: {
          _light: '#FFF7D6',
          _dark: '#332E1B',
        },
      },
      hovered: {
        value: {
          _light: '#F8E6A0',
          _dark: '#533F04',
        },
      },
      pressed: {
        value: {
          _light: '#F5CD47',
          _dark: '#7F5F01',
        },
      },
    },
    success: {
      DEFAULT: {
        value: {
          _light: '#DCFFF1',
          _dark: '#1C3329',
        },
      },
      hovered: {
        value: {
          _light: '#BAF3DB',
          _dark: '#164B35',
        },
      },
      pressed: {
        value: {
          _light: '#7EE2B8',
          _dark: '#216E4E',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#1F845A',
            _dark: '#4BCE97',
          },
        },
        hovered: {
          value: {
            _light: '#216E4E',
            _dark: '#7EE2B8',
          },
        },
        pressed: {
          value: {
            _light: '#164B35',
            _dark: '#BAF3DB',
          },
        },
      },
    },
    discovery: {
      DEFAULT: {
        value: {
          _light: '#F3F0FF',
          _dark: '#2B273F',
        },
      },
      hovered: {
        value: {
          _light: '#DFD8FD',
          _dark: '#352C63',
        },
      },
      pressed: {
        value: {
          _light: '#B8ACF6',
          _dark: '#5E4DB2',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#6E5DC6',
            _dark: '#9F8FEF',
          },
        },
        hovered: {
          value: {
            _light: '#5E4DB2',
            _dark: '#B8ACF6',
          },
        },
        pressed: {
          value: {
            _light: '#352C63',
            _dark: '#DFD8FD',
          },
        },
      },
    },
    information: {
      DEFAULT: {
        value: {
          _light: '#E9F2FF',
          _dark: '#1C2B41',
        },
      },
      hovered: {
        value: {
          _light: '#CCE0FF',
          _dark: '#09326C',
        },
      },
      pressed: {
        value: {
          _light: '#85B8FF',
          _dark: '#0055CC',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#0C66E4',
            _dark: '#579DFF',
          },
        },
        hovered: {
          value: {
            _light: '#0055CC',
            _dark: '#85B8FF',
          },
        },
        pressed: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
      },
    },
  },
  blanket: {
    DEFAULT: {
      value: {
        _light: '#091E427D',
        _dark: '#10121499',
      },
    },
    selected: {
      value: {
        _light: '#388BFF14',
        _dark: '#1D7AFC14',
      },
    },
    danger: {
      value: {
        _light: '#EF5C4814',
        _dark: '#E3493514',
      },
    },
  },
  interaction: {
    hovered: {
      value: {
        _light: '#00000029',
        _dark: '#ffffff33',
      },
    },
    pressed: {
      value: {
        _light: '#00000052',
        _dark: '#ffffff5c',
      },
    },
  },
  skeleton: {
    DEFAULT: {
      value: {
        _light: '#091E420F',
        _dark: '#A1BDD914',
      },
    },
    subtle: {
      value: {
        _light: '#091E4208',
        _dark: '#BCD6F00A',
      },
    },
  },
  chart: {
    categorical: {
      '1': {
        hovered: {
          value: {
            _light: '#227D9B',
            _dark: '#42B2D7',
          },
        },
      },
      '2': {
        DEFAULT: {
          value: {
            _light: '#5E4DB2',
            _dark: '#B8ACF6',
          },
        },
        hovered: {
          value: {
            _light: '#352C63',
            _dark: '#DFD8FD',
          },
        },
      },
      '3': {
        hovered: {
          value: {
            _light: '#C25100',
            _dark: '#F38A3F',
          },
        },
      },
      '4': {
        DEFAULT: {
          value: {
            _light: '#943D73',
            _dark: '#F797D2',
          },
        },
        hovered: {
          value: {
            _light: '#50253F',
            _dark: '#FDD0EC',
          },
        },
      },
      '5': {
        DEFAULT: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
        hovered: {
          value: {
            _light: '#1C2B41',
            _dark: '#E9F2FF',
          },
        },
      },
      '6': {
        DEFAULT: {
          value: {
            _light: '#8F7EE7',
            _dark: '#8270DB',
          },
        },
        hovered: {
          value: {
            _light: '#8270DB',
            _dark: '#8F7EE7',
          },
        },
      },
      '7': {
        DEFAULT: {
          value: {
            _light: '#50253F',
            _dark: '#FDD0EC',
          },
        },
        hovered: {
          value: {
            _light: '#3D2232',
            _dark: '#FFECF8',
          },
        },
      },
      '8': {
        DEFAULT: {
          value: {
            _light: '#A54800',
            _dark: '#FEC195',
          },
        },
        hovered: {
          value: {
            _light: '#702E00',
            _dark: '#FEDEC8',
          },
        },
      },
    },
    lime: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#6A9A23',
            _dark: '#82B536',
          },
        },
        hovered: {
          value: {
            _light: '#5B7F24',
            _dark: '#94C748',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#5B7F24',
            _dark: '#94C748',
          },
        },
        hovered: {
          value: {
            _light: '#4C6B1F',
            _dark: '#B3DF72',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#4C6B1F',
            _dark: '#B3DF72',
          },
        },
        hovered: {
          value: {
            _light: '#37471F',
            _dark: '#D3F1A7',
          },
        },
      },
    },
    neutral: {
      DEFAULT: {
        value: {
          _light: '#8590A2',
          _dark: '#738496',
        },
      },
      hovered: {
        value: {
          _light: '#758195',
          _dark: '#8C9BAB',
        },
      },
    },
    red: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#F15B50',
            _dark: '#E2483D',
          },
        },
        hovered: {
          value: {
            _light: '#E2483D',
            _dark: '#F15B50',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#E2483D',
            _dark: '#F15B50',
          },
        },
        hovered: {
          value: {
            _light: '#C9372C',
            _dark: '#F87168',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#AE2E24',
            _dark: '#FD9891',
          },
        },
        hovered: {
          value: {
            _light: '#5D1F1A',
            _dark: '#FFD5D2',
          },
        },
      },
    },
    orange: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#E56910',
            _dark: '#F38A3F',
          },
        },
        hovered: {
          value: {
            _light: '#C25100',
            _dark: '#FEA362',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#C25100',
            _dark: '#FEA362',
          },
        },
        hovered: {
          value: {
            _light: '#A54800',
            _dark: '#FEC195',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#A54800',
            _dark: '#FEC195',
          },
        },
        hovered: {
          value: {
            _light: '#702E00',
            _dark: '#FEDEC8',
          },
        },
      },
    },
    yellow: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#B38600',
            _dark: '#CF9F02',
          },
        },
        hovered: {
          value: {
            _light: '#946F00',
            _dark: '#E2B203',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#946F00',
            _dark: '#E2B203',
          },
        },
        hovered: {
          value: {
            _light: '#7F5F01',
            _dark: '#F5CD47',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#7F5F01',
            _dark: '#F5CD47',
          },
        },
        hovered: {
          value: {
            _light: '#533F04',
            _dark: '#F8E6A0',
          },
        },
      },
    },
    green: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#22A06B',
            _dark: '#2ABB7F',
          },
        },
        hovered: {
          value: {
            _light: '#1F845A',
            _dark: '#4BCE97',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#1F845A',
            _dark: '#4BCE97',
          },
        },
        hovered: {
          value: {
            _light: '#216E4E',
            _dark: '#7EE2B8',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#216E4E',
            _dark: '#7EE2B8',
          },
        },
        hovered: {
          value: {
            _light: '#164B35',
            _dark: '#BAF3DB',
          },
        },
      },
    },
    teal: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#2898BD',
            _dark: '#42B2D7',
          },
        },
        hovered: {
          value: {
            _light: '#227D9B',
            _dark: '#6CC3E0',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#227D9B',
            _dark: '#6CC3E0',
          },
        },
        hovered: {
          value: {
            _light: '#206A83',
            _dark: '#9DD9EE',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#206A83',
            _dark: '#9DD9EE',
          },
        },
        hovered: {
          value: {
            _light: '#164555',
            _dark: '#C6EDFB',
          },
        },
      },
    },
    blue: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#388BFF',
            _dark: '#1D7AFC',
          },
        },
        hovered: {
          value: {
            _light: '#1D7AFC',
            _dark: '#388BFF',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#1D7AFC',
            _dark: '#388BFF',
          },
        },
        hovered: {
          value: {
            _light: '#0C66E4',
            _dark: '#579DFF',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#0055CC',
            _dark: '#85B8FF',
          },
        },
        hovered: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
      },
    },
    purple: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#8F7EE7',
            _dark: '#8270DB',
          },
        },
        hovered: {
          value: {
            _light: '#8270DB',
            _dark: '#8F7EE7',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#8270DB',
            _dark: '#8F7EE7',
          },
        },
        hovered: {
          value: {
            _light: '#6E5DC6',
            _dark: '#9F8FEF',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#5E4DB2',
            _dark: '#B8ACF6',
          },
        },
        hovered: {
          value: {
            _light: '#352C63',
            _dark: '#DFD8FD',
          },
        },
      },
    },
    magenta: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#DA62AC',
            _dark: '#CD519D',
          },
        },
        hovered: {
          value: {
            _light: '#CD519D',
            _dark: '#DA62AC',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#CD519D',
            _dark: '#DA62AC',
          },
        },
        hovered: {
          value: {
            _light: '#AE4787',
            _dark: '#E774BB',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#943D73',
            _dark: '#F797D2',
          },
        },
        hovered: {
          value: {
            _light: '#50253F',
            _dark: '#FDD0EC',
          },
        },
      },
    },
    gray: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#8590A2',
            _dark: '#738496',
          },
        },
        hovered: {
          value: {
            _light: '#758195',
            _dark: '#8C9BAB',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#758195',
            _dark: '#8C9BAB',
          },
        },
        hovered: {
          value: {
            _light: '#626F86',
            _dark: '#9FADBC',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#44546F',
            _dark: '#9FADBC',
          },
        },
        hovered: {
          value: {
            _light: '#2C3E5D',
            _dark: '#B6C2CF',
          },
        },
      },
    },
    brand: {
      DEFAULT: {
        value: {
          _light: '#1D7AFC',
          _dark: '#388BFF',
        },
      },
      hovered: {
        value: {
          _light: '#0C66E4',
          _dark: '#579DFF',
        },
      },
    },
    danger: {
      DEFAULT: {
        value: {
          _light: '#F15B50',
          _dark: '#E2483D',
        },
      },
      hovered: {
        value: {
          _light: '#E2483D',
          _dark: '#F15B50',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#AE2E24',
            _dark: '#FD9891',
          },
        },
        hovered: {
          value: {
            _light: '#5D1F1A',
            _dark: '#FFD5D2',
          },
        },
      },
    },
    warning: {
      DEFAULT: {
        value: {
          _light: '#B38600',
          _dark: '#CF9F02',
        },
      },
      hovered: {
        value: {
          _light: '#946F00',
          _dark: '#E2B203',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#7F5F01',
            _dark: '#F5CD47',
          },
        },
        hovered: {
          value: {
            _light: '#533F04',
            _dark: '#F8E6A0',
          },
        },
      },
    },
    success: {
      DEFAULT: {
        value: {
          _light: '#22A06B',
          _dark: '#2ABB7F',
        },
      },
      hovered: {
        value: {
          _light: '#1F845A',
          _dark: '#4BCE97',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#216E4E',
            _dark: '#7EE2B8',
          },
        },
        hovered: {
          value: {
            _light: '#164B35',
            _dark: '#BAF3DB',
          },
        },
      },
    },
    discovery: {
      DEFAULT: {
        value: {
          _light: '#8F7EE7',
          _dark: '#8270DB',
        },
      },
      hovered: {
        value: {
          _light: '#8270DB',
          _dark: '#8F7EE7',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#5E4DB2',
            _dark: '#B8ACF6',
          },
        },
        hovered: {
          value: {
            _light: '#352C63',
            _dark: '#DFD8FD',
          },
        },
      },
    },
    information: {
      DEFAULT: {
        value: {
          _light: '#388BFF',
          _dark: '#1D7AFC',
        },
      },
      hovered: {
        value: {
          _light: '#1D7AFC',
          _dark: '#388BFF',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#0055CC',
            _dark: '#85B8FF',
          },
        },
        hovered: {
          value: {
            _light: '#09326C',
            _dark: '#CCE0FF',
          },
        },
      },
    },
  },
}
