export async function mapWithConcurrency<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  mapper: (item: TItem, index: number) => Promise<TResult>
): Promise<TResult[]> {
  if (items.length === 0) {
    return [];
  }

  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await mapper(items[currentIndex] as TItem, currentIndex);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
