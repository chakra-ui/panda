import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as GitHost from 'hosted-git-info'
import markdownit from 'markdown-it'
import mime from 'mime'
import parseSemver from 'parse-semver'
import * as path from 'path'
import * as semver from 'semver'
import * as url from 'url'
import * as yazl from 'yazl'
import { type ExtensionKind, type Manifest } from './manifest'
import * as util from './util'

interface IInMemoryFile {
  path: string
  mode?: number
  readonly contents: Buffer | string
}

interface ILocalFile {
  path: string
  mode?: number
  readonly localPath: string
}

export type IFile = IInMemoryFile | ILocalFile

function isInMemoryFile(file: IFile): file is IInMemoryFile {
  return !!(file as IInMemoryFile).contents
}

function read(file: IFile): Promise<string> {
  if (isInMemoryFile(file)) {
    return Promise.resolve(file.contents).then((b) => (typeof b === 'string' ? b : b.toString('utf8')))
  } else {
    return fs.promises.readFile(file.localPath, 'utf8')
  }
}

interface IAsset {
  type: string
  path: string
}

/**
 * Options for the `createVSIX` function.
 * @public
 */
export interface IPackageOptions {
  /**
   * The destination of the packaged the VSIX.
   *
   * Defaults to `NAME-VERSION.vsix`.
   */
  readonly packagePath?: string
  readonly version?: string

  /**
   * Optional target the extension should run on.
   *
   * https://code.visualstudio.com/api/working-with-extensions/publishing-extension#platformspecific-extensions
   */
  readonly target?: string
  readonly commitMessage?: string
  readonly gitTagVersion?: boolean
  readonly updatePackageJson?: boolean

  /**
   * The location of the extension in the file system.
   *
   * Defaults to `process.cwd()`.
   */
  readonly cwd?: string

  /**
   * GitHub branch used to publish the package. Used to automatically infer
   * the base content and images URI.
   */
  readonly githubBranch?: string

  /**
   * GitLab branch used to publish the package. Used to automatically infer
   * the base content and images URI.
   */
  readonly gitlabBranch?: string

  readonly rewriteRelativeLinks?: boolean
  /**
   * The base URL for links detected in Markdown files.
   */
  readonly baseContentUrl?: string

  /**
   * The base URL for images detected in Markdown files.
   */
  readonly baseImagesUrl?: string

  /**
   * Should use Yarn instead of NPM.
   */
  readonly useYarn?: boolean
  readonly dependencyEntryPoints?: string[]
  readonly ignoreFile?: string
  readonly gitHubIssueLinking?: boolean
  readonly gitLabIssueLinking?: boolean
  readonly dependencies?: boolean

  /**
   * Mark this package as a pre-release
   */
  readonly preRelease?: boolean
  readonly allowStarActivation?: boolean
  readonly allowMissingRepository?: boolean
}

interface IProcessor {
  onFile(file: IFile): Promise<IFile>
  onEnd(): Promise<void>
  assets: IAsset[]
  tags: string[]
  vsix: any
}

interface VSIX {
  id: string
  displayName: string
  version: string
  publisher: string
  target?: string
  engine: string
  description: string
  categories: string
  flags: string
  icon?: string
  license?: string
  assets: IAsset[]
  tags: string
  links: {
    repository?: string
    bugs?: string
    homepage?: string
    github?: string
  }
  galleryBanner: NonNullable<Manifest['galleryBanner']>
  badges?: Manifest['badges']
  githubMarkdown: boolean
  enableMarketplaceQnA?: boolean
  customerQnALink?: Manifest['qna']
  extensionDependencies: string
  extensionPack: string
  extensionKind: string
  localizedLanguages: string
  preRelease: boolean
  sponsorLink: string
  pricing: string
}

class BaseProcessor implements IProcessor {
  constructor(protected manifest: Manifest) {}
  assets: IAsset[] = []
  tags: string[] = []
  vsix: VSIX = Object.create(null)
  async onFile(file: IFile): Promise<IFile> {
    return file
  }
  async onEnd() {
    // noop
  }
}

// https://github.com/npm/cli/blob/latest/lib/utils/hosted-git-info-from-manifest.js
function getGitHost(manifest: Manifest): GitHost | undefined {
  const url = getRepositoryUrl(manifest)
  return url ? GitHost.fromUrl(url, { noGitPlus: true }) : undefined
}

// https://github.com/npm/cli/blob/latest/lib/repo.js
function getRepositoryUrl(manifest: Manifest, gitHost?: GitHost | null): string | undefined {
  if (gitHost) {
    return gitHost.https()
  }

  let url: string | undefined = undefined

  if (manifest.repository) {
    if (typeof manifest.repository === 'string') {
      url = manifest.repository
    } else if (
      typeof manifest.repository === 'object' &&
      manifest.repository.url &&
      typeof manifest.repository.url === 'string'
    ) {
      url = manifest.repository.url
    }
  }

  return url
}

// https://github.com/npm/cli/blob/latest/lib/bugs.js
function getBugsUrl(manifest: Manifest, gitHost: GitHost | undefined): string | undefined {
  if (manifest.bugs) {
    if (typeof manifest.bugs === 'string') {
      return manifest.bugs
    }
    if (typeof manifest.bugs === 'object' && manifest.bugs.url) {
      return manifest.bugs.url
    }
    if (typeof manifest.bugs === 'object' && manifest.bugs.email) {
      return `mailto:${manifest.bugs.email}`
    }
  }

  if (gitHost) {
    return gitHost.bugs()
  }

  return undefined
}

