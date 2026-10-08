# FindOut crawl process — current implementation, October 8, 2026

This is an assisted ingestion pipeline, not yet an unattended ZIP-code crawler. The production backend is Cloudflare Workers + D1. The Mac's always-on model and crawl scheduler have not been installed by this work. The Worker cron currently cleans expired sessions/rate-limit records; it does not discover events.

## The process actually used

1. **Choose scope manually.** Seed ZIP 72701 → Fayetteville, Arkansas, America/Chicago; select a date window. Current civic run: October 7–December 31, 2026. Rogers/Bentonville sources are explicit exceptions requested by the owner. ZIP does not establish a voting precinct or planning jurisdiction. Region routing and timezone validation are currently Fayetteville-specific.
2. **Discover sources with assisted web searches.** Search city/county/venue/organizer pages and public social posts, then follow original event links. Government scope includes public meetings, planning/zoning, official agendas, elections and community news. The earlier coffee/brewery shortlist used published Google review counts as a proxy, not a complete live Google Places ranking. Source registries are under `crawler/sources/`; enabled URLs are also saved in D1 `sources`.
3. **Capture bounded public evidence.** The earlier civic run used a local Python HTML parser and curl. The October 8 refresh uses `crawler/capture.py`: serial bounded HTTPS requests, explicit host scope, public-IP validation, DNS pinning, robots checks, redirect/page/byte/time budgets, and incremental local capture files. It extracts JSON-LD and separate visible text; it does not execute page scripts or crawl arbitrary links. Capture text, links and JSON-LD; strip scripts/styles and isolate current detail content. The civic run read the seed detail and 101 city-published related meeting links, not an unbounded recursive crawl. County direct requests returned 403; county facts were read from indexed official-page text and this limitation is recorded in each trace. No access controls were bypassed. Local URL-based capture caching is a work-session convenience, not a freshness-aware production cache.
4. **Extract one event at a time.** `crawler/extract.js`: exact-title Schema.org Event object, including ISO timezone conversion. `crawler/listings.js`: known George's-style PURCHASE-delimited blocks; one date anchor per block; explicit year evidence and weekday validation. `crawler/civic.js`: Fayetteville CivicPlus meeting detail, cut off before Related Events, explicit year/date/time and stated room/location; tentative dates and immediately-following starts flagged. `crawler/captured-page.js` cross-checks exact-title JSON-LD against isolated visible schedule rows for NWA Today and the Momentary. Description weekday/ordinal and explicit hour ranges can add conflicts; metadata never silently wins a disagreement. Other layouts and voting tables currently require assisted field extraction. General social-feed ingestion, image OCR, PDF-case parsing and local-LLM enrichment are not implemented as an autonomous service.
5. **Normalize and validate.** ISO date, 24-hour time, America/Chicago, normalized venue/organizer/category references. Preserve unknowns; end time is optional. One multi-day event uses inclusive start/end dates; `event_sessions` holds explicit daily opening windows, with omitted dates closed. Do not split a festival into duplicate events. `reviewIssues` blocks missing title/date/start (unless confirmed all-day)/source and conflicts in supplied facts. Ordinary location, street address, end time, organizer contact, description and unknown recurrence are optional advisories. Voting retains official source, location and explicit dated-hours requirements. Unknown time never becomes all-day automatically. `validateResearch` checks exact claims against captured text, bounds input and disallows executable source URLs. Test/cancelled/out-of-window meetings are excluded; tentative notices remain pending.
6. **Measure evidence coverage.** `applicable-fields/v2` scores title, date, start time (or explicitly confirmed all-day), plus supplied end time/end date/venue/address/recurrence/organizer. Missing optional values are excluded from the denominator; supplied unsupported or uncertain values earn no credit. This is coverage, not a calibrated confidence probability or proof of an independent source. A conflict always blocks publication regardless of score. Server-side recalculation drops obsolete claims when a moderator changes a field. Reports distinguish new evidence gains under the previous formula from score-model changes.
7. **Reconcile all moderation statuses.** Read pending, approved, rejected and removed events. The reusable reconciler compares normalized venue + date + title or verified alias; conflicting start times require review. This civic run additionally compared exact source URL + date for stable meeting identities. Only unmatched candidates were inserted. Existing approvals/rejections were preserved; no automatic replacement. The API fingerprint is title/date/time/venue and provides an additional insert guard, not a complete semantic identity system.
8. **Submit pending candidates and audit them.** A temporary least-privilege token can read enabled sources and call `/api/agent/ingest`; it cannot publish. This run sends one candidate per request, paced 1.3 seconds apart, and revokes its temporary token afterward. D1 stores crawl runs/steps, immutable source snapshots and field claims. Admin approves, denies or modifies with optimistic revision checks and append-only decisions. Only approved records reach the public calendar/ribbons. Trace records contain rules, evidence and outcomes, not private model reasoning.

