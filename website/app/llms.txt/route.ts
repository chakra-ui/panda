import { getPublicUrl } from '@/lib/public-url'

export const dynamic = 'force-static'

export const GET = async () => {
  const documentSets = [
    {
      title: 'Complete documentation',
      href: `${getPublicUrl('/llms-full.txt')}`,
      description:
        'The complete Panda CSS documentation across every section'
    },
    {
      title: 'Styling',
      href: `${getPublicUrl('/llms.txt/styling')}`,
      description:
        'Getting started, installation, core concepts, styling APIs, and migrating from another tool'
    },
    {
      title: 'Theming',
      href: `${getPublicUrl('/llms.txt/theming')}`,
      description:
        'Design tokens, composite styles, themes, and tooling like Panda Studio'
    },
    {
      title: 'Design Systems',
      href: `${getPublicUrl('/llms.txt/design-systems')}`,
      description:
        'Building a component library or a design system preset, customization, and distributing at scale'
    },
    {
      title: 'Reference',
      href: `${getPublicUrl('/llms.txt/reference')}`,
      description: 'Utility reference, CLI, config, and debugging'
    }
  ]

  const content = TEMPLATE.replace(
    '%DOCUMENT_SETS%',
    documentSets
      .map(set => `- [${set.title}](${set.href}): ${set.description}`)
      .join('\n')
  )

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

const TEMPLATE = `
# Panda CSS Documentation for LLMs

> Panda CSS is a CSS-in-JS framework with build-time optimizations for styling web applications

## Documentation Sets

This index provides links to documentation organized by topic. Each link contains the full text content for that section, making it easy for LLMs to understand specific aspects of Panda CSS.

%DOCUMENT_SETS%

## Notes

- The complete documentation includes all content from the official documentation
- Category-specific documentation files contain only the content relevant to that topic
- The content is automatically generated from the same source as the official documentation
- All code examples and API references are preserved in their original format
`