// https://github.com/npm/cli/blob/latest/lib/docs.js
function getHomepageUrl(manifest: Manifest, gitHost: GitHost | undefined): string | undefined {
  if (manifest.homepage) {
    return manifest.homepage
  }

  if (gitHost) {
    return gitHost.docs()
  }

  return undefined
}

// Contributed by Mozilla developer authors
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

function toExtensionTags(extensions: string[]): string[] {
  return extensions
    .map((s) => s.replace(/\W/g, ''))
    .filter((s) => !!s)
    .map((s) => `__ext_${s}`)
}

function toLanguagePackTags(translations: { id: string }[], languageId: string): string[] {
  return (translations ?? [])
    .map(({ id }) => [`__lp_${id}`, `__lp-${languageId}_${id}`])
    .reduce((r, t) => [...r, ...t], [])
}

/* This list is also maintained by the Marketplace team.
 * Remember to reach out to them when adding new domains.
 */
const TrustedSVGSources = [
  'api.bintray.com',
  'api.travis-ci.com',
  'api.travis-ci.org',
  'app.fossa.io',
  'badge.buildkite.com',
  'badge.fury.io',
  'badge.waffle.io',
  'badgen.net',
  'badges.frapsoft.com',
  'badges.gitter.im',
  'badges.greenkeeper.io',
  'cdn.travis-ci.com',
  'cdn.travis-ci.org',
  'ci.appveyor.com',
  'circleci.com',
  'cla.opensource.microsoft.com',
  'codacy.com',
  'codeclimate.com',
  'codecov.io',
  'coveralls.io',
  'david-dm.org',
  'deepscan.io',
  'dev.azure.com',
  'docs.rs',
  'flat.badgen.net',
  'gemnasium.com',
  'githost.io',
  'gitlab.com',
  'godoc.org',
  'goreportcard.com',
  'img.shields.io',
  'isitmaintained.com',
  'marketplace.visualstudio.com',
  'nodesecurity.io',
  'opencollective.com',
  'snyk.io',
  'travis-ci.com',
  'travis-ci.org',
  'visualstudio.com',
  'vsmarketplacebadges.dev',
  'www.bithound.io',
  'www.versioneye.com',
]

function isGitHubRepository(repository: string | undefined): boolean {
  return /^https:\/\/github\.com\/|^git@github\.com:/.test(repository ?? '')
}

function isGitLabRepository(repository: string | undefined): boolean {
  return /^https:\/\/gitlab\.com\/|^git@gitlab\.com:/.test(repository ?? '')
}

function isGitHubBadge(href: string): boolean {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/(actions\/)?workflows\/.*badge\.svg/.test(href || '')
}

function isHostTrusted(url: url.URL): boolean {
  return (url.host && TrustedSVGSources.indexOf(url.host.toLowerCase()) > -1) || isGitHubBadge(url.href)
}

export const Targets = new Set([
  'win32-x64',
  'win32-ia32',
  'win32-arm64',
  'linux-x64',
  'linux-arm64',
  'linux-armhf',
  'darwin-x64',
  'darwin-arm64',
  'alpine-x64',
  'alpine-arm64',
  'web',
])

class ManifestProcessor extends BaseProcessor {
  constructor(manifest: Manifest, private readonly options: IPackageOptions = {}) {
    super(manifest)

    const flags = ['Public']

    if (manifest.preview) {
      flags.push('Preview')
    }

    const gitHost = getGitHost(manifest)
    const repository = getRepositoryUrl(manifest, gitHost)
    const isGitHub = isGitHubRepository(repository)

    let enableMarketplaceQnA: boolean | undefined
    let customerQnALink: string | undefined

    if (manifest.qna === 'marketplace') {
      enableMarketplaceQnA = true
    } else if (typeof manifest.qna === 'string') {
      customerQnALink = manifest.qna
    } else if (manifest.qna === false) {
      enableMarketplaceQnA = false
    }

    const extensionKind = getExtensionKind(manifest)
    const target = options.target
    const preRelease = options.preRelease

    if (target || preRelease) {
      let engineVersion: string

      try {
        const engineSemver = parseSemver(`vscode@${manifest.engines['vscode']}`)
        engineVersion = engineSemver.version
      } catch (err) {
        throw new Error('Failed to parse semver of engines.vscode')
      }

      if (target) {
        if (engineVersion !== 'latest' && !semver.satisfies(engineVersion, '>=1.61', { includePrerelease: true })) {
          throw new Error(
            `Platform specific extension is supported by VS Code >=1.61. Current 'engines.vscode' is '${manifest.engines['vscode']}'.`,
          )
        }
        if (!Targets.has(target)) {
          throw new Error(`'${target}' is not a valid VS Code target. Valid targets: ${[...Targets].join(', ')}`)
        }
      }

      if (preRelease) {
        if (engineVersion !== 'latest' && !semver.satisfies(engineVersion, '>=1.63', { includePrerelease: true })) {
          throw new Error(
            `Pre-release versions are supported by VS Code >=1.63. Current 'engines.vscode' is '${manifest.engines['vscode']}'.`,
          )
        }
      }
    }

    this.vsix = {
      ...this.vsix,
      id: manifest.name,
      displayName: manifest.displayName ?? manifest.name,
      version: options.version && !(options.updatePackageJson ?? true) ? options.version : manifest.version,
      publisher: manifest.publisher,
      target,
      engine: manifest.engines['vscode'],
      description: manifest.description ?? '',
      pricing: manifest.pricing ?? 'Free',
      categories: (manifest.categories ?? []).join(','),
      flags: flags.join(' '),
      links: {
        repository,
        bugs: getBugsUrl(manifest, gitHost),
        homepage: getHomepageUrl(manifest, gitHost),
      },
      galleryBanner: manifest.galleryBanner ?? {},
      badges: manifest.badges,
      githubMarkdown: manifest.markdown !== 'standard',
      enableMarketplaceQnA,
      customerQnALink,
      extensionDependencies: [...new Set(manifest.extensionDependencies ?? [])].join(','),
      extensionPack: [...new Set(manifest.extensionPack ?? [])].join(','),
      extensionKind: extensionKind.join(','),
      localizedLanguages:
        manifest.contributes && manifest.contributes.localizations
          ? manifest.contributes.localizations
              .map((loc) => loc.localizedLanguageName ?? loc.languageName ?? loc.languageId)
              .join(',')
          : '',
      preRelease: !!this.options.preRelease,
      sponsorLink: manifest.sponsor?.url || '',
    }

    if (isGitHub) {
      this.vsix.links.github = repository
    }
  }

