import * as tokens from './tokens-entry.mjs';

function getTokenVarName(name) {
  return name.replace(/(?:\.-(\d+))/g, ".n$1").replace(/\./g, "_");
}

export { tokens }

export function token(path, fallback) {
  const value = tokens.$[path] ?? tokens[getTokenVarName(path)]
  return value || fallback
}

function tokenVar(path, fallback) {
  return token(path)?.var || fallback
}

token.var = tokenVar