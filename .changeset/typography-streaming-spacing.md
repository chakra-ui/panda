---
'@pandacss/preset-typography': patch
---

Make the `prose` recipe scale with its container and follow the page.

- A size sets one root font size; every element is an `em` ratio of it. Set `--prose-leading` and `--prose-flow` on the
  wrapper to tune line height and block spacing.
- Inherit the page font instead of forcing `sans`. Only `code`, `pre`, and `kbd` use `mono`.
- Space blocks from the top only, with no `:last-child` rules, so streamed content never restyles earlier blocks.
- Render inline code as a pill on the new `codeBg` color role, and code blocks as a theme surface instead of an
  always-dark panel.