  async onFile(file: IFile): Promise<IFile> {
    const path = util.normalize(file.path)

    if (!/^extension\/package.json$/i.test(path)) {
      return Promise.resolve(file)
    }

    if (this.options.version && (this.options.updatePackageJson ?? true)) {
      console.log('Updating package.json version to', this.options.version)
      const contents = await read(file)
      const packageJson = JSON.parse(contents)
      packageJson.version = this.options.version
      packageJson.bundledDependencies = []
      file = { ...file, contents: JSON.stringify(packageJson, undefined, 2) }
    }

    // Ensure that package.json is writable as VS Code needs to
    // store metadata in the extracted file.
    return { ...file, mode: 0o100644 }
  }

  async onEnd(): Promise<void> {
    if (typeof this.manifest.extensionKind === 'string') {
      util.log.warn(
        `The 'extensionKind' property should be of type 'string[]'. Learn more at: https://aka.ms/vscode/api/incorrect-execution-location`,
      )
    }

    if (this.manifest.publisher === 'vscode-samples') {
      throw new Error(
        "It's not allowed to use the 'vscode-samples' publisher. Learn more at: https://code.visualstudio.com/api/working-with-extensions/publishing-extension.",
      )
    }

    if (!this.options.allowMissingRepository && !this.manifest.repository) {
      util.log.warn(`A 'repository' field is missing from the 'package.json' manifest file.`)

      if (!/^y$/i.test(await util.read('Do you want to continue? [y/N] '))) {
        throw new Error('Aborted')
      }
    }

    if (!this.options.allowStarActivation && this.manifest.activationEvents?.some((e) => e === '*')) {
      util.log.warn(
        `Using '*' activation is usually a bad idea as it impacts performance.\nMore info: https://code.visualstudio.com/api/references/activation-events#Start-up`,
      )

      if (!/^y$/i.test(await util.read('Do you want to continue? [y/N] '))) {
        throw new Error('Aborted')
      }
    }
  }
}

class TagsProcessor extends BaseProcessor {
  private static Keywords: Record<string, string[]> = {
    git: ['git'],
    npm: ['node'],
    spell: ['markdown'],
    bootstrap: ['bootstrap'],
    lint: ['linters'],
    linting: ['linters'],
    react: ['javascript'],
    js: ['javascript'],
    node: ['javascript', 'node'],
    'c++': ['c++'],
    Cplusplus: ['c++'],
    xml: ['xml'],
    angular: ['javascript'],
    jquery: ['javascript'],
    php: ['php'],
    python: ['python'],
    latex: ['latex'],
    ruby: ['ruby'],
    java: ['java'],
    erlang: ['erlang'],
    sql: ['sql'],
    nodejs: ['node'],
    'c#': ['c#'],
    css: ['css'],
    javascript: ['javascript'],
    ftp: ['ftp'],
    haskell: ['haskell'],
    unity: ['unity'],
    terminal: ['terminal'],
    powershell: ['powershell'],
    laravel: ['laravel'],
    meteor: ['meteor'],
    emmet: ['emmet'],
    eslint: ['linters'],
    tfs: ['tfs'],
    rust: ['rust'],
  }

