export const statSync = (_path: string) => {
  return {
    isFile: () => true,
  }
}

export const readdirSync = (_path: string) => {
  return []
}

export const readFileSync = (_path: string | URL) => {
  if (_path instanceof URL) {
    return fetch(_path)
  }

  return ''
}

export const fs = {
  statSync,
  readdirSync,
  readFileSync,
}

export default fs
