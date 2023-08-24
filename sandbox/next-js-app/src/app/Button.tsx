'use client'
import * as React from 'react'
import { flex } from '../../styled-system/patterns'
import { RecipeVariantProps, css, cva } from '../../styled-system/css'
import { SystemStyleObject } from '../../styled-system/types'

export function Button(props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }) {
  const flexProps = flex.raw({ direction: 'row', _hover: { color: 'blue.400' }, border: '1px solid' })
  const rootStyle = css(flexProps, props.css ?? {})
  return <button className={rootStyle}>{props.children}</button>
}

const thing = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' },
    },
  },
})

export const Thingy = (
  props: React.ComponentPropsWithoutRef<'button'> & {
    css?: SystemStyleObject
    recipeProps?: RecipeVariantProps<typeof thing>
  },
) => {
  const rootStyle = css(thing.raw({ variant: 'primary' }), css.raw({ _hover: { color: 'blue.400' } }), props.css ?? {})
  return <button className={rootStyle}>{props.children}</button>
}
