export interface Author {
  name: string
  /** GitHub handle, used for the avatar. */
  login: string
  x?: { url: string; username: string }
}

/** Post frontmatter carries display names; everything else is resolved here. */
const AUTHORS: Record<string, Author> = {
  'Segun Adebayo': {
    name: 'Segun Adebayo',
    login: 'segunadebayo',
    x: { url: 'https://x.com/thesegunadebayo', username: '@thesegunadebayo' }
  },
  'Esther Adebayo': {
    name: 'Esther Adebayo',
    login: 'estheragbaje',
    x: { url: 'https://x.com/_estheradebayo', username: '@_estheradebayo' }
  },
  'Adebesin Tolulope': {
    name: 'Adebesin Tolulope',
    login: 'Adebesin-Cell',
    x: { url: 'https://x.com/I_am_Lope', username: '@I_am_Lope' }
  },
  'Alex Stahmer': { name: 'Alex Stahmer', login: 'astahmer' },
  'Christian Schroeter': { name: 'Christian Schroeter', login: 'cschroeter' },
  Abraham: { name: 'Abraham', login: 'anubra266' }
}

export function resolveAuthors(names: string[] = []): Author[] {
  return names
    .map(name => AUTHORS[name])
    .filter((author): author is Author => author !== undefined)
}

export function avatarUrl(login: string, size = 64) {
  return `https://github.com/${login}.png?size=${size}`
}
