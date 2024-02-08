export const isCssVar = (v: unknown) => typeof v === 'string' && /^var\(--.+\)$/.test(v)