  async onEnd(): Promise<void> {
    const keywords = this.manifest.keywords ?? []
    const contributes = this.manifest.contributes
    const activationEvents = this.manifest.activationEvents ?? []
    const doesContribute = (...properties: string[]) => {
      let obj = contributes
      for (const property of properties) {
        if (!obj) {
          return false
        }
        obj = obj[property]
      }
      return obj && obj.length > 0
    }

    const colorThemes = doesContribute('themes') ? ['theme', 'color-theme'] : []
    const iconThemes = doesContribute('iconThemes') ? ['theme', 'icon-theme'] : []
    const productIconThemes = doesContribute('productIconThemes') ? ['theme', 'product-icon-theme'] : []
    const snippets = doesContribute('snippets') ? ['snippet'] : []
    const keybindings = doesContribute('keybindings') ? ['keybindings'] : []
    const debuggers = doesContribute('debuggers') ? ['debuggers'] : []
    const json = doesContribute('jsonValidation') ? ['json'] : []
    const remoteMenu = doesContribute('menus', 'statusBar/remoteIndicator') ? ['remote-menu'] : []

    const localizationContributions = ((contributes && contributes['localizations']) ?? []).reduce<string[]>(
      (r, l) => [...r, `lp-${l.languageId}`, ...toLanguagePackTags(l.translations, l.languageId)],
      [],
    )

    const languageContributions = ((contributes && contributes['languages']) ?? []).reduce<string[]>(
      (r, l) => [...r, l.id, ...(l.aliases ?? []), ...toExtensionTags(l.extensions ?? [])],
      [],
    )

    const languageActivations = activationEvents
      .map((e) => /^onLanguage:(.*)$/.exec(e))
      .filter(util.nonnull)
      .map((r) => r[1])

    const grammars = ((contributes && contributes['grammars']) ?? []).map((g) => g.language)

    const description = this.manifest.description || ''
    const descriptionKeywords = Object.keys(TagsProcessor.Keywords).reduce<string[]>(
      (r, k) =>
        r.concat(
          new RegExp('\\b(?:' + escapeRegExp(k) + ')(?!\\w)', 'gi').test(description) ? TagsProcessor.Keywords[k] : [],
        ),
      [],
    )

    const webExtensionTags = isWebKind(this.manifest) ? ['__web_extension'] : []
    const sponsorTags = this.manifest.sponsor?.url ? ['__sponsor_extension'] : []

    const tags = new Set([
      ...keywords,
      ...colorThemes,
      ...iconThemes,
      ...productIconThemes,
      ...snippets,
      ...keybindings,
      ...debuggers,
      ...json,
      ...remoteMenu,
      ...localizationContributions,
      ...languageContributions,
      ...languageActivations,
      ...grammars,
      ...descriptionKeywords,
      ...webExtensionTags,
      ...sponsorTags,
    ])

    this.tags = [...tags].filter((tag) => !!tag)
  }
}

class MarkdownProcessor extends BaseProcessor {
  private baseContentUrl: string | undefined
  private baseImagesUrl: string | undefined
  private rewriteRelativeLinks: boolean
  private isGitHub: boolean
  private isGitLab: boolean
  private repositoryUrl: string | undefined
  private gitHubIssueLinking: boolean
  private gitLabIssueLinking: boolean

  constructor(
    manifest: Manifest,
    private name: string,
    private regexp: RegExp,
    private assetType: string,
    options: IPackageOptions = {},
  ) {
    super(manifest)

    const guess = this.guessBaseUrls(options.githubBranch || options.gitlabBranch)

    this.baseContentUrl = options.baseContentUrl || (guess && guess.content)
    this.baseImagesUrl = options.baseImagesUrl || options.baseContentUrl || (guess && guess.images)
    this.rewriteRelativeLinks = options.rewriteRelativeLinks ?? true
    this.repositoryUrl = guess && guess.repository
    this.isGitHub = isGitHubRepository(this.repositoryUrl)
    this.isGitLab = isGitLabRepository(this.repositoryUrl)
    this.gitHubIssueLinking = typeof options.gitHubIssueLinking === 'boolean' ? options.gitHubIssueLinking : true
    this.gitLabIssueLinking = typeof options.gitLabIssueLinking === 'boolean' ? options.gitLabIssueLinking : true
  }

  async onFile(file: IFile): Promise<IFile> {
    const urljoin = (await import('url-join')).default
    const filePath = util.normalize(file.path)

    if (!this.regexp.test(filePath)) {
      return Promise.resolve(file)
    }

    this.assets.push({ type: this.assetType, path: filePath })

    let contents = await read(file)

    if (/This is the README for your extension /.test(contents)) {
      throw new Error(
        `It seems the README.md still contains template text. Make sure to edit the README.md file before you package or publish your extension.`,
      )
    }

    if (this.rewriteRelativeLinks) {
      // eslint-disable-next-line no-useless-escape
      const markdownPathRegex = /(!?)\[([^\]\[]*|!\[[^\]\[]*]\([^\)]+\))\]\(([^\)]+)\)/g
      const urlReplace = (_: string, isImage: string, title: string, link: string) => {
        if (/^mailto:/i.test(link)) {
          return `${isImage}[${title}](${link})`
        }

        const isLinkRelative = !/^\w+:\/\//.test(link) && link[0] !== '#'

        if (!this.baseContentUrl && !this.baseImagesUrl) {
          const asset = isImage ? 'image' : 'link'

          if (isLinkRelative) {
            throw new Error(
              `Couldn't detect the repository where this extension is published. The ${asset} '${link}' will be broken in ${this.name}. GitHub/GitLab repositories will be automatically detected. Otherwise, please provide the repository URL in package.json or use the --baseContentUrl and --baseImagesUrl options.`,
            )
          }
        }

        title = title.replace(markdownPathRegex, urlReplace)
        const prefix = isImage ? this.baseImagesUrl : this.baseContentUrl

        if (!prefix || !isLinkRelative) {
          return `${isImage}[${title}](${link})`
        }

        return `${isImage}[${title}](${urljoin(prefix, path.posix.normalize(link))})`
      }

      // Replace Markdown links with urls
      contents = contents.replace(markdownPathRegex, urlReplace)

      // Replace <img> links with urls
      contents = contents.replace(/<img.+?src=["']([/.\w\s#-]+)['"].*?>/g, (all, link) => {
        const isLinkRelative = !/^\w+:\/\//.test(link) && link[0] !== '#'

        if (!this.baseImagesUrl && isLinkRelative) {
          throw new Error(
            `Couldn't detect the repository where this extension is published. The image will be broken in ${this.name}. GitHub/GitLab repositories will be automatically detected. Otherwise, please provide the repository URL in package.json or use the --baseContentUrl and --baseImagesUrl options.`,
          )
        }
        const prefix = this.baseImagesUrl

        if (!prefix || !isLinkRelative) {
          return all
        }

        return all.replace(link, urljoin(prefix, path.posix.normalize(link)))
      })

