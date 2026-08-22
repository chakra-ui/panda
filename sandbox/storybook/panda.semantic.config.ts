export default {
  outdir: "styled-system",
  include: ["./stories/**/*.tsx"],
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],
  conditions: { extend: { _sunset: "[data-theme=sunset] &" } },
  theme: { extend: { semanticTokens: { colors: {
    bg:     { value: { base: "{colors.white}",     _dark: "{colors.gray.900}" } },
    text:   { value: { base: "{colors.gray.900}",  _dark: "{colors.gray.50}"  } },
    accent: { value: { base: "{colors.amber.500}", _dark: "{colors.amber.300}" } },
    muted:  { value: { base: "{colors.gray.100}",  _dark: "{colors.gray.800}" } },
    brand: {
      primary: {
        value: {
          base: "{colors.violet.600}",
          _dark: { base: "{colors.violet.400}", _sunset: "{colors.orange.300}" },
        },
      },
      subtle: { value: { base: "{colors.violet.100}", _dark: "{colors.violet.900}" } },
    },
  } } } },
  themes: { ocean: { semanticTokens: { colors: { accent: { value: { base: "{colors.sky.500}", _dark: "{colors.sky.300}" } } } } } },
}
