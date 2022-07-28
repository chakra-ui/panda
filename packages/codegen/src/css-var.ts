function esc(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dashCase(string: string) {
  return string.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

type CssVar = {
  var: `--${string}`;
  ref: `var(--${string})`;
};

type CssVarOptions = {
  fallback?: string;
  prefix?: string;
};

export function createVar(name: string, opts: CssVarOptions = {}): CssVar {
  const { fallback = '', prefix = '' } = opts || {};

  const variable = dashCase(['-', prefix, esc(name)].filter(Boolean).join('-'));

  const result = {
    var: variable,
    ref: `var(${variable}${fallback ? `, ${fallback}` : ''})`,
  };

  return result as CssVar;
}