## Current bounds and known scale gaps

- Per request: 64 KB JSON; max 20 ingest candidates, 5 snapshots, 30 claims, 20 trace steps; combined evidence text 22,000 characters; max 42 SQL statements per batch. Rich evidence usually means fewer than 20 candidates.
- Agent ingestion: 120 requests/day across agents. Edge writes: 60/minute per IP; public submissions have additional limits and challenge support. One-candidate imports must respect the daily budget.
- Admin event queries currently cap each status at 1,000 rows; source lists cap at 500; public results cap at 2,000 and a date window. Pagination and region-scoped queries are required before expansion; silently treating capped reads as complete would break reconciliation.
- There is no persistent work queue, crawl lease, retry/backoff scheduler, conditional HTTP refresh, source-health dashboard or generalized geographic resolver yet. The new capture tool enforces robots policy and records unavailable sources; the new cross-check adapters flag visible cancellations and disagreements in supported layouts. These are bounded tools, not a scheduled autonomous engine.
- Voting ribbons are based on the last reviewed schedule. Emergency changes still require a new authoritative capture and human decision. Election authorities are explicitly registered in `civic-schedule.js`; accepting every `.gov` domain would not prove jurisdiction.
- Source boundaries, cadence, date window and comparison results currently involve an operator. Do not describe this as a production recursive LLM engine.

## Repeatable tests already executable

`npm test`: deterministic extraction, event-boundary splitting, explicit year, weekday conflicts, malformed dates/times, doors versus show time, wrong city/state, cancellations, missing facts, forged evidence/URLs, duplicate reconciliation, multi-day and all-day behavior, source summaries, contrast, challenge verification, request guards and database ledger constraints.

`tests/civics.test.mjs` adds: 13 courthouse opening days in one event; no Sundays; first/last-day boundaries; Saturday hours; November DST transition; official-authority lookup; invalid/duplicate sessions; Election Day without a fabricated street address; calendar export with dated periods; isolated CivicPlus details; tentative/following flags; exclusion of test events and wrong years/jurisdictions.

With the local Worker on port 8794, `python3 scripts/test-civics.py` verifies pending-only intake, daily-session storage and public roundtrip, explicit approval, concurrent-edit rejection, audit snapshots, malformed input rejection and a spoofed election domain that cannot be approved. Fixtures remain local. Local credentials are read from the private sibling folder, never committed. `scripts/test-spans.py` separately exercises general multi-day publication.

## Contract for the next regional engine

Implement a persisted region configuration: slug, seed ZIPs, IANA timezone, authoritative municipal/county boundaries, allowed nearby regions, official election authority and source adapters. The agent should receive only an ingest token; a separate moderator keeps publishing authority.

Use a bounded work queue: source → fetched version/hash/HTTP status → isolated event block → field claims → validation → all-status reconciliation → pending proposal. Version adapter/model/prompt/config identifiers, extraction failures, retry state and content changes. Add explicit withdrawn/cancelled proposals rather than mutating approved listings. Source text is untrusted input and cannot grant the model tool access or publication authority.

Before enabling any new region, run frozen fixtures and network contract checks for:

