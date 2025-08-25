import { describe, test, expect } from 'vitest'
import { reverseSplitter } from './reverse-splitter'

describe('reverseSplitter - Real World Scenarios', () => {
  test('should handle the example from user description', () => {
    const classList = 'fs_2.5rem sm:fs_3rem ls_tight fw_bold lh_1.2 max-w_40rem md:max-w_unset'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      fontSize: '2.5rem',
      sm: { fontSize: '3rem' },
      letterSpacing: 'tight',
      fontWeight: 'bold',
      lineHeight: 1.2,
      maxWidth: '40rem',
      md: { maxWidth: 'unset' },
    })
  })

  test('should handle comprehensive typography classes', () => {
    const classList = 'fs_16px ff_Inter fw_600 ls_0.05em lh_1.5 c_blue ta_center td_underline tt_uppercase'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      fontSize: '16px',
      fontFamily: 'Inter',
      fontWeight: 600,
      letterSpacing: '0.05em',
      lineHeight: 1.5,
      color: 'blue',
      textAlign: 'center',
      textDecoration: 'underline',
      textTransform: 'uppercase',
    })
  })

  test('should handle layout and positioning', () => {
    const classList = 'pos_absolute top_0 left_50% z_10 asp_16/9 obj-f_cover vis_hidden'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      position: 'absolute',
      top: 0,
      left: '50%',
      zIndex: 10,
      aspectRatio: '16/9',
      objectFit: 'cover',
      visibility: 'hidden',
    })
  })

  test('should handle comprehensive flexbox and grid', () => {
    const classList = 'd_flex flex-d_column flex-g_1 flex-sh_0 jc_center ai_stretch gap_1rem'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: '1rem',
    })
  })

  test('should handle grid layout properties', () => {
    const classList = 'd_grid grid-tc_repeat(3,_1fr) grid-tr_auto_1fr_auto grid-c_span_2 grid-r_1_/_3 gap_2rem'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'auto 1fr auto',
      gridColumn: 'span 2',
      gridRow: '1 / 3',
      gap: '2rem',
    })
  })

  test('should handle comprehensive spacing', () => {
    const classList = 'p_1rem pt_2rem pb_3rem px_4rem py_5rem m_auto ml_1rem mr_2rem mt_3rem mb_4rem mx_5rem my_6rem'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      padding: '1rem',
      paddingTop: '2rem',
      paddingBottom: '3rem',
      paddingInline: '4rem',
      paddingBlock: '5rem',
      margin: 'auto',
      marginLeft: '1rem',
      marginRight: '2rem',
      marginTop: '3rem',
      marginBottom: '4rem',
      marginInline: '5rem',
      marginBlock: '6rem',
    })
  })

  test('should handle sizing with various units and fractions', () => {
    const classList = 'w_100% h_50vh min-w_300px max-w_1200px min-h_20rem max-h_80vh size_64px'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      width: '100%',
      height: '50vh',
      minWidth: '300px',
      maxWidth: '1200px',
      minHeight: '20rem',
      maxHeight: '80vh',
      boxSize: '64px',
    })
  })

  test('should handle comprehensive background properties', () => {
    const classList = "bg_red bg-i_url('/image.jpg') bg-s_cover bg-p_center bg-r_no-repeat bg-a_fixed"

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      background: 'red',
      backgroundImage: "url('/image.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    })
  })

  test('should handle comprehensive border properties', () => {
    const classList = 'bd_1px_solid_black bd-w_2px bd-c_red bdr_8px bdr-tl_4px bdr-tr_6px'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      border: '1px solid black',
      borderWidth: '2px',
      borderColor: 'red',
      borderRadius: '8px',
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '6px',
    })
  })

  test('should handle effects and transforms', () => {
    const classList = 'op_0.8 bx-sh_lg filter_blur(10px) brightness_1.2 trf_rotate(45deg)_scale(1.1) rotate_90deg'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      opacity: 0.8,
      boxShadow: 'lg',
      filter: 'blur(10px)',
      brightness: 1.2,
      transform: 'rotate(45deg) scale(1.1)',
      rotate: '90deg',
    })
  })

  test('should handle outline and ring properties', () => {
    const classList = 'ring_2px_solid_blue ring-w_3px ring-c_green ring-o_2px'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      outline: '2px solid blue',
      outlineWidth: '3px',
      outlineColor: 'green',
      outlineOffset: '2px',
    })
  })

  test('should handle responsive breakpoints with complex nesting', () => {
    const classList = 'w_100% sm:w_50% md:w_33.33% lg:w_25% xl:w_20% 2xl:w_16.666%'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      width: '100%',
      sm: { width: '50%' },
      md: { width: '33.33%' },
      lg: { width: '25%' },
      xl: { width: '20%' },
      '2xl': { width: '16.666%' },
    })
  })

  test('should handle various pseudo-states', () => {
    const classList = 'bg_blue hover:bg_red focus:bg_green active:bg_yellow disabled:bg_gray checked:bg_purple'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      background: 'blue',
      _hover: { background: 'red' },
      _focus: { background: 'green' },
      _active: { background: 'yellow' },
      _disabled: { background: 'gray' },
      _checked: { background: 'purple' },
    })
  })

  test('should handle group and peer states', () => {
    const classList = 'bg_white group-hover:bg_blue peer-focus:bg_green peer-checked:bg_red'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      background: 'white',
      _groupHover: { background: 'blue' },
      _peerFocus: { background: 'green' },
      _peerChecked: { background: 'red' },
    })
  })

  test('should handle values with underscores (spaces)', () => {
    const classList =
      'bg_linear-gradient(to_right,_red,_blue) ff_system-ui,_sans-serif trf_translateX(-50%)_translateY(-50%)'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      background: 'linear-gradient(to right, red, blue)',
      fontFamily: 'system-ui, sans-serif',
      transform: 'translateX(-50%) translateY(-50%)',
    })
  })

  test('should handle CSS property fallback for unknown prefixes', () => {
    const classList = 'text-decoration-thickness_2px scroll-behavior_smooth'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      textDecorationThickness: '2px',
      scrollBehavior: 'smooth',
    })
  })

  test('should handle negative values', () => {
    const classList = 'ml_-1rem mt_-20px translate-x_-50% z_-1'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      marginLeft: '-1rem',
      marginTop: '-20px',
      translateX: '-50%',
      zIndex: -1,
    })
  })

  test('should handle fractional values', () => {
    const classList = 'w_1/2 h_2/3 top_1/4 left_3/4'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      width: '1/2',
      height: '2/3',
      top: '1/4',
      left: '3/4',
    })
  })

  test('should handle CSS keywords and special values', () => {
    const classList = 'd_none w_auto h_inherit bg_transparent m_initial op_unset'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      display: 'none',
      width: 'auto',
      height: 'inherit',
      background: 'transparent',
      margin: 'initial',
      opacity: 'unset',
    })
  })

  test('should ignore unknown classes gracefully', () => {
    const classList = 'fs_2rem unknown-class custom-class fw_bold some-other-unknown'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      fontSize: '2rem',
      fontWeight: 'bold',
    })
  })

  test('should handle empty and whitespace-only strings', () => {
    expect(reverseSplitter('')).toEqual({})
    expect(reverseSplitter('   ')).toEqual({})
    expect(reverseSplitter('\t\n')).toEqual({})
  })

  test('should handle complex real-world responsive design', () => {
    const classList =
      'd_block sm:d_flex md:d_grid fs_14px sm:fs_16px md:fs_18px lg:fs_20px p_1rem sm:p_2rem lg:p_3rem hover:bg_gray focus:ring_2px_solid_blue'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      display: 'block',
      sm: {
        display: 'flex',
        fontSize: '16px',
        padding: '2rem',
      },
      md: {
        display: 'grid',
        fontSize: '18px',
      },
      lg: {
        fontSize: '20px',
        padding: '3rem',
      },
      fontSize: '14px',
      padding: '1rem',
      _hover: { background: 'gray' },
      _focus: { outline: '2px solid blue' },
    })
  })

  test('should handle all CSS unit types', () => {
    const classList = 'w_100px h_50rem p_2em m_10vh fs_14pt lh_1.5ch ls_0.1ex'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      width: '100px',
      height: '50rem',
      padding: '2em',
      margin: '10vh',
      fontSize: '14pt',
      lineHeight: '1.5ch',
      letterSpacing: '0.1ex',
    })
  })

  test('should skip unsupported classes and CSS selector patterns', () => {
    const classList = 'rfm-marquee-container li-t_none motionReduce:[&_.rfm-marquee]:anim_none!'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      listStyleType: 'none',
      _motionReduce: {
        '& .rfm-marquee': {
          animation: 'none!',
        },
      },
    })
  })

  test('should handle kebab-case condition names correctly', () => {
    const classList = 'bg_white group-hover:bg_red peer-focus:c_blue focus-visible:ring_2px'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      background: 'white',
      _groupHover: { background: 'red' },
      _peerFocus: { color: 'blue' },
      _focusVisible: { outline: '2px' },
    })
  })

  test('should validate CSS properties using shared utilities', () => {
    const classList =
      'text-decoration-thickness_2px scroll-behavior_smooth backdrop-filter_blur(10px) invalid-property_value'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      textDecorationThickness: '2px',
      scrollBehavior: 'smooth',
      backdropFilter: 'blur(10px)',
      // invalid-property should be ignored since it's not a valid CSS property
    })
  })

  test('should handle CSS selector patterns with element targeting', () => {
    const classList = '[&_svg]:w_3 [&_img]:h_auto [&_button]:p_2'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      '& svg': { width: 3 },
      '& img': { height: 'auto' },
      '& button': { padding: 2 },
    })
  })

  test('should handle complex real-world class with CSS selector patterns', () => {
    const classList = 'nextra-search pos_relative md:w_64 [&_.excerpt]:trunc_true d_inline-block show_sm min-w_200px'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      position: 'relative',
      md: { width: 64 },
      '& .excerpt': { truncate: 'true' },
      display: 'inline-block',
      hideBelow: 'sm',
      minWidth: '200px',
    })
  })

  test('should handle complex selector patterns with conditions and data attributes', () => {
    const classList =
      'h_18px min-w_18px bdr_sm p_0.5 [&_path]:trf-o_center [&_path]:trs_transform [&_path]:rtl:trf_rotate(-180deg) [&[data-open="true"]_path]:ltr:trf_rotate(90deg) [&[data-open="true"]_path]:rtl:trf_rotate(-270deg)'

    const result = reverseSplitter(classList)

    expect(result).toEqual({
      height: '18px',
      minWidth: '18px',
      borderRadius: 'sm',
      padding: 0.5,
      '& path': {
        transformOrigin: 'center',
        transition: 'transform',
      },
      _rtl: {
        '& path': { transform: 'rotate(-180deg)' },
        '&[data-open="true"] path': { transform: 'rotate(-270deg)' },
      },
      _ltr: {
        '&[data-open="true"] path': { transform: 'rotate(90deg)' },
      },
    })
  })
})
