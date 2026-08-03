import { Section, SectionTitle, SectionContent, Row, DemoList } from '../showcase-kit'

const badges = ['accent', 'success', 'warning', 'danger'] as const
const badgeLabels: Record<(typeof badges)[number], string> = {
  accent: 'Accent',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
}

const spinnerSizes = ['sm', 'md', 'lg'] as const
const blockquoteVariants = ['subtle', 'solid'] as const

const quote =
  'If anyone thinks he is something when he is nothing, he deceives himself. Each one should test his own actions.'

const progress = [25, 75] as const

const timeline = [
  { title: 'Product Shipped', date: 'Jan 12, 2026', desc: 'The first release rolled out to every workspace.' },
  { title: 'Beta Opened', date: 'Feb 04, 2026', desc: 'Early adopters started testing the studio flow.' },
  { title: 'General Availability', date: 'Mar 21, 2026', desc: 'Public launch across all supported frameworks.' },
]

function BadgeRow() {
  return (
    <Row>
      {badges.map((tone) => (
        <span key={tone} class={`pg-badge pg-badge-${tone}`}>
          {badgeLabels[tone]}
        </span>
      ))}
    </Row>
  )
}

function Blockquotes() {
  return (
    <div class="pg-quote-list">
      {blockquoteVariants.map((variant) => (
        <blockquote key={variant} class={`pg-quote pg-quote-${variant}`}>
          <p class="pg-quote-body">{quote}</p>
          <footer class="pg-quote-cite">— Uzumaki Naruto</footer>
        </blockquote>
      ))}
    </div>
  )
}

function Spinners() {
  return (
    <Row>
      {spinnerSizes.map((size) => (
        <span key={size} class={`pg-spinner pg-spinner-${size}`} role="status" aria-label="Loading" />
      ))}
    </Row>
  )
}

function ProgressCircles() {
  return (
    <Row>
      {progress.map((value) => (
        <div key={value} class="pg-progress-circle" style={{ '--pg-progress': `${value}%` }}>
          <span class="pg-progress-value">{value}%</span>
        </div>
      ))}
    </Row>
  )
}

function Timeline() {
  return (
    <ol class="pg-timeline">
      {timeline.map((entry) => (
        <li key={entry.title} class="pg-timeline-item">
          <span class="pg-timeline-dot" aria-hidden="true" />
          <div class="pg-timeline-content">
            <span class="pg-timeline-title">{entry.title}</span>
            <span class="pg-timeline-date">{entry.date}</span>
            <p class="pg-timeline-desc">{entry.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Feedback() {
  return (
    <>
      <Section>
        <SectionTitle>Badge</SectionTitle>
        <SectionContent>
          <BadgeRow />
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Blockquote</SectionTitle>
        <SectionContent>
          <Blockquotes />
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Spinner</SectionTitle>
        <SectionContent>
          <Spinners />
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Progress circle</SectionTitle>
        <SectionContent>
          <DemoList items={[{ label: 'Determinate', node: <ProgressCircles /> }]} />
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Timeline</SectionTitle>
        <SectionContent>
          <Timeline />
        </SectionContent>
      </Section>
    </>
  )
}
