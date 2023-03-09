import { useEffect, useState } from 'react'

const getValue = (search: string, param: string) => new URLSearchParams(search).get(param)

const updateSearchParam = (key: string, value: string | undefined) => {
  const search = new URLSearchParams(window.location.search)
  if (value === undefined) {
    search.delete(key)
  } else {
    search.set(key, value)
  }
  window.history.pushState({}, '', `${window.location.pathname}?${search.toString()}`)
}

export type UseQueryParam = (param: string) => string | null

export const useSearchParam: UseQueryParam = (param) => {
  const location = window.location
  const [value, setValue] = useState<string | null>(() => getValue(location.search, param))

  useEffect(() => {
    const onChange = () => {
      setValue(getValue(location.search, param))
    }

    window.addEventListener('popstate', onChange)
    window.addEventListener('pushstate', onChange)
    window.addEventListener('replacestate', onChange)

    return () => {
      window.addEventListener('popstate', onChange)
      window.addEventListener('pushstate', onChange)
      window.addEventListener('replacestate', onChange)
    }
  }, [])

  return value
}

export const useSearchParams = () => {
  const location = window.location
  const [search, setSearch] = useState<string>(() => location.search)

  useEffect(() => {
    const onChange = () => {
      console.log('onChange', location.search)
      setSearch(location.search)
    }

    window.addEventListener('popstate', onChange)
    window.addEventListener('pushstate', onChange)
    window.addEventListener('replacestate', onChange)

    return () => {
      window.addEventListener('popstate', onChange)
      window.addEventListener('pushstate', onChange)
      window.addEventListener('replacestate', onChange)
    }
  }, [])

  return new URLSearchParams(search)
}
