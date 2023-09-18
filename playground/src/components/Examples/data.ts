import { getConfig } from './utils'
import outdent from 'outdent'

export const EXAMPLES = [
  {
    id: 'css',
    label: 'Writing styles (css)',
    code: outdent`import { css } from 'styled-system/css'

        export const App = () => {
          return (
            <>
              <button
                className={css({
                  color: 'red.400',
                })}
              >
                Hello world
              </button>
            </>
          )
        }
        `,
    config: getConfig(`theme: { extend: {} },`),
  },
  {
    id: 'cva',
    label: 'Atomic Recipes (cva)',
    code: outdent`import { cva } from 'styled-system/css';

    const button = cva({
      base: {
        display: 'flex',
      },
      variants: {
        visual: {
          solid: { bg: 'yellow.200', color: 'black' },
          outline: { borderWidth: '1px', borderColor: 'yellow.200' },
        },
        size: {
          sm: { padding: '4', fontSize: '12px' },
          lg: { padding: '8', fontSize: '24px' },
        },
      },
    });
    
    export const App = () => {
      return (
        <>
          <button className={button({ visual: 'outline', size: 'sm' })}>
            Click Me
          </button>
          <button className={button({ visual: 'solid', size: 'lg' })}>
            Click Me
          </button>
        </>
      );
    };
    
    `,
    config: undefined,
  },
  {
    id: 'sva',
    label: 'Slot Recipes (sva)',
    code: outdent`import { sva } from 'styled-system/css';

    const card = sva({
      slots: ['root', 'title', 'content'],
      base: {
        root: {
          p: '6',
          m: '4',
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
          borderBottom: 'solid yellow 0.2px',
          pb: '2',
        },
      },
    });
    
    export const App = () => {
      return (
        <>
          <div className={card().root}>
            <div className={card().title}>Team Members</div>
            <div className={card().content}>Content</div>
          </div>
        </>
      );
    };
    `,
    config: undefined,
  },
  {
    id: 'config-recipes',
    label: 'Config Recipes',
    code: outdent`import { button } from 'styled-system/recipes';

    function App() {
      return (
        <div>
          <button className={button()}>Click me</button>
          <button className={button({ shape: 'circle' })}>Click me</button>
        </div>
      );
    }
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
          display: 'flex'
        },
        variants: {
          visual: {
            funky: { bg: 'yellow.200', color: 'black' },
            edgy: { border: '1px solid {colors.yellow.500}' }
          },
          size: {
            sm: { padding: '4', fontSize: '12px' },
            lg: { padding: '8', fontSize: '40px' }
          },
          shape: {
            square: { borderRadius: '0' },
            circle: { borderRadius: 'full' }
          }
        },
        defaultVariants: {
          visual: 'funky',
          size: 'sm',
          shape: 'circle'
        }
      })`,
      `import { defineConfig, defineRecipe } from '@pandacss/dev'`,
    ),
  },
  {
    id: 'config-slot-recipes',
    label: 'Config Slot Recipes',
    code: outdent`import { card } from 'styled-system/recipes';

    function App() {
      return (
        <>
        <div className={card().root}>
          <div className={card().title}>Team Members</div>
          <div className={card().content}>Content</div>
        </div>
      </>
      );
    }
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
            borderBottom: 'solid yellow 0.2px',
            pb: '2',
          },
        },
      })`,
      `import { defineConfig, defineSlotRecipe } from '@pandacss/dev'`,
    ),
  },
  {
    id: 'patterns',
    label: 'Patterns',
    code: outdent`import { stack, hstack, flex, square, circle } from 'styled-system/patterns';

    export const App = () => {
      return (
        <div
          className={stack({
            gap: '1',
            p: '1',
            divideY: '1px',
            divideColor: 'yellow.200',
            divideStyle: 'solid',
          })}
        >
          <div className={hstack({ gap: '6', padding: '1' })}>
            <div className={square({ size: '9', bg: 'yellow.300' })}>1</div>
            <div className={square({ size: '9', bg: 'red.300' })}>2</div>
            <div className={square({ size: '9', bg: 'green.300' })}>3</div>
          </div>
    
          <div
            className={flex({
              direction: 'row',
              align: 'center',
              gap: '1',
              p: '1',
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
    config: undefined,
  },
] as const

export type Example = (typeof EXAMPLES)[number]['id']
