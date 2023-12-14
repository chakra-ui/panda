import Gradients from 'open-props/src/gradients'
import { camelize } from './utils'

export const noiseFilters = Object.fromEntries(
  Object.entries(Gradients)
    .filter(([key]) => key.includes('-filter-'))
    .map(([key, value]) => [camelize(key), value]),
)

export const gradients = Object.fromEntries(
  Object.entries(Gradients)
    .filter(([key]) => !key.includes('-filter-'))
    .map(([key, value]) => [camelize(key.replace('--gradient-', '')), { value }]),
)
