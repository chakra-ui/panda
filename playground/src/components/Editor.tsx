'use client'
import { css } from '@/design-system/css'
import { Flex } from '@/design-system/jsx'
import { TabContent, TabIndicator, TabList, Tabs, TabTrigger } from '@ark-ui/react'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useState } from 'react'

type Session = {
  code: string
  config: string
  view: string
}

export type EditorProps = {
  session?: Session | null
}

export const Editor = (props: EditorProps) => {
  const { session } = props

  const [form, setForm] = useState(
    session
      ? session
      : {
          code: 'default code',
          config: 'default config',
          view: 'code',
        },
  )
  const router = useRouter()

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [event.target.id]: event.target.value,
    })
  }

  const share = async () =>
    fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })
      .then((response) => response.json())
      .then((data) => router.push(`/${data.id}`))

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <Tabs defaultValue={form.view} className={css({ width: 'full' })}>
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
            value={form.code}
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
            value={form.config}
            onChange={handleChange}
            rows={5}
            cols={30}
            className={css({ borderWidth: '1px', width: 'full' })}
          />
        </TabContent>
      </Tabs>

      <button onClick={share}>Share</button>
    </Flex>
  )
}
