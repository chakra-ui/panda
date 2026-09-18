# Panda CSS agent skills

Official [Agent Skills](https://skills.sh) for using Panda CSS. They teach agents how to write Panda correctly: which
API to reach for, which token names actually exist, and what the compiler can and can't see.

Install the pack:

```sh
npx skills add chakra-ui/panda
```

Each skill loads on its own triggers. You don't need to name them.

## Skills

### `panda-css`

Day-to-day styling. Writing and editing `css()`, patterns, recipes, conditions, and JSX style props in a project that
already has Panda set up.

Triggers on: building or changing components, styles that render a class name but no CSS, styles that don't apply,
picking between `css()`, a pattern, and a recipe.

### `panda-css-theming`

Theming and architecture. Designing the theme and the component-style layer, where the decisions are hard to reverse.

Triggers on: setting up theming, adding brand colors, wiring dark mode, shipping more than one theme, naming tokens,
deciding between `tokens`, `semanticTokens`, `textStyles`, and a recipe, designing a variant API, converting a recipe
into a slot recipe, cleaning up a theme that's drifted.

### `panda-css-migrate`

Upgrading v1 to v2, and debugging projects that worked on 1.x and break on the beta.

Triggers on: installing `@pandacss/dev@beta`, build failures after upgrading, `createStyleContext`, config hooks,
template literal styles, `panda ship`, `panda mcp`, `--cpu-prof`, CSS output changing after the upgrade.

This one is temporary. It exists for the v2 transition and will be archived once v2 is stable and v1 projects have
moved.

## What these are not

They don't replace the docs. Panda publishes machine-readable documentation at
[panda-css.com/llms.txt](https://panda-css.com/llms.txt), split by section, and the skills point agents there for API
detail rather than restating it.

They don't replace the linter. `@pandacss/eslint-plugin` mechanically catches unresolved tokens, nested selectors
missing `&`, files outside `include`, deprecated APIs, and hardcoded values that have tokens. Rules that run beat rules
an agent might read, so wire it up.

They don't replace `@pandacss/mcp`, which serves live tokens, recipes, and patterns from a running project.

## Structure

```txt
skills/
├── README.md
├── panda-css/
│   └── SKILL.md
├── panda-css-theming/
│   └── SKILL.md
└── panda-css-migrate/
    └── SKILL.md
```

## Contributing

Skills ship with the API. If you change something user-facing, a config option, a recipe helper, a CLI flag, update the
skill that mentions it in the same PR.

Keep `SKILL.md` bodies short. They're decision engines, not documentation: rules an agent applies, with the reasoning
compressed out. Depth belongs in the docs, and the skill links to it.

Examples target Panda v2 (`2.x`). Where v1 differs and it matters, say so inline.