      if ((this.gitHubIssueLinking && this.isGitHub) || (this.gitLabIssueLinking && this.isGitLab)) {
        const markdownIssueRegex = /(\s|\n)([\w\d_-]+\/[\w\d_-]+)?#(\d+)\b/g
        const issueReplace = (
          all: string,
          prefix: string,
          ownerAndRepositoryName: string,
          issueNumber: string,
        ): string => {
          let result = all
          let owner: string | undefined
          let repositoryName: string | undefined

          if (ownerAndRepositoryName) {
            // prettier-ignore
            [owner, repositoryName] = ownerAndRepositoryName.split('/', 2)
          }

          if (owner && repositoryName && issueNumber) {
            // Issue in external repository
            const issueUrl = this.isGitHub
              ? urljoin('https://github.com', owner, repositoryName, 'issues', issueNumber)
              : urljoin('https://gitlab.com', owner, repositoryName, '-', 'issues', issueNumber)
            result = prefix + `[${owner}/${repositoryName}#${issueNumber}](${issueUrl})`
          } else if (!owner && !repositoryName && issueNumber && this.repositoryUrl) {
            // Issue in own repository
            result =
              prefix +
              `[#${issueNumber}](${
                this.isGitHub
                  ? urljoin(this.repositoryUrl, 'issues', issueNumber)
                  : urljoin(this.repositoryUrl, '-', 'issues', issueNumber)
              })`
          }

          return result
        }
        // Replace Markdown issue references with urls
        contents = contents.replace(markdownIssueRegex, issueReplace)
      }
    }

    const html = markdownit({ html: true }).render(contents)
    const $ = cheerio.load(html)

    if (this.rewriteRelativeLinks) {
      $('img').each((_, img) => {
        const rawSrc = $(img).attr('src')

        if (!rawSrc) {
          throw new Error(`Images in ${this.name} must have a source.`)
        }

        const src = decodeURI(rawSrc)
        const srcUrl = new url.URL(src)

        if (/^data:$/i.test(srcUrl.protocol) && /^image$/i.test(srcUrl.host) && /\/svg/i.test(srcUrl.pathname)) {
          throw new Error(`SVG data URLs are not allowed in ${this.name}: ${src}`)
        }

        if (!/^https:$/i.test(srcUrl.protocol)) {
          throw new Error(`Images in ${this.name} must come from an HTTPS source: ${src}`)
        }

        if (/\.svg$/i.test(srcUrl.pathname) && !isHostTrusted(srcUrl)) {
          throw new Error(
            `SVGs are restricted in ${this.name}; please use other file image formats, such as PNG: ${src}`,
          )
        }
      })
    }

    $('svg').each(() => {
      throw new Error(`SVG tags are not allowed in ${this.name}.`)
    })

    return {
      path: file.path,
      contents: Buffer.from(contents, 'utf8'),
    }
  }

  // GitHub heuristics
  private guessBaseUrls(
    githostBranch: string | undefined,
  ): { content: string; images: string; repository: string } | undefined {
    let repository = null

    if (typeof this.manifest.repository === 'string') {
      repository = this.manifest.repository
    } else if (this.manifest.repository && typeof this.manifest.repository['url'] === 'string') {
      repository = this.manifest.repository['url']
    }

    if (!repository) {
      return undefined
    }

    const gitHubRegex = /(?<domain>github(\.com\/|:))(?<project>(?:[^/]+)\/(?:[^/]+))(\/|$)/
    const gitLabRegex = /(?<domain>gitlab(\.com\/|:))(?<project>(?:[^/]+)(\/(?:[^/]+))+)(\/|$)/
    const match = (gitHubRegex.exec(repository) || gitLabRegex.exec(repository)) as unknown as {
      groups: Record<string, string>
    }

    if (!match) {
      return undefined
    }

    const project = match.groups.project.replace(/\.git$/i, '')
    const branchName = githostBranch ? githostBranch : 'HEAD'

    if (/^github/.test(match.groups.domain)) {
      return {
        content: `https://github.com/${project}/blob/${branchName}`,
        images: `https://github.com/${project}/raw/${branchName}`,
        repository: `https://github.com/${project}`,
      }
    } else if (/^gitlab/.test(match.groups.domain)) {
      return {
        content: `https://gitlab.com/${project}/-/blob/${branchName}`,
        images: `https://gitlab.com/${project}/-/raw/${branchName}`,
        repository: `https://gitlab.com/${project}`,
      }
    }

    return undefined
  }
}

class ReadmeProcessor extends MarkdownProcessor {
  constructor(manifest: Manifest, options: IPackageOptions = {}) {
    super(manifest, 'README.md', /^extension\/readme.md$/i, 'Microsoft.VisualStudio.Services.Content.Details', options)
  }
}
class ChangelogProcessor extends MarkdownProcessor {
  constructor(manifest: Manifest, options: IPackageOptions = {}) {
    super(
      manifest,
      'CHANGELOG.md',
      /^extension\/changelog.md$/i,
      'Microsoft.VisualStudio.Services.Content.Changelog',
      options,
    )
  }
}

class LicenseProcessor extends BaseProcessor {
  private didFindLicense = false
  private expectedLicenseName: string
  filter: (name: string) => boolean

