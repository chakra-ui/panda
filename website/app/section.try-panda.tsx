import { ComponentPropsWithoutRef } from 'react'
import { css } from '../styled-system/css'
import { Flex, HStack, panda } from '../styled-system/jsx'
import Image from 'next/image'
import { Content } from './content'

export const SectionTryPanda = () => {
  return (
    <Flex
      bgColor="panda.bg.dark"
      justifyContent="center"
      pt={{ base: '40px', lg: '85px' }}
      pb={{ base: '40px', lg: '70px' }}
    >
      <Content alignItems="center">
        <Flex alignItems="center">
          <panda.h3
            textStyle="panda.h3"
            pos="relative"
            bgColor="panda.yellow"
            color="black"
            py="25px"
            px="30px"
            borderRadius="19px"
          >
            Love what you see? <br />
            Try Panda in 3 quick steps
            <DialogIndicator
              className={css({
                pos: 'absolute',
                top: '50%',
                left: 'calc(100% - 2px)',
                transform: 'translateY(-50%)',
                color: 'panda.yellow'
              })}
            />
          </panda.h3>
          <Image
            src="/panda-hello.svg"
            width={196}
            height={261}
            alt="Yums the panda waving"
            className={css({
              ml: '20px',
              w: '75px',
              sm: { ml: '50px', w: '196px' }
            })}
          />
        </Flex>
        <Flex
          mt={{ base: '40px', lg: '80px' }}
          justifyContent="space-between"
          w="100%"
          flexDirection={{ base: 'column', lg: 'row' }}
          alignItems={{ base: 'center', lg: 'flex-start' }}
          rowGap={8}
        >
          <Flex direction="column" w="240px" position="relative">
            <panda.span
              position={{ base: 'absolute', lg: 'static' }}
              top="-25px"
              right="calc(100% + 25px)"
              fontWeight="bold"
              fontSize={{ base: '4rem', md: '5.9375rem' }}
              lineHeight="7.5rem"
              letterSpacing="tight"
              color="panda.yellow"
            >
              1
            </panda.span>
            <panda.span
              fontWeight="semibold"
              textStyle="panda.h4"
              color="white"
            >
              Install Panda in your project
            </panda.span>
            <HStack
              mt={{ base: '10px', lg: '35px' }}
              fontWeight="500"
              textStyle="xl"
              letterSpacing="tight"
            >
              <panda.code color="panda.gray.100">$</panda.code>
              <panda.code color="white" whiteSpace="nowrap">
                npm install @pandacss/dev
              </panda.code>
            </HStack>
          </Flex>
          <Flex direction="column" w="240px" position="relative">
            <panda.span
              position={{ base: 'absolute', lg: 'static' }}
              top="-25px"
              right="calc(100% + 25px)"
              fontWeight="bold"
              fontSize={{ base: '4rem', md: '5.9375rem' }}
              lineHeight="7.5rem"
              letterSpacing="tight"
              color="panda.yellow"
            >
              2
            </panda.span>
            <panda.span
              fontWeight="semibold"
              textStyle="panda.h4"
              color="white"
            >
              Run the initialize command
            </panda.span>
            <HStack
              mt={{ base: '10px', lg: '35px' }}
              fontWeight="500"
              textStyle="xl"
              letterSpacing="tight"
            >
              <panda.code color="panda.gray.100">$</panda.code>
              <panda.code color="white" whiteSpace="nowrap">
                npm run panda init
              </panda.code>
            </HStack>
          </Flex>
          <Flex direction="column" w="240px" position="relative">
            <panda.span
              position={{ base: 'absolute', lg: 'static' }}
              top="-25px"
              right="calc(100% + 25px)"
              fontWeight="bold"
              fontSize={{ base: '4rem', md: '5.9375rem' }}
              lineHeight="7.5rem"
              letterSpacing="tight"
              color="panda.yellow"
            >
              3
            </panda.span>
            <panda.span
              fontWeight="semibold"
              textStyle="panda.h4"
              color="white"
            >
              Use the generated code to write styles
            </panda.span>
            <HStack
              mt={{ base: '10px', lg: '35px' }}
              fontWeight="500"
              textStyle="xl"
              letterSpacing="tight"
            >
              <panda.code color="panda.gray.100">$</panda.code>
              <panda.code color="white" whiteSpace="nowrap">
                npm run dev
              </panda.code>
              {/* TODO icon */}
            </HStack>
          </Flex>
        </Flex>
      </Content>
    </Flex>
  )
}

const DialogIndicator = (props: ComponentPropsWithoutRef<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="772.9 44.1775 49.2 95.92"
    width="24"
    height="44"
    {...props}
  >
    <path
      d="M 773 140 L 821.118 53.3869 C 823.791 48.9638 819.994 43.4556 814.91 44.3801 L 773 52 Z"
      fill="currentColor"
    />
  </svg>
)
