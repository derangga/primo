---
status: accepted
---

# The ingest is shaped by Cloudflare's Free plan limits

The app has one user and must cost nothing to run, so it targets the Workers and D1 Free plans. Several parts of the ingest look unusual because of that plan's limits: 50 subrequests per invocation (D1 queries count), 10 ms CPU per invocation, and 100,000 D1 row writes per day.

- **A failed province is not retried.** A run already uses 35 of the 50 subrequests on fetches. Each run refetches the last 7 days, so the next run repairs a skipped province.
- **The whole batch is upserted in one statement** that reads a single JSON parameter with `json_each`. D1 allows 100 bound parameters per statement, so row-per-parameter inserts would need dozens of queries.
- **The `prices` table has no secondary index.** Each index would double the row writes. The primary key order `(commodity_id, area_id, date)` serves every read.
- **The first 90 days are loaded by a script on a local machine**, not by the Worker. 70,000 rows cannot be decoded in 10 ms of CPU.

## Consequences

- Do not add per-request retries, extra indexes or per-row inserts without rechecking these budgets. `DESIGN.md` has the numbers.
- Moving to the $5 paid plan removes all four constraints, and each of these choices could then be simplified.
