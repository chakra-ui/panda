---
'@pandacss/extractor': patch
---

Fix extractor issue where we didn't explore both branches when using a default value as the condition expression

In the example below, only the `yellow` color would be generated although the `blue` color should also be generated in case the `disabled` prop is `true`.

```tsx
const CompB = ({ disabled = false }: { disabled: boolean }) => {
    return (
        <div className={css({ color: disabled ? 'blue' : 'yellow' })}>
        Component B is disabled
        </div>
    );
};
```
