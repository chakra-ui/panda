import { css } from '@/styled-system/css'
import { useEffect, useState } from 'react'
import { Collapse } from '../components'
import { DetailsProvider } from '../contexts'
import { findSummary } from './find-summary'

const styles = css({
  mt: { base: '4', _first: '0' },
  mb: '4',
  rounded: 'md',
  borderWidth: '1px',
  bg: { base: 'white', _dark: 'neutral.800' },
  borderColor: { base: 'inherit', _dark: 'neutral.900' },
  p: '2',
  shadow: 'sm'
})

export const Details = (props: React.ComponentProps<'details'>) => {
  const { children, open, ...rest } = props
  const [openState, setOpen] = useState(!!open)
  const [summary, restChildren] = findSummary(children)

  // To animate the close animation we have to delay the DOM node state here.
  const [delayedOpenState, setDelayedOpenState] = useState(openState)

  useEffect(() => {
    if (openState) {
      setDelayedOpenState(true)
    } else {
      const timeout = setTimeout(() => setDelayedOpenState(openState), 500)
      return () => clearTimeout(timeout)
    }
  }, [openState])

  return (
    <details
      className={styles}
      {...rest}
      open={delayedOpenState}
      data-expanded={openState ? '' : undefined}
    >
      <DetailsProvider value={setOpen}>{summary}</DetailsProvider>
      <Collapse isOpen={openState}>{restChildren}</Collapse>
    </details>
  )
}
