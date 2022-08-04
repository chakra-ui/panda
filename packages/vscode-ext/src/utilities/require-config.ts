import * as tsImport from "ts-import";

export function requireModule(module: string) {
  const res = tsImport.loadSync(module, {
    mode: tsImport.LoadMode.Compile,
    compileOptions: {},
  }).default;
  return res;
}
