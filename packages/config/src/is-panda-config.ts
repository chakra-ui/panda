const configs = ['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs']
const pandaConfigRegex = new RegExp(`panda.config(${configs.join('|')})$`)

export const isPandaConfig = (file: string) => pandaConfigRegex.test(file)
