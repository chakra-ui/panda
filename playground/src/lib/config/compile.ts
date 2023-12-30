import { evalConfig } from '@/src/lib/config/eval-config'

export const compile = async (_config: string) => {
  try {
    const newUserConfig = evalConfig(_config)
    if (newUserConfig) return newUserConfig
  } catch (_error: any) {
    console.log('_error', _error)
  }
}
