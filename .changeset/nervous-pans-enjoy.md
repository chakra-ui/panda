---
'@pandacss/types': minor
'@pandacss/node': minor
'@pandacss/dev': minor
'@pandacss/reporter': minor
---

Adds support for static analysis of used tokens and recipe variants. It helps to get a birds-eye view of how your design
system is used and answers the following questions:

- What tokens are most used?
- What recipe variants are most used?
- How many hardcoded values vs tokens do we have?

```sh
panda analyze --scope=<token|recipe>
```

> Still work in progress but we're excited to get your feedback!
