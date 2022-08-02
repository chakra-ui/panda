export function esc(str: string) {
  return str.replace(/[.*+?&:^>_${}()|[\]\\]/g, '\\$&');
}

export function tap<T>(value: T, cb: (value: T) => void) {
  cb(value);
  return value;
}
