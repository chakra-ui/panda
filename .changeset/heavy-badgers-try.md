---
'@pandacss/parser': patch
'@pandacss/shared': patch
---

Fix a bug where some styles would be grouped together in the same rule, even if they were not related to each other.

## Internal details

This was caused by an object reference being re-used while setting a property deeply in the hashes decoding process,
leading to the mutation of a previous style object with additional properties.
