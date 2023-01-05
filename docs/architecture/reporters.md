# Goal

I want to track the usage of tokens in my project

## Usage coverate

- Tokens used in a recipe
- Tokens used in css function or style props
- Tokens used in global css

## Tasks

- Setup reporter context
- Process
  - enter
  - process (tokens)
  - exit

## Library

https://www.npmjs.com/package/hookable

Lifecycle

## Setup phase

- Read the config
- Generate the computed config
  - user config
  - user presets
- Setup tokens
- Setup utilities
  - connect properties <---> tokens
  - provide a function to retrieve a className or style object or types
  - transformer fn
- Setup conditions
- Setup compositions (text and layer styles)
- Setup context
- Setup paths
- Get all files
- Setup parser

## Codegen phase

- Generate tokens css
- Generate patterns
- Generate recipes

## Extraction phase

For each file:

- Parse file
  - css
  - patterns
  - jsx style props
  - recipes
- Extract css from file
- Write the css chunk for file

Generate output css

```js
// panda.config.ts

// Panda reporters

const config = {
  reporters: [
    {
      async onTokenCreate(tokens) {},
      async onParseFile(file) {},
      async onParseComplete(file, data) {},
    },
  ],
}

export default config
```
