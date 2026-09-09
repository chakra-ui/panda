export interface Author {
  name: string
  /** GitHub handle, used for the avatar. */
  login: string
  x?: { url: string; username: string }
}

const AUTHORS: Record<string, Author> = {
  sage: {
    name: 'Segun Adebayo',
    login: 'segunadebayo',
    x: { url: 'https://x.com/thesegunadebayo', username: '@thesegunadebayo' }
  },
  esther: {
    name: 'Esther Adebayo',
    login: 'estheragbaje',
    x: { url: 'https://x.com/_estheradebayo', username: '@_estheradebayo' }
  },
  lope: {
    name: 'Adebesin Tolulope',
    login: 'Adebesin-Cell',
    x: { url: 'https://x.com/I_am_Lope', username: '@I_am_Lope' }
  },
  alex: { name: 'Alex Stahmer', login: 'astahmer' },
  christian: { name: 'Christian Schroeter', login: 'cschroeter' },
  abraham: { name: 'Abraham', login: 'anubra266' }
}

export function resolveAuthors(keys: string[] = []): Author[] {
  return keys
    .map(key => AUTHORS[key])
    .filter((author): author is Author => author !== undefined)
}

export function avatarUrl(login: string, size = 64) {
  return `https://github.com/${login}.png?size=${size}`
}
