import outdent from 'outdent'

export function generateTransform() {
  return outdent`
  import config from '../config'

  const utilities = config.utilities || {}
  
  const withoutSpace = (v) => v.replace(/\\s/g, '_')
  
  function transform(prop, value) {
    let className = \`\${prop}_\${withoutSpace(value)}\`
  
    let config = utilities[prop]
  
    if (config) {
      config = typeof config === 'string' ? { className: config } : config
  
      if (typeof config.className === 'function') {
        className = config.className(value, prop)
      } else {
        className = \`\${config.className}_\${withoutSpace(value)}\`
      }
    }
  
    return { className }
  }
  
  export { transform }  
      `
}
