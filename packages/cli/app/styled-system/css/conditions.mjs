import { withoutSpace } from '../helpers.mjs';

const conditions = new Set(["sm","smOnly","smDown","md","mdOnly","mdDown","lg","lgOnly","lgDown","xl","xlOnly","xlDown","2xl","2xlOnly","smToMd","smToLg","smToXl","smTo2xl","mdToLg","mdToXl","mdTo2xl","lgToXl","lgTo2xl","xlTo2xl","base"])

export function isCondition(value){
  return conditions.has(value) || /^@|&|&$/.test(value)
}

const underscoreRegex = /^_/
const selectorRegex = /&|@/

export function finalizeConditions(paths){
  return paths.map((path) => {
    if (conditions.has(path)){
      return path.replace(underscoreRegex, '')
    }

    if (selectorRegex.test(path)){
      return `[${withoutSpace(path.trim())}]`
    }

    return path
  })}

  export function sortConditions(paths){
    return paths.sort((a, b) => {
      const aa = isCondition(a)
      const bb = isCondition(b)
      if (aa && !bb) return 1
      if (!aa && bb) return -1
      return 0
    })
  }