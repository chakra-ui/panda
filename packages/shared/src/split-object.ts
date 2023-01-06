type Dict = Record<string, unknown>

type PickFn = (key: string) => boolean

export function splitObject(obj: Dict, pickFn: PickFn) {
  const omitted = {} as Dict
  const picked = {} as Dict

  for (const [key, value] of Object.entries(obj)) {
    if (pickFn(key)) {
      picked[key] = value
    } else {
      omitted[key] = value
    }
  }

  return [picked, omitted]
}
