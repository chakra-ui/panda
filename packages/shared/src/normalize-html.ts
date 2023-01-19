const htmlProps = ['htmlSize', 'htmlTranslate', 'htmlWidth', 'htmlHeight']

function convert(key: string) {
  return htmlProps.includes(key) ? key.replace('html', '').toLowerCase() : key
}

export function normalizeHTMLProps(props: Record<string, any>) {
  return Object.fromEntries(Object.entries(props).map(([key, value]) => [convert(key), value]))
}

normalizeHTMLProps.keys = /* @__PURE__ */ htmlProps
