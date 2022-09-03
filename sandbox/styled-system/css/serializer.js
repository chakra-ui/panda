// ../packages/shared/src/filter-condition.ts
function filterBaseConditions(conditions) {
  return conditions.slice().filter((v) => !/^(base|_)$/.test(v));
}

// ../packages/shared/src/to-hash.ts
function toChar(code) {
  return String.fromCharCode(code + (code > 25 ? 39 : 97));
}
function toName(code) {
  let name = "";
  let x;
  for (x = Math.abs(code); x > 52; x = x / 52 | 0)
    name = toChar(x % 52) + name;
  return toChar(x % 52) + name;
}
function toPhash(h, x) {
  let i = x.length;
  while (i)
    h = h * 33 ^ x.charCodeAt(--i);
  return h;
}
function toHash(value) {
  return toName(toPhash(5381, value) >>> 0);
}

// ../packages/shared/src/walk-object.ts
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function walkObject(target, predicate, options = {}) {
  const { maxDepth = Infinity } = options;
  function inner(value, path = []) {
    if (isObject(value) || Array.isArray(value)) {
      const result = {};
      for (const [key, child] of Object.entries(value)) {
        const childPath = [...path, key];
        if (childPath.length > maxDepth) {
          return predicate(value, path);
        }
        result[key] = inner(child, childPath);
      }
      return result;
    }
    return predicate(value, path);
  }
  return inner(target);
}

// ../packages/shared/src/walk-styles.ts
function walkStyles(obj, fn) {
  const { selectors = {}, "@media": mediaQueries = {}, "@container": containerQueries = {}, ...baseStyles } = obj;
  fn(baseStyles);
  for (const [scope, scopeStyles] of Object.entries(selectors)) {
    fn(scopeStyles, scope);
  }
  for (const [scope, scopeStyles] of Object.entries(mediaQueries)) {
    fn(scopeStyles, `@media ${scope}`);
  }
  for (const [scope, scopeStyles] of Object.entries(containerQueries)) {
    fn(scopeStyles, `@container ${scope}`);
  }
}

// ../packages/atomic/src/classname.ts
function createCss(context) {
  const { transform, hash } = context;
  return (styleObject) => {
    const classNames = /* @__PURE__ */ new Set();
    walkStyles(styleObject, (props, scope) => {
      walkObject(props, (value, paths) => {
        const [prop, ...allConditions] = paths;
        const conditions = filterBaseConditions(allConditions);
        const transformed = transform(prop, value);
        const baseArray = [...conditions, transformed.className];
        if (scope) {
          baseArray.unshift(`[${scope.replaceAll(" ", "_")}]`);
        }
        const className = hash ? toHash(baseArray.join(":")) : baseArray.join(":");
        classNames.add(className);
      });
    });
    return Array.from(classNames).join(" ");
  };
}
export {
  createCss
};
