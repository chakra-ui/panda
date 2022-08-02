export function esc(str: string) {
  return str.replace(/[.*+?&:^>_${}()|[\]\\]/g, '\\$&');
}

export function tap<T>(value: T, cb: (value: T) => void) {
  cb(value);
  return value;
}

export function toPx(value: number | string | null): string | null {
  if (value == null) return null;
  const unitless = parseFloat(value.toString()) == value;
  return unitless || typeof value === 'number' ? `${value}px` : value;
}