  constructor(manifest: Manifest) {
    super(manifest)

    const match = /^SEE LICENSE IN (.*)$/.exec(manifest.license || '')

    if (!match || !match[1]) {
      this.expectedLicenseName = 'LICENSE.md, LICENSE.txt or LICENSE'
      this.filter = (name) => /^extension\/license(\.(md|txt))?$/i.test(name)
    } else {
      this.expectedLicenseName = match[1]
      const regexp = new RegExp('^extension/' + match[1] + '$')
      this.filter = regexp.test.bind(regexp)
    }

    delete this.vsix.license
  }

  onFile(file: IFile): Promise<IFile> {
    if (!this.didFindLicense) {
      let normalizedPath = util.normalize(file.path)

      if (this.filter(normalizedPath)) {
        if (!path.extname(normalizedPath)) {
          file.path += '.txt'
          normalizedPath += '.txt'
        }

        this.assets.push({ type: 'Microsoft.VisualStudio.Services.Content.License', path: normalizedPath })
        this.vsix.license = normalizedPath
        this.didFindLicense = true
      }
    }

    return Promise.resolve(file)
  }

  async onEnd(): Promise<void> {
    if (!this.didFindLicense) {
      util.log.warn(`${this.expectedLicenseName} not found`)

      if (!/^y$/i.test(await util.read('Do you want to continue? [y/N] '))) {
        throw new Error('Aborted')
      }
    }
  }
}

class LaunchEntryPointProcessor extends BaseProcessor {
  private entryPoints: Set<string> = new Set<string>()

  constructor(manifest: Manifest) {
    super(manifest)
    if (manifest.main) {
      this.entryPoints.add(util.normalize(path.join('extension', this.appendJSExt(manifest.main))))
    }
    if (manifest.browser) {
      this.entryPoints.add(util.normalize(path.join('extension', this.appendJSExt(manifest.browser))))
    }
  }

  appendJSExt(filePath: string): string {
    if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
      return filePath
    }
    return filePath + '.js'
  }

  onFile(file: IFile): Promise<IFile> {
    this.entryPoints.delete(util.normalize(file.path))
    return Promise.resolve(file)
  }

  async onEnd(): Promise<void> {
    if (this.entryPoints.size > 0) {
      const files: string = [...this.entryPoints].join(',\n  ')
      throw new Error(
        `Extension entrypoint(s) missing. Make sure these files exist and aren't ignored by '.vscodeignore':\n  ${files}`,
      )
    }
  }
}

class IconProcessor extends BaseProcessor {
  private icon: string | undefined
  private didFindIcon = false

  constructor(manifest: Manifest) {
    super(manifest)

    this.icon = manifest.icon && path.posix.normalize(`extension/${manifest.icon}`)
    delete this.vsix.icon
  }

  onFile(file: IFile): Promise<IFile> {
    const normalizedPath = util.normalize(file.path)
    if (normalizedPath === this.icon) {
      this.didFindIcon = true
      this.assets.push({ type: 'Microsoft.VisualStudio.Services.Icons.Default', path: normalizedPath })
      this.vsix.icon = this.icon
    }
    return Promise.resolve(file)
  }

  async onEnd(): Promise<void> {
    if (this.icon && !this.didFindIcon) {
      return Promise.reject(new Error(`The specified icon '${this.icon}' wasn't found in the extension.`))
    }
  }
}

function isWebKind(manifest: Manifest): boolean {
  const extensionKind = getExtensionKind(manifest)
  return extensionKind.some((kind) => kind === 'web')
}

const extensionPointExtensionKindsMap = new Map<string, ExtensionKind[]>()
extensionPointExtensionKindsMap.set('jsonValidation', ['workspace', 'web'])
extensionPointExtensionKindsMap.set('localizations', ['ui', 'workspace'])
extensionPointExtensionKindsMap.set('debuggers', ['workspace'])
extensionPointExtensionKindsMap.set('terminal', ['workspace'])
extensionPointExtensionKindsMap.set('typescriptServerPlugins', ['workspace'])
extensionPointExtensionKindsMap.set('markdown.previewStyles', ['workspace', 'web'])
extensionPointExtensionKindsMap.set('markdown.previewScripts', ['workspace', 'web'])
extensionPointExtensionKindsMap.set('markdown.markdownItPlugins', ['workspace', 'web'])
extensionPointExtensionKindsMap.set('html.customData', ['workspace', 'web'])
extensionPointExtensionKindsMap.set('css.customData', ['workspace', 'web'])

function getExtensionKind(manifest: Manifest): ExtensionKind[] {
  const deduced = deduceExtensionKinds(manifest)

  // check the manifest
  if (manifest.extensionKind) {
    const result: ExtensionKind[] = Array.isArray(manifest.extensionKind)
      ? manifest.extensionKind
      : manifest.extensionKind === 'ui'
      ? ['ui', 'workspace']
      : [manifest.extensionKind]

    // Add web kind if the extension can run as web extension
    if (deduced.includes('web') && !result.includes('web')) {
      result.push('web')
    }

    return result
  }

  return deduced
}

