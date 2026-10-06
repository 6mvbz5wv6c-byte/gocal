# FindOut event and review records

D1/SQLite is the durable store. Migration `0002_review_ledger.sql` is additive: it preserves existing IDs, moderation states, and revisions. No records are published by migration. New IDs are UUIDs; existing `FO-*` and `CCC-*` external import IDs remain stable. Source/venue/organizer identities use SHA-256 keys for exact deduplication; these hashes are not a fuzzy identity or authenticity guarantee.

| Relation | Purpose / references |
| --- | --- |
| `events` | Stable record, publication state, optimistic revision, primary venue/organizer foreign keys, timezone and recurrence classification. |
| `event_occurrences` | One occurrence per event, including a multi-day span. ISO local dates and 24-hour times; unknown clocks are SQL NULL. All-day flags are explicit and multi-day festivals keep one event identity. |
| `venues` | Shared place identity, address, city, region, country. Exact normalized name/address identity avoids accidental cross-city merges. |
| `organizers` | Shared public organization name, website, email and telephone. No submitter personal contact is inferred. |
| `categories`, `event_categories` | Controlled category vocabulary and referential event/category junction. Current editor chooses one primary category; the relation supports additional categorization without duplicating events. |
| `sources`, `source_snapshots` | Source registry plus immutable text captures, URL, capture timestamp, fetch outcome and content checksum. Snapshots deduplicate by URL/content. Captured sources are disabled for unattended crawling until explicitly enabled. |
| `event_evidence` | A field's exact supporting quote, snapshot reference, extraction method and event revision. Earlier evidence stays available; unchanged claims may carry forward to the next revision. Modified fields do not silently inherit old claims. |
| `crawl_runs`, `crawl_steps` | Actor/tool label, summary, event references, ordered stage/rule/outcome/detail records. Logs contain evidence and explicit processing decisions, not hidden model reasoning. Human corrections are review examples; no automatic model training is performed. |
| `moderation_decisions` | Append-only decision ledger: actor FK, event FK, before/after JSON, status transition, revision transition, timestamp and note. SQL triggers reject updates/deletes. Database operators still control the database; this is not an externally notarized ledger. |
| `users`, `sessions`, `agent_tokens` | Roles, hashed passwords, hashed sessions and least-privilege ingestion credentials. Authentication data is never included in application exports. |
| `reports`, `audit` | Community reports and account/source/security operations. Pre-migration event history remains in the legacy audit table. |

The flat event title/date/time/venue/address fields remain compatibility projections used by the original calendar. Writes update the event and normalized relations in one D1 batch. A unique decision ID guards every related moderation write, so a losing concurrent reviewer cannot overwrite the winner's venue, organizer, category, or evidence. A revision conflict returns HTTP 409. The migration and integration suites test this explicitly.

## Data formats and quality

- Candidate contract: `schemas/candidate.schema.json` (JSON Schema draft 2020-12), also served at `/schemas/candidate-v1.json`. Runtime checks additionally validate actual dates, HTTPS URLs, recurrence syntax, quote membership, and an aggregate 22,000-character snapshot budget.
- Import adapter: `crawler/extract.js` consumes Schema.org `Event` objects, including `@graph`, selects an exact event identity, and creates a traceable pending candidate. It never merges sibling exhibition and Gallery Hop schedules. This is an extraction/validation component, not an installed unattended web crawler.
- Dates: ISO `YYYY-MM-DD`; times: `HH:mm`; timezone: IANA `America/Chicago`. Captures/decisions use UTC ISO timestamps. Offset-bearing source timestamps convert to Central Time with daylight-saving handling.
- Recurrence: explicit `single`, `rule`, `range`, or `unknown`, with a supported RFC 5545 RRULE syntax for recurring schedules. A rule never automatically publishes inferred dates. A multi-day event is one record with an inclusive last date; daily hours and closures are retained in `schedule_note`. Separate performances remain distinct occurrences.
- Missing facts: empty candidate values / nullable occurrence columns, displayed as **UNABLE TO DETERMINE**. Do not store that display phrase as a fact. Inferred/conflicting facts have `uncertainFields` and block approval until a human resolves them.
- Evidence score: coverage of eight key fields, 0–100, from non-inferred source claims. This is not a statistical probability or a guarantee of accuracy. Ready means required fields are filled and no ambiguity flags remain; a person must still review the source.
- Publication requires title, date, start time (end time is optional), location/address, description, HTTPS source, recurrence classification, organizer name and at least one public organizer contact. Multi-day festivals and exhibitions do not require splitting. Explicit all-day events use `all_day=1` with empty clock times; missing times are never silently classified as all-day. Unsupported finishes are never invented as start + 1 hour.

`analytics_category_status` groups event status by referenced category. `analytics_review_outcomes` groups decisions by actor, action and day. Dashboard counts and reports are bounded queries. Do not treat an unresolved series record as multiple attendance opportunities in analytics.

## Security, custody and retention

Source evidence is private to authenticated moderators and rendered as escaped React text with literal highlights. There is no HTML injection, remote iframe, server-side arbitrary-URL fetch proxy, or third-party tracking embedded in review. The source URL remains available for independent inspection. The local crawler must separately implement fetch allowlists/public-address checks, redirect validation, bounded downloads, robots/terms handling, and tool isolation before unattended use.

Agents can submit **pending** records only; their requested publication state and confidence are not trusted. They cannot administer users or approve events. Human approval is a deliberate dashboard action; missing fields block it server-side as well as in the UI. Revisions and actor identities are recorded.

The daily scheduled worker removes expired sessions and rate counters only. Approval history, evidence, and crawl records are retained. Export/monitor database size periodically; any future archival policy must preserve referenced evidence and custody records. Full private D1 SQL export is the disaster-recovery backup. No cloud model, paid storage tier, or unattended paid fallback is added.

## Test specification

`npm test`: 28 extraction/quality/security tests plus five in-memory schema tests. The successful fixture must extract every required field, provide supporting source quotes, normalize Central Time, achieve complete evidence coverage, and remain pending. Negative fixtures cover missing data, wrong event identity, exhibition/rally-style ranges, dates without a year, invalid calendar dates, duplicate event objects, doors versus show times, repeated start/end placeholders, DST, wrong city, cancellation, injected instructions, forged quotes, oversized evidence, and malformed recurrence.

With seeded local Wrangler on port 8794, `python3 scripts/test-backend.py` runs 37 API checks and `python3 scripts/test-review.py` runs 19 provenance/concurrency checks. Both target localhost only. The latter verifies unrelated records are unchanged, exactly one competing reviewer succeeds, linked venue/organizer data matches that winner, and only one custody decision is written. Large trace batches are rejected before writes to stay within the free-tier query budget. Local rate counters may need resetting between full reruns. No production fixture publication is permitted.

## Date spans

Migration 0004 adds `all_day` (constrained boolean) and `schedule_note`. Existing events keep their dates, decisions and evidence. One event and one occurrence can cover several days; the month view uses interval overlap and the agenda lists it once. End dates are inclusive for display, except timed midnight finishes. Timed start is on the first day; timed finish is on the last day, not repeated daily. Daily hours belong in schedule notes. ICS uses RFC 5545 exclusive end dates for all-day spans; unknown timed finishes export as a transparent date span with the known start in the description. America/Chicago timezone rules are included for timed exports.
