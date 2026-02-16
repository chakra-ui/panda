export const VIRTUAL_MODULE_ID = 'virtual:panda.css'
export const RESOLVED_VIRTUAL_MODULE_ID = '\0virtual:panda.css'

/**
 * Check if an unresolved module ID matches the virtual module.
 * Returns the query string portion ('' for exact match) or null for no match.
 */
export function matchVirtualModule(id: string): string | null {
  if (id === VIRTUAL_MODULE_ID) return ''
  if (id.startsWith(VIRTUAL_MODULE_ID + '?')) return id.slice(VIRTUAL_MODULE_ID.length)
  return null
}

/**
 * Check if a resolved (\0-prefixed) module ID matches the virtual module.
 * Returns the query string portion ('' for exact match) or null for no match.
 */
export function matchResolvedVirtualModule(id: string): string | null {
  if (id === RESOLVED_VIRTUAL_MODULE_ID) return ''
  if (id.startsWith(RESOLVED_VIRTUAL_MODULE_ID + '?')) return id.slice(RESOLVED_VIRTUAL_MODULE_ID.length)
  return null
}