function deduceExtensionKinds(manifest: Manifest): ExtensionKind[] {
  // Not an UI extension if it has main
  if (manifest.main) {
    if (manifest.browser) {
      return ['workspace', 'web']
    }
    return ['workspace']
  }

  if (manifest.browser) {
    return ['web']
  }

  let result: ExtensionKind[] = ['ui', 'workspace', 'web']

  const isNonEmptyArray = (obj: any) => Array.isArray(obj) && obj.length > 0
  // Extension pack defaults to workspace,web extensionKind
  if (isNonEmptyArray(manifest.extensionPack) || isNonEmptyArray(manifest.extensionDependencies)) {
    result = ['workspace', 'web']
  }

  if (manifest.contributes) {
    for (const contribution of Object.keys(manifest.contributes)) {
      const supportedExtensionKinds = extensionPointExtensionKindsMap.get(contribution)
      if (supportedExtensionKinds) {
        result = result.filter((extensionKind) => supportedExtensionKinds.indexOf(extensionKind) !== -1)
      }
    }
  }

  return result
}

class NLSProcessor extends BaseProcessor {
  private translations: { [path: string]: string } = Object.create(null)

  constructor(manifest: Manifest) {
    super(manifest)

    if (
      !manifest.contributes ||
      !manifest.contributes.localizations ||
      manifest.contributes.localizations.length === 0
    ) {
      return
    }

    const localizations = manifest.contributes.localizations
    const translations: { [languageId: string]: string } = Object.create(null)

    // take last reference in the manifest for any given language
    for (const localization of localizations) {
      for (const translation of localization.translations) {
        if (translation.id === 'vscode' && !!translation.path) {
          // eslint-disable-next-line no-useless-escape
          const translationPath = util.normalize(translation.path.replace(/^\.[\/\\]/, ''))
          translations[localization.languageId.toUpperCase()] = `extension/${translationPath}`
        }
      }
    }

    // invert the map for later easier retrieval
    for (const languageId of Object.keys(translations)) {
      this.translations[translations[languageId]] = languageId
    }
  }

  onFile(file: IFile): Promise<IFile> {
    const normalizedPath = util.normalize(file.path)
    const language = this.translations[normalizedPath]

    if (language) {
      this.assets.push({ type: `Microsoft.VisualStudio.Code.Translation.${language}`, path: normalizedPath })
    }

    return Promise.resolve(file)
  }
}

class ValidationProcessor extends BaseProcessor {
  private files = new Map<string, string[]>()
  private duplicates = new Set<string>()

  async onFile(file: IFile): Promise<IFile> {
    const lower = file.path.toLowerCase()
    const existing = this.files.get(lower)

    if (existing) {
      this.duplicates.add(lower)
      existing.push(file.path)
    } else {
      this.files.set(lower, [file.path])
    }

    return file
  }

  async onEnd() {
    if (this.duplicates.size === 0) {
      return
    }

    const messages = [
      `The following files have the same case insensitive path, which isn't supported by the VSIX format:`,
    ]

    for (const lower of this.duplicates) {
      for (const filePath of this.files.get(lower)!) {
        messages.push(`  - ${filePath}`)
      }
    }

    throw new Error(messages.join('\n'))
  }
}

