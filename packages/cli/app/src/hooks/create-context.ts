import { createContext as createReactContext, useContext as useReactContext } from 'react'

function getErrorMessage(hook: string, provider: string) {
  return `${hook} returned \`undefined\`. Seems you forgot to wrap component within ${provider}`
}
export function createContext<T>(
  options: { name: string; strict?: boolean; hookName?: string; providerName?: string; errorMessage?: string } = {
    name: '',
  },
) {
  const { name, strict = true, hookName = 'useContext', providerName = 'Provider', errorMessage } = options
  const Context = createReactContext<T>(undefined as T)
  Context.displayName = name

  function useContext() {
    const context = useReactContext(Context)
    if (!context && strict) {
      const error = new Error(errorMessage ?? getErrorMessage(hookName, providerName))
      error.name = 'ContextError'
      Error.captureStackTrace?.(error, useContext)
      throw error
    }
    return context
  }

  return [Context.Provider, useContext, Context] as const
}
