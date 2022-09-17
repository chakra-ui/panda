import outdent from 'outdent'

export function generateTransform() {
  return outdent`
  import config from '../config'

  const utilities = Object.keys(config.utilities || []).reduce((acc, key) => {
    return Object.assign(acc, config.utilities[key])
  }, {})
  
  const clean = (value) => value.toString().replaceAll(' ', '_')
  
  function transform(prop, value) {
    let className = \`\${prop}_\${clean(value)}\`
  
    let config = utilities[prop]
  
    if (config) {
      config = typeof config === 'string' ? { className: config } : config
  
      if (typeof config.className === 'function') {
        className = config.className(value, prop)
      } else {
        className = \`\${config.className}_\${clean(value)}\`
      }
    }
  
    return { className }
  }
  
  export { transform }  
      `
}
