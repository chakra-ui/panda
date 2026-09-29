import { DEFAULT_PRESETS, getConfig } from './utils'
import outdent from 'outdent'

export const initialCSS = `@layer reset,
base,
tokens,
recipes,
utilities;`

export const EXAMPLES = [
  {
    id: 'css',
    label: 'Writing styles (css)',
    code: outdent`import { css } from 'styled-system/css';
    import { center } from 'styled-system/patterns';
    
    export const App = () => {
      return (
        <div className={center({ h: 'full' })}>
          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              fontWeight: 'semibold',
              color: 'yellow.300',
              textAlign: 'center',
              textStyle: '4xl',
            })}
          >
            <span>🐼</span>
            <span>Hello from Panda</span>
          </div>
        </div>
      );
    };
    
        `,
    config: getConfig(`theme: { extend: {} },`),
  },
  {
    id: 'cva',
    label: 'Atomic Recipes (cva)',
    code: outdent`import { cva } from 'styled-system/css';
    import { center } from 'styled-system/patterns';
    
    const button = cva({
      base: {
        borderRadius: 'md',
        fontWeight: 'semibold',
        h: '10',
        px: '4',
      },
      variants: {
        visual: {
          solid: {
            bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
            color: { base: 'white', _dark: 'gray.800' },
          },
          outline: {
            border: '1px solid',
            color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
            borderColor: 'currentColor',
          },
        },
      },
    });
    
    export const App = () => {
      return (
        <div className={center({ colorPalette: 'yellow', h: 'full', gap: '4' })}>
          <button className={button({ visual: 'solid' })}>Button</button>
          <button className={button({ visual: 'outline' })}>Button</button>
        </div>
      );
    };
    
    
    `,
    config: getConfig(`theme: { extend: {} },`),
  },
  {
    id: 'sva',
    label: 'Slot Recipes (sva)',
    code: outdent`import { sva } from 'styled-system/css';
    import { center } from 'styled-system/patterns';
    
    const card = sva({
      slots: ['root', 'title', 'content'],
      base: {
        root: {
          p: '6',
          m: '4',
          w: 'md',
          boxShadow: 'md',
          borderRadius: 'md',
          _dark: { bg: '#262626', color: 'white' },
        },
        content: {
          textStyle: 'lg',
        },
        title: {
          textStyle: 'xl',
          fontWeight: 'semibold',
          pb: '2',
        },
      },
    });
    
    export const App = () => {
      const styles = card()
      return (
        <div className={center({ h: 'full' })}>
          <div className={styles.root}>
            <div className={styles.title}>Team Members</div>
            <div className={styles.content}>Content</div>
          </div>
        </div>
      );
    };
    
    `,
    config: getConfig(`theme: { extend: {} },`),
  },
  {
    id: 'config-recipes',
    label: 'Config Recipes',
    code: outdent`import { button } from 'styled-system/recipes';
    import { center } from 'styled-system/patterns';
    
    export const App = () => {
      return (
        <div className={center({ colorPalette: 'yellow', h: 'full', gap: '4' })}>
          <button className={button({ visual: 'solid' })}>Button</button>
          <button className={button({ visual: 'outline' })}>Button</button>
        </div>
      );
    };
    
    `,
    config: getConfig(
      `theme: {
    extend: {
      recipes: {
        button: buttonRecipe,
      },
    },
  }`,
      `const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'The styles for the Button component',
  base: {
    borderRadius: 'md',
    fontWeight: 'semibold',
    h: '10',
    px: '4',
  },
  variants: {
    visual: {
      solid: {
        bg: { base: 'colorPalette.500', _dark: 'colorPalette.300' },
        color: { base: 'white', _dark: 'gray.800' },
      },
      outline: {
        border: '1px solid',
        color: { base: 'colorPalette.600', _dark: 'colorPalette.200' },
        borderColor: 'currentColor',
      },
    },
  },
})`,
      `import { defineConfig, defineRecipe } from '@pandacss/dev'`,
    ),
  },
  {
    id: 'config-slot-recipes',
    label: 'Config Slot Recipes',
    code: outdent`import { card } from 'styled-system/recipes';
    import { center } from 'styled-system/patterns';
    
    export const App = () => {
      const styles = card()
      return (
        <div className={center({ h: 'full' })}>
          <div className={styles.root}>
            <div className={styles.title}>Team Members</div>
            <div className={styles.content}>Content</div>
          </div>
        </div>
      );
    };
    
    `,
    config: getConfig(
      `theme: {
    extend: {
      slotRecipes: {
        card: cardRecipe,
      },
    },
  }`,
      `const cardRecipe = defineSlotRecipe({
  className: 'card',
  description: 'The styles for the Card component',
  slots: ['root', 'title', 'content'],
  base: {
    root: {
      p: '6',
      m: '4',
      w: 'md',
      boxShadow: 'md',
      borderRadius: 'md',
      _dark: { bg: '#262626', color: 'white' },
    },
    content: {
      textStyle: 'lg',
    },
    title: {
      textStyle: 'xl',
      fontWeight: 'semibold',
      pb: '2',
    },
  },
});`,
      `import { defineConfig, defineSlotRecipe } from '@pandacss/dev'`,
    ),
  },
  {
    id: 'patterns',
    label: 'Patterns',
    code: outdent`import { cx } from 'styled-system/css';
    import { flex, square, circle, center } from 'styled-system/patterns';
    
    export const App = () => {
      return (
        <div
          className={cx(
            flex({
              gap: '4',
              direction: 'column',
            }),
            center({ h: 'full' })
          )}
        >
          <div className={flex({ gap: '6', padding: '1' })}>
            <div className={square({ size: '11', bg: 'yellow.300' })}>1</div>
            <div className={square({ size: '11', bg: 'red.300' })}>2</div>
            <div className={square({ size: '11', bg: 'green.300' })}>3</div>
          </div>
    
          <div
            className={flex({
              direction: 'row',
              align: 'center',
              gap: '4',
            })}
          >
            <div className={circle({ size: '12', bg: 'blue.300' })}>1</div>
            <div className={circle({ size: '12', bg: 'orange.300' })}>2</div>
            <div className={circle({ size: '12', bg: 'violet.300' })}>3</div>
          </div>
        </div>
      );
    };
    
    `,

    config: getConfig(`theme: { extend: {} },`),
  },

  {
    id: 'prose',
    label: 'Typography (prose)',
    code: outdent`import { prose } from 'styled-system/recipes';

    // HTML you don't control: a CMS field, rendered Markdown, a model reply.
    const html = \`
      <h1>Shipping a token change</h1>
      <p class="lead">Change the palette once. Every component follows, in light and dark.</p>
      <p>Components read roles like <code>bg: 'surface'</code>, not values. Change the role's value and you are done.</p>
      <h2>Three steps</h2>
      <ol>
        <li>Pick the value in the token sheet.</li>
        <li>Export it to <code>tokens.json</code>.</li>
        <li>Run codegen.</li>
      </ol>
      <blockquote><p>The best token change is the one nobody finds out about.</p></blockquote>
      <table>
        <thead><tr><th>Role</th><th>Light</th><th>Dark</th></tr></thead>
        <tbody>
          <tr><td>surface</td><td>white</td><td>gray.800</td></tr>
          <tr><td>accent</td><td>blue.600</td><td>blue.300</td></tr>
        </tbody>
      </table>
    \`;

    export const App = () => {
      return (
        <div style={{ padding: 32 }}>
          <article
            className={prose({ size: 'md' })}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      );
    };

        `,
    config: getConfig(`theme: { extend: {} },`, undefined, undefined, [
      ...DEFAULT_PRESETS,
      '@pandacss/preset-typography',
    ]),
  },
  {
    id: 'jsx',
    label: 'JSX Style Props',
    code: outdent`import { styled, Center } from 'styled-system/jsx';

    export const App = () => {
      return (
        <Center height="full">
          <styled.button
            rounded="md"
            fontWeight="semibold"
            height="10"
            px="4"
            bg={{ base: 'yellow.500', _dark: 'yellow.300' }}
            color={{ base: 'white', _dark: 'gray.800' }}
          >
            Button
          </styled.button>
        </Center>
      );
    };
    `,
    config: getConfig(`theme: { extend: {} },`),
  },
]

export type Example = (typeof EXAMPLES)[number]['id']
