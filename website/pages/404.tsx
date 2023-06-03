import Image from 'next/image'
import Link from 'next/link'
import { css } from '../styled-system/css'
import { Box, Container, VStack, panda } from '../styled-system/jsx'

export default function Page() {
  return (
    <panda.div bg="yellow.300" height="dvh">
      <Container py="20" textAlign="center">
        <VStack>
          <panda.h1 textStyle="panda.h1" fontWeight="bold">
            404
          </panda.h1>
          <panda.h2 textStyle="panda.h2" fontWeight="medium">
            Page Not Found
          </panda.h2>
          <panda.p textStyle="panda.h4">
            Sorry, that page does not exist.{' '}
            <Link
              className={css({
                fontWeight: 'medium',
                textDecoration: 'underline'
              })}
              href="/docs"
            >
              Back to docs
            </Link>
          </panda.p>
          <Box mt="16">
            <Image src="/panda-yoga.svg" alt="" width="300" height="500" />
          </Box>
        </VStack>
      </Container>
    </panda.div>
  )
}
