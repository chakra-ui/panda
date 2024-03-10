---
'@pandacss/is-valid-prop': minor
'@pandacss/generator': minor
'@pandacss/studio': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

- Simplify typings for the style properties.
- Add the `csstype` comments for each property.

You will now be able to see a utility or `csstype` values in 2 clicks !

---

Instead of relying on TS to infer the correct type for each properties, we now just generate the appropriate value for
each property based on the config.

This should make it easier to understand the type of each property and might also speed up the TS suggestions as there's
less to infer.
