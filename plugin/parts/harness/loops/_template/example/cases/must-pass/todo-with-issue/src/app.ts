export function total(items: number[]) {
  // TODO(#42): handle currencies
  return items.reduce((a, b) => a + b, 0);
}
