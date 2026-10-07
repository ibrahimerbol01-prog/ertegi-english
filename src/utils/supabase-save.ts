export async function saveToSupabase(
  fn: () => Promise<{ error: unknown }>,
  onError?: () => void
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await fn();
      if (!result.error) return;
    } catch {
      // network failure
    }
    if (attempt < 2) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    }
  }
  onError?.();
}
