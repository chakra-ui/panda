import { isString } from '@pandacss/shared'
import type { Context } from './context'

export class FileEngine {
  constructor(private context: Pick<Context, 'config'>) {}

  private get forceConsistentTypeExtension() {
    return this.context.config.forceConsistentTypeExtension || false
  }

  private get outExtension() {
    return this.context.config.outExtension
  }

  ext(file: string): string {
    return `${file}.${this.outExtension}`
  }

  extDts(file: string): string {
    const dts = this.outExtension === 'mjs' && this.forceConsistentTypeExtension ? 'd.mts' : 'd.ts'
    return `${file}.${dts}`
  }

  private __extDts(file: string): string {
    return this.forceConsistentTypeExtension ? this.extDts(file) : file
  }

  import(mod: string, file: string): string {
    return `import { ${mod} } from '${this.ext(file)}';`
  }

  importType(mod: string, file: string): string {
    return `import type { ${mod} } from '${this.__extDts(file)}';`
  }

  exportType(mod: string, file: string): string {
    return `export type { ${mod} } from '${this.__extDts(file)}';`
  }

  exportStar(file: string): string {
    return `export * from '${this.ext(file)}';`
  }

  exportTypeStar(file: string): string {
    return `export * from '${this.__extDts(file)}';`
  }

  isTypeFile(file: string): boolean {
    return file.endsWith('.d.ts') || file.endsWith('.d.mts')
  }

  jsDocComment(comment: string | undefined, options?: { deprecated?: boolean | string; default?: string }): string {
    const { deprecated, default: defaultValue } = options ?? {}
    if (!comment && !deprecated && !defaultValue) return ''

    const comments: string[] = ['/**']

    if (comment) {
      comments.push(` * ${comment}`, '\n')
    }

    if (deprecated) {
      const suffix = isString(deprecated) ? ` ${deprecated}` : ''
      comments.push(` * @deprecated${suffix}`)
    }

    if (defaultValue) {
      comments.push(` * @default ${defaultValue}`)
    }

    comments.push(' */')
    return comments.join('\n')
  }

  /**
   * convert import type { CompositionStyleObject } from './system-types'
   * to import type { CompositionStyleObject } from './system-types.d.ts'
   */
  rewriteTypeImport(code: string) {
    return code.replace(/import\s+type\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, this.importType('$1', '$2'))
  }
}
