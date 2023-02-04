'use client'
import { css } from '@/design-system/css'
import { container } from '@/design-system/patterns'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useState } from 'react'

type Session = {
  code: string
  config: string
  view: string
}

type EditorProps = {
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
    <div className={container({})}>
      <section>
        <label htmlFor="code" className={css({ display: 'block' })}>
          Code
        </label>
        <textarea
          id="code"
          value={form.code}
          onChange={handleChange}
          rows={5}
          cols={30}
          className={css({ borderWidth: '1px' })}
        />
      </section>
      <section>
        <label htmlFor="config" className={css({ display: 'block' })}>
          Config
        </label>
        <textarea
          id="config"
          value={form.config}
          onChange={handleChange}
          rows={5}
          cols={30}
          className={css({ borderWidth: '1px' })}
        />
      </section>

      <button onClick={share}>Share</button>
    </div>
  )
}
