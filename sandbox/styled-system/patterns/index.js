import config from "../config"
import { css } from "../css"

const cache = new Map()

const getPattern = (key) => {
  if (cache.has(key)) return cache.get(key)
  const pattern = config.patterns.find(p => p.name === key)
  if (!pattern) throw new Error(`Pattern ${key} not found`)
  cache.set(key, pattern)
}

const stackTransform = getPattern("stack").transform
export const stack = (styles) => css(stackTransform(styles))

const absoluteCenterTransform = getPattern("absoluteCenter").transform
export const absoluteCenter = (styles) => css(absoluteCenterTransform(styles))

const simpleGridTransform = getPattern("simpleGrid").transform
export const simpleGrid = (styles) => css(simpleGridTransform(styles))