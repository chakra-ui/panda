import * as svelte from 'svelte/compiler'
import MagicString from 'magic-string'

export const svelteToTsx = (code: string) => {
  try {
    const parsed = svelte.parse(code)
    const fileStr = new MagicString(code)

    // remove the script tag
    if (parsed.instance && parsed.instance.content) {
      const content = parsed.instance.content as any as typeof parsed.instance // it's actually a `BaseNode` but the type isnt exported so..
      fileStr.update(parsed.instance.start, parsed.instance.end, code.slice(content.start, content.end))
    }

    const moduleContext = parsed.module ? fileStr.snip(parsed.module.start, parsed.module.end) : ''
    const scriptContent = parsed.instance ? fileStr.snip(parsed.instance.start, parsed.instance.end) : ''
    const templateContent =
      parsed.html.children
        ?.map((child) => fileStr.snip(child.start, child.end))
        .join('')
        .trimStart() ?? ''

    const transformed = new MagicString(
      `${moduleContext + '\n'}${scriptContent + '\n'}\nconst render = <div>${templateContent}</div>`,
    )

    return transformed.toString().trim()
  } catch (err) {
    return ''
  }
}
