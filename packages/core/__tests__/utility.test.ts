import { fixturePreset } from '@pandacss/fixture'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { describe, expect, test } from 'vitest'
import { Utility } from '../src/utility'

const { tokens, semanticTokens } = fixturePreset.theme

describe('Utility', () => {
  test('should resolve hideFrom and hideBelow', () => {
    const utility = new Utility({
      tokens: new TokenDictionary({
        breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      }),
      config: {
        hideFrom: {
          className: 'hide',
          values: 'breakpoints',
          transform(value, { raw }) {
            return {
              [`@breakpoint ${raw}`]: {
                display: 'none',
              },
            }
          },
        },

        hideBelow: {
          className: 'show',
          values: 'breakpoints',
          transform(value, { raw }) {
            return {
              [`@breakpoint ${raw}Down`]: {
                display: 'none',
              },
            }
          },
        },
      },
    })

    expect(utility.classNames).toMatchInlineSnapshot(`
      Map {
        "(hideFrom = sm)" => "hide_sm",
        "(hideFrom = md)" => "hide_md",
        "(hideFrom = lg)" => "hide_lg",
        "(hideFrom = xl)" => "hide_xl",
        "(hideBelow = sm)" => "show_sm",
        "(hideBelow = md)" => "show_md",
        "(hideBelow = lg)" => "show_lg",
        "(hideBelow = xl)" => "show_xl",
      }
    `)

    expect(utility.styles).toMatchInlineSnapshot(`
      Map {
        "(hideFrom = sm)" => {
          "@breakpoint sm": {
            "display": "none",
          },
        },
        "(hideFrom = md)" => {
          "@breakpoint md": {
            "display": "none",
          },
        },
        "(hideFrom = lg)" => {
          "@breakpoint lg": {
            "display": "none",
          },
        },
        "(hideFrom = xl)" => {
          "@breakpoint xl": {
            "display": "none",
          },
        },
        "(hideBelow = sm)" => {
          "@breakpoint smDown": {
            "display": "none",
          },
        },
        "(hideBelow = md)" => {
          "@breakpoint mdDown": {
            "display": "none",
          },
        },
        "(hideBelow = lg)" => {
          "@breakpoint lgDown": {
            "display": "none",
          },
        },
        "(hideBelow = xl)" => {
          "@breakpoint xlDown": {
            "display": "none",
          },
        },
      }
    `)
  })

  test('should prime cache for faster lookup', () => {
    const utility = new Utility({
      tokens: new TokenDictionary({ tokens, semanticTokens }),
      config: {
        backgroundColor: {
          className: 'bg',
          values: 'colors',
        },
        display: {
          className: 'd',
          values: ['flex', 'inline-flex'],
        },
        margin: {
          className: 'm',
          values: (tokens) => tokens('spacing'),
        },
        marginX: {
          className: 'mx',
          transform(value) {
            return { marginTop: value, marginBottom: value }
          },
          values: { sm: '20px', md: '40px' },
        },
        bt: {
          transform(value, { token }) {
            return {
              borderTopWidth: value,
              borderTopStyle: 'solid',
              borderTopColor: token('colors.gray.500'),
            }
          },
        },
      },
    })

    expect(utility.types).toMatchInlineSnapshot(`
      Map {
        "backgroundColor" => Set {
          "type:Tokens[\\"colors\\"]",
        },
        "display" => Set {
          "flex",
          "inline-flex",
        },
        "margin" => Set {
          "type:Tokens[\\"spacing\\"]",
        },
        "marginX" => Set {
          "sm",
          "md",
        },
        "colorPalette" => Set {
          "current",
          "black",
          "white",
          "transparent",
          "rose",
          "pink",
          "fuchsia",
          "purple",
          "violet",
          "indigo",
          "blue",
          "sky",
          "cyan",
          "teal",
          "emerald",
          "green",
          "lime",
          "yellow",
          "amber",
          "orange",
          "red",
          "neutral",
          "stone",
          "zinc",
          "gray",
          "slate",
          "deep",
          "deep.test",
          "deep.test.pool",
          "primary",
          "secondary",
          "complex",
          "surface",
          "button",
          "button.card",
        },
      }
    `)

    expect(utility.classNames).toMatchInlineSnapshot(`
      Map {
        "(backgroundColor = current)" => "bg_current",
        "(backgroundColor = black)" => "bg_black",
        "(backgroundColor = white)" => "bg_white",
        "(backgroundColor = transparent)" => "bg_transparent",
        "(backgroundColor = rose.50)" => "bg_rose.50",
        "(backgroundColor = rose.100)" => "bg_rose.100",
        "(backgroundColor = rose.200)" => "bg_rose.200",
        "(backgroundColor = rose.300)" => "bg_rose.300",
        "(backgroundColor = rose.400)" => "bg_rose.400",
        "(backgroundColor = rose.500)" => "bg_rose.500",
        "(backgroundColor = rose.600)" => "bg_rose.600",
        "(backgroundColor = rose.700)" => "bg_rose.700",
        "(backgroundColor = rose.800)" => "bg_rose.800",
        "(backgroundColor = rose.900)" => "bg_rose.900",
        "(backgroundColor = rose.950)" => "bg_rose.950",
        "(backgroundColor = pink.50)" => "bg_pink.50",
        "(backgroundColor = pink.100)" => "bg_pink.100",
        "(backgroundColor = pink.200)" => "bg_pink.200",
        "(backgroundColor = pink.300)" => "bg_pink.300",
        "(backgroundColor = pink.400)" => "bg_pink.400",
        "(backgroundColor = pink.500)" => "bg_pink.500",
        "(backgroundColor = pink.600)" => "bg_pink.600",
        "(backgroundColor = pink.700)" => "bg_pink.700",
        "(backgroundColor = pink.800)" => "bg_pink.800",
        "(backgroundColor = pink.900)" => "bg_pink.900",
        "(backgroundColor = pink.950)" => "bg_pink.950",
        "(backgroundColor = fuchsia.50)" => "bg_fuchsia.50",
        "(backgroundColor = fuchsia.100)" => "bg_fuchsia.100",
        "(backgroundColor = fuchsia.200)" => "bg_fuchsia.200",
        "(backgroundColor = fuchsia.300)" => "bg_fuchsia.300",
        "(backgroundColor = fuchsia.400)" => "bg_fuchsia.400",
        "(backgroundColor = fuchsia.500)" => "bg_fuchsia.500",
        "(backgroundColor = fuchsia.600)" => "bg_fuchsia.600",
        "(backgroundColor = fuchsia.700)" => "bg_fuchsia.700",
        "(backgroundColor = fuchsia.800)" => "bg_fuchsia.800",
        "(backgroundColor = fuchsia.900)" => "bg_fuchsia.900",
        "(backgroundColor = fuchsia.950)" => "bg_fuchsia.950",
        "(backgroundColor = purple.50)" => "bg_purple.50",
        "(backgroundColor = purple.100)" => "bg_purple.100",
        "(backgroundColor = purple.200)" => "bg_purple.200",
        "(backgroundColor = purple.300)" => "bg_purple.300",
        "(backgroundColor = purple.400)" => "bg_purple.400",
        "(backgroundColor = purple.500)" => "bg_purple.500",
        "(backgroundColor = purple.600)" => "bg_purple.600",
        "(backgroundColor = purple.700)" => "bg_purple.700",
        "(backgroundColor = purple.800)" => "bg_purple.800",
        "(backgroundColor = purple.900)" => "bg_purple.900",
        "(backgroundColor = purple.950)" => "bg_purple.950",
        "(backgroundColor = violet.50)" => "bg_violet.50",
        "(backgroundColor = violet.100)" => "bg_violet.100",
        "(backgroundColor = violet.200)" => "bg_violet.200",
        "(backgroundColor = violet.300)" => "bg_violet.300",
        "(backgroundColor = violet.400)" => "bg_violet.400",
        "(backgroundColor = violet.500)" => "bg_violet.500",
        "(backgroundColor = violet.600)" => "bg_violet.600",
        "(backgroundColor = violet.700)" => "bg_violet.700",
        "(backgroundColor = violet.800)" => "bg_violet.800",
        "(backgroundColor = violet.900)" => "bg_violet.900",
        "(backgroundColor = violet.950)" => "bg_violet.950",
        "(backgroundColor = indigo.50)" => "bg_indigo.50",
        "(backgroundColor = indigo.100)" => "bg_indigo.100",
        "(backgroundColor = indigo.200)" => "bg_indigo.200",
        "(backgroundColor = indigo.300)" => "bg_indigo.300",
        "(backgroundColor = indigo.400)" => "bg_indigo.400",
        "(backgroundColor = indigo.500)" => "bg_indigo.500",
        "(backgroundColor = indigo.600)" => "bg_indigo.600",
        "(backgroundColor = indigo.700)" => "bg_indigo.700",
        "(backgroundColor = indigo.800)" => "bg_indigo.800",
        "(backgroundColor = indigo.900)" => "bg_indigo.900",
        "(backgroundColor = indigo.950)" => "bg_indigo.950",
        "(backgroundColor = blue.50)" => "bg_blue.50",
        "(backgroundColor = blue.100)" => "bg_blue.100",
        "(backgroundColor = blue.200)" => "bg_blue.200",
        "(backgroundColor = blue.300)" => "bg_blue.300",
        "(backgroundColor = blue.400)" => "bg_blue.400",
        "(backgroundColor = blue.500)" => "bg_blue.500",
        "(backgroundColor = blue.600)" => "bg_blue.600",
        "(backgroundColor = blue.700)" => "bg_blue.700",
        "(backgroundColor = blue.800)" => "bg_blue.800",
        "(backgroundColor = blue.900)" => "bg_blue.900",
        "(backgroundColor = blue.950)" => "bg_blue.950",
        "(backgroundColor = sky.50)" => "bg_sky.50",
        "(backgroundColor = sky.100)" => "bg_sky.100",
        "(backgroundColor = sky.200)" => "bg_sky.200",
        "(backgroundColor = sky.300)" => "bg_sky.300",
        "(backgroundColor = sky.400)" => "bg_sky.400",
        "(backgroundColor = sky.500)" => "bg_sky.500",
        "(backgroundColor = sky.600)" => "bg_sky.600",
        "(backgroundColor = sky.700)" => "bg_sky.700",
        "(backgroundColor = sky.800)" => "bg_sky.800",
        "(backgroundColor = sky.900)" => "bg_sky.900",
        "(backgroundColor = sky.950)" => "bg_sky.950",
        "(backgroundColor = cyan.50)" => "bg_cyan.50",
        "(backgroundColor = cyan.100)" => "bg_cyan.100",
        "(backgroundColor = cyan.200)" => "bg_cyan.200",
        "(backgroundColor = cyan.300)" => "bg_cyan.300",
        "(backgroundColor = cyan.400)" => "bg_cyan.400",
        "(backgroundColor = cyan.500)" => "bg_cyan.500",
        "(backgroundColor = cyan.600)" => "bg_cyan.600",
        "(backgroundColor = cyan.700)" => "bg_cyan.700",
        "(backgroundColor = cyan.800)" => "bg_cyan.800",
        "(backgroundColor = cyan.900)" => "bg_cyan.900",
        "(backgroundColor = cyan.950)" => "bg_cyan.950",
        "(backgroundColor = teal.50)" => "bg_teal.50",
        "(backgroundColor = teal.100)" => "bg_teal.100",
        "(backgroundColor = teal.200)" => "bg_teal.200",
        "(backgroundColor = teal.300)" => "bg_teal.300",
        "(backgroundColor = teal.400)" => "bg_teal.400",
        "(backgroundColor = teal.500)" => "bg_teal.500",
        "(backgroundColor = teal.600)" => "bg_teal.600",
        "(backgroundColor = teal.700)" => "bg_teal.700",
        "(backgroundColor = teal.800)" => "bg_teal.800",
        "(backgroundColor = teal.900)" => "bg_teal.900",
        "(backgroundColor = teal.950)" => "bg_teal.950",
        "(backgroundColor = emerald.50)" => "bg_emerald.50",
        "(backgroundColor = emerald.100)" => "bg_emerald.100",
        "(backgroundColor = emerald.200)" => "bg_emerald.200",
        "(backgroundColor = emerald.300)" => "bg_emerald.300",
        "(backgroundColor = emerald.400)" => "bg_emerald.400",
        "(backgroundColor = emerald.500)" => "bg_emerald.500",
        "(backgroundColor = emerald.600)" => "bg_emerald.600",
        "(backgroundColor = emerald.700)" => "bg_emerald.700",
        "(backgroundColor = emerald.800)" => "bg_emerald.800",
        "(backgroundColor = emerald.900)" => "bg_emerald.900",
        "(backgroundColor = emerald.950)" => "bg_emerald.950",
        "(backgroundColor = green.50)" => "bg_green.50",
        "(backgroundColor = green.100)" => "bg_green.100",
        "(backgroundColor = green.200)" => "bg_green.200",
        "(backgroundColor = green.300)" => "bg_green.300",
        "(backgroundColor = green.400)" => "bg_green.400",
        "(backgroundColor = green.500)" => "bg_green.500",
        "(backgroundColor = green.600)" => "bg_green.600",
        "(backgroundColor = green.700)" => "bg_green.700",
        "(backgroundColor = green.800)" => "bg_green.800",
        "(backgroundColor = green.900)" => "bg_green.900",
        "(backgroundColor = green.950)" => "bg_green.950",
        "(backgroundColor = lime.50)" => "bg_lime.50",
        "(backgroundColor = lime.100)" => "bg_lime.100",
        "(backgroundColor = lime.200)" => "bg_lime.200",
        "(backgroundColor = lime.300)" => "bg_lime.300",
        "(backgroundColor = lime.400)" => "bg_lime.400",
        "(backgroundColor = lime.500)" => "bg_lime.500",
        "(backgroundColor = lime.600)" => "bg_lime.600",
        "(backgroundColor = lime.700)" => "bg_lime.700",
        "(backgroundColor = lime.800)" => "bg_lime.800",
        "(backgroundColor = lime.900)" => "bg_lime.900",
        "(backgroundColor = lime.950)" => "bg_lime.950",
        "(backgroundColor = yellow.50)" => "bg_yellow.50",
        "(backgroundColor = yellow.100)" => "bg_yellow.100",
        "(backgroundColor = yellow.200)" => "bg_yellow.200",
        "(backgroundColor = yellow.300)" => "bg_yellow.300",
        "(backgroundColor = yellow.400)" => "bg_yellow.400",
        "(backgroundColor = yellow.500)" => "bg_yellow.500",
        "(backgroundColor = yellow.600)" => "bg_yellow.600",
        "(backgroundColor = yellow.700)" => "bg_yellow.700",
        "(backgroundColor = yellow.800)" => "bg_yellow.800",
        "(backgroundColor = yellow.900)" => "bg_yellow.900",
        "(backgroundColor = yellow.950)" => "bg_yellow.950",
        "(backgroundColor = amber.50)" => "bg_amber.50",
        "(backgroundColor = amber.100)" => "bg_amber.100",
        "(backgroundColor = amber.200)" => "bg_amber.200",
        "(backgroundColor = amber.300)" => "bg_amber.300",
        "(backgroundColor = amber.400)" => "bg_amber.400",
        "(backgroundColor = amber.500)" => "bg_amber.500",
        "(backgroundColor = amber.600)" => "bg_amber.600",
        "(backgroundColor = amber.700)" => "bg_amber.700",
        "(backgroundColor = amber.800)" => "bg_amber.800",
        "(backgroundColor = amber.900)" => "bg_amber.900",
        "(backgroundColor = amber.950)" => "bg_amber.950",
        "(backgroundColor = orange.50)" => "bg_orange.50",
        "(backgroundColor = orange.100)" => "bg_orange.100",
        "(backgroundColor = orange.200)" => "bg_orange.200",
        "(backgroundColor = orange.300)" => "bg_orange.300",
        "(backgroundColor = orange.400)" => "bg_orange.400",
        "(backgroundColor = orange.500)" => "bg_orange.500",
        "(backgroundColor = orange.600)" => "bg_orange.600",
        "(backgroundColor = orange.700)" => "bg_orange.700",
        "(backgroundColor = orange.800)" => "bg_orange.800",
        "(backgroundColor = orange.900)" => "bg_orange.900",
        "(backgroundColor = orange.950)" => "bg_orange.950",
        "(backgroundColor = red.50)" => "bg_red.50",
        "(backgroundColor = red.100)" => "bg_red.100",
        "(backgroundColor = red.200)" => "bg_red.200",
        "(backgroundColor = red.300)" => "bg_red.300",
        "(backgroundColor = red.400)" => "bg_red.400",
        "(backgroundColor = red.500)" => "bg_red.500",
        "(backgroundColor = red.600)" => "bg_red.600",
        "(backgroundColor = red.700)" => "bg_red.700",
        "(backgroundColor = red.800)" => "bg_red.800",
        "(backgroundColor = red.900)" => "bg_red.900",
        "(backgroundColor = red.950)" => "bg_red.950",
        "(backgroundColor = neutral.50)" => "bg_neutral.50",
        "(backgroundColor = neutral.100)" => "bg_neutral.100",
        "(backgroundColor = neutral.200)" => "bg_neutral.200",
        "(backgroundColor = neutral.300)" => "bg_neutral.300",
        "(backgroundColor = neutral.400)" => "bg_neutral.400",
        "(backgroundColor = neutral.500)" => "bg_neutral.500",
        "(backgroundColor = neutral.600)" => "bg_neutral.600",
        "(backgroundColor = neutral.700)" => "bg_neutral.700",
        "(backgroundColor = neutral.800)" => "bg_neutral.800",
        "(backgroundColor = neutral.900)" => "bg_neutral.900",
        "(backgroundColor = neutral.950)" => "bg_neutral.950",
        "(backgroundColor = stone.50)" => "bg_stone.50",
        "(backgroundColor = stone.100)" => "bg_stone.100",
        "(backgroundColor = stone.200)" => "bg_stone.200",
        "(backgroundColor = stone.300)" => "bg_stone.300",
        "(backgroundColor = stone.400)" => "bg_stone.400",
        "(backgroundColor = stone.500)" => "bg_stone.500",
        "(backgroundColor = stone.600)" => "bg_stone.600",
        "(backgroundColor = stone.700)" => "bg_stone.700",
        "(backgroundColor = stone.800)" => "bg_stone.800",
        "(backgroundColor = stone.900)" => "bg_stone.900",
        "(backgroundColor = stone.950)" => "bg_stone.950",
        "(backgroundColor = zinc.50)" => "bg_zinc.50",
        "(backgroundColor = zinc.100)" => "bg_zinc.100",
        "(backgroundColor = zinc.200)" => "bg_zinc.200",
        "(backgroundColor = zinc.300)" => "bg_zinc.300",
        "(backgroundColor = zinc.400)" => "bg_zinc.400",
        "(backgroundColor = zinc.500)" => "bg_zinc.500",
        "(backgroundColor = zinc.600)" => "bg_zinc.600",
        "(backgroundColor = zinc.700)" => "bg_zinc.700",
        "(backgroundColor = zinc.800)" => "bg_zinc.800",
        "(backgroundColor = zinc.900)" => "bg_zinc.900",
        "(backgroundColor = zinc.950)" => "bg_zinc.950",
        "(backgroundColor = gray.50)" => "bg_gray.50",
        "(backgroundColor = gray.100)" => "bg_gray.100",
        "(backgroundColor = gray.200)" => "bg_gray.200",
        "(backgroundColor = gray.300)" => "bg_gray.300",
        "(backgroundColor = gray.400)" => "bg_gray.400",
        "(backgroundColor = gray.500)" => "bg_gray.500",
        "(backgroundColor = gray.600)" => "bg_gray.600",
        "(backgroundColor = gray.700)" => "bg_gray.700",
        "(backgroundColor = gray.800)" => "bg_gray.800",
        "(backgroundColor = gray.900)" => "bg_gray.900",
        "(backgroundColor = gray.950)" => "bg_gray.950",
        "(backgroundColor = slate.50)" => "bg_slate.50",
        "(backgroundColor = slate.100)" => "bg_slate.100",
        "(backgroundColor = slate.200)" => "bg_slate.200",
        "(backgroundColor = slate.300)" => "bg_slate.300",
        "(backgroundColor = slate.400)" => "bg_slate.400",
        "(backgroundColor = slate.500)" => "bg_slate.500",
        "(backgroundColor = slate.600)" => "bg_slate.600",
        "(backgroundColor = slate.700)" => "bg_slate.700",
        "(backgroundColor = slate.800)" => "bg_slate.800",
        "(backgroundColor = slate.900)" => "bg_slate.900",
        "(backgroundColor = slate.950)" => "bg_slate.950",
        "(backgroundColor = deep.test.yam)" => "bg_deep.test.yam",
        "(backgroundColor = deep.test.pool.poller)" => "bg_deep.test.pool.poller",
        "(backgroundColor = deep.test.pool.tall)" => "bg_deep.test.pool.tall",
        "(backgroundColor = primary)" => "bg_primary",
        "(backgroundColor = secondary)" => "bg_secondary",
        "(backgroundColor = complex)" => "bg_complex",
        "(backgroundColor = surface)" => "bg_surface",
        "(backgroundColor = button.thick)" => "bg_button.thick",
        "(backgroundColor = button.card.body)" => "bg_button.card.body",
        "(backgroundColor = button.card.heading)" => "bg_button.card.heading",
        "(backgroundColor = colorPalette)" => "bg_colorPalette",
        "(backgroundColor = colorPalette.50)" => "bg_colorPalette.50",
        "(backgroundColor = colorPalette.100)" => "bg_colorPalette.100",
        "(backgroundColor = colorPalette.200)" => "bg_colorPalette.200",
        "(backgroundColor = colorPalette.300)" => "bg_colorPalette.300",
        "(backgroundColor = colorPalette.400)" => "bg_colorPalette.400",
        "(backgroundColor = colorPalette.500)" => "bg_colorPalette.500",
        "(backgroundColor = colorPalette.600)" => "bg_colorPalette.600",
        "(backgroundColor = colorPalette.700)" => "bg_colorPalette.700",
        "(backgroundColor = colorPalette.800)" => "bg_colorPalette.800",
        "(backgroundColor = colorPalette.900)" => "bg_colorPalette.900",
        "(backgroundColor = colorPalette.950)" => "bg_colorPalette.950",
        "(backgroundColor = colorPalette.test.yam)" => "bg_colorPalette.test.yam",
        "(backgroundColor = colorPalette.yam)" => "bg_colorPalette.yam",
        "(backgroundColor = colorPalette.test.pool.poller)" => "bg_colorPalette.test.pool.poller",
        "(backgroundColor = colorPalette.pool.poller)" => "bg_colorPalette.pool.poller",
        "(backgroundColor = colorPalette.poller)" => "bg_colorPalette.poller",
        "(backgroundColor = colorPalette.test.pool.tall)" => "bg_colorPalette.test.pool.tall",
        "(backgroundColor = colorPalette.pool.tall)" => "bg_colorPalette.pool.tall",
        "(backgroundColor = colorPalette.tall)" => "bg_colorPalette.tall",
        "(backgroundColor = colorPalette.thick)" => "bg_colorPalette.thick",
        "(backgroundColor = colorPalette.card.body)" => "bg_colorPalette.card.body",
        "(backgroundColor = colorPalette.body)" => "bg_colorPalette.body",
        "(backgroundColor = colorPalette.card.heading)" => "bg_colorPalette.card.heading",
        "(backgroundColor = colorPalette.heading)" => "bg_colorPalette.heading",
        "(display = flex)" => "d_flex",
        "(display = inline-flex)" => "d_inline-flex",
        "(margin = 0)" => "m_0",
        "(margin = 1)" => "m_1",
        "(margin = 2)" => "m_2",
        "(margin = 3)" => "m_3",
        "(margin = 4)" => "m_4",
        "(margin = 5)" => "m_5",
        "(margin = 6)" => "m_6",
        "(margin = 7)" => "m_7",
        "(margin = 8)" => "m_8",
        "(margin = 9)" => "m_9",
        "(margin = 10)" => "m_10",
        "(margin = 11)" => "m_11",
        "(margin = 12)" => "m_12",
        "(margin = 14)" => "m_14",
        "(margin = 16)" => "m_16",
        "(margin = 20)" => "m_20",
        "(margin = 24)" => "m_24",
        "(margin = 28)" => "m_28",
        "(margin = 32)" => "m_32",
        "(margin = 36)" => "m_36",
        "(margin = 40)" => "m_40",
        "(margin = 44)" => "m_44",
        "(margin = 48)" => "m_48",
        "(margin = 52)" => "m_52",
        "(margin = 56)" => "m_56",
        "(margin = 60)" => "m_60",
        "(margin = 64)" => "m_64",
        "(margin = 72)" => "m_72",
        "(margin = 80)" => "m_80",
        "(margin = 96)" => "m_96",
        "(margin = 0.5)" => "m_0.5",
        "(margin = 1.5)" => "m_1.5",
        "(margin = 2.5)" => "m_2.5",
        "(margin = 3.5)" => "m_3.5",
        "(margin = gutter)" => "m_gutter",
        "(margin = -1)" => "m_-1",
        "(margin = -2)" => "m_-2",
        "(margin = -3)" => "m_-3",
        "(margin = -4)" => "m_-4",
        "(margin = -5)" => "m_-5",
        "(margin = -6)" => "m_-6",
        "(margin = -7)" => "m_-7",
        "(margin = -8)" => "m_-8",
        "(margin = -9)" => "m_-9",
        "(margin = -10)" => "m_-10",
        "(margin = -11)" => "m_-11",
        "(margin = -12)" => "m_-12",
        "(margin = -14)" => "m_-14",
        "(margin = -16)" => "m_-16",
        "(margin = -20)" => "m_-20",
        "(margin = -24)" => "m_-24",
        "(margin = -28)" => "m_-28",
        "(margin = -32)" => "m_-32",
        "(margin = -36)" => "m_-36",
        "(margin = -40)" => "m_-40",
        "(margin = -44)" => "m_-44",
        "(margin = -48)" => "m_-48",
        "(margin = -52)" => "m_-52",
        "(margin = -56)" => "m_-56",
        "(margin = -60)" => "m_-60",
        "(margin = -64)" => "m_-64",
        "(margin = -72)" => "m_-72",
        "(margin = -80)" => "m_-80",
        "(margin = -96)" => "m_-96",
        "(margin = -0.5)" => "m_-0.5",
        "(margin = -1.5)" => "m_-1.5",
        "(margin = -2.5)" => "m_-2.5",
        "(margin = -3.5)" => "m_-3.5",
        "(margin = -gutter)" => "m_-gutter",
        "(marginX = sm)" => "mx_sm",
        "(marginX = md)" => "mx_md",
        "(colorPalette = current)" => "color-palette_current",
        "(colorPalette = black)" => "color-palette_black",
        "(colorPalette = white)" => "color-palette_white",
        "(colorPalette = transparent)" => "color-palette_transparent",
        "(colorPalette = rose)" => "color-palette_rose",
        "(colorPalette = pink)" => "color-palette_pink",
        "(colorPalette = fuchsia)" => "color-palette_fuchsia",
        "(colorPalette = purple)" => "color-palette_purple",
        "(colorPalette = violet)" => "color-palette_violet",
        "(colorPalette = indigo)" => "color-palette_indigo",
        "(colorPalette = blue)" => "color-palette_blue",
        "(colorPalette = sky)" => "color-palette_sky",
        "(colorPalette = cyan)" => "color-palette_cyan",
        "(colorPalette = teal)" => "color-palette_teal",
        "(colorPalette = emerald)" => "color-palette_emerald",
        "(colorPalette = green)" => "color-palette_green",
        "(colorPalette = lime)" => "color-palette_lime",
        "(colorPalette = yellow)" => "color-palette_yellow",
        "(colorPalette = amber)" => "color-palette_amber",
        "(colorPalette = orange)" => "color-palette_orange",
        "(colorPalette = red)" => "color-palette_red",
        "(colorPalette = neutral)" => "color-palette_neutral",
        "(colorPalette = stone)" => "color-palette_stone",
        "(colorPalette = zinc)" => "color-palette_zinc",
        "(colorPalette = gray)" => "color-palette_gray",
        "(colorPalette = slate)" => "color-palette_slate",
        "(colorPalette = deep)" => "color-palette_deep",
        "(colorPalette = deep.test)" => "color-palette_deep.test",
        "(colorPalette = deep.test.pool)" => "color-palette_deep.test.pool",
        "(colorPalette = primary)" => "color-palette_primary",
        "(colorPalette = secondary)" => "color-palette_secondary",
        "(colorPalette = complex)" => "color-palette_complex",
        "(colorPalette = surface)" => "color-palette_surface",
        "(colorPalette = button)" => "color-palette_button",
        "(colorPalette = button.card)" => "color-palette_button.card",
      }
    `)

    expect(utility.styles).toMatchInlineSnapshot(`
      Map {
        "(backgroundColor = current)" => {
          "backgroundColor": "var(--colors-current)",
        },
        "(backgroundColor = black)" => {
          "backgroundColor": "var(--colors-black)",
        },
        "(backgroundColor = white)" => {
          "backgroundColor": "var(--colors-white)",
        },
        "(backgroundColor = transparent)" => {
          "backgroundColor": "var(--colors-transparent)",
        },
        "(backgroundColor = rose.50)" => {
          "backgroundColor": "var(--colors-rose-50)",
        },
        "(backgroundColor = rose.100)" => {
          "backgroundColor": "var(--colors-rose-100)",
        },
        "(backgroundColor = rose.200)" => {
          "backgroundColor": "var(--colors-rose-200)",
        },
        "(backgroundColor = rose.300)" => {
          "backgroundColor": "var(--colors-rose-300)",
        },
        "(backgroundColor = rose.400)" => {
          "backgroundColor": "var(--colors-rose-400)",
        },
        "(backgroundColor = rose.500)" => {
          "backgroundColor": "var(--colors-rose-500)",
        },
        "(backgroundColor = rose.600)" => {
          "backgroundColor": "var(--colors-rose-600)",
        },
        "(backgroundColor = rose.700)" => {
          "backgroundColor": "var(--colors-rose-700)",
        },
        "(backgroundColor = rose.800)" => {
          "backgroundColor": "var(--colors-rose-800)",
        },
        "(backgroundColor = rose.900)" => {
          "backgroundColor": "var(--colors-rose-900)",
        },
        "(backgroundColor = rose.950)" => {
          "backgroundColor": "var(--colors-rose-950)",
        },
        "(backgroundColor = pink.50)" => {
          "backgroundColor": "var(--colors-pink-50)",
        },
        "(backgroundColor = pink.100)" => {
          "backgroundColor": "var(--colors-pink-100)",
        },
        "(backgroundColor = pink.200)" => {
          "backgroundColor": "var(--colors-pink-200)",
        },
        "(backgroundColor = pink.300)" => {
          "backgroundColor": "var(--colors-pink-300)",
        },
        "(backgroundColor = pink.400)" => {
          "backgroundColor": "var(--colors-pink-400)",
        },
        "(backgroundColor = pink.500)" => {
          "backgroundColor": "var(--colors-pink-500)",
        },
        "(backgroundColor = pink.600)" => {
          "backgroundColor": "var(--colors-pink-600)",
        },
        "(backgroundColor = pink.700)" => {
          "backgroundColor": "var(--colors-pink-700)",
        },
        "(backgroundColor = pink.800)" => {
          "backgroundColor": "var(--colors-pink-800)",
        },
        "(backgroundColor = pink.900)" => {
          "backgroundColor": "var(--colors-pink-900)",
        },
        "(backgroundColor = pink.950)" => {
          "backgroundColor": "var(--colors-pink-950)",
        },
        "(backgroundColor = fuchsia.50)" => {
          "backgroundColor": "var(--colors-fuchsia-50)",
        },
        "(backgroundColor = fuchsia.100)" => {
          "backgroundColor": "var(--colors-fuchsia-100)",
        },
        "(backgroundColor = fuchsia.200)" => {
          "backgroundColor": "var(--colors-fuchsia-200)",
        },
        "(backgroundColor = fuchsia.300)" => {
          "backgroundColor": "var(--colors-fuchsia-300)",
        },
        "(backgroundColor = fuchsia.400)" => {
          "backgroundColor": "var(--colors-fuchsia-400)",
        },
        "(backgroundColor = fuchsia.500)" => {
          "backgroundColor": "var(--colors-fuchsia-500)",
        },
        "(backgroundColor = fuchsia.600)" => {
          "backgroundColor": "var(--colors-fuchsia-600)",
        },
        "(backgroundColor = fuchsia.700)" => {
          "backgroundColor": "var(--colors-fuchsia-700)",
        },
        "(backgroundColor = fuchsia.800)" => {
          "backgroundColor": "var(--colors-fuchsia-800)",
        },
        "(backgroundColor = fuchsia.900)" => {
          "backgroundColor": "var(--colors-fuchsia-900)",
        },
        "(backgroundColor = fuchsia.950)" => {
          "backgroundColor": "var(--colors-fuchsia-950)",
        },
        "(backgroundColor = purple.50)" => {
          "backgroundColor": "var(--colors-purple-50)",
        },
        "(backgroundColor = purple.100)" => {
          "backgroundColor": "var(--colors-purple-100)",
        },
        "(backgroundColor = purple.200)" => {
          "backgroundColor": "var(--colors-purple-200)",
        },
        "(backgroundColor = purple.300)" => {
          "backgroundColor": "var(--colors-purple-300)",
        },
        "(backgroundColor = purple.400)" => {
          "backgroundColor": "var(--colors-purple-400)",
        },
        "(backgroundColor = purple.500)" => {
          "backgroundColor": "var(--colors-purple-500)",
        },
        "(backgroundColor = purple.600)" => {
          "backgroundColor": "var(--colors-purple-600)",
        },
        "(backgroundColor = purple.700)" => {
          "backgroundColor": "var(--colors-purple-700)",
        },
        "(backgroundColor = purple.800)" => {
          "backgroundColor": "var(--colors-purple-800)",
        },
        "(backgroundColor = purple.900)" => {
          "backgroundColor": "var(--colors-purple-900)",
        },
        "(backgroundColor = purple.950)" => {
          "backgroundColor": "var(--colors-purple-950)",
        },
        "(backgroundColor = violet.50)" => {
          "backgroundColor": "var(--colors-violet-50)",
        },
        "(backgroundColor = violet.100)" => {
          "backgroundColor": "var(--colors-violet-100)",
        },
        "(backgroundColor = violet.200)" => {
          "backgroundColor": "var(--colors-violet-200)",
        },
        "(backgroundColor = violet.300)" => {
          "backgroundColor": "var(--colors-violet-300)",
        },
        "(backgroundColor = violet.400)" => {
          "backgroundColor": "var(--colors-violet-400)",
        },
        "(backgroundColor = violet.500)" => {
          "backgroundColor": "var(--colors-violet-500)",
        },
        "(backgroundColor = violet.600)" => {
          "backgroundColor": "var(--colors-violet-600)",
        },
        "(backgroundColor = violet.700)" => {
          "backgroundColor": "var(--colors-violet-700)",
        },
        "(backgroundColor = violet.800)" => {
          "backgroundColor": "var(--colors-violet-800)",
        },
        "(backgroundColor = violet.900)" => {
          "backgroundColor": "var(--colors-violet-900)",
        },
        "(backgroundColor = violet.950)" => {
          "backgroundColor": "var(--colors-violet-950)",
        },
        "(backgroundColor = indigo.50)" => {
          "backgroundColor": "var(--colors-indigo-50)",
        },
        "(backgroundColor = indigo.100)" => {
          "backgroundColor": "var(--colors-indigo-100)",
        },
        "(backgroundColor = indigo.200)" => {
          "backgroundColor": "var(--colors-indigo-200)",
        },
        "(backgroundColor = indigo.300)" => {
          "backgroundColor": "var(--colors-indigo-300)",
        },
        "(backgroundColor = indigo.400)" => {
          "backgroundColor": "var(--colors-indigo-400)",
        },
        "(backgroundColor = indigo.500)" => {
          "backgroundColor": "var(--colors-indigo-500)",
        },
        "(backgroundColor = indigo.600)" => {
          "backgroundColor": "var(--colors-indigo-600)",
        },
        "(backgroundColor = indigo.700)" => {
          "backgroundColor": "var(--colors-indigo-700)",
        },
        "(backgroundColor = indigo.800)" => {
          "backgroundColor": "var(--colors-indigo-800)",
        },
        "(backgroundColor = indigo.900)" => {
          "backgroundColor": "var(--colors-indigo-900)",
        },
        "(backgroundColor = indigo.950)" => {
          "backgroundColor": "var(--colors-indigo-950)",
        },
        "(backgroundColor = blue.50)" => {
          "backgroundColor": "var(--colors-blue-50)",
        },
        "(backgroundColor = blue.100)" => {
          "backgroundColor": "var(--colors-blue-100)",
        },
        "(backgroundColor = blue.200)" => {
          "backgroundColor": "var(--colors-blue-200)",
        },
        "(backgroundColor = blue.300)" => {
          "backgroundColor": "var(--colors-blue-300)",
        },
        "(backgroundColor = blue.400)" => {
          "backgroundColor": "var(--colors-blue-400)",
        },
        "(backgroundColor = blue.500)" => {
          "backgroundColor": "var(--colors-blue-500)",
        },
        "(backgroundColor = blue.600)" => {
          "backgroundColor": "var(--colors-blue-600)",
        },
        "(backgroundColor = blue.700)" => {
          "backgroundColor": "var(--colors-blue-700)",
        },
        "(backgroundColor = blue.800)" => {
          "backgroundColor": "var(--colors-blue-800)",
        },
        "(backgroundColor = blue.900)" => {
          "backgroundColor": "var(--colors-blue-900)",
        },
        "(backgroundColor = blue.950)" => {
          "backgroundColor": "var(--colors-blue-950)",
        },
        "(backgroundColor = sky.50)" => {
          "backgroundColor": "var(--colors-sky-50)",
        },
        "(backgroundColor = sky.100)" => {
          "backgroundColor": "var(--colors-sky-100)",
        },
        "(backgroundColor = sky.200)" => {
          "backgroundColor": "var(--colors-sky-200)",
        },
        "(backgroundColor = sky.300)" => {
          "backgroundColor": "var(--colors-sky-300)",
        },
        "(backgroundColor = sky.400)" => {
          "backgroundColor": "var(--colors-sky-400)",
        },
        "(backgroundColor = sky.500)" => {
          "backgroundColor": "var(--colors-sky-500)",
        },
        "(backgroundColor = sky.600)" => {
          "backgroundColor": "var(--colors-sky-600)",
        },
        "(backgroundColor = sky.700)" => {
          "backgroundColor": "var(--colors-sky-700)",
        },
        "(backgroundColor = sky.800)" => {
          "backgroundColor": "var(--colors-sky-800)",
        },
        "(backgroundColor = sky.900)" => {
          "backgroundColor": "var(--colors-sky-900)",
        },
        "(backgroundColor = sky.950)" => {
          "backgroundColor": "var(--colors-sky-950)",
        },
        "(backgroundColor = cyan.50)" => {
          "backgroundColor": "var(--colors-cyan-50)",
        },
        "(backgroundColor = cyan.100)" => {
          "backgroundColor": "var(--colors-cyan-100)",
        },
        "(backgroundColor = cyan.200)" => {
          "backgroundColor": "var(--colors-cyan-200)",
        },
        "(backgroundColor = cyan.300)" => {
          "backgroundColor": "var(--colors-cyan-300)",
        },
        "(backgroundColor = cyan.400)" => {
          "backgroundColor": "var(--colors-cyan-400)",
        },
        "(backgroundColor = cyan.500)" => {
          "backgroundColor": "var(--colors-cyan-500)",
        },
        "(backgroundColor = cyan.600)" => {
          "backgroundColor": "var(--colors-cyan-600)",
        },
        "(backgroundColor = cyan.700)" => {
          "backgroundColor": "var(--colors-cyan-700)",
        },
        "(backgroundColor = cyan.800)" => {
          "backgroundColor": "var(--colors-cyan-800)",
        },
        "(backgroundColor = cyan.900)" => {
          "backgroundColor": "var(--colors-cyan-900)",
        },
        "(backgroundColor = cyan.950)" => {
          "backgroundColor": "var(--colors-cyan-950)",
        },
        "(backgroundColor = teal.50)" => {
          "backgroundColor": "var(--colors-teal-50)",
        },
        "(backgroundColor = teal.100)" => {
          "backgroundColor": "var(--colors-teal-100)",
        },
        "(backgroundColor = teal.200)" => {
          "backgroundColor": "var(--colors-teal-200)",
        },
        "(backgroundColor = teal.300)" => {
          "backgroundColor": "var(--colors-teal-300)",
        },
        "(backgroundColor = teal.400)" => {
          "backgroundColor": "var(--colors-teal-400)",
        },
        "(backgroundColor = teal.500)" => {
          "backgroundColor": "var(--colors-teal-500)",
        },
        "(backgroundColor = teal.600)" => {
          "backgroundColor": "var(--colors-teal-600)",
        },
        "(backgroundColor = teal.700)" => {
          "backgroundColor": "var(--colors-teal-700)",
        },
        "(backgroundColor = teal.800)" => {
          "backgroundColor": "var(--colors-teal-800)",
        },
        "(backgroundColor = teal.900)" => {
          "backgroundColor": "var(--colors-teal-900)",
        },
        "(backgroundColor = teal.950)" => {
          "backgroundColor": "var(--colors-teal-950)",
        },
        "(backgroundColor = emerald.50)" => {
          "backgroundColor": "var(--colors-emerald-50)",
        },
        "(backgroundColor = emerald.100)" => {
          "backgroundColor": "var(--colors-emerald-100)",
        },
        "(backgroundColor = emerald.200)" => {
          "backgroundColor": "var(--colors-emerald-200)",
        },
        "(backgroundColor = emerald.300)" => {
          "backgroundColor": "var(--colors-emerald-300)",
        },
        "(backgroundColor = emerald.400)" => {
          "backgroundColor": "var(--colors-emerald-400)",
        },
        "(backgroundColor = emerald.500)" => {
          "backgroundColor": "var(--colors-emerald-500)",
        },
        "(backgroundColor = emerald.600)" => {
          "backgroundColor": "var(--colors-emerald-600)",
        },
        "(backgroundColor = emerald.700)" => {
          "backgroundColor": "var(--colors-emerald-700)",
        },
        "(backgroundColor = emerald.800)" => {
          "backgroundColor": "var(--colors-emerald-800)",
        },
        "(backgroundColor = emerald.900)" => {
          "backgroundColor": "var(--colors-emerald-900)",
        },
        "(backgroundColor = emerald.950)" => {
          "backgroundColor": "var(--colors-emerald-950)",
        },
        "(backgroundColor = green.50)" => {
          "backgroundColor": "var(--colors-green-50)",
        },
        "(backgroundColor = green.100)" => {
          "backgroundColor": "var(--colors-green-100)",
        },
        "(backgroundColor = green.200)" => {
          "backgroundColor": "var(--colors-green-200)",
        },
        "(backgroundColor = green.300)" => {
          "backgroundColor": "var(--colors-green-300)",
        },
        "(backgroundColor = green.400)" => {
          "backgroundColor": "var(--colors-green-400)",
        },
        "(backgroundColor = green.500)" => {
          "backgroundColor": "var(--colors-green-500)",
        },
        "(backgroundColor = green.600)" => {
          "backgroundColor": "var(--colors-green-600)",
        },
        "(backgroundColor = green.700)" => {
          "backgroundColor": "var(--colors-green-700)",
        },
        "(backgroundColor = green.800)" => {
          "backgroundColor": "var(--colors-green-800)",
        },
        "(backgroundColor = green.900)" => {
          "backgroundColor": "var(--colors-green-900)",
        },
        "(backgroundColor = green.950)" => {
          "backgroundColor": "var(--colors-green-950)",
        },
        "(backgroundColor = lime.50)" => {
          "backgroundColor": "var(--colors-lime-50)",
        },
        "(backgroundColor = lime.100)" => {
          "backgroundColor": "var(--colors-lime-100)",
        },
        "(backgroundColor = lime.200)" => {
          "backgroundColor": "var(--colors-lime-200)",
        },
        "(backgroundColor = lime.300)" => {
          "backgroundColor": "var(--colors-lime-300)",
        },
        "(backgroundColor = lime.400)" => {
          "backgroundColor": "var(--colors-lime-400)",
        },
        "(backgroundColor = lime.500)" => {
          "backgroundColor": "var(--colors-lime-500)",
        },
        "(backgroundColor = lime.600)" => {
          "backgroundColor": "var(--colors-lime-600)",
        },
        "(backgroundColor = lime.700)" => {
          "backgroundColor": "var(--colors-lime-700)",
        },
        "(backgroundColor = lime.800)" => {
          "backgroundColor": "var(--colors-lime-800)",
        },
        "(backgroundColor = lime.900)" => {
          "backgroundColor": "var(--colors-lime-900)",
        },
        "(backgroundColor = lime.950)" => {
          "backgroundColor": "var(--colors-lime-950)",
        },
        "(backgroundColor = yellow.50)" => {
          "backgroundColor": "var(--colors-yellow-50)",
        },
        "(backgroundColor = yellow.100)" => {
          "backgroundColor": "var(--colors-yellow-100)",
        },
        "(backgroundColor = yellow.200)" => {
          "backgroundColor": "var(--colors-yellow-200)",
        },
        "(backgroundColor = yellow.300)" => {
          "backgroundColor": "var(--colors-yellow-300)",
        },
        "(backgroundColor = yellow.400)" => {
          "backgroundColor": "var(--colors-yellow-400)",
        },
        "(backgroundColor = yellow.500)" => {
          "backgroundColor": "var(--colors-yellow-500)",
        },
        "(backgroundColor = yellow.600)" => {
          "backgroundColor": "var(--colors-yellow-600)",
        },
        "(backgroundColor = yellow.700)" => {
          "backgroundColor": "var(--colors-yellow-700)",
        },
        "(backgroundColor = yellow.800)" => {
          "backgroundColor": "var(--colors-yellow-800)",
        },
        "(backgroundColor = yellow.900)" => {
          "backgroundColor": "var(--colors-yellow-900)",
        },
        "(backgroundColor = yellow.950)" => {
          "backgroundColor": "var(--colors-yellow-950)",
        },
        "(backgroundColor = amber.50)" => {
          "backgroundColor": "var(--colors-amber-50)",
        },
        "(backgroundColor = amber.100)" => {
          "backgroundColor": "var(--colors-amber-100)",
        },
        "(backgroundColor = amber.200)" => {
          "backgroundColor": "var(--colors-amber-200)",
        },
        "(backgroundColor = amber.300)" => {
          "backgroundColor": "var(--colors-amber-300)",
        },
        "(backgroundColor = amber.400)" => {
          "backgroundColor": "var(--colors-amber-400)",
        },
        "(backgroundColor = amber.500)" => {
          "backgroundColor": "var(--colors-amber-500)",
        },
        "(backgroundColor = amber.600)" => {
          "backgroundColor": "var(--colors-amber-600)",
        },
        "(backgroundColor = amber.700)" => {
          "backgroundColor": "var(--colors-amber-700)",
        },
        "(backgroundColor = amber.800)" => {
          "backgroundColor": "var(--colors-amber-800)",
        },
        "(backgroundColor = amber.900)" => {
          "backgroundColor": "var(--colors-amber-900)",
        },
        "(backgroundColor = amber.950)" => {
          "backgroundColor": "var(--colors-amber-950)",
        },
        "(backgroundColor = orange.50)" => {
          "backgroundColor": "var(--colors-orange-50)",
        },
        "(backgroundColor = orange.100)" => {
          "backgroundColor": "var(--colors-orange-100)",
        },
        "(backgroundColor = orange.200)" => {
          "backgroundColor": "var(--colors-orange-200)",
        },
        "(backgroundColor = orange.300)" => {
          "backgroundColor": "var(--colors-orange-300)",
        },
        "(backgroundColor = orange.400)" => {
          "backgroundColor": "var(--colors-orange-400)",
        },
        "(backgroundColor = orange.500)" => {
          "backgroundColor": "var(--colors-orange-500)",
        },
        "(backgroundColor = orange.600)" => {
          "backgroundColor": "var(--colors-orange-600)",
        },
        "(backgroundColor = orange.700)" => {
          "backgroundColor": "var(--colors-orange-700)",
        },
        "(backgroundColor = orange.800)" => {
          "backgroundColor": "var(--colors-orange-800)",
        },
        "(backgroundColor = orange.900)" => {
          "backgroundColor": "var(--colors-orange-900)",
        },
        "(backgroundColor = orange.950)" => {
          "backgroundColor": "var(--colors-orange-950)",
        },
        "(backgroundColor = red.50)" => {
          "backgroundColor": "var(--colors-red-50)",
        },
        "(backgroundColor = red.100)" => {
          "backgroundColor": "var(--colors-red-100)",
        },
        "(backgroundColor = red.200)" => {
          "backgroundColor": "var(--colors-red-200)",
        },
        "(backgroundColor = red.300)" => {
          "backgroundColor": "var(--colors-red-300)",
        },
        "(backgroundColor = red.400)" => {
          "backgroundColor": "var(--colors-red-400)",
        },
        "(backgroundColor = red.500)" => {
          "backgroundColor": "var(--colors-red-500)",
        },
        "(backgroundColor = red.600)" => {
          "backgroundColor": "var(--colors-red-600)",
        },
        "(backgroundColor = red.700)" => {
          "backgroundColor": "var(--colors-red-700)",
        },
        "(backgroundColor = red.800)" => {
          "backgroundColor": "var(--colors-red-800)",
        },
        "(backgroundColor = red.900)" => {
          "backgroundColor": "var(--colors-red-900)",
        },
        "(backgroundColor = red.950)" => {
          "backgroundColor": "var(--colors-red-950)",
        },
        "(backgroundColor = neutral.50)" => {
          "backgroundColor": "var(--colors-neutral-50)",
        },
        "(backgroundColor = neutral.100)" => {
          "backgroundColor": "var(--colors-neutral-100)",
        },
        "(backgroundColor = neutral.200)" => {
          "backgroundColor": "var(--colors-neutral-200)",
        },
        "(backgroundColor = neutral.300)" => {
          "backgroundColor": "var(--colors-neutral-300)",
        },
        "(backgroundColor = neutral.400)" => {
          "backgroundColor": "var(--colors-neutral-400)",
        },
        "(backgroundColor = neutral.500)" => {
          "backgroundColor": "var(--colors-neutral-500)",
        },
        "(backgroundColor = neutral.600)" => {
          "backgroundColor": "var(--colors-neutral-600)",
        },
        "(backgroundColor = neutral.700)" => {
          "backgroundColor": "var(--colors-neutral-700)",
        },
        "(backgroundColor = neutral.800)" => {
          "backgroundColor": "var(--colors-neutral-800)",
        },
        "(backgroundColor = neutral.900)" => {
          "backgroundColor": "var(--colors-neutral-900)",
        },
        "(backgroundColor = neutral.950)" => {
          "backgroundColor": "var(--colors-neutral-950)",
        },
        "(backgroundColor = stone.50)" => {
          "backgroundColor": "var(--colors-stone-50)",
        },
        "(backgroundColor = stone.100)" => {
          "backgroundColor": "var(--colors-stone-100)",
        },
        "(backgroundColor = stone.200)" => {
          "backgroundColor": "var(--colors-stone-200)",
        },
        "(backgroundColor = stone.300)" => {
          "backgroundColor": "var(--colors-stone-300)",
        },
        "(backgroundColor = stone.400)" => {
          "backgroundColor": "var(--colors-stone-400)",
        },
        "(backgroundColor = stone.500)" => {
          "backgroundColor": "var(--colors-stone-500)",
        },
        "(backgroundColor = stone.600)" => {
          "backgroundColor": "var(--colors-stone-600)",
        },
        "(backgroundColor = stone.700)" => {
          "backgroundColor": "var(--colors-stone-700)",
        },
        "(backgroundColor = stone.800)" => {
          "backgroundColor": "var(--colors-stone-800)",
        },
        "(backgroundColor = stone.900)" => {
          "backgroundColor": "var(--colors-stone-900)",
        },
        "(backgroundColor = stone.950)" => {
          "backgroundColor": "var(--colors-stone-950)",
        },
        "(backgroundColor = zinc.50)" => {
          "backgroundColor": "var(--colors-zinc-50)",
        },
        "(backgroundColor = zinc.100)" => {
          "backgroundColor": "var(--colors-zinc-100)",
        },
        "(backgroundColor = zinc.200)" => {
          "backgroundColor": "var(--colors-zinc-200)",
        },
        "(backgroundColor = zinc.300)" => {
          "backgroundColor": "var(--colors-zinc-300)",
        },
        "(backgroundColor = zinc.400)" => {
          "backgroundColor": "var(--colors-zinc-400)",
        },
        "(backgroundColor = zinc.500)" => {
          "backgroundColor": "var(--colors-zinc-500)",
        },
        "(backgroundColor = zinc.600)" => {
          "backgroundColor": "var(--colors-zinc-600)",
        },
        "(backgroundColor = zinc.700)" => {
          "backgroundColor": "var(--colors-zinc-700)",
        },
        "(backgroundColor = zinc.800)" => {
          "backgroundColor": "var(--colors-zinc-800)",
        },
        "(backgroundColor = zinc.900)" => {
          "backgroundColor": "var(--colors-zinc-900)",
        },
        "(backgroundColor = zinc.950)" => {
          "backgroundColor": "var(--colors-zinc-950)",
        },
        "(backgroundColor = gray.50)" => {
          "backgroundColor": "var(--colors-gray-50)",
        },
        "(backgroundColor = gray.100)" => {
          "backgroundColor": "var(--colors-gray-100)",
        },
        "(backgroundColor = gray.200)" => {
          "backgroundColor": "var(--colors-gray-200)",
        },
        "(backgroundColor = gray.300)" => {
          "backgroundColor": "var(--colors-gray-300)",
        },
        "(backgroundColor = gray.400)" => {
          "backgroundColor": "var(--colors-gray-400)",
        },
        "(backgroundColor = gray.500)" => {
          "backgroundColor": "var(--colors-gray-500)",
        },
        "(backgroundColor = gray.600)" => {
          "backgroundColor": "var(--colors-gray-600)",
        },
        "(backgroundColor = gray.700)" => {
          "backgroundColor": "var(--colors-gray-700)",
        },
        "(backgroundColor = gray.800)" => {
          "backgroundColor": "var(--colors-gray-800)",
        },
        "(backgroundColor = gray.900)" => {
          "backgroundColor": "var(--colors-gray-900)",
        },
        "(backgroundColor = gray.950)" => {
          "backgroundColor": "var(--colors-gray-950)",
        },
        "(backgroundColor = slate.50)" => {
          "backgroundColor": "var(--colors-slate-50)",
        },
        "(backgroundColor = slate.100)" => {
          "backgroundColor": "var(--colors-slate-100)",
        },
        "(backgroundColor = slate.200)" => {
          "backgroundColor": "var(--colors-slate-200)",
        },
        "(backgroundColor = slate.300)" => {
          "backgroundColor": "var(--colors-slate-300)",
        },
        "(backgroundColor = slate.400)" => {
          "backgroundColor": "var(--colors-slate-400)",
        },
        "(backgroundColor = slate.500)" => {
          "backgroundColor": "var(--colors-slate-500)",
        },
        "(backgroundColor = slate.600)" => {
          "backgroundColor": "var(--colors-slate-600)",
        },
        "(backgroundColor = slate.700)" => {
          "backgroundColor": "var(--colors-slate-700)",
        },
        "(backgroundColor = slate.800)" => {
          "backgroundColor": "var(--colors-slate-800)",
        },
        "(backgroundColor = slate.900)" => {
          "backgroundColor": "var(--colors-slate-900)",
        },
        "(backgroundColor = slate.950)" => {
          "backgroundColor": "var(--colors-slate-950)",
        },
        "(backgroundColor = deep.test.yam)" => {
          "backgroundColor": "var(--colors-deep-test-yam)",
        },
        "(backgroundColor = deep.test.pool.poller)" => {
          "backgroundColor": "var(--colors-deep-test-pool-poller)",
        },
        "(backgroundColor = deep.test.pool.tall)" => {
          "backgroundColor": "var(--colors-deep-test-pool-tall)",
        },
        "(backgroundColor = primary)" => {
          "backgroundColor": "var(--colors-primary)",
        },
        "(backgroundColor = secondary)" => {
          "backgroundColor": "var(--colors-secondary)",
        },
        "(backgroundColor = complex)" => {
          "backgroundColor": "var(--colors-complex)",
        },
        "(backgroundColor = surface)" => {
          "backgroundColor": "var(--colors-surface)",
        },
        "(backgroundColor = button.thick)" => {
          "backgroundColor": "var(--colors-button-thick)",
        },
        "(backgroundColor = button.card.body)" => {
          "backgroundColor": "var(--colors-button-card-body)",
        },
        "(backgroundColor = button.card.heading)" => {
          "backgroundColor": "var(--colors-button-card-heading)",
        },
        "(backgroundColor = colorPalette)" => {
          "backgroundColor": "var(--colors-color-palette)",
        },
        "(backgroundColor = colorPalette.50)" => {
          "backgroundColor": "var(--colors-color-palette-50)",
        },
        "(backgroundColor = colorPalette.100)" => {
          "backgroundColor": "var(--colors-color-palette-100)",
        },
        "(backgroundColor = colorPalette.200)" => {
          "backgroundColor": "var(--colors-color-palette-200)",
        },
        "(backgroundColor = colorPalette.300)" => {
          "backgroundColor": "var(--colors-color-palette-300)",
        },
        "(backgroundColor = colorPalette.400)" => {
          "backgroundColor": "var(--colors-color-palette-400)",
        },
        "(backgroundColor = colorPalette.500)" => {
          "backgroundColor": "var(--colors-color-palette-500)",
        },
        "(backgroundColor = colorPalette.600)" => {
          "backgroundColor": "var(--colors-color-palette-600)",
        },
        "(backgroundColor = colorPalette.700)" => {
          "backgroundColor": "var(--colors-color-palette-700)",
        },
        "(backgroundColor = colorPalette.800)" => {
          "backgroundColor": "var(--colors-color-palette-800)",
        },
        "(backgroundColor = colorPalette.900)" => {
          "backgroundColor": "var(--colors-color-palette-900)",
        },
        "(backgroundColor = colorPalette.950)" => {
          "backgroundColor": "var(--colors-color-palette-950)",
        },
        "(backgroundColor = colorPalette.test.yam)" => {
          "backgroundColor": "var(--colors-color-palette-test-yam)",
        },
        "(backgroundColor = colorPalette.yam)" => {
          "backgroundColor": "var(--colors-color-palette-yam)",
        },
        "(backgroundColor = colorPalette.test.pool.poller)" => {
          "backgroundColor": "var(--colors-color-palette-test-pool-poller)",
        },
        "(backgroundColor = colorPalette.pool.poller)" => {
          "backgroundColor": "var(--colors-color-palette-pool-poller)",
        },
        "(backgroundColor = colorPalette.poller)" => {
          "backgroundColor": "var(--colors-color-palette-poller)",
        },
        "(backgroundColor = colorPalette.test.pool.tall)" => {
          "backgroundColor": "var(--colors-color-palette-test-pool-tall)",
        },
        "(backgroundColor = colorPalette.pool.tall)" => {
          "backgroundColor": "var(--colors-color-palette-pool-tall)",
        },
        "(backgroundColor = colorPalette.tall)" => {
          "backgroundColor": "var(--colors-color-palette-tall)",
        },
        "(backgroundColor = colorPalette.thick)" => {
          "backgroundColor": "var(--colors-color-palette-thick)",
        },
        "(backgroundColor = colorPalette.card.body)" => {
          "backgroundColor": "var(--colors-color-palette-card-body)",
        },
        "(backgroundColor = colorPalette.body)" => {
          "backgroundColor": "var(--colors-color-palette-body)",
        },
        "(backgroundColor = colorPalette.card.heading)" => {
          "backgroundColor": "var(--colors-color-palette-card-heading)",
        },
        "(backgroundColor = colorPalette.heading)" => {
          "backgroundColor": "var(--colors-color-palette-heading)",
        },
        "(display = flex)" => {
          "display": "flex",
        },
        "(display = inline-flex)" => {
          "display": "inline-flex",
        },
        "(margin = 0)" => {
          "margin": "var(--spacing-0)",
        },
        "(margin = 1)" => {
          "margin": "var(--spacing-1)",
        },
        "(margin = 2)" => {
          "margin": "var(--spacing-2)",
        },
        "(margin = 3)" => {
          "margin": "var(--spacing-3)",
        },
        "(margin = 4)" => {
          "margin": "var(--spacing-4)",
        },
        "(margin = 5)" => {
          "margin": "var(--spacing-5)",
        },
        "(margin = 6)" => {
          "margin": "var(--spacing-6)",
        },
        "(margin = 7)" => {
          "margin": "var(--spacing-7)",
        },
        "(margin = 8)" => {
          "margin": "var(--spacing-8)",
        },
        "(margin = 9)" => {
          "margin": "var(--spacing-9)",
        },
        "(margin = 10)" => {
          "margin": "var(--spacing-10)",
        },
        "(margin = 11)" => {
          "margin": "var(--spacing-11)",
        },
        "(margin = 12)" => {
          "margin": "var(--spacing-12)",
        },
        "(margin = 14)" => {
          "margin": "var(--spacing-14)",
        },
        "(margin = 16)" => {
          "margin": "var(--spacing-16)",
        },
        "(margin = 20)" => {
          "margin": "var(--spacing-20)",
        },
        "(margin = 24)" => {
          "margin": "var(--spacing-24)",
        },
        "(margin = 28)" => {
          "margin": "var(--spacing-28)",
        },
        "(margin = 32)" => {
          "margin": "var(--spacing-32)",
        },
        "(margin = 36)" => {
          "margin": "var(--spacing-36)",
        },
        "(margin = 40)" => {
          "margin": "var(--spacing-40)",
        },
        "(margin = 44)" => {
          "margin": "var(--spacing-44)",
        },
        "(margin = 48)" => {
          "margin": "var(--spacing-48)",
        },
        "(margin = 52)" => {
          "margin": "var(--spacing-52)",
        },
        "(margin = 56)" => {
          "margin": "var(--spacing-56)",
        },
        "(margin = 60)" => {
          "margin": "var(--spacing-60)",
        },
        "(margin = 64)" => {
          "margin": "var(--spacing-64)",
        },
        "(margin = 72)" => {
          "margin": "var(--spacing-72)",
        },
        "(margin = 80)" => {
          "margin": "var(--spacing-80)",
        },
        "(margin = 96)" => {
          "margin": "var(--spacing-96)",
        },
        "(margin = 0.5)" => {
          "margin": "var(--spacing-0\\\\.5)",
        },
        "(margin = 1.5)" => {
          "margin": "var(--spacing-1\\\\.5)",
        },
        "(margin = 2.5)" => {
          "margin": "var(--spacing-2\\\\.5)",
        },
        "(margin = 3.5)" => {
          "margin": "var(--spacing-3\\\\.5)",
        },
        "(margin = gutter)" => {
          "margin": "var(--spacing-gutter)",
        },
        "(margin = -1)" => {
          "margin": "calc(var(--spacing-1) * -1)",
        },
        "(margin = -2)" => {
          "margin": "calc(var(--spacing-2) * -1)",
        },
        "(margin = -3)" => {
          "margin": "calc(var(--spacing-3) * -1)",
        },
        "(margin = -4)" => {
          "margin": "calc(var(--spacing-4) * -1)",
        },
        "(margin = -5)" => {
          "margin": "calc(var(--spacing-5) * -1)",
        },
        "(margin = -6)" => {
          "margin": "calc(var(--spacing-6) * -1)",
        },
        "(margin = -7)" => {
          "margin": "calc(var(--spacing-7) * -1)",
        },
        "(margin = -8)" => {
          "margin": "calc(var(--spacing-8) * -1)",
        },
        "(margin = -9)" => {
          "margin": "calc(var(--spacing-9) * -1)",
        },
        "(margin = -10)" => {
          "margin": "calc(var(--spacing-10) * -1)",
        },
        "(margin = -11)" => {
          "margin": "calc(var(--spacing-11) * -1)",
        },
        "(margin = -12)" => {
          "margin": "calc(var(--spacing-12) * -1)",
        },
        "(margin = -14)" => {
          "margin": "calc(var(--spacing-14) * -1)",
        },
        "(margin = -16)" => {
          "margin": "calc(var(--spacing-16) * -1)",
        },
        "(margin = -20)" => {
          "margin": "calc(var(--spacing-20) * -1)",
        },
        "(margin = -24)" => {
          "margin": "calc(var(--spacing-24) * -1)",
        },
        "(margin = -28)" => {
          "margin": "calc(var(--spacing-28) * -1)",
        },
        "(margin = -32)" => {
          "margin": "calc(var(--spacing-32) * -1)",
        },
        "(margin = -36)" => {
          "margin": "calc(var(--spacing-36) * -1)",
        },
        "(margin = -40)" => {
          "margin": "calc(var(--spacing-40) * -1)",
        },
        "(margin = -44)" => {
          "margin": "calc(var(--spacing-44) * -1)",
        },
        "(margin = -48)" => {
          "margin": "calc(var(--spacing-48) * -1)",
        },
        "(margin = -52)" => {
          "margin": "calc(var(--spacing-52) * -1)",
        },
        "(margin = -56)" => {
          "margin": "calc(var(--spacing-56) * -1)",
        },
        "(margin = -60)" => {
          "margin": "calc(var(--spacing-60) * -1)",
        },
        "(margin = -64)" => {
          "margin": "calc(var(--spacing-64) * -1)",
        },
        "(margin = -72)" => {
          "margin": "calc(var(--spacing-72) * -1)",
        },
        "(margin = -80)" => {
          "margin": "calc(var(--spacing-80) * -1)",
        },
        "(margin = -96)" => {
          "margin": "calc(var(--spacing-96) * -1)",
        },
        "(margin = -0.5)" => {
          "margin": "calc(var(--spacing-0\\\\.5) * -1)",
        },
        "(margin = -1.5)" => {
          "margin": "calc(var(--spacing-1\\\\.5) * -1)",
        },
        "(margin = -2.5)" => {
          "margin": "calc(var(--spacing-2\\\\.5) * -1)",
        },
        "(margin = -3.5)" => {
          "margin": "calc(var(--spacing-3\\\\.5) * -1)",
        },
        "(margin = -gutter)" => {
          "margin": "calc(var(--spacing-gutter) * -1)",
        },
        "(marginX = sm)" => {
          "marginBottom": "20px",
          "marginTop": "20px",
        },
        "(marginX = md)" => {
          "marginBottom": "40px",
          "marginTop": "40px",
        },
        "(colorPalette = current)" => {
          "--colors-color-palette": "var(--colors-current)",
        },
        "(colorPalette = black)" => {
          "--colors-color-palette": "var(--colors-black)",
        },
        "(colorPalette = white)" => {
          "--colors-color-palette": "var(--colors-white)",
        },
        "(colorPalette = transparent)" => {
          "--colors-color-palette": "var(--colors-transparent)",
        },
        "(colorPalette = rose)" => {
          "--colors-color-palette-100": "var(--colors-rose-100)",
          "--colors-color-palette-200": "var(--colors-rose-200)",
          "--colors-color-palette-300": "var(--colors-rose-300)",
          "--colors-color-palette-400": "var(--colors-rose-400)",
          "--colors-color-palette-50": "var(--colors-rose-50)",
          "--colors-color-palette-500": "var(--colors-rose-500)",
          "--colors-color-palette-600": "var(--colors-rose-600)",
          "--colors-color-palette-700": "var(--colors-rose-700)",
          "--colors-color-palette-800": "var(--colors-rose-800)",
          "--colors-color-palette-900": "var(--colors-rose-900)",
          "--colors-color-palette-950": "var(--colors-rose-950)",
        },
        "(colorPalette = pink)" => {
          "--colors-color-palette-100": "var(--colors-pink-100)",
          "--colors-color-palette-200": "var(--colors-pink-200)",
          "--colors-color-palette-300": "var(--colors-pink-300)",
          "--colors-color-palette-400": "var(--colors-pink-400)",
          "--colors-color-palette-50": "var(--colors-pink-50)",
          "--colors-color-palette-500": "var(--colors-pink-500)",
          "--colors-color-palette-600": "var(--colors-pink-600)",
          "--colors-color-palette-700": "var(--colors-pink-700)",
          "--colors-color-palette-800": "var(--colors-pink-800)",
          "--colors-color-palette-900": "var(--colors-pink-900)",
          "--colors-color-palette-950": "var(--colors-pink-950)",
        },
        "(colorPalette = fuchsia)" => {
          "--colors-color-palette-100": "var(--colors-fuchsia-100)",
          "--colors-color-palette-200": "var(--colors-fuchsia-200)",
          "--colors-color-palette-300": "var(--colors-fuchsia-300)",
          "--colors-color-palette-400": "var(--colors-fuchsia-400)",
          "--colors-color-palette-50": "var(--colors-fuchsia-50)",
          "--colors-color-palette-500": "var(--colors-fuchsia-500)",
          "--colors-color-palette-600": "var(--colors-fuchsia-600)",
          "--colors-color-palette-700": "var(--colors-fuchsia-700)",
          "--colors-color-palette-800": "var(--colors-fuchsia-800)",
          "--colors-color-palette-900": "var(--colors-fuchsia-900)",
          "--colors-color-palette-950": "var(--colors-fuchsia-950)",
        },
        "(colorPalette = purple)" => {
          "--colors-color-palette-100": "var(--colors-purple-100)",
          "--colors-color-palette-200": "var(--colors-purple-200)",
          "--colors-color-palette-300": "var(--colors-purple-300)",
          "--colors-color-palette-400": "var(--colors-purple-400)",
          "--colors-color-palette-50": "var(--colors-purple-50)",
          "--colors-color-palette-500": "var(--colors-purple-500)",
          "--colors-color-palette-600": "var(--colors-purple-600)",
          "--colors-color-palette-700": "var(--colors-purple-700)",
          "--colors-color-palette-800": "var(--colors-purple-800)",
          "--colors-color-palette-900": "var(--colors-purple-900)",
          "--colors-color-palette-950": "var(--colors-purple-950)",
        },
        "(colorPalette = violet)" => {
          "--colors-color-palette-100": "var(--colors-violet-100)",
          "--colors-color-palette-200": "var(--colors-violet-200)",
          "--colors-color-palette-300": "var(--colors-violet-300)",
          "--colors-color-palette-400": "var(--colors-violet-400)",
          "--colors-color-palette-50": "var(--colors-violet-50)",
          "--colors-color-palette-500": "var(--colors-violet-500)",
          "--colors-color-palette-600": "var(--colors-violet-600)",
          "--colors-color-palette-700": "var(--colors-violet-700)",
          "--colors-color-palette-800": "var(--colors-violet-800)",
          "--colors-color-palette-900": "var(--colors-violet-900)",
          "--colors-color-palette-950": "var(--colors-violet-950)",
        },
        "(colorPalette = indigo)" => {
          "--colors-color-palette-100": "var(--colors-indigo-100)",
          "--colors-color-palette-200": "var(--colors-indigo-200)",
          "--colors-color-palette-300": "var(--colors-indigo-300)",
          "--colors-color-palette-400": "var(--colors-indigo-400)",
          "--colors-color-palette-50": "var(--colors-indigo-50)",
          "--colors-color-palette-500": "var(--colors-indigo-500)",
          "--colors-color-palette-600": "var(--colors-indigo-600)",
          "--colors-color-palette-700": "var(--colors-indigo-700)",
          "--colors-color-palette-800": "var(--colors-indigo-800)",
          "--colors-color-palette-900": "var(--colors-indigo-900)",
          "--colors-color-palette-950": "var(--colors-indigo-950)",
        },
        "(colorPalette = blue)" => {
          "--colors-color-palette-100": "var(--colors-blue-100)",
          "--colors-color-palette-200": "var(--colors-blue-200)",
          "--colors-color-palette-300": "var(--colors-blue-300)",
          "--colors-color-palette-400": "var(--colors-blue-400)",
          "--colors-color-palette-50": "var(--colors-blue-50)",
          "--colors-color-palette-500": "var(--colors-blue-500)",
          "--colors-color-palette-600": "var(--colors-blue-600)",
          "--colors-color-palette-700": "var(--colors-blue-700)",
          "--colors-color-palette-800": "var(--colors-blue-800)",
          "--colors-color-palette-900": "var(--colors-blue-900)",
          "--colors-color-palette-950": "var(--colors-blue-950)",
        },
        "(colorPalette = sky)" => {
          "--colors-color-palette-100": "var(--colors-sky-100)",
          "--colors-color-palette-200": "var(--colors-sky-200)",
          "--colors-color-palette-300": "var(--colors-sky-300)",
          "--colors-color-palette-400": "var(--colors-sky-400)",
          "--colors-color-palette-50": "var(--colors-sky-50)",
          "--colors-color-palette-500": "var(--colors-sky-500)",
          "--colors-color-palette-600": "var(--colors-sky-600)",
          "--colors-color-palette-700": "var(--colors-sky-700)",
          "--colors-color-palette-800": "var(--colors-sky-800)",
          "--colors-color-palette-900": "var(--colors-sky-900)",
          "--colors-color-palette-950": "var(--colors-sky-950)",
        },
        "(colorPalette = cyan)" => {
          "--colors-color-palette-100": "var(--colors-cyan-100)",
          "--colors-color-palette-200": "var(--colors-cyan-200)",
          "--colors-color-palette-300": "var(--colors-cyan-300)",
          "--colors-color-palette-400": "var(--colors-cyan-400)",
          "--colors-color-palette-50": "var(--colors-cyan-50)",
          "--colors-color-palette-500": "var(--colors-cyan-500)",
          "--colors-color-palette-600": "var(--colors-cyan-600)",
          "--colors-color-palette-700": "var(--colors-cyan-700)",
          "--colors-color-palette-800": "var(--colors-cyan-800)",
          "--colors-color-palette-900": "var(--colors-cyan-900)",
          "--colors-color-palette-950": "var(--colors-cyan-950)",
        },
        "(colorPalette = teal)" => {
          "--colors-color-palette-100": "var(--colors-teal-100)",
          "--colors-color-palette-200": "var(--colors-teal-200)",
          "--colors-color-palette-300": "var(--colors-teal-300)",
          "--colors-color-palette-400": "var(--colors-teal-400)",
          "--colors-color-palette-50": "var(--colors-teal-50)",
          "--colors-color-palette-500": "var(--colors-teal-500)",
          "--colors-color-palette-600": "var(--colors-teal-600)",
          "--colors-color-palette-700": "var(--colors-teal-700)",
          "--colors-color-palette-800": "var(--colors-teal-800)",
          "--colors-color-palette-900": "var(--colors-teal-900)",
          "--colors-color-palette-950": "var(--colors-teal-950)",
        },
        "(colorPalette = emerald)" => {
          "--colors-color-palette-100": "var(--colors-emerald-100)",
          "--colors-color-palette-200": "var(--colors-emerald-200)",
          "--colors-color-palette-300": "var(--colors-emerald-300)",
          "--colors-color-palette-400": "var(--colors-emerald-400)",
          "--colors-color-palette-50": "var(--colors-emerald-50)",
          "--colors-color-palette-500": "var(--colors-emerald-500)",
          "--colors-color-palette-600": "var(--colors-emerald-600)",
          "--colors-color-palette-700": "var(--colors-emerald-700)",
          "--colors-color-palette-800": "var(--colors-emerald-800)",
          "--colors-color-palette-900": "var(--colors-emerald-900)",
          "--colors-color-palette-950": "var(--colors-emerald-950)",
        },
        "(colorPalette = green)" => {
          "--colors-color-palette-100": "var(--colors-green-100)",
          "--colors-color-palette-200": "var(--colors-green-200)",
          "--colors-color-palette-300": "var(--colors-green-300)",
          "--colors-color-palette-400": "var(--colors-green-400)",
          "--colors-color-palette-50": "var(--colors-green-50)",
          "--colors-color-palette-500": "var(--colors-green-500)",
          "--colors-color-palette-600": "var(--colors-green-600)",
          "--colors-color-palette-700": "var(--colors-green-700)",
          "--colors-color-palette-800": "var(--colors-green-800)",
          "--colors-color-palette-900": "var(--colors-green-900)",
          "--colors-color-palette-950": "var(--colors-green-950)",
        },
        "(colorPalette = lime)" => {
          "--colors-color-palette-100": "var(--colors-lime-100)",
          "--colors-color-palette-200": "var(--colors-lime-200)",
          "--colors-color-palette-300": "var(--colors-lime-300)",
          "--colors-color-palette-400": "var(--colors-lime-400)",
          "--colors-color-palette-50": "var(--colors-lime-50)",
          "--colors-color-palette-500": "var(--colors-lime-500)",
          "--colors-color-palette-600": "var(--colors-lime-600)",
          "--colors-color-palette-700": "var(--colors-lime-700)",
          "--colors-color-palette-800": "var(--colors-lime-800)",
          "--colors-color-palette-900": "var(--colors-lime-900)",
          "--colors-color-palette-950": "var(--colors-lime-950)",
        },
        "(colorPalette = yellow)" => {
          "--colors-color-palette-100": "var(--colors-yellow-100)",
          "--colors-color-palette-200": "var(--colors-yellow-200)",
          "--colors-color-palette-300": "var(--colors-yellow-300)",
          "--colors-color-palette-400": "var(--colors-yellow-400)",
          "--colors-color-palette-50": "var(--colors-yellow-50)",
          "--colors-color-palette-500": "var(--colors-yellow-500)",
          "--colors-color-palette-600": "var(--colors-yellow-600)",
          "--colors-color-palette-700": "var(--colors-yellow-700)",
          "--colors-color-palette-800": "var(--colors-yellow-800)",
          "--colors-color-palette-900": "var(--colors-yellow-900)",
          "--colors-color-palette-950": "var(--colors-yellow-950)",
        },
        "(colorPalette = amber)" => {
          "--colors-color-palette-100": "var(--colors-amber-100)",
          "--colors-color-palette-200": "var(--colors-amber-200)",
          "--colors-color-palette-300": "var(--colors-amber-300)",
          "--colors-color-palette-400": "var(--colors-amber-400)",
          "--colors-color-palette-50": "var(--colors-amber-50)",
          "--colors-color-palette-500": "var(--colors-amber-500)",
          "--colors-color-palette-600": "var(--colors-amber-600)",
          "--colors-color-palette-700": "var(--colors-amber-700)",
          "--colors-color-palette-800": "var(--colors-amber-800)",
          "--colors-color-palette-900": "var(--colors-amber-900)",
          "--colors-color-palette-950": "var(--colors-amber-950)",
        },
        "(colorPalette = orange)" => {
          "--colors-color-palette-100": "var(--colors-orange-100)",
          "--colors-color-palette-200": "var(--colors-orange-200)",
          "--colors-color-palette-300": "var(--colors-orange-300)",
          "--colors-color-palette-400": "var(--colors-orange-400)",
          "--colors-color-palette-50": "var(--colors-orange-50)",
          "--colors-color-palette-500": "var(--colors-orange-500)",
          "--colors-color-palette-600": "var(--colors-orange-600)",
          "--colors-color-palette-700": "var(--colors-orange-700)",
          "--colors-color-palette-800": "var(--colors-orange-800)",
          "--colors-color-palette-900": "var(--colors-orange-900)",
          "--colors-color-palette-950": "var(--colors-orange-950)",
        },
        "(colorPalette = red)" => {
          "--colors-color-palette-100": "var(--colors-red-100)",
          "--colors-color-palette-200": "var(--colors-red-200)",
          "--colors-color-palette-300": "var(--colors-red-300)",
          "--colors-color-palette-400": "var(--colors-red-400)",
          "--colors-color-palette-50": "var(--colors-red-50)",
          "--colors-color-palette-500": "var(--colors-red-500)",
          "--colors-color-palette-600": "var(--colors-red-600)",
          "--colors-color-palette-700": "var(--colors-red-700)",
          "--colors-color-palette-800": "var(--colors-red-800)",
          "--colors-color-palette-900": "var(--colors-red-900)",
          "--colors-color-palette-950": "var(--colors-red-950)",
        },
        "(colorPalette = neutral)" => {
          "--colors-color-palette-100": "var(--colors-neutral-100)",
          "--colors-color-palette-200": "var(--colors-neutral-200)",
          "--colors-color-palette-300": "var(--colors-neutral-300)",
          "--colors-color-palette-400": "var(--colors-neutral-400)",
          "--colors-color-palette-50": "var(--colors-neutral-50)",
          "--colors-color-palette-500": "var(--colors-neutral-500)",
          "--colors-color-palette-600": "var(--colors-neutral-600)",
          "--colors-color-palette-700": "var(--colors-neutral-700)",
          "--colors-color-palette-800": "var(--colors-neutral-800)",
          "--colors-color-palette-900": "var(--colors-neutral-900)",
          "--colors-color-palette-950": "var(--colors-neutral-950)",
        },
        "(colorPalette = stone)" => {
          "--colors-color-palette-100": "var(--colors-stone-100)",
          "--colors-color-palette-200": "var(--colors-stone-200)",
          "--colors-color-palette-300": "var(--colors-stone-300)",
          "--colors-color-palette-400": "var(--colors-stone-400)",
          "--colors-color-palette-50": "var(--colors-stone-50)",
          "--colors-color-palette-500": "var(--colors-stone-500)",
          "--colors-color-palette-600": "var(--colors-stone-600)",
          "--colors-color-palette-700": "var(--colors-stone-700)",
          "--colors-color-palette-800": "var(--colors-stone-800)",
          "--colors-color-palette-900": "var(--colors-stone-900)",
          "--colors-color-palette-950": "var(--colors-stone-950)",
        },
        "(colorPalette = zinc)" => {
          "--colors-color-palette-100": "var(--colors-zinc-100)",
          "--colors-color-palette-200": "var(--colors-zinc-200)",
          "--colors-color-palette-300": "var(--colors-zinc-300)",
          "--colors-color-palette-400": "var(--colors-zinc-400)",
          "--colors-color-palette-50": "var(--colors-zinc-50)",
          "--colors-color-palette-500": "var(--colors-zinc-500)",
          "--colors-color-palette-600": "var(--colors-zinc-600)",
          "--colors-color-palette-700": "var(--colors-zinc-700)",
          "--colors-color-palette-800": "var(--colors-zinc-800)",
          "--colors-color-palette-900": "var(--colors-zinc-900)",
          "--colors-color-palette-950": "var(--colors-zinc-950)",
        },
        "(colorPalette = gray)" => {
          "--colors-color-palette-100": "var(--colors-gray-100)",
          "--colors-color-palette-200": "var(--colors-gray-200)",
          "--colors-color-palette-300": "var(--colors-gray-300)",
          "--colors-color-palette-400": "var(--colors-gray-400)",
          "--colors-color-palette-50": "var(--colors-gray-50)",
          "--colors-color-palette-500": "var(--colors-gray-500)",
          "--colors-color-palette-600": "var(--colors-gray-600)",
          "--colors-color-palette-700": "var(--colors-gray-700)",
          "--colors-color-palette-800": "var(--colors-gray-800)",
          "--colors-color-palette-900": "var(--colors-gray-900)",
          "--colors-color-palette-950": "var(--colors-gray-950)",
        },
        "(colorPalette = slate)" => {
          "--colors-color-palette-100": "var(--colors-slate-100)",
          "--colors-color-palette-200": "var(--colors-slate-200)",
          "--colors-color-palette-300": "var(--colors-slate-300)",
          "--colors-color-palette-400": "var(--colors-slate-400)",
          "--colors-color-palette-50": "var(--colors-slate-50)",
          "--colors-color-palette-500": "var(--colors-slate-500)",
          "--colors-color-palette-600": "var(--colors-slate-600)",
          "--colors-color-palette-700": "var(--colors-slate-700)",
          "--colors-color-palette-800": "var(--colors-slate-800)",
          "--colors-color-palette-900": "var(--colors-slate-900)",
          "--colors-color-palette-950": "var(--colors-slate-950)",
        },
        "(colorPalette = deep)" => {
          "--colors-color-palette-test-pool-poller": "var(--colors-deep-test-pool-poller)",
          "--colors-color-palette-test-pool-tall": "var(--colors-deep-test-pool-tall)",
          "--colors-color-palette-test-yam": "var(--colors-deep-test-yam)",
        },
        "(colorPalette = deep.test)" => {
          "--colors-color-palette-pool-poller": "var(--colors-deep-test-pool-poller)",
          "--colors-color-palette-pool-tall": "var(--colors-deep-test-pool-tall)",
          "--colors-color-palette-yam": "var(--colors-deep-test-yam)",
        },
        "(colorPalette = deep.test.pool)" => {
          "--colors-color-palette-poller": "var(--colors-deep-test-pool-poller)",
          "--colors-color-palette-tall": "var(--colors-deep-test-pool-tall)",
        },
        "(colorPalette = primary)" => {
          "--colors-color-palette": "var(--colors-primary)",
        },
        "(colorPalette = secondary)" => {
          "--colors-color-palette": "var(--colors-secondary)",
        },
        "(colorPalette = complex)" => {
          "--colors-color-palette": "var(--colors-complex)",
        },
        "(colorPalette = surface)" => {
          "--colors-color-palette": "var(--colors-surface)",
        },
        "(colorPalette = button)" => {
          "--colors-color-palette-card-body": "var(--colors-button-card-body)",
          "--colors-color-palette-card-heading": "var(--colors-button-card-heading)",
          "--colors-color-palette-thick": "var(--colors-button-thick)",
        },
        "(colorPalette = button.card)" => {
          "--colors-color-palette-body": "var(--colors-button-card-body)",
          "--colors-color-palette-heading": "var(--colors-button-card-heading)",
        },
      }
    `)

    expect(utility.transform('bt', '4px')).toMatchInlineSnapshot(`
      {
        "className": "bt_4px",
        "styles": {
          "borderTopColor": "var(--colors-gray-500)",
          "borderTopStyle": "solid",
          "borderTopWidth": "4px",
        },
      }
    `)
  })

  test('should resolve arbitrary property', () => {
    const values = { auto: 'auto', sm: '20px', md: '40px' }
    const utility = new Utility({
      tokens: new TokenDictionary({ tokens, semanticTokens }),
      config: {
        marginLeft: {
          className: 'ml',
          values,
          transform(value) {
            return { marginLeft: value }
          },
        },
        marginRight: {
          className: 'mr',
          values,
          transform(value) {
            return { marginRight: value }
          },
        },
      },
    })

    expect(utility.styles).toMatchInlineSnapshot(`
      Map {
        "(marginLeft = auto)" => {
          "marginLeft": "auto",
        },
        "(marginLeft = sm)" => {
          "marginLeft": "20px",
        },
        "(marginLeft = md)" => {
          "marginLeft": "40px",
        },
        "(marginRight = auto)" => {
          "marginRight": "auto",
        },
        "(marginRight = sm)" => {
          "marginRight": "20px",
        },
        "(marginRight = md)" => {
          "marginRight": "40px",
        },
        "(colorPalette = current)" => {
          "--colors-color-palette": "var(--colors-current)",
        },
        "(colorPalette = black)" => {
          "--colors-color-palette": "var(--colors-black)",
        },
        "(colorPalette = white)" => {
          "--colors-color-palette": "var(--colors-white)",
        },
        "(colorPalette = transparent)" => {
          "--colors-color-palette": "var(--colors-transparent)",
        },
        "(colorPalette = rose)" => {
          "--colors-color-palette-100": "var(--colors-rose-100)",
          "--colors-color-palette-200": "var(--colors-rose-200)",
          "--colors-color-palette-300": "var(--colors-rose-300)",
          "--colors-color-palette-400": "var(--colors-rose-400)",
          "--colors-color-palette-50": "var(--colors-rose-50)",
          "--colors-color-palette-500": "var(--colors-rose-500)",
          "--colors-color-palette-600": "var(--colors-rose-600)",
          "--colors-color-palette-700": "var(--colors-rose-700)",
          "--colors-color-palette-800": "var(--colors-rose-800)",
          "--colors-color-palette-900": "var(--colors-rose-900)",
          "--colors-color-palette-950": "var(--colors-rose-950)",
        },
        "(colorPalette = pink)" => {
          "--colors-color-palette-100": "var(--colors-pink-100)",
          "--colors-color-palette-200": "var(--colors-pink-200)",
          "--colors-color-palette-300": "var(--colors-pink-300)",
          "--colors-color-palette-400": "var(--colors-pink-400)",
          "--colors-color-palette-50": "var(--colors-pink-50)",
          "--colors-color-palette-500": "var(--colors-pink-500)",
          "--colors-color-palette-600": "var(--colors-pink-600)",
          "--colors-color-palette-700": "var(--colors-pink-700)",
          "--colors-color-palette-800": "var(--colors-pink-800)",
          "--colors-color-palette-900": "var(--colors-pink-900)",
          "--colors-color-palette-950": "var(--colors-pink-950)",
        },
        "(colorPalette = fuchsia)" => {
          "--colors-color-palette-100": "var(--colors-fuchsia-100)",
          "--colors-color-palette-200": "var(--colors-fuchsia-200)",
          "--colors-color-palette-300": "var(--colors-fuchsia-300)",
          "--colors-color-palette-400": "var(--colors-fuchsia-400)",
          "--colors-color-palette-50": "var(--colors-fuchsia-50)",
          "--colors-color-palette-500": "var(--colors-fuchsia-500)",
          "--colors-color-palette-600": "var(--colors-fuchsia-600)",
          "--colors-color-palette-700": "var(--colors-fuchsia-700)",
          "--colors-color-palette-800": "var(--colors-fuchsia-800)",
          "--colors-color-palette-900": "var(--colors-fuchsia-900)",
          "--colors-color-palette-950": "var(--colors-fuchsia-950)",
        },
        "(colorPalette = purple)" => {
          "--colors-color-palette-100": "var(--colors-purple-100)",
          "--colors-color-palette-200": "var(--colors-purple-200)",
          "--colors-color-palette-300": "var(--colors-purple-300)",
          "--colors-color-palette-400": "var(--colors-purple-400)",
          "--colors-color-palette-50": "var(--colors-purple-50)",
          "--colors-color-palette-500": "var(--colors-purple-500)",
          "--colors-color-palette-600": "var(--colors-purple-600)",
          "--colors-color-palette-700": "var(--colors-purple-700)",
          "--colors-color-palette-800": "var(--colors-purple-800)",
          "--colors-color-palette-900": "var(--colors-purple-900)",
          "--colors-color-palette-950": "var(--colors-purple-950)",
        },
        "(colorPalette = violet)" => {
          "--colors-color-palette-100": "var(--colors-violet-100)",
          "--colors-color-palette-200": "var(--colors-violet-200)",
          "--colors-color-palette-300": "var(--colors-violet-300)",
          "--colors-color-palette-400": "var(--colors-violet-400)",
          "--colors-color-palette-50": "var(--colors-violet-50)",
          "--colors-color-palette-500": "var(--colors-violet-500)",
          "--colors-color-palette-600": "var(--colors-violet-600)",
          "--colors-color-palette-700": "var(--colors-violet-700)",
          "--colors-color-palette-800": "var(--colors-violet-800)",
          "--colors-color-palette-900": "var(--colors-violet-900)",
          "--colors-color-palette-950": "var(--colors-violet-950)",
        },
        "(colorPalette = indigo)" => {
          "--colors-color-palette-100": "var(--colors-indigo-100)",
          "--colors-color-palette-200": "var(--colors-indigo-200)",
          "--colors-color-palette-300": "var(--colors-indigo-300)",
          "--colors-color-palette-400": "var(--colors-indigo-400)",
          "--colors-color-palette-50": "var(--colors-indigo-50)",
          "--colors-color-palette-500": "var(--colors-indigo-500)",
          "--colors-color-palette-600": "var(--colors-indigo-600)",
          "--colors-color-palette-700": "var(--colors-indigo-700)",
          "--colors-color-palette-800": "var(--colors-indigo-800)",
          "--colors-color-palette-900": "var(--colors-indigo-900)",
          "--colors-color-palette-950": "var(--colors-indigo-950)",
        },
        "(colorPalette = blue)" => {
          "--colors-color-palette-100": "var(--colors-blue-100)",
          "--colors-color-palette-200": "var(--colors-blue-200)",
          "--colors-color-palette-300": "var(--colors-blue-300)",
          "--colors-color-palette-400": "var(--colors-blue-400)",
          "--colors-color-palette-50": "var(--colors-blue-50)",
          "--colors-color-palette-500": "var(--colors-blue-500)",
          "--colors-color-palette-600": "var(--colors-blue-600)",
          "--colors-color-palette-700": "var(--colors-blue-700)",
          "--colors-color-palette-800": "var(--colors-blue-800)",
          "--colors-color-palette-900": "var(--colors-blue-900)",
          "--colors-color-palette-950": "var(--colors-blue-950)",
        },
        "(colorPalette = sky)" => {
          "--colors-color-palette-100": "var(--colors-sky-100)",
          "--colors-color-palette-200": "var(--colors-sky-200)",
          "--colors-color-palette-300": "var(--colors-sky-300)",
          "--colors-color-palette-400": "var(--colors-sky-400)",
          "--colors-color-palette-50": "var(--colors-sky-50)",
          "--colors-color-palette-500": "var(--colors-sky-500)",
          "--colors-color-palette-600": "var(--colors-sky-600)",
          "--colors-color-palette-700": "var(--colors-sky-700)",
          "--colors-color-palette-800": "var(--colors-sky-800)",
          "--colors-color-palette-900": "var(--colors-sky-900)",
          "--colors-color-palette-950": "var(--colors-sky-950)",
        },
        "(colorPalette = cyan)" => {
          "--colors-color-palette-100": "var(--colors-cyan-100)",
          "--colors-color-palette-200": "var(--colors-cyan-200)",
          "--colors-color-palette-300": "var(--colors-cyan-300)",
          "--colors-color-palette-400": "var(--colors-cyan-400)",
          "--colors-color-palette-50": "var(--colors-cyan-50)",
          "--colors-color-palette-500": "var(--colors-cyan-500)",
          "--colors-color-palette-600": "var(--colors-cyan-600)",
          "--colors-color-palette-700": "var(--colors-cyan-700)",
          "--colors-color-palette-800": "var(--colors-cyan-800)",
          "--colors-color-palette-900": "var(--colors-cyan-900)",
          "--colors-color-palette-950": "var(--colors-cyan-950)",
        },
        "(colorPalette = teal)" => {
          "--colors-color-palette-100": "var(--colors-teal-100)",
          "--colors-color-palette-200": "var(--colors-teal-200)",
          "--colors-color-palette-300": "var(--colors-teal-300)",
          "--colors-color-palette-400": "var(--colors-teal-400)",
          "--colors-color-palette-50": "var(--colors-teal-50)",
          "--colors-color-palette-500": "var(--colors-teal-500)",
          "--colors-color-palette-600": "var(--colors-teal-600)",
          "--colors-color-palette-700": "var(--colors-teal-700)",
          "--colors-color-palette-800": "var(--colors-teal-800)",
          "--colors-color-palette-900": "var(--colors-teal-900)",
          "--colors-color-palette-950": "var(--colors-teal-950)",
        },
        "(colorPalette = emerald)" => {
          "--colors-color-palette-100": "var(--colors-emerald-100)",
          "--colors-color-palette-200": "var(--colors-emerald-200)",
          "--colors-color-palette-300": "var(--colors-emerald-300)",
          "--colors-color-palette-400": "var(--colors-emerald-400)",
          "--colors-color-palette-50": "var(--colors-emerald-50)",
          "--colors-color-palette-500": "var(--colors-emerald-500)",
          "--colors-color-palette-600": "var(--colors-emerald-600)",
          "--colors-color-palette-700": "var(--colors-emerald-700)",
          "--colors-color-palette-800": "var(--colors-emerald-800)",
          "--colors-color-palette-900": "var(--colors-emerald-900)",
          "--colors-color-palette-950": "var(--colors-emerald-950)",
        },
        "(colorPalette = green)" => {
          "--colors-color-palette-100": "var(--colors-green-100)",
          "--colors-color-palette-200": "var(--colors-green-200)",
          "--colors-color-palette-300": "var(--colors-green-300)",
          "--colors-color-palette-400": "var(--colors-green-400)",
          "--colors-color-palette-50": "var(--colors-green-50)",
          "--colors-color-palette-500": "var(--colors-green-500)",
          "--colors-color-palette-600": "var(--colors-green-600)",
          "--colors-color-palette-700": "var(--colors-green-700)",
          "--colors-color-palette-800": "var(--colors-green-800)",
          "--colors-color-palette-900": "var(--colors-green-900)",
          "--colors-color-palette-950": "var(--colors-green-950)",
        },
        "(colorPalette = lime)" => {
          "--colors-color-palette-100": "var(--colors-lime-100)",
          "--colors-color-palette-200": "var(--colors-lime-200)",
          "--colors-color-palette-300": "var(--colors-lime-300)",
          "--colors-color-palette-400": "var(--colors-lime-400)",
          "--colors-color-palette-50": "var(--colors-lime-50)",
          "--colors-color-palette-500": "var(--colors-lime-500)",
          "--colors-color-palette-600": "var(--colors-lime-600)",
          "--colors-color-palette-700": "var(--colors-lime-700)",
          "--colors-color-palette-800": "var(--colors-lime-800)",
          "--colors-color-palette-900": "var(--colors-lime-900)",
          "--colors-color-palette-950": "var(--colors-lime-950)",
        },
        "(colorPalette = yellow)" => {
          "--colors-color-palette-100": "var(--colors-yellow-100)",
          "--colors-color-palette-200": "var(--colors-yellow-200)",
          "--colors-color-palette-300": "var(--colors-yellow-300)",
          "--colors-color-palette-400": "var(--colors-yellow-400)",
          "--colors-color-palette-50": "var(--colors-yellow-50)",
          "--colors-color-palette-500": "var(--colors-yellow-500)",
          "--colors-color-palette-600": "var(--colors-yellow-600)",
          "--colors-color-palette-700": "var(--colors-yellow-700)",
          "--colors-color-palette-800": "var(--colors-yellow-800)",
          "--colors-color-palette-900": "var(--colors-yellow-900)",
          "--colors-color-palette-950": "var(--colors-yellow-950)",
        },
        "(colorPalette = amber)" => {
          "--colors-color-palette-100": "var(--colors-amber-100)",
          "--colors-color-palette-200": "var(--colors-amber-200)",
          "--colors-color-palette-300": "var(--colors-amber-300)",
          "--colors-color-palette-400": "var(--colors-amber-400)",
          "--colors-color-palette-50": "var(--colors-amber-50)",
          "--colors-color-palette-500": "var(--colors-amber-500)",
          "--colors-color-palette-600": "var(--colors-amber-600)",
          "--colors-color-palette-700": "var(--colors-amber-700)",
          "--colors-color-palette-800": "var(--colors-amber-800)",
          "--colors-color-palette-900": "var(--colors-amber-900)",
          "--colors-color-palette-950": "var(--colors-amber-950)",
        },
        "(colorPalette = orange)" => {
          "--colors-color-palette-100": "var(--colors-orange-100)",
          "--colors-color-palette-200": "var(--colors-orange-200)",
          "--colors-color-palette-300": "var(--colors-orange-300)",
          "--colors-color-palette-400": "var(--colors-orange-400)",
          "--colors-color-palette-50": "var(--colors-orange-50)",
          "--colors-color-palette-500": "var(--colors-orange-500)",
          "--colors-color-palette-600": "var(--colors-orange-600)",
          "--colors-color-palette-700": "var(--colors-orange-700)",
          "--colors-color-palette-800": "var(--colors-orange-800)",
          "--colors-color-palette-900": "var(--colors-orange-900)",
          "--colors-color-palette-950": "var(--colors-orange-950)",
        },
        "(colorPalette = red)" => {
          "--colors-color-palette-100": "var(--colors-red-100)",
          "--colors-color-palette-200": "var(--colors-red-200)",
          "--colors-color-palette-300": "var(--colors-red-300)",
          "--colors-color-palette-400": "var(--colors-red-400)",
          "--colors-color-palette-50": "var(--colors-red-50)",
          "--colors-color-palette-500": "var(--colors-red-500)",
          "--colors-color-palette-600": "var(--colors-red-600)",
          "--colors-color-palette-700": "var(--colors-red-700)",
          "--colors-color-palette-800": "var(--colors-red-800)",
          "--colors-color-palette-900": "var(--colors-red-900)",
          "--colors-color-palette-950": "var(--colors-red-950)",
        },
        "(colorPalette = neutral)" => {
          "--colors-color-palette-100": "var(--colors-neutral-100)",
          "--colors-color-palette-200": "var(--colors-neutral-200)",
          "--colors-color-palette-300": "var(--colors-neutral-300)",
          "--colors-color-palette-400": "var(--colors-neutral-400)",
          "--colors-color-palette-50": "var(--colors-neutral-50)",
          "--colors-color-palette-500": "var(--colors-neutral-500)",
          "--colors-color-palette-600": "var(--colors-neutral-600)",
          "--colors-color-palette-700": "var(--colors-neutral-700)",
          "--colors-color-palette-800": "var(--colors-neutral-800)",
          "--colors-color-palette-900": "var(--colors-neutral-900)",
          "--colors-color-palette-950": "var(--colors-neutral-950)",
        },
        "(colorPalette = stone)" => {
          "--colors-color-palette-100": "var(--colors-stone-100)",
          "--colors-color-palette-200": "var(--colors-stone-200)",
          "--colors-color-palette-300": "var(--colors-stone-300)",
          "--colors-color-palette-400": "var(--colors-stone-400)",
          "--colors-color-palette-50": "var(--colors-stone-50)",
          "--colors-color-palette-500": "var(--colors-stone-500)",
          "--colors-color-palette-600": "var(--colors-stone-600)",
          "--colors-color-palette-700": "var(--colors-stone-700)",
          "--colors-color-palette-800": "var(--colors-stone-800)",
          "--colors-color-palette-900": "var(--colors-stone-900)",
          "--colors-color-palette-950": "var(--colors-stone-950)",
        },
        "(colorPalette = zinc)" => {
          "--colors-color-palette-100": "var(--colors-zinc-100)",
          "--colors-color-palette-200": "var(--colors-zinc-200)",
          "--colors-color-palette-300": "var(--colors-zinc-300)",
          "--colors-color-palette-400": "var(--colors-zinc-400)",
          "--colors-color-palette-50": "var(--colors-zinc-50)",
          "--colors-color-palette-500": "var(--colors-zinc-500)",
          "--colors-color-palette-600": "var(--colors-zinc-600)",
          "--colors-color-palette-700": "var(--colors-zinc-700)",
          "--colors-color-palette-800": "var(--colors-zinc-800)",
          "--colors-color-palette-900": "var(--colors-zinc-900)",
          "--colors-color-palette-950": "var(--colors-zinc-950)",
        },
        "(colorPalette = gray)" => {
          "--colors-color-palette-100": "var(--colors-gray-100)",
          "--colors-color-palette-200": "var(--colors-gray-200)",
          "--colors-color-palette-300": "var(--colors-gray-300)",
          "--colors-color-palette-400": "var(--colors-gray-400)",
          "--colors-color-palette-50": "var(--colors-gray-50)",
          "--colors-color-palette-500": "var(--colors-gray-500)",
          "--colors-color-palette-600": "var(--colors-gray-600)",
          "--colors-color-palette-700": "var(--colors-gray-700)",
          "--colors-color-palette-800": "var(--colors-gray-800)",
          "--colors-color-palette-900": "var(--colors-gray-900)",
          "--colors-color-palette-950": "var(--colors-gray-950)",
        },
        "(colorPalette = slate)" => {
          "--colors-color-palette-100": "var(--colors-slate-100)",
          "--colors-color-palette-200": "var(--colors-slate-200)",
          "--colors-color-palette-300": "var(--colors-slate-300)",
          "--colors-color-palette-400": "var(--colors-slate-400)",
          "--colors-color-palette-50": "var(--colors-slate-50)",
          "--colors-color-palette-500": "var(--colors-slate-500)",
          "--colors-color-palette-600": "var(--colors-slate-600)",
          "--colors-color-palette-700": "var(--colors-slate-700)",
          "--colors-color-palette-800": "var(--colors-slate-800)",
          "--colors-color-palette-900": "var(--colors-slate-900)",
          "--colors-color-palette-950": "var(--colors-slate-950)",
        },
        "(colorPalette = deep)" => {
          "--colors-color-palette-test-pool-poller": "var(--colors-deep-test-pool-poller)",
          "--colors-color-palette-test-pool-tall": "var(--colors-deep-test-pool-tall)",
          "--colors-color-palette-test-yam": "var(--colors-deep-test-yam)",
        },
        "(colorPalette = deep.test)" => {
          "--colors-color-palette-pool-poller": "var(--colors-deep-test-pool-poller)",
          "--colors-color-palette-pool-tall": "var(--colors-deep-test-pool-tall)",
          "--colors-color-palette-yam": "var(--colors-deep-test-yam)",
        },
        "(colorPalette = deep.test.pool)" => {
          "--colors-color-palette-poller": "var(--colors-deep-test-pool-poller)",
          "--colors-color-palette-tall": "var(--colors-deep-test-pool-tall)",
        },
        "(colorPalette = primary)" => {
          "--colors-color-palette": "var(--colors-primary)",
        },
        "(colorPalette = secondary)" => {
          "--colors-color-palette": "var(--colors-secondary)",
        },
        "(colorPalette = complex)" => {
          "--colors-color-palette": "var(--colors-complex)",
        },
        "(colorPalette = surface)" => {
          "--colors-color-palette": "var(--colors-surface)",
        },
        "(colorPalette = button)" => {
          "--colors-color-palette-card-body": "var(--colors-button-card-body)",
          "--colors-color-palette-card-heading": "var(--colors-button-card-heading)",
          "--colors-color-palette-thick": "var(--colors-button-thick)",
        },
        "(colorPalette = button.card)" => {
          "--colors-color-palette-body": "var(--colors-button-card-body)",
          "--colors-color-palette-heading": "var(--colors-button-card-heading)",
        },
      }
    `)

    expect(utility.classNames).toMatchInlineSnapshot(`
      Map {
        "(marginLeft = auto)" => "ml_auto",
        "(marginLeft = sm)" => "ml_sm",
        "(marginLeft = md)" => "ml_md",
        "(marginRight = auto)" => "mr_auto",
        "(marginRight = sm)" => "mr_sm",
        "(marginRight = md)" => "mr_md",
        "(colorPalette = current)" => "color-palette_current",
        "(colorPalette = black)" => "color-palette_black",
        "(colorPalette = white)" => "color-palette_white",
        "(colorPalette = transparent)" => "color-palette_transparent",
        "(colorPalette = rose)" => "color-palette_rose",
        "(colorPalette = pink)" => "color-palette_pink",
        "(colorPalette = fuchsia)" => "color-palette_fuchsia",
        "(colorPalette = purple)" => "color-palette_purple",
        "(colorPalette = violet)" => "color-palette_violet",
        "(colorPalette = indigo)" => "color-palette_indigo",
        "(colorPalette = blue)" => "color-palette_blue",
        "(colorPalette = sky)" => "color-palette_sky",
        "(colorPalette = cyan)" => "color-palette_cyan",
        "(colorPalette = teal)" => "color-palette_teal",
        "(colorPalette = emerald)" => "color-palette_emerald",
        "(colorPalette = green)" => "color-palette_green",
        "(colorPalette = lime)" => "color-palette_lime",
        "(colorPalette = yellow)" => "color-palette_yellow",
        "(colorPalette = amber)" => "color-palette_amber",
        "(colorPalette = orange)" => "color-palette_orange",
        "(colorPalette = red)" => "color-palette_red",
        "(colorPalette = neutral)" => "color-palette_neutral",
        "(colorPalette = stone)" => "color-palette_stone",
        "(colorPalette = zinc)" => "color-palette_zinc",
        "(colorPalette = gray)" => "color-palette_gray",
        "(colorPalette = slate)" => "color-palette_slate",
        "(colorPalette = deep)" => "color-palette_deep",
        "(colorPalette = deep.test)" => "color-palette_deep.test",
        "(colorPalette = deep.test.pool)" => "color-palette_deep.test.pool",
        "(colorPalette = primary)" => "color-palette_primary",
        "(colorPalette = secondary)" => "color-palette_secondary",
        "(colorPalette = complex)" => "color-palette_complex",
        "(colorPalette = surface)" => "color-palette_surface",
        "(colorPalette = button)" => "color-palette_button",
        "(colorPalette = button.card)" => "color-palette_button.card",
      }
    `)

    expect(utility.transform('marginLeft', 'sm')).toMatchInlineSnapshot(`
      {
        "className": "ml_sm",
        "styles": {
          "marginLeft": "20px",
        },
      }
    `)

    expect(utility.transform('marginLeft', '40px')).toMatchInlineSnapshot(`
      {
        "className": "ml_40px",
        "styles": {
          "marginLeft": "40px",
        },
      }
    `)

    expect(utility.customValues).toMatchInlineSnapshot(`
      Map {
        "marginLeft" => "40px",
      }
    `)
  })

  test('allow retrieving the token object with the raw value', () => {
    const utility = new Utility({
      tokens: new TokenDictionary({
        tokens: { colors: { someColor: { value: '#aabbcc' } } },
      }),
      config: {
        backgroundColor: {
          shorthand: 'bgColor',
          className: 'bg',
          values: 'colors',
          transform(_, args) {
            const token = args.token.raw('colors.' + args.raw)
            return {
              backgroundColor: token?.value.replace('aa', 'ee'),
            }
          },
        },
      },
    })

    expect(utility.classNames).toMatchInlineSnapshot(`
      Map {
        "(backgroundColor = someColor)" => "bg_someColor",
        "(backgroundColor = colorPalette)" => "bg_colorPalette",
        "(colorPalette = someColor)" => "color-palette_someColor",
      }
    `)
    expect(utility.styles).toMatchInlineSnapshot(`
      Map {
        "(backgroundColor = someColor)" => {
          "backgroundColor": "#eebbcc",
        },
        "(backgroundColor = colorPalette)" => {
          "backgroundColor": "colors.colorPalette",
        },
        "(colorPalette = someColor)" => {
          "--colors-color-palette": "var(--colors-some-color)",
        },
      }
    `)
  })
})
