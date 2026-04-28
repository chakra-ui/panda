'use client'

import { cx, css, cva } from '../css/index.mjs';
import { panda } from './factory.mjs';
import { getDisplayName } from './factory-helper.mjs';

import { createContext, useContext, createElement, forwardRef } from 'react'

function resolveRecipe(options) {
  if (options == null) {
    throw new Error('createRecipeContext requires a recipe or { key }')
  }
  if (options.__recipe__ === true || options.__cva__ != null) return options
  
  if (options.recipe) return options.recipe
  throw new Error('createRecipeContext requires a recipe or { key }')
}

export function createRecipeContext(options) {
  const recipe = resolveRecipe(options)
  const isConfigRecipe = recipe.__recipe__ === true
  const cvaFn = isConfigRecipe ? recipe : cva(recipe)

  const PropsContext = createContext(undefined)
  const usePropsContext = () => useContext(PropsContext)

  const withContext = (Component, options) => {
    const StyledComponent = panda(Component, {}, options)
    const componentName = getDisplayName(Component)

    const WithContext = forwardRef((inProps, ref) => {
      const propsContext = usePropsContext()
      const props = propsContext ? { ...propsContext, ...inProps } : inProps
      const { unstyled, ...restProps } = props

      const [variantProps, otherProps] = cvaFn.splitVariantProps(restProps)

      let className
      if (unstyled) {
        className = cx(props.className)
      } else if (isConfigRecipe) {
        className = cx(cvaFn(variantProps), props.className)
      } else {
        className = cx(css(cvaFn.raw(variantProps)), props.className)
      }

      return createElement(StyledComponent, {
        ...otherProps,
        className,
        ref,
      })
    })

    WithContext.displayName = componentName
    return WithContext
  }

  return {
    withContext,
    PropsProvider: PropsContext.Provider,
    usePropsContext,
  }
}