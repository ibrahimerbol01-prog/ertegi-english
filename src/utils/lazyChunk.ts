import type { ComponentType } from "react";
import { ChunkError } from "../components/ChunkError";

/** For React.lazy: wraps the imported component as { default } and turns a
    failed download into ChunkError, so a lost connection shows a message
    instead of dropping the whole screen. */
export function orChunkError<P extends { lang: string; onClose: () => void }>(
  load: Promise<ComponentType<P>>,
): Promise<{ default: ComponentType<P> }> {
  const fallback = ChunkError as unknown as ComponentType<P>;
  return load.then((c) => ({ default: c }), () => ({ default: fallback }));
}
