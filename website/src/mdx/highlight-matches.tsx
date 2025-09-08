import { css } from '@/styled-system/css'
import { Fragment, memo } from 'react'

type MatchArgs = {
  value?: string
  match: string
}

export const HighlightMatches = memo<MatchArgs>(function HighlightMatches({
  value,
  match
}: MatchArgs) {
  const splitText = value ? value.split('') : []
  const escapedSearch = match.trim().replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  const regexp = RegExp('(' + escapedSearch.replaceAll(' ', '|') + ')', 'ig')
  let result
  let id = 0
  let index = 0
  const res = [] as any[]

  if (value) {
    while ((result = regexp.exec(value)) !== null) {
      res.push(
        <Fragment key={id++}>
          {splitText.splice(0, result.index - index).join('')}
          <span className={css({ color: 'blue.600' })}>
            {splitText.splice(0, regexp.lastIndex - result.index).join('')}
          </span>
        </Fragment>
      )
      index = regexp.lastIndex
    }
  }

  return (
    <>
      {res}
      {splitText.join('')}
    </>
  )
})
