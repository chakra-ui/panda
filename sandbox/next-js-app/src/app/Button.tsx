'use client'
import * as React from 'react'
import { flex } from '../../styled-system/patterns'
import { RecipeVariantProps, css, cx } from '../../styled-system/css'
import { SystemStyleObject } from '../../styled-system/types'
import { thingy } from '../../styled-system/recipes'

export function Button(props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }) {
  const rootStyle = cx(flex({ direction: 'row', _hover: { color: 'blue.400' }, border: '1px solid' }), props.className)
  return <button className={rootStyle}>{props.children}</button>
}

export const Thingy = (
  props: React.ComponentPropsWithoutRef<'button'> & { recipeProps?: RecipeVariantProps<typeof thingy> },
) => {
  const rootStyle = cx(thingy(), css({ _hover: { color: 'blue.400' } }), props.className)
  return <button className={rootStyle}>{props.children}</button>
}
