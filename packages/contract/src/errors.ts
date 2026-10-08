import { Schema } from "effect";

// The API could not read D1. Carries no detail: the backend logs the cause.
export class StorageUnavailable extends Schema.TaggedError<StorageUnavailable>()(
  "StorageUnavailable",
  {},
  { httpApiStatus: 503 },
) {}
