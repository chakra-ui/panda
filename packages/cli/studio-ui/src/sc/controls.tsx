import { Section, SectionTitle, SectionContent, Row, DemoList } from '../showcase-kit'

const tabVariants = ['line', 'subtle', 'enclosed', 'outline'] as const
const tabItems = ['Components', 'Hooks', 'Utilities']

function TabStrip({ variant }: { variant: (typeof tabVariants)[number] }) {
  return (
    <div class={`pg-tabs pg-tabs-${variant}`}>
      {tabItems.map((label, i) => (
        <button type="button" class={`pg-tab${i === 0 ? ' pg-tab-active' : ''}`} key={label}>
          {label}
        </button>
      ))}
    </div>
  )
}

const checkVariants = ['solid', 'outline', 'subtle'] as const

function CheckboxItem({ variant, checked }: { variant: string; checked: boolean }) {
  return (
    <label class="pg-checkbox-item">
      <span class={`pg-checkbox pg-checkbox-${variant}${checked ? ' pg-checked' : ''}`}>
        {checked ? (
          <svg class="pg-check-glyph" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              d="M3 8.5l3 3 7-7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span class="pg-control-label">Accept terms</span>
    </label>
  )
}

const radioVariants = ['solid', 'outline', 'subtle'] as const

function RadioItem({ variant, label, selected }: { variant: string; label: string; selected: boolean }) {
  return (
    <label class="pg-radio-item">
      <span class={`pg-radio pg-radio-${variant}${selected ? ' pg-selected' : ''}`}>
        <span class="pg-radio-dot" />
      </span>
      <span class="pg-control-label">{label}</span>
    </label>
  )
}

function SwitchItem({ on, tone }: { on: boolean; tone: 'accent' | 'gray' }) {
  return (
    <span class={`pg-switch pg-switch-${tone}${on ? ' pg-on' : ''}`}>
      <span class="pg-switch-knob" />
    </span>
  )
}

export function Controls() {
  return (
    <>
      <Section>
        <SectionTitle>Tabs</SectionTitle>
        <SectionContent>
          <div class="pg-tabs-grid">
            {tabVariants.map((variant) => (
              <TabStrip variant={variant} key={variant} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Checkbox</SectionTitle>
        <SectionContent>
          <Row>
            {checkVariants.map((variant) => (
              <div class="pg-stack" key={variant}>
                <CheckboxItem variant={variant} checked={false} />
                <CheckboxItem variant={variant} checked={true} />
              </div>
            ))}
          </Row>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Radio</SectionTitle>
        <SectionContent>
          <Row>
            {radioVariants.map((variant) => (
              <div class="pg-radio-group" key={variant}>
                <RadioItem variant={variant} label="Radio one" selected={false} />
                <RadioItem variant={variant} label="Radio second" selected={true} />
              </div>
            ))}
          </Row>
        </SectionContent>
      </Section>

      <Section>
        <SectionTitle>Switch</SectionTitle>
        <SectionContent>
          <Row>
            <SwitchItem on={false} tone="accent" />
            <SwitchItem on={true} tone="accent" />
            <SwitchItem on={true} tone="gray" />
          </Row>
        </SectionContent>
      </Section>
    </>
  )
}