const escapeChars = new Map([
  ["'", '&apos;'],
  ['"', '&quot;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],
])

function escape(value: any): string {
  return String(value).replace(/(['"<>&])/g, (_, char) => escapeChars.get(char)!)
}

async function toVsixManifest(vsix: VSIX): Promise<string> {
  return `<?xml version="1.0" encoding="utf-8"?>
	<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
		<Metadata>
			<Identity Language="en-US" Id="${escape(vsix.id)}" Version="${escape(vsix.version)}" Publisher="${escape(
    vsix.publisher,
  )}" ${vsix.target ? `TargetPlatform="${escape(vsix.target)}"` : ''}/>
			<DisplayName>${escape(vsix.displayName)}</DisplayName>
			<Description xml:space="preserve">${escape(vsix.description)}</Description>
			<Tags>${escape(vsix.tags)}</Tags>
			<Categories>${escape(vsix.categories)}</Categories>
			<GalleryFlags>${escape(vsix.flags)}</GalleryFlags>
			${
        !vsix.badges
          ? ''
          : `<Badges>${vsix.badges
              .map(
                (badge) =>
                  `<Badge Link="${escape(badge.href)}" ImgUri="${escape(badge.url)}" Description="${escape(
                    badge.description,
                  )}" />`,
              )
              .join('\n')}</Badges>`
      }
			<Properties>
				<Property Id="Microsoft.VisualStudio.Code.Engine" Value="${escape(vsix.engine)}" />
				<Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="${escape(vsix.extensionDependencies)}" />
				<Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="${escape(vsix.extensionPack)}" />
				<Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="${escape(vsix.extensionKind)}" />
				<Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="${escape(vsix.localizedLanguages)}" />
				${vsix.preRelease ? `<Property Id="Microsoft.VisualStudio.Code.PreRelease" Value="${escape(vsix.preRelease)}" />` : ''}
				${
          vsix.sponsorLink
            ? `<Property Id="Microsoft.VisualStudio.Code.SponsorLink" Value="${escape(vsix.sponsorLink)}" />`
            : ''
        }
				${
          !vsix.links.repository
            ? ''
            : `<Property Id="Microsoft.VisualStudio.Services.Links.Source" Value="${escape(vsix.links.repository)}" />
				<Property Id="Microsoft.VisualStudio.Services.Links.Getstarted" Value="${escape(vsix.links.repository)}" />
				${
          vsix.links.github
            ? `<Property Id="Microsoft.VisualStudio.Services.Links.GitHub" Value="${escape(vsix.links.github)}" />`
            : `<Property Id="Microsoft.VisualStudio.Services.Links.Repository" Value="${escape(
                vsix.links.repository,
              )}" />`
        }`
        }
				${
          vsix.links.bugs
            ? `<Property Id="Microsoft.VisualStudio.Services.Links.Support" Value="${escape(vsix.links.bugs)}" />`
            : ''
        }
				${
          vsix.links.homepage
            ? `<Property Id="Microsoft.VisualStudio.Services.Links.Learn" Value="${escape(vsix.links.homepage)}" />`
            : ''
        }
				${
          vsix.galleryBanner.color
            ? `<Property Id="Microsoft.VisualStudio.Services.Branding.Color" Value="${escape(
                vsix.galleryBanner.color,
              )}" />`
            : ''
        }
				${
          vsix.galleryBanner.theme
            ? `<Property Id="Microsoft.VisualStudio.Services.Branding.Theme" Value="${escape(
                vsix.galleryBanner.theme,
              )}" />`
            : ''
        }
				<Property Id="Microsoft.VisualStudio.Services.GitHubFlavoredMarkdown" Value="${escape(vsix.githubMarkdown)}" />
				<Property Id="Microsoft.VisualStudio.Services.Content.Pricing" Value="${escape(vsix.pricing)}"/>

				${
          vsix.enableMarketplaceQnA !== undefined
            ? `<Property Id="Microsoft.VisualStudio.Services.EnableMarketplaceQnA" Value="${escape(
                vsix.enableMarketplaceQnA,
              )}" />`
            : ''
        }
				${
          vsix.customerQnALink !== undefined
            ? `<Property Id="Microsoft.VisualStudio.Services.CustomerQnALink" Value="${escape(
                vsix.customerQnALink,
              )}" />`
            : ''
        }
			</Properties>
			${vsix.license ? `<License>${escape(vsix.license)}</License>` : ''}
			${vsix.icon ? `<Icon>${escape(vsix.icon)}</Icon>` : ''}
		</Metadata>
		<Installation>
			<InstallationTarget Id="Microsoft.VisualStudio.Code"/>
		</Installation>
		<Dependencies/>
		<Assets>
			<Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
			${vsix.assets
        .map((asset) => `<Asset Type="${escape(asset.type)}" Path="${escape(asset.path)}" Addressable="true" />`)
        .join('\n')}
		</Assets>
	</PackageManifest>`
}

const defaultMimetypes = new Map<string, string>([
  ['.json', 'application/json'],
  ['.vsixmanifest', 'text/xml'],
])

async function toContentTypes(files: IFile[]): Promise<string> {
  const mimetypes = new Map<string, string>(defaultMimetypes)

  for (const file of files) {
    const ext = path.extname(file.path).toLowerCase()

    if (ext) {
      mimetypes.set(ext, mime.lookup(ext))
    }
  }

  const contentTypes: string[] = []
  for (const [extension, contentType] of mimetypes) {
    contentTypes.push(`<Default Extension="${extension}" ContentType="${contentType}"/>`)
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${contentTypes.join('')}</Types>
`
}

export function processFiles(processors: IProcessor[], files: IFile[]): Promise<IFile[]> {
  const processedFiles = files.map((file) => util.chain(file, processors, (file, processor) => processor.onFile(file)))

  return Promise.all(processedFiles).then((files) => {
    return util.sequence(processors.map((p) => () => p.onEnd())).then(() => {
      const assets = processors.reduce<IAsset[]>((r, p) => [...r, ...p.assets], [])
      const tags = [
        ...processors.reduce<Set<string>>((r, p) => {
          for (const tag of p.tags) {
            if (tag) {
              r.add(tag)
            }
          }
          return r
        }, new Set()),
      ].join(',')
      const vsix = processors.reduce<VSIX>((r, p) => ({ ...r, ...p.vsix }), { assets, tags } as VSIX)

      return Promise.all([toVsixManifest(vsix), toContentTypes(files)]).then((result) => {
        return [
          { path: 'extension.vsixmanifest', contents: Buffer.from(result[0], 'utf8') },
          { path: '[Content_Types].xml', contents: Buffer.from(result[1], 'utf8') },
          ...files,
        ]
      })
    })
  })
}

export function createDefaultProcessors(manifest: Manifest, options: IPackageOptions = {}): IProcessor[] {
  return [
    new ManifestProcessor(manifest, options),
    new TagsProcessor(manifest),
    new ReadmeProcessor(manifest, options),
    new ChangelogProcessor(manifest, options),
    new LaunchEntryPointProcessor(manifest),
    new LicenseProcessor(manifest),
    new IconProcessor(manifest),
    new NLSProcessor(manifest),
    new ValidationProcessor(manifest),
  ]
}
export function writeVsix(files: IFile[], packagePath: string): Promise<void> {
  console.log('Writing VSIX package...')
  return fs.promises
    .unlink(packagePath)
    .catch((err) => (err.code !== 'ENOENT' ? Promise.reject(err) : Promise.resolve(null)))
    .then(
      () =>
        new Promise((c, e) => {
          const zip = new yazl.ZipFile()
          files.forEach((f) =>
            isInMemoryFile(f)
              ? zip.addBuffer(typeof f.contents === 'string' ? Buffer.from(f.contents, 'utf8') : f.contents, f.path, {
                  mode: f.mode,
                })
              : zip.addFile(f.localPath, f.path, { mode: f.mode }),
          )
          zip.end()

          const zipStream = fs.createWriteStream(packagePath)
          zip.outputStream.pipe(zipStream)

          zip.outputStream.once('error', e)
          zipStream.once('error', e)
          zipStream.once('finish', () => c())
        }),
    )
}
