// src/css-important.ts
function isImportant(value) {
  return typeof value === "string" ? /!(important)?$/.test(value) : false;
}
function withoutImportant(value) {
  return typeof value === "string" ? value.replace(/!(important)?$/, "").trim() : value;
}
function withoutSpace(str) {
  return typeof str === "string" ? str.replaceAll(" ", "_") : str;
}

// src/condition.ts
var isBaseCondition = (c) => /^(base|_)$/.test(c);
function filterBaseConditions(c) {
  return c.slice().filter((v) => !isBaseCondition(v));
}

// src/hash.ts
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

// src/assert.ts
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/walk-object.ts
function walkObject(target, predicate, options = {}) {
  const { stop, getKey } = options;
  function inner(value, path = []) {
    if (isObject(value) || Array.isArray(value)) {
      const result = {};
      for (const [prop, child] of Object.entries(value)) {
        const key = getKey?.(prop) ?? prop;
        const childPath = [...path, key];
        if (stop?.(value, childPath)) {
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
function mapObject(obj, fn) {
  if (!isObject(obj))
    return fn(obj);
  return walkObject(obj, (value) => fn(value));
}

// src/walk-styles.ts
function walkStyles(mixedStyles, fn, scopes = []) {
  const {
    selectors = {},
    "@media": mediaQueries = {},
    "@container": containerQueries = {},
    "@supports": supportQueries = {},
    ...baseStyles
  } = mixedStyles;
  fn(baseStyles, scopes);
  for (const [selector, selectorStyles] of Object.entries(selectors)) {
    walkStyles(selectorStyles, fn, [...scopes, selector]);
  }
  for (const [mediaQuery, mediaQueryStyles] of Object.entries(mediaQueries)) {
    walkStyles(mediaQueryStyles, fn, [...scopes, `@media ${mediaQuery}`]);
  }
  for (const [containerQuery, containerQueryStyles] of Object.entries(containerQueries)) {
    walkStyles(containerQueryStyles, fn, [...scopes, `@container ${containerQuery}`]);
  }
  for (const [supportQuery, supportQueryStyles] of Object.entries(supportQueries)) {
    walkStyles(supportQueryStyles, fn, [...scopes, `@supports ${supportQuery}`]);
  }
}

// src/normalize-style-object.ts
function toResponsiveObject(values, breakpoints) {
  return values.reduce((acc, current, index) => {
    const key = breakpoints[index];
    if (current != null) {
      acc[key] = current;
    }
    return acc;
  }, {});
}
function normalizeStyleObject(styles, context) {
  const { utility, conditions } = context;
  const { hasShorthand, resolveShorthand } = utility;
  return walkObject(
    styles,
    (value) => {
      return Array.isArray(value) ? toResponsiveObject(value, conditions.breakpoints.keys) : value;
    },
    {
      stop: (value) => Array.isArray(value),
      getKey: (prop) => {
        return hasShorthand ? resolveShorthand(prop) : prop;
      }
    }
  );
}

// src/classname.ts
var fallbackCondition = {
  shift: (v) => v,
  finalize: (v) => v,
  breakpoints: { keys: [] }
};
var sanitize = (value) => typeof value === "string" ? value.replaceAll(/[\n\s]+/g, " ") : value;
function createCss(context) {
  const { utility, hash, conditions: conds = fallbackCondition } = context;
  return (styleObject = {}) => {
    const normalizedObject = normalizeStyleObject(styleObject, context);
    const classNames = /* @__PURE__ */ new Set();
    walkStyles(normalizedObject, (props, scope) => {
      walkObject(props, (value, paths) => {
        const important = isImportant(value);
        if (value == null)
          return;
        const [prop, ...allConditions] = conds.shift(paths);
        const conditions = filterBaseConditions(allConditions);
        const transformed = utility.transform(prop, withoutImportant(sanitize(value)));
        let transformedClassName = transformed.className;
        if (important) {
          transformedClassName = `${transformedClassName}!`;
        }
        const baseArray = [...conds.finalize(conditions), transformedClassName];
        if (scope && scope.length > 0) {
          baseArray.unshift(`[${withoutSpace(scope.join("__"))}]`);
        }
        const className = hash ? toHash(baseArray.join(":")) : baseArray.join(":");
        classNames.add(className);
      });
    });
    return Array.from(classNames).join(" ");
  };
}

// src/compact.ts
function compact(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([_, value2]) => value2 !== void 0));
}
export {
  compact,
  createCss,
  filterBaseConditions,
  isBaseCondition,
  mapObject,
  toHash,
  walkObject,
  walkStyles,
  withoutSpace
};
