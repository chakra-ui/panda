// ../packages/types/src/config.ts
function defineConfig(config2) {
  return config2
}

var config = defineConfig({
  tokens: {
    colors: {
      red: {
        100: '#hex',
      },
    },
  },
  utilities: [
    {
      properties: {
        marginTop: {
          className: 'mt',
          values: 'spacing',
          transform(value) {
            return { marginTop: value }
          },
        },
      },
    },
  ],
})

export { config as default }
