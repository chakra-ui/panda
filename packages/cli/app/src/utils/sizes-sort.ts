export function getSortedSizes(sizes: any[]) {
  return sizes.sort((a, b) => {
    if (a.key === "max") return 1;
    if (Number.isNaN(parseFloat(a.key))) return -1;
    return parseFloat(a.key) - parseFloat(b.key);
  });
}
