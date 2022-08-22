import outdent from 'outdent'

export function generateTransform(configPath: string) {
  return outdent`
      import config from '${configPath}'
  
      var transform = (prop, value) => {
        for (const utility of config.utilities) {
          for (const key in utility.properties) {
            if (prop === key) {
              const { className } = utility.properties[key]
              return { className: typeof className === 'string' ? \`\${className}_\${value}\` : className }
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
