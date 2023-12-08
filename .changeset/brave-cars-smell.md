---
'@pandacss/extractor': patch
---

Fix static extraction issue when using JSX attributes (props) that are other JSX nodes

While parsing over the AST Nodes, due to an optimization where we skipped retrieving the current JSX element and instead
kept track of the latest one, the logic was flawed and did not extract other properties after encountering a JSX
attribute that was another JSX node.

```tsx
const Component = () => {
  return (
    <>
      {/* ❌ this wasn't extracting ml="2" */}
      <Flex icon={<svg className="icon" />} ml="2" />

      {/* ✅ this was fine */}
      <Stack ml="4" icon={<div className="icon" />} />
    </>
  )
}
```

Now both will be fine again.
