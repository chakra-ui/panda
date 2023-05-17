import { ComponentPropsWithoutRef } from 'react'
import { css } from '../styled-system/css'
import { Flex, HStack, panda } from '../styled-system/jsx'
import Image from 'next/image'

export const SectionTryPanda = () => {
  return (
    <Flex bgColor="panda.bg.dark" justifyContent="center" pt="85px" pb="70px">
      <Flex direction="column" width="80%" alignItems="center">
        <Flex alignItems="center">
          <panda.div
            fontSize="40px"
            lineHeight="50px"
            letterSpacing="tight"
            fontWeight="bold"
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
          </panda.div>
          <Image
            src="/panda-hello.svg"
            width={196}
            height={261}
            alt="Yums the panda waving"
            className={css({ ml: '50px' })}
          />
        </Flex>
        <Flex mt="80px" justifyContent="space-between" w="100%">
          <Flex direction="column" w="240px">
            <panda.span
              fontWeight="bold"
              fontSize="95px"
              lineHeight="120px"
              letterSpacing="tight"
              color="panda.yellow"
            >
              1
            </panda.span>
            <panda.span
              fontWeight="600"
              fontSize="27px"
              lineHeight="34px"
              letterSpacing="tight"
              color="white"
            >
              Install Panda in your project
            </panda.span>
            <HStack
              mt="35px"
              fontWeight="500"
              fontSize="20px"
              letterSpacing="tight"
            >
              <panda.code color="panda.gray.100">$</panda.code>
              <panda.code color="white" whiteSpace="nowrap">
                npm install @pandacss/dev
              </panda.code>
            </HStack>
          </Flex>
          <Flex direction="column" w="240px">
            <panda.span
              fontWeight="bold"
              fontSize="95px"
              lineHeight="120px"
              letterSpacing="tight"
              color="panda.yellow"
            >
              2
            </panda.span>
            <panda.span
              fontWeight="600"
              fontSize="27px"
              lineHeight="34px"
              letterSpacing="tight"
              color="white"
            >
              Run the initialize command
            </panda.span>
            <HStack
              mt="35px"
              fontWeight="500"
              fontSize="20px"
              letterSpacing="tight"
            >
              <panda.code color="panda.gray.100">$</panda.code>
              <panda.code color="white" whiteSpace="nowrap">
                npm run panda init
              </panda.code>
            </HStack>
          </Flex>
          <Flex direction="column" w="240px">
            <panda.span
              fontWeight="bold"
              fontSize="95px"
              lineHeight="120px"
              letterSpacing="tight"
              color="panda.yellow"
            >
              3
            </panda.span>
            <panda.span
              fontWeight="600"
              fontSize="27px"
              lineHeight="34px"
              letterSpacing="tight"
              color="white"
            >
              Use the generated code to write styles
            </panda.span>
            <HStack
              mt="35px"
              fontWeight="500"
              fontSize="20px"
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
      </Flex>
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
