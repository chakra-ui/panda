import lzString from 'lz-string'

const MAX_URL_LENGTH = 10_000

function decodeParam(name: string) {
  if (typeof window === 'undefined') return

  const search = new URLSearchParams(window.location.search)
  const code = (search.get(name) ?? '').trim()
  return lzString.decompressFromEncodedURIComponent(code) ?? '' // will be null on error
}

type OnLargeString = () => void | Promise<void>
const defaultOnLargeString: OnLargeString = () => {
  throw new Error('The compressed string is too large to be stored in the URL.')
}

function encodeParam(
  name: string,
  value: string,
  onLargeString: OnLargeString = defaultOnLargeString
) {
  if (value.length === 0) {
    updateUrlWithParam(name, '')
    return Promise.resolve()
  }

  const compressed = lzString.compressToEncodedURIComponent(value)
  const url = new URL(window.location.href)
  url.searchParams.set(name, compressed)

  // completely arbitrary limit of characters, but it appears to not work anymore around that
  // chrome seems fine with 14_500 but maybe other browsers are not, so lower it to 10_000
  if (url.toString().length >= MAX_URL_LENGTH) {
    return onLargeString()
  }

  updateUrlWithParam(name, compressed)
  return Promise.resolve()
}

function updateUrlWithParam(name: string, value: string | number) {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.set(name, String(value))
  window.history.replaceState(undefined, '', url)
}

const resetUrl = () => {
  if (typeof window === 'undefined') return

  window.history.replaceState(
    undefined,
    '',
    window.location.origin + window.location.pathname
  )
}

const deleteParamInUrl = (name: string) => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete(name)
  window.history.replaceState(undefined, '', url)
}

export class UrlSaver<T extends Record<string, string>> {
  get(name: keyof T) {
    return decodeParam(name as string)
  }

  set<Key extends keyof T>(
    name: Key,
    value: T[Key],
    onLargeString: OnLargeString
  ) {
    try {
      return encodeParam(name as string, value, onLargeString)
    } catch (err) {
      console.error(err)
      return Promise.reject(err)
    }
  }

  setAll(params: T, onLargeString: OnLargeString = defaultOnLargeString) {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, lzString.compressToEncodedURIComponent(value))
    })

    // completely arbitrary limit of characters, but it appears to not work anymore around that
    // chrome seems fine with 14_500 but maybe other browsers are not, so lower it to 10_000
    if (url.toString().length >= MAX_URL_LENGTH) {
      return onLargeString()
    }

    window.history.replaceState(undefined, '', url)
    return Promise.resolve()
  }

  reset(name: keyof T) {
    deleteParamInUrl(name as string)
  }

  resetAll() {
    resetUrl()
  }
}
