const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((key) => scope[key]);
  return new Function(...scopeKeys, code)(...scopeValues);
};
export const evalTheme = (theme: string) => {
  const codeTrimmed = theme
    .replaceAll(/module.exports.*/g, "")
    .trim()
    .replace(/;$/, "");

  try {
    return evalCode(`return (() => {${codeTrimmed}; return theme})()`, {});
  } catch (e) {
    return null;
  }
};
