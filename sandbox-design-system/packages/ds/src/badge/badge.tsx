import type { ComponentPropsWithoutRef } from 'react'
import { dsBadge } from './badge.css'

export function Badge(props: ComponentPropsWithoutRef<'span'>) {
  return <span className={dsBadge} {...props} />
}
