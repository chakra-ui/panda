---
'@pandacss/generator': patch
'@pandacss/studio': patch
---

make `WithEscapeHatch<T>` much more performant

This pull request is a follow-up pull request to #2466.

Make `WithEscapeHatch<T>` much more performant and typescript happy by updating the type signature of `WithImportant<T>`
and `WithColorOpacityModifier<T>` to use _branded type_ and _non-distributive conditional types_, while keeping such
tokens valid and also not appearing in autocompletions to prevent them from polluting autocompletion result (which is
the current behavior).
