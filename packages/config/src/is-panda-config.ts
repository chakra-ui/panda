const configName = 'panda'

const pandaConfigFiles = new Set([
  `${configName}.config.ts`,
  `${configName}.config.js`,
  `${configName}.config.mts`,
  `${configName}.config.mjs`,
  `${configName}.config.cts`,
  `${configName}.config.cjs`,
])

export const isPandaConfig = (file: string) => pandaConfigFiles.has(file)
