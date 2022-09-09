import outdent from 'outdent'

export function generateTransform() {
  return outdent`
      import config from '../config.min'
      
      const utilities = config.utilities ?? []

      var transform = (prop, value) => {
        for (const utility of utilities) {
          for (const key in utility.properties) {
            if (prop === key) {
              let conf = utility.properties[key]
              conf =  typeof conf === "string" ? { className: conf } : conf
              
              const { className } = conf

              if (typeof className === 'function') {
                return { className: className(value, key) }
              }
              
              value = value.toString().replaceAll(' ', '_')
              return { className: \`\${className}_\${value}\` }
            }
          }
        }
        
        value = value.toString().replaceAll(' ', '_')
        return { className: \`\${prop}_\${value}\` }
      }
  
      export {
        transform 
      }
      `
}
