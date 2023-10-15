# nuxt-lib-source

This is an example of using panda css as a source based component library.

  * https://panda-css.com/docs/guides/component-library#include-the-src-files

The css-lib package contains a simple export for a button style.
The nuxt-app package consumes the export and uses it within a vue component.

## Running the Example

To install the packages
```
pnpm install
```

Generate the styled-system directories
```
cd packages/css-lib
pnpm css

cd packages/nuxt-app
pnpm css
```

To start the nuxt application
```
cd packages/nuxt-app
pnpm dev
```
