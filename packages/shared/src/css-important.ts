import { traverse } from './traverse'

const importantRegex = /!(important)?$/

export function isImportant(value: string) {
  return typeof value === 'string' ? importantRegex.test(value) : false
}

export function withoutImportant(value: string) {
  return typeof value === 'string' ? value.replace(importantRegex, '').trim() : value
}

export function withoutSpace(str: string) {
  return typeof str === 'string' ? str.replaceAll(' ', '_') : str
}

type Dict = Record<string, unknown>

export const markImportant = (styles: Dict) => {
  const obj = {} as Dict
  let prevObj = obj

  traverse(styles, (args) => {
    obj[args.key] = args.value
    if (typeof args.value === 'object') {
      prevObj = args.value
      return
    }

    prevObj[args.key] = args.value + '!important'
  })

  return obj
}
