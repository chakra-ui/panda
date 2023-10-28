import { Button, HStack } from '@chakra-ui/react'
import { useSandpack } from '@codesandbox/sandpack-react'
import { FILES_TO_EXCLUDE } from '../constants/sandpack'
import { FormatCodeButton } from './format-code-button'

export const EditorTabs = () => {
  const { sandpack } = useSandpack()
  const { files, activeFile: activeFileKey, setActiveFile } = sandpack

  const activeFile = files[activeFileKey]

  const editableFiles = Object.entries(files).filter(
    ([fileName, file]) => !file.hidden && !FILES_TO_EXCLUDE.includes(fileName)
  )

  return (
    <HStack
      px='2'
      spacing='0'
      bg='var(--sp-colors-surface1)'
      borderBottom='1px solid var(--sp-colors-surface2)'
      role='tablist'
    >
      {editableFiles.map(([fileName, file]) => (
        <Button
          role='tab'
          key={fileName}
          borderRadius='0'
          onClick={() => setActiveFile(fileName)}
          variant='unstyled'
          fontSize='sm'
          fontWeight='medium'
          px='2'
          color='var(--sp-colors-clickable)'
          transition='color var(--sp-transitions-default), background var(--sp-transitions-default)'
          data-active={file.code === activeFile.code ? '' : undefined}
          _active={{
            color: 'teal.300',
            boxShadow: 'inset 0 -1px 0px 0px var(--chakra-colors-teal-500)',
          }}
          _hover={{
            color: 'var(--sp-colors-hover)',
          }}
        >
          {fileName.split('/')[1]}
        </Button>
      ))}
      <FormatCodeButton />
    </HStack>
  )
}
