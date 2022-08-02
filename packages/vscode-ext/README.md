## Run The Sample

```bash

# Navigate into extension directory
cd packages/vscode-ext

# Install dependencies for both the extension and webview UI source code
pnpm run install:all

# Build exntension webview UI source code in watch mode
pnpm run watch:ui

# Open sample in VS Code
code .
```

Once the sample is open inside VS Code you can run the extension by doing the following:

1. Press `F5` to open a new Extension Development Host window
2. Inside the host window, click the new panda icon to open the sidebar
