import { Section, SectionTitle, SectionContent, Row, DemoList } from '../showcase-kit'

function Stars({ tone }: { tone: 'accent' | 'gray' }) {
  return (
    <div class={`pg-stars pg-stars-${tone}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span class={`pg-star ${i < 3 ? 'pg-star-on' : ''}`} key={i}>
          ★
        </span>
      ))}
    </div>
  )
}

function Slider({ value }: { value: number }) {
  return <input type="range" class="pg-slider" min={0} max={100} defaultValue={String(value)} />
}

export function DataDisplay() {
  return (
    <>
      <Section>
        <SectionTitle>Pagination</SectionTitle>
        <SectionContent>
          <Row>
            <button class="pg-page pg-page-nav">‹</button>
            <button class="pg-page pg-page-active">1</button>
            <button class="pg-page">2</button>
            <button class="pg-page">3</button>
            <button class="pg-page">4</button>
            <button class="pg-page">5</button>
            <span class="pg-page-ellipsis">…</span>
            <button class="pg-page">10</button>
            <button class="pg-page pg-page-nav">›</button>
          </Row>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Rating</SectionTitle>
        <SectionContent>
          <DemoList
            items={[
              { label: 'Accent', node: <Stars tone="accent" /> },
              { label: 'Gray', node: <Stars tone="gray" /> },
            ]}
          />
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Slider</SectionTitle>
        <SectionContent>
          <DemoList
            items={[
              { label: '40%', node: <Slider value={40} /> },
              { label: '65%', node: <Slider value={65} /> },
            ]}
          />
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Steps</SectionTitle>
        <SectionContent>
          <div class="pg-steps">
            <div class="pg-step">
              <div class="pg-step-circle pg-step-done">✓</div>
              <span class="pg-step-label">Step 1</span>
            </div>
            <div class="pg-step-connector pg-step-connector-done" />
            <div class="pg-step">
              <div class="pg-step-circle pg-step-active">2</div>
              <span class="pg-step-label">Step 2</span>
            </div>
            <div class="pg-step-connector" />
            <div class="pg-step">
              <div class="pg-step-circle pg-step-upcoming">3</div>
              <span class="pg-step-label">Step 3</span>
            </div>
          </div>
          <Row>
            <button class="pg-step-btn">Prev</button>
            <button class="pg-step-btn">Next</button>
          </Row>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Keyboard</SectionTitle>
        <SectionContent>
          <Row>
            <kbd class="pg-kbd">⌘</kbd>
            <kbd class="pg-kbd">C</kbd>
            <kbd class="pg-kbd">⌘</kbd>
            <kbd class="pg-kbd">K</kbd>
          </Row>
        </SectionContent>
      </Section>
    </>
  )
}
