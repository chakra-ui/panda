import { Button } from '@chakra-ui/react'
import { useActiveCode } from '@codesandbox/sandpack-react'
import prettier from 'prettier'
import parserBabel from 'prettier/parser-babel'
import { ImMagicWand } from 'react-icons/im'

export const FormatCodeButton = () => {
  const { code, updateCode } = useActiveCode()

  const runPrettier = () => {
    try {
      const formattedCode = prettier.format(code, {
        parser: 'babel',
        plugins: [parserBabel],
        semi: false,
        singleQuote: true,
      })

      updateCode(formattedCode)
    } catch {}
  }

  return (
    <Button
      borderRadius='0'
      onClick={runPrettier}
      variant='unstyled'
      size='sm'
      fontWeight='medium'
      px='2'
      color='gray.400'
      transition='color var(--sp-transitions-default), background var(--sp-transitions-default)'
      ml='auto !important'
      leftIcon={<ImMagicWand />}
      _hover={{ color: 'gray.300' }}
    >
      Format
    </Button>
  )
}
