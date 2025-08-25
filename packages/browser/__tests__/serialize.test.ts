import { describe, test, expect } from 'vitest'
import { serialize, generateTokenCSS } from '../src/serialize'

describe('serialize', () => {
  describe('Basic functionality', () => {
    test('should convert simple style object to utility class names', () => {
      const result = serialize({
        color: 'red',
        fontSize: 'lg',
        margin: '4',
      })

      expect(result.className).toMatchInlineSnapshot(`"c_red fs_lg m_4"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_red {
          color: red;
        }
        .fs_lg {
          font-size: var(--fontSizes-lg);
        }
        .m_4 {
          margin: var(--spacing-4);
        }"
      `)
    })

    test('should handle numeric values', () => {
      const result = serialize({
        width: 100,
        height: 200,
        zIndex: 5,
      })

      expect(result.className).toMatchInlineSnapshot(`"w_100 h_200 z_5"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".w_100 {
          width: 100;
        }
        .h_200 {
          height: 200;
        }
        .z_5 {
          z-index: 5;
        }"
      `)
    })

    test('should handle CSS keywords and units', () => {
      const result = serialize({
        display: 'flex',
        position: 'absolute',
        width: 'auto',
        margin: 'initial',
        opacity: 'inherit',
      })

      expect(result.className).toMatchInlineSnapshot(`"d_flex pos_absolute w_auto m_initial op_inherit"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".d_flex {
          display: flex;
        }
        .pos_absolute {
          position: absolute;
        }
        .w_auto {
          width: auto;
        }
        .m_initial {
          margin: initial;
        }
        .op_inherit {
          opacity: inherit;
        }"
      `)
    })

    test('should handle arbitrary values with brackets', () => {
      const result = serialize({
        color: '[#ff0000]',
        fontSize: '[24px]',
        margin: '[2rem]',
      })

      expect(result.className).toMatchInlineSnapshot(`"c_[#ff0000] fs_[24px] m_[2rem]"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_[#ff0000] {
          color: #ff0000;
        }
        .fs_[24px] {
          font-size: 24px;
        }
        .m_[2rem] {
          margin: 2rem;
        }"
      `)
    })

    test('should fallback to original value for unknown tokens', () => {
      const result = serialize({
        color: 'customColor',
        fontSize: 'customSize',
        unknownProperty: 'someValue',
      })

      expect(result.className).toMatchInlineSnapshot(`"c_customColor fs_customSize unknownproperty_someValue"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_customColor {
          color: customColor;
        }
        .fs_customSize {
          font-size: customSize;
        }
        .unknownproperty_someValue {
          unknown-property: someValue;
        }"
      `)
    })
  })

  describe('Token resolution', () => {
    test('should resolve color tokens', () => {
      const result = serialize({
        color: 'red',
        backgroundColor: 'blue',
        borderColor: 'green',
      })

      expect(result.className).toMatchInlineSnapshot(`"c_red bg-c_blue bd-c_green"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_red {
          color: red;
        }
        .bg-c_blue {
          background-color: blue;
        }
        .bd-c_green {
          border-color: green;
        }"
      `)
    })

    test('should resolve spacing tokens', () => {
      const result = serialize({
        margin: '4',
        padding: '2',
        gap: '6',
      })

      expect(result.className).toMatchInlineSnapshot(`"m_4 p_2 gap_6"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".m_4 {
          margin: var(--spacing-4);
        }
        .p_2 {
          padding: var(--spacing-2);
        }
        .gap_6 {
          gap: var(--spacing-6);
        }"
      `)
    })

    test('should resolve typography tokens', () => {
      const result = serialize({
        fontSize: 'lg',
        fontWeight: 'bold',
        lineHeight: 'normal',
        letterSpacing: 'wide',
      })

      expect(result.className).toMatchInlineSnapshot(`"fs_lg fw_bold lh_normal ls_wide"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".fs_lg {
          font-size: var(--fontSizes-lg);
        }
        .fw_bold {
          font-weight: var(--fontWeights-bold);
        }
        .lh_normal {
          line-height: var(--lineHeights-normal);
        }
        .ls_wide {
          letter-spacing: var(--letterSpacings-wide);
        }"
      `)
    })

    test('should resolve size tokens', () => {
      const result = serialize({
        width: 'full',
        height: 'screen',
        maxWidth: 'max',
        minHeight: 'min',
      })

      expect(result.className).toMatchInlineSnapshot(`"w_full h_screen max-w_max min-h_min"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".w_full {
          width: var(--sizes-full);
        }
        .h_screen {
          height: var(--sizes-screen);
        }
        .max-w_max {
          max-width: var(--sizes-max);
        }
        .min-h_min {
          min-height: var(--sizes-min);
        }"
      `)
    })

    test('should resolve shadow tokens', () => {
      const result = serialize({
        boxShadow: 'lg',
        textShadow: 'sm',
      })

      expect(result.className).toMatchInlineSnapshot(`"bx-sh_lg tsh_sm"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".bx-sh_lg {
          box-shadow: var(--shadows-lg);
        }
        .tsh_sm {
          text-shadow: var(--shadows-sm);
        }"
      `)
    })

    test('should resolve radii tokens', () => {
      const result = serialize({
        borderRadius: 'md',
        borderTopLeftRadius: 'lg',
        borderBottomRightRadius: 'full',
      })

      expect(result.className).toMatchInlineSnapshot(`"bdr_md bdr-tl_lg bdr-br_full"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".bdr_md {
          border-radius: var(--radii-md);
        }
        .bdr-tl_lg {
          border-top-left-radius: var(--radii-lg);
        }
        .bdr-br_full {
          border-bottom-right-radius: var(--radii-full);
        }"
      `)
    })

    test('should resolve zIndex tokens', () => {
      const result = serialize({
        zIndex: 'modal',
        position: 'fixed',
      })

      expect(result.className).toMatchInlineSnapshot(`"z_modal pos_fixed"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".z_modal {
          z-index: modal;
        }
        .pos_fixed {
          position: fixed;
        }"
      `)
    })
  })

  describe('Conditions and breakpoints', () => {
    test('should handle simple breakpoint conditions', () => {
      const result = serialize({
        color: 'blue',
        sm: { color: 'red' },
        lg: { color: 'green' },
      })

      expect(result.className).toMatchInlineSnapshot(`"c_blue sm:c_red lg:c_green"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_blue {
          color: blue;
        }
        @media (min-width: 640px) {
          .sm:c_red {
            color: red;
          }
        }
        @media (min-width: 1024px) {
          .lg:c_green {
            color: green;
          }
        }"
      `)
    })

    test('should handle pseudo-state conditions', () => {
      const result = serialize({
        backgroundColor: 'white',
        _hover: { backgroundColor: 'blue' },
        _focus: { backgroundColor: 'green' },
        _active: { backgroundColor: 'red' },
      })

      expect(result.className).toMatchInlineSnapshot(`"bg-c_white hover:bg-c_blue focus:bg-c_green active:bg-c_red"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".bg-c_white {
          background-color: white;
        }
        .hover:bg-c_blue:is(:hover, [data-hover]) {
          background-color: blue;
        }
        .focus:bg-c_green:is(:focus, [data-focus]) {
          background-color: green;
        }
        .active:bg-c_red:is(:active, [data-active]) {
          background-color: red;
        }"
      `)
    })

    test('should handle combined breakpoints and pseudo-states', () => {
      const result = serialize({
        padding: '4',
        sm: {
          padding: '6',
          _hover: { padding: '8' },
        },
        _focus: { padding: '2' },
      })

      expect(result.className).toMatchInlineSnapshot(`"p_4 sm:p_6 [sm:hover]:p_8 focus:p_2"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".p_4 {
          padding: var(--spacing-4);
        }
        @media (min-width: 640px) {
          .sm:p_6 {
            padding: var(--spacing-6);
          }
        }
        @media (min-width: 640px) {
          .[sm:hover]:p_8:is(:hover, [data-hover]) {
            padding: var(--spacing-8);
          }
        }
        .focus:p_2:is(:focus, [data-focus]) {
          padding: var(--spacing-2);
        }"
      `)
    })

    test('should handle nested conditions', () => {
      const result = serialize({
        color: 'black',
        md: {
          color: 'blue',
          _hover: {
            color: 'red',
            backgroundColor: 'yellow',
          },
        },
      })

      expect(result.className).toMatchInlineSnapshot(`"c_black md:c_blue [md:hover]:c_red [md:hover]:bg-c_yellow"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_black {
          color: black;
        }
        @media (min-width: 768px) {
          .md:c_blue {
            color: blue;
          }
        }
        @media (min-width: 768px) {
          .[md:hover]:c_red:is(:hover, [data-hover]) {
            color: red;
          }
        }
        @media (min-width: 768px) {
          .[md:hover]:bg-c_yellow:is(:hover, [data-hover]) {
            background-color: yellow;
          }
        }"
      `)
    })

    test('should handle custom media queries', () => {
      const result = serialize({
        color: 'blue',
        '@media (orientation: landscape)': { color: 'red' },
        '@media print': { color: 'black' },
      })

      expect(result.className).toMatchInlineSnapshot(
        `"c_blue [@media_(orientation:_landscape)]:c_red [@media_print]:c_black"`,
      )
      expect(result.css).toMatchInlineSnapshot(`
        ".c_blue {
          color: blue;
        }
        @media (orientation: landscape) {
          .[@media_(orientation:_landscape)]:c_red {
            color: red;
          }
        }
        @media print {
          .[@media_print]:c_black {
            color: black;
          }
        }"
      `)
    })

    test('should handle custom selectors', () => {
      const result = serialize({
        color: 'blue',
        '&:nth-child(odd)': { color: 'red' },
        '&[data-state="active"]': { color: 'green' },
      })

      expect(result.className).toMatchInlineSnapshot(
        `"c_blue [&:nth-child(odd)]:c_red [&[data-state="active"]]:c_green"`,
      )
      expect(result.css).toMatchInlineSnapshot(`
        ".c_blue {
          color: blue;
        }
        .[&:nth-child(odd)]:c_red:nth-child(odd) {
          color: red;
        }
        .[&[data-state="active"]]:c_green[data-state="active"] {
          color: green;
        }"
      `)
    })
  })

  describe('Class generation', () => {
    test('should generate atomic class names by default', () => {
      const result = serialize({
        color: 'red',
        fontSize: 'lg',
      })

      expect(result.className).toMatchInlineSnapshot(`"c_red fs_lg"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_red {
          color: red;
        }
        .fs_lg {
          font-size: var(--fontSizes-lg);
        }"
      `)
    })

    test('should generate atomic class names with conditions', () => {
      const result = serialize({
        color: 'blue',
        _hover: { color: 'red' },
        sm: { fontSize: 'lg' },
      })

      expect(result.className).toMatchInlineSnapshot(`"c_blue hover:c_red sm:fs_lg"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_blue {
          color: blue;
        }
        .hover:c_red:is(:hover, [data-hover]) {
          color: red;
        }
        @media (min-width: 640px) {
          .sm:fs_lg {
            font-size: var(--fontSizes-lg);
          }
        }"
      `)
    })
  })

  describe('Edge cases', () => {
    test('should handle empty object', () => {
      const result = serialize({})

      expect(result.css).toMatchInlineSnapshot(`""`)
      expect(result.className).toMatchInlineSnapshot(`""`)
    })

    test('should handle object with only conditions', () => {
      const result = serialize({
        sm: { color: 'red' },
        _hover: { backgroundColor: 'blue' },
      })

      expect(result.className).toMatchInlineSnapshot(`"sm:c_red hover:bg-c_blue"`)
      expect(result.css).toMatchInlineSnapshot(`
        "@media (min-width: 640px) {
          .sm:c_red {
            color: red;
          }
        }
        .hover:bg-c_blue:is(:hover, [data-hover]) {
          background-color: blue;
        }"
      `)
    })

    test('should ignore undefined values', () => {
      const result = serialize({
        color: 'red',
        backgroundColor: undefined,
        fontSize: undefined,
        margin: '4',
      })

      expect(result.className).toMatchInlineSnapshot(`"c_red m_4"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".c_red {
          color: red;
        }
        .m_4 {
          margin: var(--spacing-4);
        }"
      `)
      expect(result.css).toContain('color: red;')
      expect(result.css).toContain('margin: var(--spacing-4)')
      expect(result.css).not.toContain('background-color')
      expect(result.css).not.toContain('font-size')
    })

    test('should handle camelCase to kebab-case conversion', () => {
      const result = serialize({
        backgroundColor: 'red',
        borderRadius: 'md',
        fontSize: 'lg',
        marginTop: '4',
        paddingLeft: '2',
      })

      expect(result.className).toMatchInlineSnapshot(`"bg-c_red bdr_md fs_lg mt_4 pl_2"`)
      expect(result.css).toMatchInlineSnapshot(`
        ".bg-c_red {
          background-color: red;
        }
        .bdr_md {
          border-radius: var(--radii-md);
        }
        .fs_lg {
          font-size: var(--fontSizes-lg);
        }
        .mt_4 {
          margin-top: var(--spacing-4);
        }
        .pl_2 {
          padding-left: var(--spacing-2);
        }"
      `)
    })
  })

  describe('Real-world scenarios', () => {
    test('should handle complex button component styles', () => {
      const result = serialize({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3',
        borderRadius: 'md',
        fontSize: 'sm',
        fontWeight: 'medium',
        backgroundColor: 'blue',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        _hover: {
          backgroundColor: 'blue',
          opacity: 0.9,
        },
        _focus: {
          outline: '2px solid blue',
          outlineOffset: '2',
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      })

      expect(result.className).toMatchInlineSnapshot(
        `"d_inline-flex ai_center jc_center p_3 bdr_md fs_sm fw_medium bg-c_blue c_white bd_none cursor_pointer hover:bg-c_blue hover:op_0.9 focus:ring_2px_solid_blue focus:ring-o_2 disabled:op_0.5 disabled:cursor_not-allowed"`,
      )
      expect(result.css).toMatchInlineSnapshot(`
        ".d_inline-flex {
          display: inline-flex;
        }
        .ai_center {
          align-items: center;
        }
        .jc_center {
          justify-content: center;
        }
        .p_3 {
          padding: var(--spacing-3);
        }
        .bdr_md {
          border-radius: var(--radii-md);
        }
        .fs_sm {
          font-size: var(--fontSizes-sm);
        }
        .fw_medium {
          font-weight: var(--fontWeights-medium);
        }
        .bg-c_blue {
          background-color: blue;
        }
        .c_white {
          color: white;
        }
        .bd_none {
          border: none;
        }
        .cursor_pointer {
          cursor: pointer;
        }
        .hover:bg-c_blue:is(:hover, [data-hover]) {
          background-color: blue;
        }
        .hover:op_0.9:is(:hover, [data-hover]) {
          opacity: 0.9;
        }
        .focus:ring_2px_solid_blue:is(:focus, [data-focus]) {
          outline: 2px solid blue;
        }
        .focus:ring-o_2:is(:focus, [data-focus]) {
          outline-offset: var(--spacing-2);
        }
        .disabled:op_0.5:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
          opacity: 0.5;
        }
        .disabled:cursor_not-allowed:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
          cursor: not-allowed;
        }"
      `)
    })

    test('should handle responsive card layout', () => {
      const result = serialize({
        display: 'flex',
        flexDirection: 'column',
        padding: '4',
        borderRadius: 'lg',
        boxShadow: 'md',
        backgroundColor: 'white',
        sm: {
          padding: '6',
          flexDirection: 'row',
        },
        md: {
          padding: '8',
          maxWidth: '2xl',
        },
        lg: {
          padding: '12',
        },
      })

      expect(result.className).toMatchInlineSnapshot(
        `"d_flex flex-d_column p_4 bdr_lg bx-sh_md bg-c_white sm:p_6 sm:flex-d_row md:p_8 md:max-w_2xl lg:p_12"`,
      )
      expect(result.css).toMatchInlineSnapshot(`
        ".d_flex {
          display: flex;
        }
        .flex-d_column {
          flex-direction: column;
        }
        .p_4 {
          padding: var(--spacing-4);
        }
        .bdr_lg {
          border-radius: var(--radii-lg);
        }
        .bx-sh_md {
          box-shadow: var(--shadows-md);
        }
        .bg-c_white {
          background-color: white;
        }
        @media (min-width: 640px) {
          .sm:p_6 {
            padding: var(--spacing-6);
          }
        }
        @media (min-width: 640px) {
          .sm:flex-d_row {
            flex-direction: row;
          }
        }
        @media (min-width: 768px) {
          .md:p_8 {
            padding: var(--spacing-8);
          }
        }
        @media (min-width: 768px) {
          .md:max-w_2xl {
            max-width: var(--sizes-2xl);
          }
        }
        @media (min-width: 1024px) {
          .lg:p_12 {
            padding: var(--spacing-12);
          }
        }"
      `)
    })

    test('should handle form input styles with states', () => {
      const result = serialize({
        width: 'full',
        padding: '3',
        border: '1px solid gray',
        borderRadius: 'md',
        fontSize: 'sm',
        backgroundColor: 'white',
        _focus: {
          outline: 'none',
          borderColor: 'blue',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        },
        _invalid: {
          borderColor: 'red',
          _focus: {
            borderColor: 'red',
            boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
          },
        },
        _disabled: {
          backgroundColor: 'gray',
          cursor: 'not-allowed',
          opacity: 0.6,
        },
      })

      expect(result.className).toMatchInlineSnapshot(
        `"w_full p_3 bd_1px_solid_gray bdr_md fs_sm bg-c_white focus:ring_none focus:bd-c_blue focus:bx-sh_0_0_0_3px_rgba(59,_130,_246,_0.1) invalid:bd-c_red [invalid:focus]:bd-c_red [invalid:focus]:bx-sh_0_0_0_3px_rgba(239,_68,_68,_0.1) disabled:bg-c_gray disabled:cursor_not-allowed disabled:op_0.6"`,
      )
      expect(result.css).toMatchInlineSnapshot(`
        ".w_full {
          width: var(--sizes-full);
        }
        .p_3 {
          padding: var(--spacing-3);
        }
        .bd_1px_solid_gray {
          border: 1px solid gray;
        }
        .bdr_md {
          border-radius: var(--radii-md);
        }
        .fs_sm {
          font-size: var(--fontSizes-sm);
        }
        .bg-c_white {
          background-color: white;
        }
        .focus:ring_none:is(:focus, [data-focus]) {
          outline: none;
        }
        .focus:bd-c_blue:is(:focus, [data-focus]) {
          border-color: blue;
        }
        .focus:bx-sh_0_0_0_3px_rgba(59,_130,_246,_0.1):is(:focus, [data-focus]) {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .invalid:bd-c_red:is(:invalid, [data-invalid], [aria-invalid=true]) {
          border-color: red;
        }
        .[invalid:focus]:bd-c_red:is(:invalid, [data-invalid], [aria-invalid=true]):is(:focus, [data-focus]) {
          border-color: red;
        }
        .[invalid:focus]:bx-sh_0_0_0_3px_rgba(239,_68,_68,_0.1):is(:invalid, [data-invalid], [aria-invalid=true]):is(:focus, [data-focus]) {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        .disabled:bg-c_gray:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
          background-color: gray;
        }
        .disabled:cursor_not-allowed:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
          cursor: not-allowed;
        }
        .disabled:op_0.6:is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
          opacity: 0.6;
        }"
      `)
    })
  })

  describe('Token CSS generation', () => {
    test('should generate CSS variables for all token categories', () => {
      const css = generateTokenCSS()
      expect(css).toMatchInlineSnapshot(`
        ":root {
          --colors-current: currentColor;
          --colors-black: #000;
          --colors-white: #fff;
          --colors-transparent: rgb(0 0 0 / 0);
          --colors-rose-50: #fff1f2;
          --colors-rose-100: #ffe4e6;
          --colors-rose-200: #fecdd3;
          --colors-rose-300: #fda4af;
          --colors-rose-400: #fb7185;
          --colors-rose-500: #f43f5e;
          --colors-rose-600: #e11d48;
          --colors-rose-700: #be123c;
          --colors-rose-800: #9f1239;
          --colors-rose-900: #881337;
          --colors-rose-950: #4c0519;
          --colors-pink-50: #fdf2f8;
          --colors-pink-100: #fce7f3;
          --colors-pink-200: #fbcfe8;
          --colors-pink-300: #f9a8d4;
          --colors-pink-400: #f472b6;
          --colors-pink-500: #ec4899;
          --colors-pink-600: #db2777;
          --colors-pink-700: #be185d;
          --colors-pink-800: #9d174d;
          --colors-pink-900: #831843;
          --colors-pink-950: #500724;
          --colors-fuchsia-50: #fdf4ff;
          --colors-fuchsia-100: #fae8ff;
          --colors-fuchsia-200: #f5d0fe;
          --colors-fuchsia-300: #f0abfc;
          --colors-fuchsia-400: #e879f9;
          --colors-fuchsia-500: #d946ef;
          --colors-fuchsia-600: #c026d3;
          --colors-fuchsia-700: #a21caf;
          --colors-fuchsia-800: #86198f;
          --colors-fuchsia-900: #701a75;
          --colors-fuchsia-950: #4a044e;
          --colors-purple-50: #faf5ff;
          --colors-purple-100: #f3e8ff;
          --colors-purple-200: #e9d5ff;
          --colors-purple-300: #d8b4fe;
          --colors-purple-400: #c084fc;
          --colors-purple-500: #a855f7;
          --colors-purple-600: #9333ea;
          --colors-purple-700: #7e22ce;
          --colors-purple-800: #6b21a8;
          --colors-purple-900: #581c87;
          --colors-purple-950: #3b0764;
          --colors-violet-50: #f5f3ff;
          --colors-violet-100: #ede9fe;
          --colors-violet-200: #ddd6fe;
          --colors-violet-300: #c4b5fd;
          --colors-violet-400: #a78bfa;
          --colors-violet-500: #8b5cf6;
          --colors-violet-600: #7c3aed;
          --colors-violet-700: #6d28d9;
          --colors-violet-800: #5b21b6;
          --colors-violet-900: #4c1d95;
          --colors-violet-950: #2e1065;
          --colors-indigo-50: #eef2ff;
          --colors-indigo-100: #e0e7ff;
          --colors-indigo-200: #c7d2fe;
          --colors-indigo-300: #a5b4fc;
          --colors-indigo-400: #818cf8;
          --colors-indigo-500: #6366f1;
          --colors-indigo-600: #4f46e5;
          --colors-indigo-700: #4338ca;
          --colors-indigo-800: #3730a3;
          --colors-indigo-900: #312e81;
          --colors-indigo-950: #1e1b4b;
          --colors-blue-50: #eff6ff;
          --colors-blue-100: #dbeafe;
          --colors-blue-200: #bfdbfe;
          --colors-blue-300: #93c5fd;
          --colors-blue-400: #60a5fa;
          --colors-blue-500: #3b82f6;
          --colors-blue-600: #2563eb;
          --colors-blue-700: #1d4ed8;
          --colors-blue-800: #1e40af;
          --colors-blue-900: #1e3a8a;
          --colors-blue-950: #172554;
          --colors-sky-50: #f0f9ff;
          --colors-sky-100: #e0f2fe;
          --colors-sky-200: #bae6fd;
          --colors-sky-300: #7dd3fc;
          --colors-sky-400: #38bdf8;
          --colors-sky-500: #0ea5e9;
          --colors-sky-600: #0284c7;
          --colors-sky-700: #0369a1;
          --colors-sky-800: #075985;
          --colors-sky-900: #0c4a6e;
          --colors-sky-950: #082f49;
          --colors-cyan-50: #ecfeff;
          --colors-cyan-100: #cffafe;
          --colors-cyan-200: #a5f3fc;
          --colors-cyan-300: #67e8f9;
          --colors-cyan-400: #22d3ee;
          --colors-cyan-500: #06b6d4;
          --colors-cyan-600: #0891b2;
          --colors-cyan-700: #0e7490;
          --colors-cyan-800: #155e75;
          --colors-cyan-900: #164e63;
          --colors-cyan-950: #083344;
          --colors-teal-50: #f0fdfa;
          --colors-teal-100: #ccfbf1;
          --colors-teal-200: #99f6e4;
          --colors-teal-300: #5eead4;
          --colors-teal-400: #2dd4bf;
          --colors-teal-500: #14b8a6;
          --colors-teal-600: #0d9488;
          --colors-teal-700: #0f766e;
          --colors-teal-800: #115e59;
          --colors-teal-900: #134e4a;
          --colors-teal-950: #042f2e;
          --colors-emerald-50: #ecfdf5;
          --colors-emerald-100: #d1fae5;
          --colors-emerald-200: #a7f3d0;
          --colors-emerald-300: #6ee7b7;
          --colors-emerald-400: #34d399;
          --colors-emerald-500: #10b981;
          --colors-emerald-600: #059669;
          --colors-emerald-700: #047857;
          --colors-emerald-800: #065f46;
          --colors-emerald-900: #064e3b;
          --colors-emerald-950: #022c22;
          --colors-green-50: #f0fdf4;
          --colors-green-100: #dcfce7;
          --colors-green-200: #bbf7d0;
          --colors-green-300: #86efac;
          --colors-green-400: #4ade80;
          --colors-green-500: #22c55e;
          --colors-green-600: #16a34a;
          --colors-green-700: #15803d;
          --colors-green-800: #166534;
          --colors-green-900: #14532d;
          --colors-green-950: #052e16;
          --colors-lime-50: #f7fee7;
          --colors-lime-100: #ecfccb;
          --colors-lime-200: #d9f99d;
          --colors-lime-300: #bef264;
          --colors-lime-400: #a3e635;
          --colors-lime-500: #84cc16;
          --colors-lime-600: #65a30d;
          --colors-lime-700: #4d7c0f;
          --colors-lime-800: #3f6212;
          --colors-lime-900: #365314;
          --colors-lime-950: #1a2e05;
          --colors-yellow-50: #fefce8;
          --colors-yellow-100: #fef9c3;
          --colors-yellow-200: #fef08a;
          --colors-yellow-300: #fde047;
          --colors-yellow-400: #facc15;
          --colors-yellow-500: #eab308;
          --colors-yellow-600: #ca8a04;
          --colors-yellow-700: #a16207;
          --colors-yellow-800: #854d0e;
          --colors-yellow-900: #713f12;
          --colors-yellow-950: #422006;
          --colors-amber-50: #fffbeb;
          --colors-amber-100: #fef3c7;
          --colors-amber-200: #fde68a;
          --colors-amber-300: #fcd34d;
          --colors-amber-400: #fbbf24;
          --colors-amber-500: #f59e0b;
          --colors-amber-600: #d97706;
          --colors-amber-700: #b45309;
          --colors-amber-800: #92400e;
          --colors-amber-900: #78350f;
          --colors-amber-950: #451a03;
          --colors-orange-50: #fff7ed;
          --colors-orange-100: #ffedd5;
          --colors-orange-200: #fed7aa;
          --colors-orange-300: #fdba74;
          --colors-orange-400: #fb923c;
          --colors-orange-500: #f97316;
          --colors-orange-600: #ea580c;
          --colors-orange-700: #c2410c;
          --colors-orange-800: #9a3412;
          --colors-orange-900: #7c2d12;
          --colors-orange-950: #431407;
          --colors-red-50: #fef2f2;
          --colors-red-100: #fee2e2;
          --colors-red-200: #fecaca;
          --colors-red-300: #fca5a5;
          --colors-red-400: #f87171;
          --colors-red-500: #ef4444;
          --colors-red-600: #dc2626;
          --colors-red-700: #b91c1c;
          --colors-red-800: #991b1b;
          --colors-red-900: #7f1d1d;
          --colors-red-950: #450a0a;
          --colors-neutral-50: #fafafa;
          --colors-neutral-100: #f5f5f5;
          --colors-neutral-200: #e5e5e5;
          --colors-neutral-300: #d4d4d4;
          --colors-neutral-400: #a3a3a3;
          --colors-neutral-500: #737373;
          --colors-neutral-600: #525252;
          --colors-neutral-700: #404040;
          --colors-neutral-800: #262626;
          --colors-neutral-900: #171717;
          --colors-neutral-950: #0a0a0a;
          --colors-stone-50: #fafaf9;
          --colors-stone-100: #f5f5f4;
          --colors-stone-200: #e7e5e4;
          --colors-stone-300: #d6d3d1;
          --colors-stone-400: #a8a29e;
          --colors-stone-500: #78716c;
          --colors-stone-600: #57534e;
          --colors-stone-700: #44403c;
          --colors-stone-800: #292524;
          --colors-stone-900: #1c1917;
          --colors-stone-950: #0c0a09;
          --colors-zinc-50: #fafafa;
          --colors-zinc-100: #f4f4f5;
          --colors-zinc-200: #e4e4e7;
          --colors-zinc-300: #d4d4d8;
          --colors-zinc-400: #a1a1aa;
          --colors-zinc-500: #71717a;
          --colors-zinc-600: #52525b;
          --colors-zinc-700: #3f3f46;
          --colors-zinc-800: #27272a;
          --colors-zinc-900: #18181b;
          --colors-zinc-950: #09090b;
          --colors-gray-50: #f9fafb;
          --colors-gray-100: #f3f4f6;
          --colors-gray-200: #e5e7eb;
          --colors-gray-300: #d1d5db;
          --colors-gray-400: #9ca3af;
          --colors-gray-500: #6b7280;
          --colors-gray-600: #4b5563;
          --colors-gray-700: #374151;
          --colors-gray-800: #1f2937;
          --colors-gray-900: #111827;
          --colors-gray-950: #030712;
          --colors-slate-50: #f8fafc;
          --colors-slate-100: #f1f5f9;
          --colors-slate-200: #e2e8f0;
          --colors-slate-300: #cbd5e1;
          --colors-slate-400: #94a3b8;
          --colors-slate-500: #64748b;
          --colors-slate-600: #475569;
          --colors-slate-700: #334155;
          --colors-slate-800: #1e293b;
          --colors-slate-900: #0f172a;
          --colors-slate-950: #020617;
          --spacing-0: 0rem;
          --spacing-1: 0.25rem;
          --spacing-2: 0.5rem;
          --spacing-3: 0.75rem;
          --spacing-4: 1rem;
          --spacing-5: 1.25rem;
          --spacing-6: 1.5rem;
          --spacing-7: 1.75rem;
          --spacing-8: 2rem;
          --spacing-9: 2.25rem;
          --spacing-10: 2.5rem;
          --spacing-11: 2.75rem;
          --spacing-12: 3rem;
          --spacing-13: 3.25rem;
          --spacing-14: 3.5rem;
          --spacing-15: 3.75rem;
          --spacing-16: 4rem;
          --spacing-17: 4.25rem;
          --spacing-18: 4.5rem;
          --spacing-19: 4.75rem;
          --spacing-20: 5rem;
          --spacing-21: 5.25rem;
          --spacing-22: 5.5rem;
          --spacing-23: 5.75rem;
          --spacing-24: 6rem;
          --spacing-28: 7rem;
          --spacing-32: 8rem;
          --spacing-36: 9rem;
          --spacing-40: 10rem;
          --spacing-44: 11rem;
          --spacing-48: 12rem;
          --spacing-52: 13rem;
          --spacing-56: 14rem;
          --spacing-60: 15rem;
          --spacing-64: 16rem;
          --spacing-72: 18rem;
          --spacing-80: 20rem;
          --spacing-96: 24rem;
          --spacing-0\\.5: 0.125rem;
          --spacing-1\\.5: 0.375rem;
          --spacing-2\\.5: 0.625rem;
          --spacing-3\\.5: 0.875rem;
          --spacing--0\\.5: -0.125rem;
          --spacing--1: -0.25rem;
          --spacing--1\\.5: -0.375rem;
          --spacing--2: -0.5rem;
          --spacing--2\\.5: -0.625rem;
          --spacing--3: -0.75rem;
          --spacing--3\\.5: -0.875rem;
          --spacing--4: -1rem;
          --spacing--5: -1.25rem;
          --spacing--6: -1.5rem;
          --spacing--7: -1.75rem;
          --spacing--8: -2rem;
          --spacing--9: -2.25rem;
          --spacing--10: -2.5rem;
          --spacing--11: -2.75rem;
          --spacing--12: -3rem;
          --spacing--14: -3.5rem;
          --spacing--16: -4rem;
          --spacing--20: -5rem;
          --spacing--24: -6rem;
          --spacing--28: -7rem;
          --spacing--32: -8rem;
          --spacing--36: -9rem;
          --spacing--40: -10rem;
          --spacing--44: -11rem;
          --spacing--48: -12rem;
          --spacing--52: -13rem;
          --spacing--56: -14rem;
          --spacing--60: -15rem;
          --spacing--64: -16rem;
          --spacing--72: -18rem;
          --spacing--80: -20rem;
          --spacing--96: -24rem;
          --spacing-1\\/2: 50%;
          --spacing-1\\/3: 33.333333%;
          --spacing-2\\/3: 66.666667%;
          --spacing-1\\/4: 25%;
          --spacing-2\\/4: 50%;
          --spacing-3\\/4: 75%;
          --spacing-1\\/5: 20%;
          --spacing-2\\/5: 40%;
          --spacing-3\\/5: 60%;
          --spacing-4\\/5: 80%;
          --spacing-1\\/6: 16.666667%;
          --spacing-2\\/6: 33.333333%;
          --spacing-3\\/6: 50%;
          --spacing-4\\/6: 66.666667%;
          --spacing-5\\/6: 83.333333%;
          --spacing-1\\/12: 8.333333%;
          --spacing-2\\/12: 16.666667%;
          --spacing-3\\/12: 25%;
          --spacing-4\\/12: 33.333333%;
          --spacing-5\\/12: 41.666667%;
          --spacing-6\\/12: 50%;
          --spacing-7\\/12: 58.333333%;
          --spacing-8\\/12: 66.666667%;
          --spacing-9\\/12: 75%;
          --spacing-10\\/12: 83.333333%;
          --spacing-11\\/12: 91.666667%;
          --spacing-px: 1px;
          --fonts-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          --fonts-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          --fonts-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          --fontSizes-2xs: 0.5rem;
          --fontSizes-xs: 0.75rem;
          --fontSizes-sm: 0.875rem;
          --fontSizes-md: 1rem;
          --fontSizes-lg: 1.125rem;
          --fontSizes-xl: 1.25rem;
          --fontSizes-2xl: 1.5rem;
          --fontSizes-3xl: 1.875rem;
          --fontSizes-4xl: 2.25rem;
          --fontSizes-5xl: 3rem;
          --fontSizes-6xl: 3.75rem;
          --fontSizes-7xl: 4.5rem;
          --fontSizes-8xl: 6rem;
          --fontSizes-9xl: 8rem;
          --fontWeights-thin: 100;
          --fontWeights-extralight: 200;
          --fontWeights-light: 300;
          --fontWeights-normal: 400;
          --fontWeights-medium: 500;
          --fontWeights-semibold: 600;
          --fontWeights-bold: 700;
          --fontWeights-extrabold: 800;
          --fontWeights-black: 900;
          --lineHeights-none: 1;
          --lineHeights-tight: 1.25;
          --lineHeights-snug: 1.375;
          --lineHeights-normal: 1.5;
          --lineHeights-relaxed: 1.625;
          --lineHeights-loose: 2;
          --letterSpacings-tighter: -0.05em;
          --letterSpacings-tight: -0.025em;
          --letterSpacings-normal: 0em;
          --letterSpacings-wide: 0.025em;
          --letterSpacings-wider: 0.05em;
          --letterSpacings-widest: 0.1em;
          --sizes-0: 0rem;
          --sizes-1: 0.25rem;
          --sizes-2: 0.5rem;
          --sizes-3: 0.75rem;
          --sizes-4: 1rem;
          --sizes-5: 1.25rem;
          --sizes-6: 1.5rem;
          --sizes-7: 1.75rem;
          --sizes-8: 2rem;
          --sizes-9: 2.25rem;
          --sizes-10: 2.5rem;
          --sizes-11: 2.75rem;
          --sizes-12: 3rem;
          --sizes-14: 3.5rem;
          --sizes-16: 4rem;
          --sizes-20: 5rem;
          --sizes-24: 6rem;
          --sizes-28: 7rem;
          --sizes-32: 8rem;
          --sizes-36: 9rem;
          --sizes-40: 10rem;
          --sizes-44: 11rem;
          --sizes-48: 12rem;
          --sizes-52: 13rem;
          --sizes-56: 14rem;
          --sizes-60: 15rem;
          --sizes-64: 16rem;
          --sizes-72: 18rem;
          --sizes-80: 20rem;
          --sizes-96: 24rem;
          --sizes-0\\.5: 0.125rem;
          --sizes-1\\.5: 0.375rem;
          --sizes-2\\.5: 0.625rem;
          --sizes-3\\.5: 0.875rem;
          --sizes-xs: 20rem;
          --sizes-sm: 24rem;
          --sizes-md: 28rem;
          --sizes-lg: 32rem;
          --sizes-xl: 36rem;
          --sizes-2xl: 42rem;
          --sizes-3xl: 48rem;
          --sizes-4xl: 56rem;
          --sizes-5xl: 64rem;
          --sizes-6xl: 72rem;
          --sizes-7xl: 80rem;
          --sizes-8xl: 90rem;
          --sizes-prose: 65ch;
          --sizes-full: 100%;
          --sizes-min: min-content;
          --sizes-max: max-content;
          --sizes-fit: fit-content;
          --sizes-screen: 100vw;
          --sizes-dvh: 100dvh;
          --sizes-lvh: 100lvh;
          --sizes-svh: 100svh;
          --sizes-dvw: 100dvw;
          --sizes-lvw: 100lvw;
          --sizes-svw: 100svw;
          --sizes-9xl: 96rem;
          --sizes-10xl: 104rem;
          --sizes-11xl: 112rem;
          --sizes-12xl: 120rem;
          --sizes-auto: auto;
          --sizes-1\\/2: 50%;
          --sizes-1\\/3: 33.333333%;
          --sizes-2\\/3: 66.666667%;
          --sizes-1\\/4: 25%;
          --sizes-2\\/4: 50%;
          --sizes-3\\/4: 75%;
          --sizes-1\\/5: 20%;
          --sizes-2\\/5: 40%;
          --sizes-3\\/5: 60%;
          --sizes-4\\/5: 80%;
          --sizes-1\\/6: 16.666667%;
          --sizes-2\\/6: 33.333333%;
          --sizes-3\\/6: 50%;
          --sizes-4\\/6: 66.666667%;
          --sizes-5\\/6: 83.333333%;
          --sizes-1\\/12: 8.333333%;
          --sizes-2\\/12: 16.666667%;
          --sizes-3\\/12: 25%;
          --sizes-4\\/12: 33.333333%;
          --sizes-5\\/12: 41.666667%;
          --sizes-6\\/12: 50%;
          --sizes-7\\/12: 58.333333%;
          --sizes-8\\/12: 66.666667%;
          --sizes-9\\/12: 75%;
          --sizes-10\\/12: 83.333333%;
          --sizes-11\\/12: 91.666667%;
          --sizes--0\\.5: -0.125rem;
          --sizes--1: -0.25rem;
          --sizes--1\\.5: -0.375rem;
          --sizes--2: -0.5rem;
          --sizes--2\\.5: -0.625rem;
          --sizes--3: -0.75rem;
          --sizes--3\\.5: -0.875rem;
          --sizes--4: -1rem;
          --sizes--5: -1.25rem;
          --sizes--6: -1.5rem;
          --sizes--7: -1.75rem;
          --sizes--8: -2rem;
          --sizes--9: -2.25rem;
          --sizes--10: -2.5rem;
          --sizes--11: -2.75rem;
          --sizes--12: -3rem;
          --sizes--14: -3.5rem;
          --sizes--16: -4rem;
          --sizes--20: -5rem;
          --sizes--24: -6rem;
          --sizes--28: -7rem;
          --sizes--32: -8rem;
          --sizes--36: -9rem;
          --sizes--40: -10rem;
          --sizes--44: -11rem;
          --sizes--48: -12rem;
          --sizes--52: -13rem;
          --sizes--56: -14rem;
          --sizes--60: -15rem;
          --sizes--64: -16rem;
          --sizes--72: -18rem;
          --sizes--80: -20rem;
          --sizes--96: -24rem;
          --shadows-2xs: 0 1px rgb(0 0 0 / 0.05);
          --shadows-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadows-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          --shadows-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --shadows-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          --shadows-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          --shadows-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
          --shadows-inset-2xs: inset 0 1px rgb(0 0 0 / 0.05);
          --shadows-inset-xs: inset 0 1px 1px rgb(0 0 0 / 0.05);
          --shadows-inset-sm: inset 0 2px 4px rgb(0 0 0 / 0.05);
          --radii-xs: 0.125rem;
          --radii-sm: 0.25rem;
          --radii-md: 0.375rem;
          --radii-lg: 0.5rem;
          --radii-xl: 0.75rem;
          --radii-2xl: 1rem;
          --radii-3xl: 1.5rem;
          --radii-4xl: 2rem;
          --radii-full: 9999px;
        }"
      `)
    })

    test('generated CSS should be valid and well-formatted', () => {
      const css = generateTokenCSS()
      const lines = css.split('\n')

      expect(lines[0]).toMatchInlineSnapshot(`":root {"`)
      expect(lines[lines.length - 1]).toMatchInlineSnapshot(`"}"`)

      // Check that each variable line is properly formatted
      const variableLines = lines.slice(1, -1)
      variableLines.forEach((line) => {
        if (line.trim()) {
          expect(line).toMatch(/^\s+--[\w.\-\\\/]+: .+;$/)
        }
      })
    })
  })
})
