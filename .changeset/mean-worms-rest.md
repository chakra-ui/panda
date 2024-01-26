---
'@pandacss/config': patch
---

Add config validation:

- Check for duplicate between token & semanticTokens names
- Check for duplicate between recipes/patterns/slots names
- Check for token / semanticTokens paths (must end/contain 'value')
- Check for self/circular token references
- Check for missing tokens references
- Check for conditions selectors (must contain '&')
- Check for breakpoints units (must be the same)
