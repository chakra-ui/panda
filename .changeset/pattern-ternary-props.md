---
'@pandacss/compiler': patch
---

Fix ternary values in pattern props, like `<Box bg={on ? 'green.500' : 'red.500'} />` or
`hstack({ gap: on ? '1' : '3' })`. Each branch now gets its own CSS instead of a broken `bg_conditional` rule and a
breakpoint-only second branch.
