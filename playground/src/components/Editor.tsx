import { css } from '@/design-system/css'
import { Flex } from '@/design-system/jsx'
import { TabContent, TabIndicator, TabList, Tabs, TabTrigger } from '@ark-ui/react'
import { ChangeEvent } from 'react'
import { State } from './usePlayground'

type EditorProps = {
  value: State
  onChange: (state: State) => void
}

export const Editor = (props: EditorProps) => {
  const { onChange, value } = props

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      [event.target.id]: event.target.value,
    })
  }

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <Tabs defaultValue={value.view} className={css({ width: 'full' })}>
        <TabList
          className={css({
            px: '6',
            height: '12',
            borderBottomWidth: '1px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3',
          })}
        >
          <TabTrigger value="code">
            <button>Code</button>
          </TabTrigger>
          <TabTrigger value="config">
            <button>Config</button>
          </TabTrigger>
          <TabIndicator className={css({ background: 'blue.500', height: '2px', mb: '-1px' })} />
        </TabList>
        <TabContent value="code" className={css({ px: '6', py: '4' })}>
          <label htmlFor="code" className={css({ display: 'block' })}>
            Code
          </label>
          <textarea
            id="code"
            value={value.code}
            onChange={handleChange}
            rows={5}
            cols={30}
            className={css({ borderWidth: '1px', width: 'full' })}
          />
        </TabContent>
        <TabContent value="config" className={css({ px: '6', py: '4' })}>
          <label htmlFor="config" className={css({ display: 'block' })}>
            Config
          </label>
          <textarea
            id="config"
            value={value.config}
            onChange={handleChange}
            rows={5}
            cols={30}
            className={css({ borderWidth: '1px', width: 'full' })}
          />
        </TabContent>
      </Tabs>
    </Flex>
  )
}
