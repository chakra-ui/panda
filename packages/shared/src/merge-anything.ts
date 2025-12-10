/**
 * Credits: https://github.com/mesqueeb/merge-anything
 */

import { isObject, isString, isSymbol } from './assert'

const MERGE_OMIT = new Set(['__proto__', 'constructor', 'prototype'])

function concatArrays<T>(originVal: unknown, newVal: T): T {
  if (Array.isArray(originVal) && Array.isArray(newVal)) {
    return originVal.concat(newVal) as T
  }
  return newVal
}

function assignProp(
  carry: Record<string | number | symbol, unknown>,
  key: string,
  newVal: unknown,
  originalObject: Record<string | number | symbol, unknown>,
): void {
  const propType = {}.propertyIsEnumerable.call(originalObject, key) ? 'enumerable' : 'nonenumerable'
  if (propType === 'enumerable') carry[key] = newVal
  if (propType === 'nonenumerable') {
    Object.defineProperty(carry, key, {
      value: newVal,
      enumerable: false,
      writable: true,
      configurable: true,
    })
  }
}

function mergeRecursively<T1, T2>(
  origin: T1,
  newComer: T2,
  compareFn?: (prop1: T1[keyof T1], prop2: T2[keyof T2], propName: keyof T1) => any,
): (T1 & T2) | T2 {
  // always return newComer if its not an object
  if (!isObject(newComer)) return newComer
  // define newObject to merge all values upon
  let newObject = {} as (T1 & T2) | T2
  if (isObject(origin)) {
    const props = Object.getOwnPropertyNames(origin)
    const symbols = Object.getOwnPropertySymbols(origin)
    newObject = [...props, ...symbols].reduce(
      (carry, key) => {
        if (isString(key) && MERGE_OMIT.has(key)) return carry
        const targetVal = origin[key as keyof typeof origin]
        if (
          (!isSymbol(key) && !Object.getOwnPropertyNames(newComer).includes(key)) ||
          (isSymbol(key) && !Object.getOwnPropertySymbols(newComer).includes(key))
        ) {
          assignProp(carry as Record<string | number | symbol, unknown>, key as string, targetVal, origin)
        }
        return carry
      },
      {} as (T1 & T2) | T2,
    )
  }
  // newObject has all properties that newComer hasn't
  const props = Object.getOwnPropertyNames(newComer)
  const symbols = Object.getOwnPropertySymbols(newComer)
  const result = [...props, ...symbols].reduce((carry, key) => {
    if (isString(key) && MERGE_OMIT.has(key)) return carry
    let newVal = newComer[key as keyof typeof newComer]
    const targetVal = isObject(origin) ? origin[key as keyof typeof origin] : undefined
    if (targetVal !== undefined && isObject(newVal)) {
      newVal = mergeRecursively(targetVal as any, newVal as any, compareFn)
    }
    const propToAssign = compareFn ? compareFn(targetVal as any, newVal as any, key as any) : newVal
    assignProp(carry as Record<string | number | symbol, unknown>, key as string, propToAssign, newComer)
    return carry
  }, newObject)
  return result
}

export function mergeAndConcat<T, const Tn extends unknown[]>(object: T, ...otherObjects: Tn): any {
  return otherObjects.reduce((result, newComer) => {
    return mergeRecursively(result, newComer, concatArrays)
  }, object) as any
}
