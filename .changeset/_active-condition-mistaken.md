---
"@pandacss/preset-base": patch
---

_active condition was triggering when data-active=false

There is a problem with the "_active" condition. If the component has the attribute data-active=false, it is triggered. Just the presence of it triggers the condition, regardless of its value. I had to override it to make it work properly.
