import type { SemanticTokens } from '@pandacss/types'

export const semanticColors: SemanticTokens['colors'] = {
  text: {
    DEFAULT: {
      value: {
        _light: '#292A2E',
        _dark: '#CECFD2',
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
            _light: '#9E4C00',
            _dark: '#FBC828',
          },
        },
        bolder: {
          value: {
            _light: '#693200',
            _dark: '#FCE4A6',
          },
        },
      },
      yellow: {
        DEFAULT: {
          value: {
            _light: '#7F5F01',
            _dark: '#EED12B',
          },
        },
        bolder: {
          value: {
            _light: '#533F04',
            _dark: '#F5E989',
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
            _light: '#1558BC',
            _dark: '#8FB8F6',
          },
        },
        bolder: {
          value: {
            _light: '#123263',
            _dark: '#CFE1FD',
          },
        },
      },
      purple: {
        DEFAULT: {
          value: {
            _light: '#803FA5',
            _dark: '#D8A0F7',
          },
        },
        bolder: {
          value: {
            _light: '#48245D',
            _dark: '#EED7FC',
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
            _light: '#505258',
            _dark: '#A9ABAF',
          },
        },
        bolder: {
          value: {
            _light: '#1E1F21',
            _dark: '#E2E3E4',
          },
        },
      },
    },
    disabled: {
      value: {
        _light: '#080F214A',
        _dark: '#E5E9F640',
      },
    },
    inverse: {
      value: {
        _light: '#FFFFFF',
        _dark: '#1F1F21',
      },
    },
    selected: {
      value: {
        _light: '#1868DB',
        _dark: '#669DF1',
      },
    },
    brand: {
      value: {
        _light: '#1868DB',
        _dark: '#669DF1',
      },
    },
    danger: {
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
    warning: {
      DEFAULT: {
        value: {
          _light: '#9E4C00',
          _dark: '#FBC828',
        },
      },
      inverse: {
        value: {
          _light: '#292A2E',
          _dark: '#1F1F21',
        },
      },
      bolder: {
        value: {
          _light: '#693200',
          _dark: '#FCE4A6',
        },
      },
    },
    success: {
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
    discovery: {
      DEFAULT: {
        value: {
          _light: '#803FA5',
          _dark: '#D8A0F7',
        },
      },
      bolder: {
        value: {
          _light: '#48245D',
          _dark: '#EED7FC',
        },
      },
    },
    information: {
      DEFAULT: {
        value: {
          _light: '#1558BC',
          _dark: '#8FB8F6',
        },
      },
      bolder: {
        value: {
          _light: '#123263',
          _dark: '#CFE1FD',
        },
      },
    },
    subtlest: {
      value: {
        _light: '#6B6E76',
        _dark: '#96999E',
      },
    },
    subtle: {
      value: {
        _light: '#505258',
        _dark: '#A9ABAF',
      },
    },
  },
  link: {
    DEFAULT: {
      value: {
        _light: '#1868DB',
        _dark: '#669DF1',
      },
    },
    pressed: {
      value: {
        _light: '#1558BC',
        _dark: '#8FB8F6',
      },
    },
    visited: {
      DEFAULT: {
        value: {
          _light: '#803FA5',
          _dark: '#D8A0F7',
        },
      },
      pressed: {
        value: {
          _light: '#48245D',
          _dark: '#EED7FC',
        },
      },
    },
  },
  icon: {
    DEFAULT: {
      value: {
        _light: '#292A2E',
        _dark: '#CECFD2',
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
          _light: '#E06C00',
          _dark: '#F68909',
        },
      },
      yellow: {
        value: {
          _light: '#B38600',
          _dark: '#EED12B',
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
          _light: '#357DE8',
          _dark: '#4688EC',
        },
      },
      purple: {
        value: {
          _light: '#AF59E1',
          _dark: '#BF63F3',
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
          _light: '#7D818A',
          _dark: '#7E8188',
        },
      },
    },
    disabled: {
      value: {
        _light: '#080F214A',
        _dark: '#E5E9F640',
      },
    },
    inverse: {
      value: {
        _light: '#FFFFFF',
        _dark: '#1F1F21',
      },
    },
    selected: {
      value: {
        _light: '#1868DB',
        _dark: '#669DF1',
      },
    },
    brand: {
      value: {
        _light: '#1868DB',
        _dark: '#669DF1',
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
          _light: '#E06C00',
          _dark: '#FBC828',
        },
      },
      inverse: {
        value: {
          _light: '#292A2E',
          _dark: '#1F1F21',
        },
      },
    },
    success: {
      value: {
        _light: '#6A9A23',
        _dark: '#82B536',
      },
    },
    discovery: {
      value: {
        _light: '#AF59E1',
        _dark: '#BF63F3',
      },
    },
    information: {
      value: {
        _light: '#357DE8',
        _dark: '#4688EC',
      },
    },
    subtlest: {
      value: {
        _light: '#6B6E76',
        _dark: '#96999E',
      },
    },
    subtle: {
      value: {
        _light: '#505258',
        _dark: '#A9ABAF',
      },
    },
  },
  border: {
    DEFAULT: {
      value: {
        _light: '#0B120E24',
        _dark: '#E3E4F21F',
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
          _light: '#E06C00',
          _dark: '#F68909',
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
          _light: '#357DE8',
          _dark: '#4688EC',
        },
      },
      purple: {
        value: {
          _light: '#AF59E1',
          _dark: '#BF63F3',
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
          _light: '#7D818A',
          _dark: '#7E8188',
        },
      },
    },
    disabled: {
      value: {
        _light: '#0515240F',
        _dark: '#CECED912',
      },
    },
    focused: {
      value: {
        _light: '#4688EC',
        _dark: '#8FB8F6',
      },
    },
    input: {
      value: {
        _light: '#8C8F97',
        _dark: '#7E8188',
      },
    },
    inverse: {
      value: {
        _light: '#FFFFFF',
        _dark: '#18191A',
      },
    },
    selected: {
      value: {
        _light: '#1868DB',
        _dark: '#669DF1',
      },
    },
    brand: {
      value: {
        _light: '#1868DB',
        _dark: '#669DF1',
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
        _light: '#E06C00',
        _dark: '#F68909',
      },
    },
    success: {
      value: {
        _light: '#6A9A23',
        _dark: '#82B536',
      },
    },
    discovery: {
      value: {
        _light: '#AF59E1',
        _dark: '#BF63F3',
      },
    },
    information: {
      value: {
        _light: '#357DE8',
        _dark: '#4688EC',
      },
    },
    bold: {
      value: {
        _light: '#7D818A',
        _dark: '#7E8188',
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
              _light: '#BDE97C',
              _dark: '#3F5224',
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
              _light: '#BDE97C',
              _dark: '#3F5224',
            },
          },
          pressed: {
            value: {
              _light: '#B3DF72',
              _dark: '#4C6B1F',
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
              _dark: '#3F5224',
            },
          },
          pressed: {
            value: {
              _light: '#BDE97C',
              _dark: '#37471F',
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
              _light: '#3F5224',
              _dark: '#BDE97C',
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
              _light: '#FFB8B2',
              _dark: '#872821',
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
              _light: '#FFB8B2',
              _dark: '#872821',
            },
          },
          pressed: {
            value: {
              _light: '#FD9891',
              _dark: '#AE2E24',
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
              _dark: '#872821',
            },
          },
          pressed: {
            value: {
              _light: '#FFB8B2',
              _dark: '#5D1F1A',
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
              _light: '#872821',
              _dark: '#FFB8B2',
            },
          },
        },
      },
      orange: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#FFF5DB',
              _dark: '#3A2C1F',
            },
          },
          hovered: {
            value: {
              _light: '#FCE4A6',
              _dark: '#693200',
            },
          },
          pressed: {
            value: {
              _light: '#FBD779',
              _dark: '#7A3B00',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#FCE4A6',
              _dark: '#693200',
            },
          },
          hovered: {
            value: {
              _light: '#FBD779',
              _dark: '#7A3B00',
            },
          },
          pressed: {
            value: {
              _light: '#FBC828',
              _dark: '#9E4C00',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#FCA700',
              _dark: '#9E4C00',
            },
          },
          hovered: {
            value: {
              _light: '#FBC828',
              _dark: '#7A3B00',
            },
          },
          pressed: {
            value: {
              _light: '#FBD779',
              _dark: '#693200',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#BD5B00',
              _dark: '#FCA700',
            },
          },
          hovered: {
            value: {
              _light: '#9E4C00',
              _dark: '#FBC828',
            },
          },
          pressed: {
            value: {
              _light: '#7A3B00',
              _dark: '#FBD779',
            },
          },
        },
      },
      yellow: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#FEF7C8',
              _dark: '#332E1B',
            },
          },
          hovered: {
            value: {
              _light: '#F5E989',
              _dark: '#533F04',
            },
          },
          pressed: {
            value: {
              _light: '#EFDD4E',
              _dark: '#614A05',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#F5E989',
              _dark: '#533F04',
            },
          },
          hovered: {
            value: {
              _light: '#EFDD4E',
              _dark: '#614A05',
            },
          },
          pressed: {
            value: {
              _light: '#EED12B',
              _dark: '#7F5F01',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#EED12B',
              _dark: '#7F5F01',
            },
          },
          hovered: {
            value: {
              _light: '#DDB30E',
              _dark: '#614A05',
            },
          },
          pressed: {
            value: {
              _light: '#EFDD4E',
              _dark: '#533F04',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#946F00',
              _dark: '#DDB30E',
            },
          },
          hovered: {
            value: {
              _light: '#7F5F01',
              _dark: '#EED12B',
            },
          },
          pressed: {
            value: {
              _light: '#614A05',
              _dark: '#EFDD4E',
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
              _light: '#97EDC9',
              _dark: '#19573D',
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
              _light: '#97EDC9',
              _dark: '#19573D',
            },
          },
          pressed: {
            value: {
              _light: '#7EE2B8',
              _dark: '#216E4E',
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
              _dark: '#19573D',
            },
          },
          pressed: {
            value: {
              _light: '#97EDC9',
              _dark: '#164B35',
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
              _light: '#19573D',
              _dark: '#97EDC9',
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
              _light: '#B1E4F7',
              _dark: '#1A5265',
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
              _light: '#B1E4F7',
              _dark: '#1A5265',
            },
          },
          pressed: {
            value: {
              _light: '#9DD9EE',
              _dark: '#206A83',
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
              _dark: '#1A5265',
            },
          },
          pressed: {
            value: {
              _light: '#B1E4F7',
              _dark: '#164555',
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
              _light: '#1A5265',
              _dark: '#B1E4F7',
            },
          },
        },
      },
      blue: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#E9F2FE',
              _dark: '#1C2B42',
            },
          },
          hovered: {
            value: {
              _light: '#CFE1FD',
              _dark: '#123263',
            },
          },
          pressed: {
            value: {
              _light: '#ADCBFB',
              _dark: '#144794',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#CFE1FD',
              _dark: '#123263',
            },
          },
          hovered: {
            value: {
              _light: '#ADCBFB',
              _dark: '#144794',
            },
          },
          pressed: {
            value: {
              _light: '#8FB8F6',
              _dark: '#1558BC',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#669DF1',
              _dark: '#1558BC',
            },
          },
          hovered: {
            value: {
              _light: '#8FB8F6',
              _dark: '#144794',
            },
          },
          pressed: {
            value: {
              _light: '#ADCBFB',
              _dark: '#123263',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#1868DB',
              _dark: '#669DF1',
            },
          },
          hovered: {
            value: {
              _light: '#1558BC',
              _dark: '#8FB8F6',
            },
          },
          pressed: {
            value: {
              _light: '#144794',
              _dark: '#ADCBFB',
            },
          },
        },
      },
      purple: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#F8EEFE',
              _dark: '#35243F',
            },
          },
          hovered: {
            value: {
              _light: '#EED7FC',
              _dark: '#48245D',
            },
          },
          pressed: {
            value: {
              _light: '#E3BDFA',
              _dark: '#673286',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#EED7FC',
              _dark: '#48245D',
            },
          },
          hovered: {
            value: {
              _light: '#E3BDFA',
              _dark: '#673286',
            },
          },
          pressed: {
            value: {
              _light: '#D8A0F7',
              _dark: '#803FA5',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#C97CF4',
              _dark: '#803FA5',
            },
          },
          hovered: {
            value: {
              _light: '#D8A0F7',
              _dark: '#673286',
            },
          },
          pressed: {
            value: {
              _light: '#E3BDFA',
              _dark: '#48245D',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#964AC0',
              _dark: '#C97CF4',
            },
          },
          hovered: {
            value: {
              _light: '#803FA5',
              _dark: '#D8A0F7',
            },
          },
          pressed: {
            value: {
              _light: '#673286',
              _dark: '#E3BDFA',
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
              _light: '#FCB6E1',
              _dark: '#77325B',
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
              _light: '#FCB6E1',
              _dark: '#77325B',
            },
          },
          pressed: {
            value: {
              _light: '#F797D2',
              _dark: '#943D73',
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
              _dark: '#77325B',
            },
          },
          pressed: {
            value: {
              _light: '#FCB6E1',
              _dark: '#50253F',
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
              _light: '#77325B',
              _dark: '#FCB6E1',
            },
          },
        },
      },
      gray: {
        subtlest: {
          DEFAULT: {
            value: {
              _light: '#F0F1F2',
              _dark: '#303134',
            },
          },
          hovered: {
            value: {
              _light: '#DDDEE1',
              _dark: '#3D3F43',
            },
          },
          pressed: {
            value: {
              _light: '#B7B9BE',
              _dark: '#4B4D51',
            },
          },
        },
        subtler: {
          DEFAULT: {
            value: {
              _light: '#DDDEE1',
              _dark: '#4B4D51',
            },
          },
          hovered: {
            value: {
              _light: '#B7B9BE',
              _dark: '#63666B',
            },
          },
          pressed: {
            value: {
              _light: '#8C8F97',
              _dark: '#7E8188',
            },
          },
        },
        subtle: {
          DEFAULT: {
            value: {
              _light: '#8C8F97',
              _dark: '#63666B',
            },
          },
          hovered: {
            value: {
              _light: '#B7B9BE',
              _dark: '#4B4D51',
            },
          },
          pressed: {
            value: {
              _light: '#DDDEE1',
              _dark: '#3D3F43',
            },
          },
        },
        bolder: {
          DEFAULT: {
            value: {
              _light: '#6B6E76',
              _dark: '#96999E',
            },
          },
          hovered: {
            value: {
              _light: '#505258',
              _dark: '#A9ABAF',
            },
          },
          pressed: {
            value: {
              _light: '#3B3D42',
              _dark: '#BFC1C4',
            },
          },
        },
      },
    },
    disabled: {
      value: {
        _light: '#17171708',
        _dark: '#BDBDBD0A',
      },
    },
    input: {
      DEFAULT: {
        value: {
          _light: '#FFFFFF',
          _dark: '#242528',
        },
      },
      hovered: {
        value: {
          _light: '#F8F8F8',
          _dark: '#2B2C2F',
        },
      },
      pressed: {
        value: {
          _light: '#FFFFFF',
          _dark: '#242528',
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
          _light: '#0515240F',
          _dark: '#CECED912',
        },
      },
      hovered: {
        value: {
          _light: '#0B120E24',
          _dark: '#E3E4F21F',
        },
      },
      pressed: {
        value: {
          _light: '#080F214A',
          _dark: '#E5E9F640',
        },
      },
      subtle: {
        hovered: {
          value: {
            _light: '#0515240F',
            _dark: '#CECED912',
          },
        },
        pressed: {
          value: {
            _light: '#0B120E24',
            _dark: '#E3E4F21F',
          },
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#292A2E',
            _dark: '#CECFD2',
          },
        },
        hovered: {
          value: {
            _light: '#3B3D42',
            _dark: '#BFC1C4',
          },
        },
        pressed: {
          value: {
            _light: '#505258',
            _dark: '#A9ABAF',
          },
        },
      },
    },
    selected: {
      DEFAULT: {
        value: {
          _light: '#E9F2FE',
          _dark: '#1C2B42',
        },
      },
      hovered: {
        value: {
          _light: '#CFE1FD',
          _dark: '#123263',
        },
      },
      pressed: {
        value: {
          _light: '#8FB8F6',
          _dark: '#1558BC',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#1868DB',
            _dark: '#669DF1',
          },
        },
        hovered: {
          value: {
            _light: '#1558BC',
            _dark: '#8FB8F6',
          },
        },
        pressed: {
          value: {
            _light: '#123263',
            _dark: '#CFE1FD',
          },
        },
      },
    },
    brand: {
      subtlest: {
        DEFAULT: {
          value: {
            _light: '#E9F2FE',
            _dark: '#1C2B42',
          },
        },
        hovered: {
          value: {
            _light: '#CFE1FD',
            _dark: '#123263',
          },
        },
        pressed: {
          value: {
            _light: '#ADCBFB',
            _dark: '#144794',
          },
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#1868DB',
            _dark: '#669DF1',
          },
        },
        hovered: {
          value: {
            _light: '#1558BC',
            _dark: '#8FB8F6',
          },
        },
        pressed: {
          value: {
            _light: '#144794',
            _dark: '#ADCBFB',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#1C2B42',
            _dark: '#E9F2FE',
          },
        },
        hovered: {
          value: {
            _light: '#123263',
            _dark: '#CFE1FD',
          },
        },
        pressed: {
          value: {
            _light: '#144794',
            _dark: '#ADCBFB',
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
          _light: '#FFB8B2',
          _dark: '#872821',
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
            _light: '#FFB8B2',
            _dark: '#872821',
          },
        },
        pressed: {
          value: {
            _light: '#FD9891',
            _dark: '#AE2E24',
          },
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
            _light: '#872821',
            _dark: '#FFB8B2',
          },
        },
      },
    },
    warning: {
      DEFAULT: {
        value: {
          _light: '#FFF5DB',
          _dark: '#3A2C1F',
        },
      },
      hovered: {
        value: {
          _light: '#FCE4A6',
          _dark: '#693200',
        },
      },
      pressed: {
        value: {
          _light: '#FBD779',
          _dark: '#7A3B00',
        },
      },
      subtler: {
        DEFAULT: {
          value: {
            _light: '#FCE4A6',
            _dark: '#693200',
          },
        },
        hovered: {
          value: {
            _light: '#FBD779',
            _dark: '#7A3B00',
          },
        },
        pressed: {
          value: {
            _light: '#FBC828',
            _dark: '#9E4C00',
          },
        },
      },
    },
    success: {
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
          _light: '#BDE97C',
          _dark: '#3F5224',
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
            _light: '#BDE97C',
            _dark: '#3F5224',
          },
        },
        pressed: {
          value: {
            _light: '#B3DF72',
            _dark: '#4C6B1F',
          },
        },
      },
      bold: {
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
            _light: '#3F5224',
            _dark: '#BDE97C',
          },
        },
      },
    },
    discovery: {
      DEFAULT: {
        value: {
          _light: '#F8EEFE',
          _dark: '#35243F',
        },
      },
      hovered: {
        value: {
          _light: '#EED7FC',
          _dark: '#48245D',
        },
      },
      pressed: {
        value: {
          _light: '#E3BDFA',
          _dark: '#673286',
        },
      },
      subtler: {
        DEFAULT: {
          value: {
            _light: '#EED7FC',
            _dark: '#48245D',
          },
        },
        hovered: {
          value: {
            _light: '#E3BDFA',
            _dark: '#673286',
          },
        },
        pressed: {
          value: {
            _light: '#D8A0F7',
            _dark: '#803FA5',
          },
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#964AC0',
            _dark: '#C97CF4',
          },
        },
        hovered: {
          value: {
            _light: '#803FA5',
            _dark: '#D8A0F7',
          },
        },
        pressed: {
          value: {
            _light: '#673286',
            _dark: '#E3BDFA',
          },
        },
      },
    },
    information: {
      DEFAULT: {
        value: {
          _light: '#E9F2FE',
          _dark: '#1C2B42',
        },
      },
      hovered: {
        value: {
          _light: '#CFE1FD',
          _dark: '#123263',
        },
      },
      pressed: {
        value: {
          _light: '#ADCBFB',
          _dark: '#144794',
        },
      },
      subtler: {
        DEFAULT: {
          value: {
            _light: '#CFE1FD',
            _dark: '#123263',
          },
        },
        hovered: {
          value: {
            _light: '#ADCBFB',
            _dark: '#144794',
          },
        },
        pressed: {
          value: {
            _light: '#8FB8F6',
            _dark: '#1558BC',
          },
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#1868DB',
            _dark: '#669DF1',
          },
        },
        hovered: {
          value: {
            _light: '#1558BC',
            _dark: '#8FB8F6',
          },
        },
        pressed: {
          value: {
            _light: '#144794',
            _dark: '#ADCBFB',
          },
        },
      },
    },
  },
  blanket: {
    DEFAULT: {
      value: {
        _light: '#050C1F75',
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
        _light: '#0515240F',
        _dark: '#CECED912',
      },
    },
    subtle: {
      value: {
        _light: '#17171708',
        _dark: '#BDBDBD0A',
      },
    },
  },
  chart: {
    categorical: {
      '1': {
        DEFAULT: {
          value: {
            _light: '#357DE8',
            _dark: '#4688EC',
          },
        },
        hovered: {
          value: {
            _light: '#1868DB',
            _dark: '#669DF1',
          },
        },
      },
      '2': {
        DEFAULT: {
          value: {
            _light: '#82B536',
            _dark: '#94C748',
          },
        },
        hovered: {
          value: {
            _light: '#6A9A23',
            _dark: '#B3DF72',
          },
        },
      },
      '3': {
        DEFAULT: {
          value: {
            _light: '#BF63F3',
            _dark: '#C97CF4',
          },
        },
        hovered: {
          value: {
            _light: '#AF59E1',
            _dark: '#D8A0F7',
          },
        },
      },
      '4': {
        DEFAULT: {
          value: {
            _light: '#F68909',
            _dark: '#FCA700',
          },
        },
        hovered: {
          value: {
            _light: '#E06C00',
            _dark: '#FBC828',
          },
        },
      },
      '5': {
        hovered: {
          value: {
            _light: '#123263',
            _dark: '#1868DB',
          },
        },
      },
      '6': {
        hovered: {
          value: {
            _light: '#803FA5',
            _dark: '#AF59E1',
          },
        },
      },
      '7': {
        hovered: {
          value: {
            _light: '#2898BD',
            _dark: '#6CC3E0',
          },
        },
      },
      '8': {
        DEFAULT: {
          value: {
            _light: '#BD5B00',
            _dark: '#E06C00',
          },
        },
        hovered: {
          value: {
            _light: '#7A3B00',
            _dark: '#FBD779',
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
          _light: '#8C8F97',
          _dark: '#7E8188',
        },
      },
      hovered: {
        value: {
          _light: '#7D818A',
          _dark: '#96999E',
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
            _light: '#E06C00',
            _dark: '#F68909',
          },
        },
        hovered: {
          value: {
            _light: '#BD5B00',
            _dark: '#FCA700',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#BD5B00',
            _dark: '#FCA700',
          },
        },
        hovered: {
          value: {
            _light: '#9E4C00',
            _dark: '#FBC828',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#7A3B00',
            _dark: '#FBD779',
          },
        },
        hovered: {
          value: {
            _light: '#693200',
            _dark: '#FCE4A6',
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
            _dark: '#DDB30E',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#946F00',
            _dark: '#DDB30E',
          },
        },
        hovered: {
          value: {
            _light: '#7F5F01',
            _dark: '#EED12B',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#7F5F01',
            _dark: '#EED12B',
          },
        },
        hovered: {
          value: {
            _light: '#533F04',
            _dark: '#F5E989',
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
            _light: '#4688EC',
            _dark: '#357DE8',
          },
        },
        hovered: {
          value: {
            _light: '#357DE8',
            _dark: '#4688EC',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#357DE8',
            _dark: '#4688EC',
          },
        },
        hovered: {
          value: {
            _light: '#1868DB',
            _dark: '#669DF1',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#1558BC',
            _dark: '#8FB8F6',
          },
        },
        hovered: {
          value: {
            _light: '#123263',
            _dark: '#CFE1FD',
          },
        },
      },
    },
    purple: {
      bold: {
        DEFAULT: {
          value: {
            _light: '#BF63F3',
            _dark: '#AF59E1',
          },
        },
        hovered: {
          value: {
            _light: '#AF59E1',
            _dark: '#BF63F3',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#AF59E1',
            _dark: '#BF63F3',
          },
        },
        hovered: {
          value: {
            _light: '#964AC0',
            _dark: '#C97CF4',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#803FA5',
            _dark: '#D8A0F7',
          },
        },
        hovered: {
          value: {
            _light: '#48245D',
            _dark: '#EED7FC',
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
            _light: '#8C8F97',
            _dark: '#7E8188',
          },
        },
        hovered: {
          value: {
            _light: '#7D818A',
            _dark: '#96999E',
          },
        },
      },
      bolder: {
        DEFAULT: {
          value: {
            _light: '#7D818A',
            _dark: '#96999E',
          },
        },
        hovered: {
          value: {
            _light: '#6B6E76',
            _dark: '#A9ABAF',
          },
        },
      },
      boldest: {
        DEFAULT: {
          value: {
            _light: '#505258',
            _dark: '#A9ABAF',
          },
        },
        hovered: {
          value: {
            _light: '#3B3D42',
            _dark: '#BFC1C4',
          },
        },
      },
    },
    brand: {
      DEFAULT: {
        value: {
          _light: '#357DE8',
          _dark: '#4688EC',
        },
      },
      hovered: {
        value: {
          _light: '#1868DB',
          _dark: '#669DF1',
        },
      },
    },
    danger: {
      hovered: {
        value: {
          _light: '#C9372C',
          _dark: '#F15B50',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#872821',
            _dark: '#FFB8B2',
          },
        },
        hovered: {
          value: {
            _light: '#5D1F1A',
            _dark: '#FD9891',
          },
        },
      },
    },
    warning: {
      hovered: {
        value: {
          _light: '#E06C00',
          _dark: '#FCA700',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#BD5B00',
            _dark: '#FBC828',
          },
        },
        hovered: {
          value: {
            _light: '#9E4C00',
            _dark: '#FCE4A6',
          },
        },
      },
    },
    success: {
      hovered: {
        value: {
          _light: '#6A9A23',
          _dark: '#94C748',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#5B7F24',
            _dark: '#B3DF72',
          },
        },
        hovered: {
          value: {
            _light: '#4C6B1F',
            _dark: '#D3F1A7',
          },
        },
      },
    },
    discovery: {
      hovered: {
        value: {
          _light: '#AF59E1',
          _dark: '#C97CF4',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#803FA5',
            _dark: '#D8A0F7',
          },
        },
        hovered: {
          value: {
            _light: '#964AC0',
            _dark: '#EED7FC',
          },
        },
      },
    },
    information: {
      DEFAULT: {
        value: {
          _light: '#357DE8',
          _dark: '#4688EC',
        },
      },
      hovered: {
        value: {
          _light: '#1868DB',
          _dark: '#669DF1',
        },
      },
      bold: {
        DEFAULT: {
          value: {
            _light: '#1558BC',
            _dark: '#8FB8F6',
          },
        },
        hovered: {
          value: {
            _light: '#123263',
            _dark: '#CFE1FD',
          },
        },
      },
    },
  },
}
