import { css } from '@/styled-system/css'
import { addBasePath } from 'next/dist/client/add-base-path'
import { useRouter } from 'next/router'
import { GlobeIcon } from 'nextra/icons'
import type { DocsThemeConfig } from '../constants'
import { Select } from './select'

interface LocaleSwitchProps {
  options: NonNullable<DocsThemeConfig['i18n']>
  lite?: boolean
  className?: string
}

export function LocaleSwitch({ options, lite, className }: LocaleSwitchProps) {
  const { locale, asPath } = useRouter()
  const selected = options.find(option => locale === option.locale)
  return (
    <Select
      title="Change language"
      className={className}
      onChange={option => {
        const date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        document.cookie = `NEXT_LOCALE=${
          option?.value
        }; expires=${date.toUTCString()}; path=/`
        location.href = addBasePath(asPath)
      }}
      selected={{
        value: selected?.locale || '',
        label: (
          <span
            className={css({ display: 'flex', alignItems: 'center', gap: 2 })}
          >
            <GlobeIcon />
            <span className={lite ? css({ display: 'none' }) : ''}>
              {selected?.text}
            </span>
          </span>
        )
      }}
      options={options.map(l => ({ value: l.locale, label: l.text }))}
    />
  )
}
