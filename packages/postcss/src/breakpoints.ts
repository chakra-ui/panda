type Detail = {
  min?: string | null;
  max?: string | null;
};

export function buildMediaQuery({ min, max }: Detail) {
  return [min && `(min-width: ${min})`, max && `(max-width: ${max})`].filter(Boolean).join(' and ');
}

export class Breakpoints<T extends Record<string, string>> {
  constructor(private readonly breakpoints: T) {}

  get sorted() {
    return Object.fromEntries(
      Object.entries(this.breakpoints).sort((a, b) => {
        return parseInt(a[1], 10) > parseInt(b[1], 10) ? 1 : -1;
      })
    );
  }

  get keys() {
    return [...new Set(Object.keys(this.sorted))];
  }

  get entries() {
    return Object.entries(this.sorted);
  }

  get details() {
    return this.entries.map(([name, min], index, entries) => {
      let max: string | null = null;

      if (index <= entries.length - 1) {
        max = entries[index + 1][1];
      }

      if (max != null) {
        max = Number.parseFloat(max) > 0 ? subtract(max) : null;
      }

      return { name, min, max };
    });
  }
}

function subtract(value: string) {
  if (!value) return null;
  value = toPx(value) ?? value;

  const unitRem = 1 / 16;
  const factor = value.endsWith('px') ? -1 : -unitRem;

  return typeof value === 'number'
    ? `${value + factor}`
    : value.replace(/(\d+\.?\d*)/u, (match) => `${Number.parseFloat(match) + factor}`);
}

function toPx(value: number | string | null): string | null {
  if (value == null) return null;
  const unitless = Number.parseFloat(value.toString()) == value;
  return unitless || typeof value === 'number' ? `${value}px` : value;
}
