import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { StorageUnavailable } from "../src/errors.ts";

it.effect("StorageUnavailable round-trips through its schema", () =>
  Effect.gen(function* () {
    const encoded = yield* Schema.encodeEffect(StorageUnavailable)(new StorageUnavailable());
    const decoded = yield* Schema.decodeUnknownEffect(StorageUnavailable)(encoded);

    assert.instanceOf(decoded, StorageUnavailable);
  }),
);
