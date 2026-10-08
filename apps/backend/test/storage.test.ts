import { StorageUnavailable } from "@primo/contract/errors";
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { hideStorageFailure } from "../src/storage.ts";

it.effect("a failed read becomes StorageUnavailable", () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(hideStorageFailure(Effect.fail("disk on fire")));

    assert.instanceOf(error, StorageUnavailable);
  }),
);
