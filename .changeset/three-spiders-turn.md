---
'@pandacss/parser': patch
---

Do not allow all JSX properties to be extracted if none provided, rely on the `isStyleProp` fn instead

This fixes cases when :

- `eject: true` and only the `@pandacss/preset-base` is used (or none)
- some non-styling JSX prop is extracted leading to an incorrect CSS rule being generated, ex:

```sh
🐼 info [cli] Writing /Users/astahmer/dev/reproductions/remix-panda/styled-system/debug/app__routes___index.css
🐼 error [serializer:css] Failed to serialize CSS: CssSyntaxError: <css input>:28:19: Missed semicolon

  26 |     }
  27 |     .src_https\:\/\/akmweb\.viztatech\.com\/web\/svnres\/file\/50_e4bb32c9ea75c5de397f2dc17a3cf186\.jpg {
> 28 |         src: https://akmweb.viztatech.com/web/svnres/file/50_e4bb32c9ea75c5de397f2dc17a3cf186.jpg
     |                   ^
  29 |     }
  30 | }
```
