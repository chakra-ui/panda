import { useState } from 'preact/hooks'
import { Row, Section, SectionContent, SectionTitle } from '../showcase-kit'

const TAB_VARIANTS = ['line', 'subtle', 'enclosed', 'outline'] as const
const TABS = [
  { value: 'components', label: 'Components' },
  { value: 'hooks', label: 'Hooks' },
  { value: 'utilities', label: 'Utilities' },
]

function TabStrip({ variant }: { variant: string }) {
  const [active, setActive] = useState('components')
  return (
    <div class={`pg-tabs pg-tabs-${variant}`}>
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          class={`pg-tab${active === tab.value ? ' pg-tab-active' : ''}`}
          onClick={() => setActive(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function Checkbox({ variant, defaultChecked }: { variant: string; defaultChecked?: boolean }) {
  return (
    <label class={`pg-cb pg-cb-${variant}`}>
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span class="pg-cb-box">
        <svg
          viewBox="0 0 16 16"
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </span>
      <span class="pg-control-label">Accept terms</span>
    </label>
  )
}

function RadioItem({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label class="pg-radio">
      <input type="radio" name={name} defaultChecked={defaultChecked} />
      <span class="pg-radio-mark" />
      <span class="pg-control-label">{label}</span>
    </label>
  )
}

function Switch({ gray, defaultChecked }: { gray?: boolean; defaultChecked?: boolean }) {
  return (
    <label class={`pg-switch${gray ? ' pg-switch-gray' : ''}`}>
      <input type="checkbox" defaultChecked={defaultChecked} />
      <span class="pg-switch-track">
        <span class="pg-switch-knob" />
      </span>
    </label>
  )
}

export function Controls() {
  return (
    <>
      <Section>
        <SectionTitle>Tabs</SectionTitle>
        <SectionContent>
          <div class="pg-tabs-grid">
            {TAB_VARIANTS.map((variant) => (
              <TabStrip key={variant} variant={variant} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Checkbox</SectionTitle>
        <SectionContent>
          <Row>
            {['solid', 'outline', 'subtle'].map((variant) => (
              <div class="pg-stack" key={variant}>
                <Checkbox variant={variant} />
                <Checkbox variant={variant} defaultChecked />
              </div>
            ))}
          </Row>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Radio</SectionTitle>
        <SectionContent>
          <Row>
            {['solid', 'outline', 'subtle'].map((variant) => (
              <div class="pg-radio-group" key={variant}>
                <RadioItem name={`pg-radio-${variant}`} label="Radio one" />
                <RadioItem name={`pg-radio-${variant}`} label="Radio second" defaultChecked />
              </div>
            ))}
          </Row>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Switch</SectionTitle>
        <SectionContent>
          <Row>
            <Switch />
            <Switch defaultChecked />
            <Switch gray defaultChecked />
          </Row>
        </SectionContent>
      </Section>
    </>
  )
}
