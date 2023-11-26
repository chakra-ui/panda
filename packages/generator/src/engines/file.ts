import type { UserConfig } from '@pandacss/types'

export class FileEngine {
  constructor(private config: UserConfig) {}

  private get forceConsistentTypeExtension() {
    return this.config.forceConsistentTypeExtension || false
  }

  private get outExtension() {
    return this.config.outExtension
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
}
