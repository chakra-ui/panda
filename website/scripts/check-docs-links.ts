/**
 * Validates internal links inside website/content/docs/**\/*.mdx and guards against
 * sidebar/search drift.
 *
 * A `/docs/:path*.mdx` request is rewritten (see next.config) to the llms.txt raw-markdown
 * route, so a literal `.md`/`.mdx` suffix on a `/docs/...` link doesn't 404 — it silently
 * serves a raw-text dump instead of the rendered page. That's only intentional in
 * llms-txt.mdx, which documents the feature; everywhere else it's a mistake.
 *
 * Run: pnpm check-docs-links
 */
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import GithubSlugger from 'github-slugger'
import { docsTabs, installationGuideUrls } from '../src/docs.config'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DOCS_ROOT = path.resolve(SCRIPT_DIR, '../content/docs')
const RAW_MARKDOWN_EXCEPTION_SLUG = 'styling/llms-txt'

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith('.mdx')) out.push(full)
  }
  return out
}

function toSlug(file: string): string {
  return path
    .relative(DOCS_ROOT, file)
    .replace(/\.mdx$/, '')
    .split(path.sep)
    .join('/')
}

function stripInlineMarkup(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
}

function headingIds(content: string): Set<string> {
  const slugger = new GithubSlugger()
  const ids = new Set<string>()
  let inFence = false
  for (const line of content.split('\n')) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = line.match(/^#{1,6}\s+(.+?)\s*$/)
    if (m) ids.add(slugger.slug(stripInlineMarkup(m[1])))
  }
  return ids
}

const files = walk(DOCS_ROOT)
const slugs = new Set(files.map(toSlug))
const headingsBySlug = new Map(
  files.map(file => [toSlug(file), headingIds(fs.readFileSync(file, 'utf8'))])
)

const linkRe = /\]\(((?:\/docs\/[^)#\s]+)?)(#[^)\s]*)?\)/g
const errors: string[] = []
let linksChecked = 0

for (const file of files) {
  const slug = toSlug(file)
  const content = fs.readFileSync(file, 'utf8')
  const re = new RegExp(linkRe)
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    const [, pathPart, fragment] = m
    if (!pathPart && !fragment) continue
    linksChecked++

    const lineNo = content.slice(0, m.index).split('\n').length
    const where = `${slug}.mdx:${lineNo}`

    if (pathPart) {
      const hasFileExtension = /\.mdx?$/.test(pathPart)
      if (hasFileExtension && slug !== RAW_MARKDOWN_EXCEPTION_SLUG) {
        errors.push(
          `${where}  ${pathPart}${fragment ?? ''} — literal .md/.mdx suffix hits the ` +
            `llms.txt raw-markdown rewrite instead of the rendered page (only ` +
            `${RAW_MARKDOWN_EXCEPTION_SLUG}.mdx is allowed to use this intentionally)`
        )
        continue
      }

      const targetSlug = pathPart
        .replace(/^\/docs\//, '')
        .replace(/\/$/, '')
        .replace(/\.mdx?$/, '')

      if (!slugs.has(targetSlug)) {
        errors.push(`${where}  ${pathPart}${fragment ?? ''} — no doc at slug "${targetSlug}"`)
        continue
      }

      if (fragment) {
        const frag = fragment.slice(1)
        if (!headingsBySlug.get(targetSlug)?.has(frag)) {
          errors.push(
            `${where}  ${pathPart}${fragment} — no heading "${frag}" in ${targetSlug}.mdx`
          )
        }
      }
    } else if (fragment) {
      const frag = fragment.slice(1)
      if (!headingsBySlug.get(slug)?.has(frag)) {
        errors.push(`${where}  ${fragment} — no heading "${frag}" in this page`)
      }
    }
  }
}

// Guard against sidebar/search drift: every on-disk doc must be reachable from docsTabs or
// installationGuideUrls, or search (which indexes the full unfiltered doc collection) can
// surface a page the sidebar can't.
const navSlugs = new Set<string>()
for (const tab of docsTabs) {
  for (const group of tab.items) {
    for (const page of group.items ?? []) {
      if (page.url) navSlugs.add(`${tab.key}/${page.url}`)
    }
  }
}
const installSlugs = new Set(installationGuideUrls.map(u => `styling/${u}`))

const orphans = [...slugs].filter(s => !navSlugs.has(s) && !installSlugs.has(s))
const danglingNavEntries = [...navSlugs, ...installSlugs].filter(s => !slugs.has(s))

for (const slug of orphans) {
  errors.push(
    `${slug}.mdx — on disk but not reachable from docsTabs or installationGuideUrls in ` +
      `docs.config.tsx (search will surface it; the sidebar won't)`
  )
}
for (const slug of danglingNavEntries) {
  errors.push(`docs.config.tsx references "${slug}" but no such file exists under content/docs`)
}

console.log(
  `Checked ${files.length} docs files, ${linksChecked} internal links, ` +
    `${navSlugs.size} sidebar entries + ${installSlugs.size} installation-guide entries.`
)

if (errors.length) {
  console.error(`\n${errors.length} problem(s) found:\n`)
  for (const e of errors) console.error(`  ${e}`)
  process.exitCode = 1
} else {
  console.log('No broken links or orphaned pages found.')
}
