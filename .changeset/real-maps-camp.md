---
'@pandacss/generator': minor
'@pandacss/parser': minor
---

Introduce the new `{fn}.raw` method that allows for a super flexible usage and extraction :tada: :

```tsx
<Button rootProps={css.raw({ bg: "red.400" })} />

// recipe in storybook
export const Funky: Story = {
	args: button.raw({
		visual: "funky",
		shape: "circle",
		size: "sm",
	}),
};

// mixed with pattern
const stackProps = {
  sm: stack.raw({ direction: "column" }),
  md: stack.raw({ direction: "row" })
}

stack(stackProps[props.size]))
```
