function esc(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dashCase(string: string) {
  return string.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

type CssVar = {
  var: `--${string}`;
  ref: string;
};

export type CreateVarOptions = {
  fallback?: string;
  prefix?: string;
};

export function createVar(name: string, options: CreateVarOptions = {}): CssVar {
  const { fallback = '', prefix = '' } = options;

  const variable = dashCase(['-', prefix, esc(name)].filter(Boolean).join('-'));

  const result = {
    var: variable,
    ref: `var(${variable}${fallback ? `, ${fallback}` : ''})`,
  };

  return result as CssVar;
}
