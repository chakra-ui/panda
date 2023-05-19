import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Stack, panda } from '../styled-system/jsx'
import { button, code } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'
import { Content } from './content'
import { Code } from '../bright/code'
import { outdent } from 'outdent'

export const SectionModernCss = () => {
  return (
    <panda.div
      display="flex"
      justifyContent="center"
      bgColor="panda.bg.main"
      py="8"
      lg={{ h: '650px', pt: '100px' }}
    >
      <Content
        justifyContent="center"
        alignItems="center"
        position="relative"
        flexDirection="row"
        lgDown={{ flexDirection: 'column' }}
      >
        <Stack
          justifyContent="center"
          alignItems="flex-start"
          lg={{ maxWidth: '45%', mr: 'auto', pb: '92px' }}
        >
          <panda.div
            w="93px"
            h="93px"
            className={button({ color: 'white', shape: 'circle' })}
            position="relative"
            alignSelf={{ base: 'center', lg: 'flex-start' }}
          >
            <Icon icon="Css3" />
            <panda.div
              position="absolute"
              top="-7px"
              right="-18px"
              color="panda.text.main"
            >
              <Icon icon="Sparks2" className={css({ w: '22px', h: '22px' })} />
            </panda.div>
          </panda.div>
          <panda.h3 textStyle="panda.h3" mt={{ base: '20px', lg: '53px' }}>
            Generates Modern CSS code at build time
          </panda.h3>
          <panda.h4 textStyle="panda.h4" color="panda.text.muted" mt="20px">
            Panda uses modern features like cascade layers, :where selectors and
            css variables to give you best-in-class css output.
          </panda.h4>
          <Link
            href="/learn"
            className={cx(
              button({ color: 'ghost', size: 'xl' }),
              css({
                ml: -6,
                color: 'panda.text.headline',
                _hover: {
                  backgroundColor: 'white',
                  color: 'black',
                  _dark: {
                    backgroundColor: 'panda.yellow'
                  }
                }
              })
            )}
          >
            Learn more
            <ButtonIcon icon="RightArrowIcon" />
          </Link>
        </Stack>
        <panda.div
          maxW="570px"
          lg={{
            position: 'absolute',
            right: '0',
            bottom: '-70px',
            w: '48%'
          }}
          backgroundColor="panda.gray.600"
          borderRadius="16px"
        >
          {/* @ts-expect-error Server Component */}
          <Code lang="css" className={code()}>
            {outdent`
              @layer reset, base, tokens, recipes, utilities;

              @layer utilities {
                .d_flex {
                  display: flex;
                }
                .flex_row {
                  flex-direction: row;
                }
                .items_center {
                  align-items: center;
                }
                .p_4 {
                  padding: 1rem;
                }

                /* ... */

                .mt_2 {
                  margin-top: var(--space-2);
                }
                .fs_sm {
                  font-size: var(--fontSizes-sm);
                }
                .color_gray.600 {
                  color: var(--color-gray-600);
                }
              }`}
          </Code>
        </panda.div>
      </Content>
    </panda.div>
  )
}
