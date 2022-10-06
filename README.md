# CSS panda

The universal design system solution for enterprise team.

## Features

- Styled system to generate css utility classes
- Consume the utilities in a strongly typed `css` function
- Token management
  - Analyze token usage across your project
  - VSCode extension to view tokens in your IDE
- Token export
  - css, less, saas variables
  - json object
  - js module
- Quality check
  - Ensure all engineers use the specified tokens
  - Checkes css, js{x}, ts{x}, less and sass files for tokens
- Common layout helpers
  - stack, flex, grid
  - visually hidden, no scroll, etc

## Getting Started

```sh
yarn install css-panda
```

To scaffold the panda config and postcss

```sh
yarn panda init
# or
yarn panda init --postcss
```
