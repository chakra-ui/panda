'use client'

import { cx, css, sva } from '../css/index.mjs';
import { panda } from './factory.mjs';
import { createContext, useContext, createElement, forwardRef } from 'react'

const getDisplayName = (Component) => Component.displayName || Component.name || typeof Component === 'string' ? Component : 'Component'

export function createStyleContext(recipe) {
  const StyleContext = createContext({})
  const isConfigRecipe = "__recipe__" in recipe
  const svaFn = isConfigRecipe ? recipe : sva(recipe.config)

  const getResolvedProps = (props, slotStyles) => {
    const { unstyled, ...restProps } = props
    if (unstyled) return restProps
    if (isConfigRecipe) {
       return { ...restProps, className: cx(slotStyles, restProps.className) }
    }
    return { ...slotStyles, ...restProps }
  }

  const withRootProvider = (Component) => {
    const WithRootProvider = (props) => {
      const [variantProps, otherProps] = svaFn.splitVariantProps(props)
      
      const slotStyles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
      slotStyles._classNameMap = svaFn.classNameMap

      return createElement(StyleContext.Provider, {
        value: slotStyles,
        children: createElement(Component, otherProps)
      })
    }
    
    const componentName = getDisplayName(Component)
    WithRootProvider.displayName = `withRootProvider(${componentName})`
    
    return WithRootProvider
  }

  const withProvider = (Component, slot, options) => {
    const StyledComponent = panda(Component, {}, options)
    
    const WithProvider = forwardRef((props, ref) => {
      const [variantProps, restProps] = svaFn.splitVariantProps(props)
      
      const slotStyles = isConfigRecipe ? svaFn(variantProps) : svaFn.raw(variantProps)
      slotStyles._classNameMap = svaFn.classNameMap

      const resolvedProps = getResolvedProps(restProps, slotStyles[slot])
      return createElement(StyleContext.Provider, {
        value: slotStyles,
        children: createElement(StyledComponent, {
          ...resolvedProps,
          className: cx(resolvedProps.className, slotStyles._classNameMap[slot]),
          ref,
        })
      })
    })
    
    const componentName = getDisplayName(Component)
    WithProvider.displayName = `withProvider(${componentName})`
    
    return WithProvider
  }

  const withContext = (Component, slot) => {
    const StyledComponent = panda(Component)
    
    const WithContext = forwardRef((props, ref) => {
      const slotStyles = useContext(StyleContext)

      const resolvedProps = getResolvedProps(props, slotStyles[slot])
      return createElement(StyledComponent, {
        ...resolvedProps,
        className: cx(resolvedProps.className, slotStyles._classNameMap[slot]),
        ref,
      })
    })
    
    const componentName = getDisplayName(Component)
    WithContext.displayName = `withContext(${componentName})`
    
    return WithContext
  }

  return {
    withRootProvider,
    withProvider,
    withContext,
  }
}