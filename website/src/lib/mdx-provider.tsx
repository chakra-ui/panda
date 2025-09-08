import React, { createContext, useContext, ReactNode } from 'react'
import { sharedComponents } from '@/docs-layout/mdx-content'

// Context for MDX components
const MDXContext = createContext<Record<string, React.ComponentType>>(sharedComponents)

interface MDXProviderProps {
  components?: Record<string, React.ComponentType>
  children: ReactNode
}

/**
 * MDXProvider implementation using shared components
 * This provides MDX components to child components
 */
export function MDXProvider({ components = {}, children }: MDXProviderProps) {
  const mergedComponents = { ...sharedComponents, ...components }
  
  return (
    <MDXContext.Provider value={mergedComponents}>
      {children}
    </MDXContext.Provider>
  )
}

/**
 * Hook to get MDX components
 */
export function useMDXComponents(components?: Record<string, React.ComponentType>): Record<string, React.ComponentType> {
  const contextComponents = useContext(MDXContext)
  return { ...contextComponents, ...components }
}
