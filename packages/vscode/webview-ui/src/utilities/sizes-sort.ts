import { SizesProps } from '../components/size-docs';

export function getSortedSizes(sizes: SizesProps['sizes']) {
  return Object.entries(sizes).sort(([a], [b]) => {
    if (a === 'max') return 1;
    if (Number.isNaN(parseFloat(a))) return -1;
    return parseFloat(a) - parseFloat(b);
  });
}
