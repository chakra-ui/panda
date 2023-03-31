export const createLogScope = (scope: string) => {
  const fn = (subScope: string) => `${scope}/${subScope}`
  fn.toString = () => scope
  return fn
}
