import { PageMapItem, Item, PageItem, PageTheme } from '@/types/nextra'

interface NormalizeInput {
  list: PageMapItem[]
  locale: string
  defaultLocale: string
  route: string
}

interface NormalizeOutput {
  activeType: 'page' | 'doc'
  activeIndex: number
  activeThemeContext: PageTheme
  activePath: Item[]
  topLevelNavbarItems: Item[]
  docsDirectories: PageItem[]
  flatDirectories: Item[]
  flatDocsDirectories: Item[]
  directories: Item[]
}

/**
 * Simplified implementation of nextra's normalizePages function
 * This is a basic version that processes the page map and returns the expected structure
 */
export function normalizePages(input: NormalizeInput): NormalizeOutput {
  const { list, locale, defaultLocale, route } = input

  // Convert PageMapItem to Item/PageItem
  const convertPageMapToItems = (items: PageMapItem[]): Item[] => {
    return items.map(item => ({
      name: item.name,
      route: item.route || `/${item.name}`,
      title: item.name,
      type: item.kind === 'Folder' ? 'folder' : 'page',
      children: item.children ? convertPageMapToItems(item.children) : undefined,
      isUnderCurrentDocsTree: true
    }))
  }

  const directories = convertPageMapToItems(list)
  const flatDirectories = flattenDirectories(directories)
  
  // Find docs directories (assuming they're under /docs)
  const docsDirectories = directories
    .filter(item => item.route?.startsWith('/docs'))
    .map(item => ({ ...item }) as PageItem)

  const flatDocsDirectories = flattenDirectories(docsDirectories)

  // Find active item
  const activeItem = flatDirectories.find(item => item.route === route)
  const activeIndex = flatDirectories.indexOf(activeItem || flatDirectories[0])

  // Default theme context
  const activeThemeContext: PageTheme = {
    layout: 'default',
    sidebar: true,
    toc: true,
    navbar: true,
    footer: true,
    pagination: true,
    breadcrumb: true,
    timestamp: false,
    typesetting: 'default'
  }

  // Top level navbar items (non-docs items)
  const topLevelNavbarItems = directories.filter(item => !item.route?.startsWith('/docs'))

  // Active path (breadcrumb)
  const activePath = getActivePath(directories, route)

  return {
    activeType: route.startsWith('/docs') ? 'doc' : 'page',
    activeIndex,
    activeThemeContext,
    activePath,
    topLevelNavbarItems,
    docsDirectories,
    flatDirectories,
    flatDocsDirectories,
    directories
  }
}

function flattenDirectories(items: Item[]): Item[] {
  const flat: Item[] = []
  
  function traverse(items: Item[]) {
    for (const item of items) {
      flat.push(item)
      if (item.children) {
        traverse(item.children)
      }
    }
  }
  
  traverse(items)
  return flat
}

function getActivePath(directories: Item[], route: string): Item[] {
  const path: Item[] = []
  
  function findPath(items: Item[], targetRoute: string, currentPath: Item[]): boolean {
    for (const item of items) {
      const newPath = [...currentPath, item]
      
      if (item.route === targetRoute) {
        path.push(...newPath)
        return true
      }
      
      if (item.children && findPath(item.children, targetRoute, newPath)) {
        return true
      }
    }
    return false
  }
  
  findPath(directories, route, [])
  return path
}