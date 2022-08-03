import { queries } from './queries';

function px(value: number | string | null): string | null {
  if (value == null) return null;
  const unitless = parseFloat(value.toString()) == value;
  return unitless || typeof value === 'number' ? `${value}px` : value;
}

function getDetails(entries: [string, string][]) {
  return entries.map(([name, min], index, entries) => {
    let max: string | null = null;

    if (index <= entries.length - 1) {
      max = entries[index + 1]?.[1];
    }

    if (max != null) {
      max = parseFloat(max) > 0 ? subtract(max) : null;
    }

    return queries({ name, min, max });
  });
}

export function getBreakpointDetails<T extends Record<string, string>>(breakpoints: T) {
  const sorted = Object.fromEntries(
    Object.entries(breakpoints).sort((a, b) => {
      return parseInt(a[1], 10) > parseInt(b[1], 10) ? 1 : -1;
    })
  );

  const keys = [...new Set(Object.keys(sorted))];
  const entries = Object.entries(sorted);
  const details = getDetails(entries);

  return {
    keys,
    details,
    get(name: string) {
      return details.find((dfn) => dfn.name === name);
    },
  };
}

function subtract(value: string | null) {
  if (!value || !(parseFloat(value) > 0)) return null;
  value = px(value) ?? value;

  const unitRem = 1 / 16;
  const factor = value.endsWith('px') ? -1 : -unitRem;

  return typeof value === 'number'
    ? `${value + factor}`
    : value.replace(/(\d+\.?\d*)/u, (match) => `${parseFloat(match) + factor}`);
}
