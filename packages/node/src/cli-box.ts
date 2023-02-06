import boxen from 'boxen'

export const createBox = (options: { content: string; title?: string }) =>
  boxen(options.content, {
    padding: { left: 3, right: 3, top: 1, bottom: 1 },
    borderColor: 'magenta',
    borderStyle: 'round',
    title: options.title,
    titleAlignment: 'center',
  })
