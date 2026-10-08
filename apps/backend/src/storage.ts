import { StorageUnavailable } from "@primo/contract/errors";
import { Effect } from "effect";

// A storage failure never reaches an API caller: the cause goes to the log, the caller gets StorageUnavailable.
export const hideStorageFailure = <A, E, R>(
  read: Effect.Effect<A, E, R>,
): Effect.Effect<A, StorageUnavailable, R> =>
  read.pipe(
    Effect.tapError((cause) => Effect.logError("storage read failed", cause)),
    Effect.mapError(() => new StorageUnavailable()),
  );
