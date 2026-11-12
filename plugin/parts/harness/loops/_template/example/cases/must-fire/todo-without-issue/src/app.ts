export function total(items: number[]) {
  // TODO: handle currencies
  return items.reduce((a, b) => a + b, 0);
}
