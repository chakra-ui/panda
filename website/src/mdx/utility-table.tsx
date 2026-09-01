import rawData from '@/generated/utilities.json'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface UtilityEntry {
  property: string
  shorthand?: string
  className?: string
  values?: string
  group?: string
}

interface UtilityGroup {
  group: string
  entries: UtilityEntry[]
}

const data = rawData as { groups: UtilityGroup[] }

const MAX_VALUES = 6

function summarise(values?: string) {
  if (!values) return '—'
  const parts = values.split(' | ')
  if (parts.length <= MAX_VALUES) return values
  return `${parts.slice(0, MAX_VALUES).join(' | ')} + ${parts.length - MAX_VALUES} more`
}

interface Props {
  /** Group names as they appear in the preset, e.g. `["Padding", "Margin"]`. */
  groups?: string[]
  /** Explicit property names, for pages that do not map onto a preset group. */
  properties?: string[]
  /** Heading shown above an explicit property list. */
  label?: string
}

const cell = css({
  textAlign: 'start',
  verticalAlign: 'top',
  px: '3',
  py: '2.5',
  borderBottomWidth: '1px',
  borderColor: 'border'
})

const code = css({
  fontFamily: 'mono',
  textStyle: 'sm',
  whiteSpace: 'nowrap'
})

export function UtilityTable({ groups, properties, label }: Props) {
  const matched = properties
    ? [
        {
          group: label ?? 'Properties',
          entries: data.groups
            .flatMap(group => group.entries)
            .filter(entry => properties.includes(entry.property))
            .sort((a, b) => a.property.localeCompare(b.property))
        }
      ].filter(group => group.entries.length > 0)
    : data.groups.filter(group => groups?.includes(group.group))

  if (matched.length === 0) return null

  return (
    <Box my="8">
      {matched.map(group => (
        <Box key={group.group} mb="8">
          <Box textStyle="eyebrow" color="fg.subtle" mb="3">
            {group.group} · {group.entries.length}
          </Box>
          <Box overflowX="auto" className="scroll-area">
            <Box
              as="table"
              width="full"
              textStyle="sm"
              borderCollapse="collapse"
            >
              <thead>
                <tr>
                  <th className={cell}>Property</th>
                  <th className={cell}>Shorthand</th>
                  <th className={cell}>Class</th>
                  <th className={cell}>Values</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map(entry => (
                  <tr key={entry.property}>
                    <td className={cell}>
                      <span className={code}>{entry.property}</span>
                    </td>
                    <td className={cell}>
                      {entry.shorthand ? (
                        <span className={code}>{entry.shorthand}</span>
                      ) : (
                        <Box as="span" color="fg.subtle">
                          —
                        </Box>
                      )}
                    </td>
                    <td className={cell}>
                      {entry.className ? (
                        <span className={code}>{entry.className}</span>
                      ) : (
                        <Box as="span" color="fg.subtle">
                          —
                        </Box>
                      )}
                    </td>
                    <td className={cell}>
                      <Box as="span" color="fg.muted">
                        {summarise(entry.values)}
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )
}
