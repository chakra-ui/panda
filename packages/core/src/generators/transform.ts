import outdent from 'outdent'

export function generateTransform(configPath: string) {
  return outdent`
      import config from '${configPath}'
  
      var transform = (prop, value) => {
        for (const utility of config.utilities) {
          for (const key in utility.properties) {
            if (prop === key) {
              let __config = utility.properties[key]
              __config =  typeof __config === "string" ? { className: __config } : __config
              
              const { className } = __config
              
              if (typeof className === "string") return { className }
              
              if (typeof className === "function") return { className: className(value, key) }
              
              return { className: \`\${className}_\${value}\` }
            }
          }
        }
        
        value = value.replaceAll(' ', '_')
        return { className: \`\${prop}_\${value}\` }
      }
  
      export {
        transform 
      }
      `
}
