# FindOut crawl process — current implementation, October 7, 2026

This is an assisted ingestion pipeline, not yet an unattended ZIP-code crawler. The production backend is Cloudflare Workers + D1. The Mac's always-on model and crawl scheduler have not been installed by this work. The Worker cron currently cleans expired sessions/rate-limit records; it does not discover events.

## The process actually used

1. **Choose scope manually.** Seed ZIP 72701 → Fayetteville, Arkansas, America/Chicago; select a date window. Current civic run: October 7–December 31, 2026. Rogers/Bentonville sources are explicit exceptions requested by the owner. ZIP does not establish a voting precinct or planning jurisdiction. Region routing and timezone validation are currently Fayetteville-specific.
2. **Discover sources with assisted web searches.** Search city/county/venue/organizer pages and public social posts, then follow original event links. Government scope includes public meetings, planning/zoning, official agendas, elections and community news. The earlier coffee/brewery shortlist used published Google review counts as a proxy, not a complete live Google Places ranking. Source registries are under `crawler/sources/`; enabled URLs are also saved in D1 `sources`.
3. **Capture bounded public evidence.** The current run used a local Python HTML parser and `curl`, at most four concurrent reads, plus web search and browser inspection when needed. Capture text, links and JSON-LD; strip scripts/styles and isolate current detail content. The civic run read the seed detail and 101 city-published related meeting links, not an unbounded recursive crawl. County direct requests returned 403; county facts were read from indexed official-page text and this limitation is recorded in each trace. No access controls were bypassed. Local URL-based capture caching is a work-session convenience, not a freshness-aware production cache.
4. **Extract one event at a time.** `crawler/extract.js`: exact-title Schema.org Event object, including ISO timezone conversion. `crawler/listings.js`: known George's-style PURCHASE-delimited blocks; one date anchor per block; explicit year evidence and weekday validation. `crawler/civic.js`: Fayetteville CivicPlus meeting detail, cut off before Related Events, explicit year/date/time; tentative dates and immediately-following starts flagged. Other layouts and voting tables currently require assisted field extraction. General social-feed ingestion, image OCR, PDF-case parsing and local-LLM enrichment are not implemented as an autonomous service.
5. **Normalize and validate.** ISO date, 24-hour time, America/Chicago, normalized venue/organizer/category references. Preserve unknowns; end time is optional. One multi-day event uses inclusive start/end dates; `event_sessions` holds explicit daily opening windows, with omitted dates closed. Do not split a festival into duplicate events. `reviewIssues` blocks unresolved required fields and explicit uncertainty. `validateResearch` checks exact claims against captured text, bounds input and disallows executable source URLs. Test/cancelled/out-of-window meetings are excluded; tentative notices remain pending.
6. **Measure evidence coverage.** `evidenceQuality` scores eight fields: title, date, start time (or confirmed all-day), end time, venue, address, recurrence, organizer. Each contributes 12.5 points only when nonempty, not uncertain and supported by a non-inferred claim. Rounded score is evidence coverage, not probability of truth. An unknown optional end time can reduce the score without blocking approval. A high score does not override flags or human review.
7. **Reconcile all moderation statuses.** Read pending, approved, rejected and removed events. The reusable reconciler compares normalized venue + date + title or verified alias; conflicting start times require review. This civic run additionally compared exact source URL + date for stable meeting identities. Only unmatched candidates were inserted. Existing approvals/rejections were preserved; no automatic replacement. The API fingerprint is title/date/time/venue and provides an additional insert guard, not a complete semantic identity system.
8. **Submit pending candidates and audit them.** A temporary least-privilege token can read enabled sources and call `/api/agent/ingest`; it cannot publish. This run sends one candidate per request, paced 1.3 seconds apart, and revokes its temporary token afterward. D1 stores crawl runs/steps, immutable source snapshots and field claims. Admin approves, denies or modifies with optimistic revision checks and append-only decisions. Only approved records reach the public calendar/ribbons. Trace records contain rules, evidence and outcomes, not private model reasoning.

## Current bounds and known scale gaps

- Per request: 64 KB JSON; max 20 ingest candidates, 5 snapshots, 30 claims, 20 trace steps; combined evidence text 22,000 characters; max 42 SQL statements per batch. Rich evidence usually means fewer than 20 candidates.
- Agent ingestion: 120 requests/day across agents. Edge writes: 60/minute per IP; public submissions have additional limits and challenge support. One-candidate imports must respect the daily budget.
- Admin event queries currently cap each status at 1,000 rows; source lists cap at 500; public results cap at 2,000 and a date window. Pagination and region-scoped queries are required before expansion; silently treating capped reads as complete would break reconciliation.
- There is no persistent source work queue, crawl lease, retry/backoff scheduler, robots-policy engine, conditional HTTP refresh, source health dashboard, generalized geographic resolver or automatic cancellation/change detector yet.
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
