import { DEFAULT_BREAKPOINTS, DEFAULT_CONDITIONS } from './mappings'

export interface BreakpointConfig {
  sm?: string
  md?: string
  lg?: string
  xl?: string
  '2xl'?: string
}

export interface ConditionConfig {
  breakpoints?: BreakpointConfig
  conditions?: Record<string, string>
}

export interface ResolvedCondition {
  type: 'media' | 'selector'
  value: string
  priority: number
}

/**
 * Condition resolver state
 */
export interface ConditionResolverState {
  breakpoints: BreakpointConfig
  conditions: Record<string, string>
}

/**
 * Create a condition resolver with the given configuration
 */
export function createConditionResolver(config: ConditionConfig = {}): ConditionResolverState {
  return {
    breakpoints: { ...DEFAULT_BREAKPOINTS, ...config.breakpoints },
    conditions: { ...DEFAULT_CONDITIONS, ...config.conditions },
  }
}

/**
 * Resolve a condition string to CSS media query or selector
 */
export function resolveCondition(state: ConditionResolverState, condition: string): ResolvedCondition | null {
  // Check for breakpoints first
  if (state.breakpoints[condition as keyof BreakpointConfig]) {
    return {
      type: 'media',
      value: `@media (min-width: ${state.breakpoints[condition as keyof BreakpointConfig]})`,
      priority: getBreakpointPriority(condition),
    }
  }

  // Check for custom conditions
  if (state.conditions[condition]) {
    const value = state.conditions[condition]
    return {
      type: value.startsWith('@media') ? 'media' : 'selector',
      value,
      priority: getConditionPriority(state, condition),
    }
  }

  // Handle custom selectors (e.g., "&:nth-child(3)")
  if (condition.startsWith('&') || condition.startsWith('[')) {
    return {
      type: 'selector',
      value: condition,
      priority: 100, // Custom selectors get low priority
    }
  }

  // Handle custom media queries
  if (condition.startsWith('@media')) {
    return {
      type: 'media',
      value: condition,
      priority: 100,
    }
  }

  return null
}

/**
 * Get priority for breakpoints (smaller breakpoints have higher priority)
 */
function getBreakpointPriority(breakpoint: string): number {
  const order = ['2xl', 'xl', 'lg', 'md', 'sm']
  const index = order.indexOf(breakpoint)
  return index !== -1 ? index : 999
}

/**
 * Get priority for conditions
 */
function getConditionPriority(state: ConditionResolverState, condition: string): number {
  // Media queries get higher priority
  if (state.conditions[condition]?.startsWith('@media')) {
    return 10
  }

  // Pseudo-classes get medium priority
  if (condition.includes('hover') || condition.includes('focus') || condition.includes('active')) {
    return 50
  }

  // Other selectors get lower priority
  return 100
}

/**
 * Add custom condition
 */
export function addCondition(state: ConditionResolverState, name: string, value: string): void {
  state.conditions[name] = value
}

/**
 * Add custom breakpoint
 */
export function addBreakpoint(state: ConditionResolverState, name: string, value: string): void {
  state.breakpoints[name as keyof BreakpointConfig] = value
}

/**
 * Get all available conditions
 */
export function getConditions(state: ConditionResolverState): Record<string, string> {
  return { ...state.conditions }
}

/**
 * Get all available breakpoints
 */
export function getBreakpoints(state: ConditionResolverState): BreakpointConfig {
  return { ...state.breakpoints }
}

// Export default instance
export const defaultConditionResolver = createConditionResolver()
