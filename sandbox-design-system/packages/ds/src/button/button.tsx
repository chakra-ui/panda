import type { ComponentPropsWithoutRef } from 'react'
import { dsButton } from './button.css'

export function Button(props: ComponentPropsWithoutRef<'button'>) {
  return <button className={dsButton} {...props} />
}
