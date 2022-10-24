import boxen from 'boxen'

export function cliBox(str: string, title?: string) {
  return boxen(str, {
    padding: { left: 3, right: 3, top: 1, bottom: 1 },
    borderColor: 'magenta',
    borderStyle: 'round',
    title,
    titleAlignment: 'center',
  })
}
