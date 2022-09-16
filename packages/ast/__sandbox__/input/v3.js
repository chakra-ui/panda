// ../packages/types/src/config.ts
function defineConfig(config2) {
  return config2
}

const tokens = {
  colors: {
    red: {
      100: '#hex',
    },
  },
}

const margin = {
  properties: {
    marginTop: {
      className: 'mt',
      values: 'spacing',
      transform(value) {
        return { marginTop: value }
      },
    },
  },
}

var config = defineConfig({
  tokens,
  utilities: [margin],
})

export { config as default }
