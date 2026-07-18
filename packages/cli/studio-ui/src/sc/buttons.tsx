import { Section, SectionTitle, SectionContent, Row, DemoList } from '../showcase-kit'

const buttonVariants = ['solid', 'outline', 'ghost', 'subtle', 'surface', 'plain'] as const

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function PersonGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
    </svg>
  )
}

function ButtonRow({ gray }: { gray?: boolean }) {
  return (
    <Row>
      {buttonVariants.map((variant) => (
        <button key={variant} type="button" class={`pg-btn pg-btn-${variant}${gray ? ' pg-btn-gray' : ''}`}>
          Click
          <Arrow />
        </button>
      ))}
    </Row>
  )
}

const codeVariants = ['subtle', 'surface', 'outline', 'solid'] as const
const avatarVariants = ['solid', 'subtle'] as const

export function Buttons() {
  return (
    <>
      <Section>
        <SectionTitle>Button</SectionTitle>
        <SectionContent>
          <DemoList
            items={[
              { label: 'Accent colors', node: <ButtonRow /> },
              { label: 'Gray', node: <ButtonRow gray /> },
            ]}
          />
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Code</SectionTitle>
        <SectionContent>
          <Row>
            {codeVariants.map((variant) => (
              <code key={variant} class={`pg-code pg-code-${variant}`}>
                console.log()
              </code>
            ))}
          </Row>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Avatar</SectionTitle>
        <SectionContent>
          <Row>
            {avatarVariants.map((variant) => (
              <div key={variant} class="pg-avatar-group">
                <span class={`pg-avatar pg-avatar-${variant}`}>SA</span>
                <span class={`pg-avatar pg-avatar-${variant}`}>MD</span>
                <span class={`pg-avatar pg-avatar-${variant}`}>
                  <PersonGlyph />
                </span>
              </div>
            ))}
          </Row>
        </SectionContent>
      </Section>
    </>
  )
}
