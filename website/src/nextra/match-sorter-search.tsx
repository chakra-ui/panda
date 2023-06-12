import { css } from '@/styled-system/css'
import { matchSorter } from 'match-sorter'
import type { Item as NormalItem } from 'nextra/normalize-pages'
import { useMemo, useState } from 'react'
import type { SearchResult } from '../types'
import { HighlightMatches } from './highlight-matches'
import { Search } from './search'

type Props = {
  className?: string
  directories: NormalItem[]
}

export function MatchSorterSearch({ className, directories }: Props) {
  const [search, setSearch] = useState('')

  const results = useMemo<SearchResult[]>(
    () =>
      // Will need to scrape all the headers from each page and search through them here
      // (similar to what we already do to render the hash links in sidebar)
      // We could also try to search the entire string text from each page
      search
        ? matchSorter(directories, search, { keys: ['title'] }).map(
            ({ route, title }) => ({
              id: route + title,
              route,
              children: <HighlightMatches value={title} match={search} />
            })
          )
        : [],
    [search, directories]
  )

  return (
    <Search
      value={search}
      onChange={setSearch}
      className={className}
      overlayClassName={css({ w: 'full' })}
      results={results}
    />
  )
}
