import { readFileSync } from 'node:fs'
import { join } from 'path'

import { Project as TsProject } from 'ts-morph'

const createTsProject = () =>
  new TsProject({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    useInMemoryFileSystem: true,
    compilerOptions: {
      skipLibCheck: true,
    },
  })

const input = 'csstype.d.ts'
const inputPath = join(__dirname, '..', 'src', input)
const interfaces = [
  'StandardLonghandProperties',
  'StandardShorthandProperties',
  'VendorLonghandProperties',
  'VendorShorthandProperties',
]

/**
 * Returns a map of <CSS prop, matching comment>
 */
export const getCssTypesComments = () => {
  const project = createTsProject()
  const content = readFileSync(inputPath, 'utf8')
  const sourceFile = project.createSourceFile(inputPath, content)

  const propsComment = {} as Record<string, string>
  interfaces.forEach((interfaceName) => {
    const interfaceDeclaration = sourceFile.getInterface(interfaceName)
    if (!interfaceDeclaration) return

    const interfaceProps = interfaceDeclaration.getProperties()
    interfaceProps.forEach((prop) => {
      const [range] = prop.getLeadingCommentRanges()
      if (!range) return

      const comment = range.getText()
      propsComment[prop.getName()] = comment
    })
  })

  return propsComment
}

getCssTypesComments()