| Layer | Required passing cases |
|---|---|
| Geography | Same city name in another state excluded; ZIP crossing a boundary handled; nearby scope opt-in; no precinct guessed from ZIP |
| Acquisition | Pagination complete; 403/429/timeout handled; robots policy observed; linked-host allowlist; redirect/private-network SSRF blocked; fetch/page/byte budgets enforced |
| Event identity | Multiple events on one page remain separate; one festival remains one record; a recurring series has stable IDs; two rooms/times do not collapse |
| Dates | Explicit year; leap day; local timezone and DST; overnight finish; inclusive last date; closures/exceptions; cancelled/rescheduled events |
| Evidence | Every important field cites its own source block; stale/conflicting pages flagged; OCR uncertainty retained; instructions embedded in pages ignored |
| Reconciliation | All statuses paginated; repeat run adds zero duplicates; corrected times become reviewable changes; concurrent human decisions win |
| Moderation | Agent never publishes; missing optional end time allowed; missing mandatory facts block; reviewer changes and source version retained |
| Operations | Retry idempotency, interrupted-run resume, source health alerts, query/storage budgets and no model/cloud charges beyond configured limits |

These future cases are an acceptance checklist, not a claim that all integrations exist or have passed. Keep deterministic fixture tests separate from live-source freshness checks. A monthly baseline plus more frequent upcoming-event checks is an intended schedule, not an enabled automation.


## October 8 adversarial and hands-on review

- Compared metadata-only extraction against isolated visible-detail cross-checking on the same live captures. Metadata-only marked 12 records ready; cross-checking correctly held 5 with visible-time, description-finish or recurrence-day disagreements. See `reports/crawl-benchmark-2026-10-08.json` for reproducible per-event results. Readiness remains a human-review gate.
- Fetched 120 unique URLs for 124 pending records: 117 successful captures, 3 unavailable county URLs (covering four records). The capture tool deferred unavailable robots policy instead of bypassing access controls.
- Reprocessed 112 supported records. Six previously empty venues were recoverable from the city page body. Nineteen records gain evidence coverage under the old formula; 107 show higher v2 scores, partly because unknown optional fields no longer lower the score. Do not describe all 107 as newly verified events.
- Retain current pending schedule values when the new extractor disagrees, display both versions in review notes, and flag the affected field. Existing human decisions win through revision checks. No new event is inserted by this refresh and nothing is automatically approved.
- Queue workflow: 25 records per page, search/source/worklist filters, sort by date/blockers/evidence, inline required-field edits, source text highlights, per-row decisions, selected ready approvals, and mandatory verification notes when clearing uncertainty. Bulk decisions use individual revision-guarded API writes, stop on failure, and retain unprocessed selections.
- Public event popups render one description. The duplicate generated source-summary paragraph is removed; evidence remains in the admin view. Older descriptions that were previously generated are not retroactively relabeled as organizer quotes. New supported captures preserve available organizer/source prose in the description field.

### Re-run locally without AI fees

1. Obtain pending records through the authenticated admin API, retaining IDs and revisions in a private file. Do not export users, sessions or credentials.
2. `python3 crawler/capture.py pending.json captures.json`
3. `node scripts/benchmark-crawl.mjs pending.json captures.json comparison.json`
4. `node scripts/reprocess-pending.mjs pending.json captures.json plan.json`
5. Inspect plan metrics/conflicts, then apply pending-only updates with `python3 scripts/enrich-pending.py plan.json --credentials /private/path/admin-login.json --result result.json`. This assisted admin command is not an agent credential workflow. An unattended agent must keep its ingest-only token and cannot use admin credentials.
6. Human reviewers use the online queue. Known source conflicts remain red until checked; unsupported sources remain unchanged.

### Current limitations after this review

The 25-row UI pagination still sits over a server query capped at 1,000 records per status; region expansion needs cursor-based API pagination. Identity reconciliation is conservative and cannot prove semantic equivalence. Exact-quote presence does not prove an arbitrary model's interpretation; this revision improves deterministic adapters, not generic LLM truth validation. OCR/social-feed adapters, retries/leases, source authority ranking and new-region timezone configuration are still future work. Website HTML changes require adapter fixture updates. No local model or always-on scheduler was installed in this task.
