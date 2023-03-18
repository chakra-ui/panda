import { Project, ts } from "ts-morph";

export const createProject = () => {
  return new Project({
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      noUnusedParameters: false,
      declaration: false,
      noEmit: true,
      allowJs: true,
      // useVirtualFileSystem: true,
    },
    // tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    useInMemoryFileSystem: true,
  });
};
