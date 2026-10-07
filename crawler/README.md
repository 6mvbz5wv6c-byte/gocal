# Event extraction

`extract.js` extracts one exact-title Schema.org event. `listings.js` adds a
deterministic fallback for the George's-style flattened schedule in which each
show ends with `PURCHASE` / `PURCHASE TICKETS`. Neither module publishes events or
runs an unattended crawl.

Use this order when extending the local crawler:

1. Capture individual DOM event cards and their detail links, or structured
   Event objects. Preserve boundaries before converting HTML to text.
2. For purchase-delimited text, call `extractListings`. Each block must have
   exactly one month/day/start-time/weekday anchor. A block with multiple dates
   produces a boundary error and no candidate; fetch its detail pages instead.
3. Resolve year from an explicit event date or captured calendar context. Never
   supply the current year by default. Check the printed weekday against it.
4. Enrich missing address/contact/venue information from captured primary
   sources. Keep doors time distinct from show time. An absent end time stays
   empty. A truncated venue or a conflicting date remains flagged.
5. Import the resulting `events` through the existing pending-only agent API.
   Review `results[].issues` and top-level `issues` before importing. Top-level
   issues mean some text was not safely converted, even if other events parsed.
   Human approval is still required. `score` measures evidence coverage, not a
   calibrated probability of correctness.

## Offline CLI

Prepare a JSON capture with `text`, `url`, `fetchedAt` (ISO timestamp), and optional
`yearContext` and `venueContext`. Source URLs must be HTTPS. Source captures must
contain the exact quotes/values supplied; do not manufacture supporting text.

- `yearContext`: `{year, url, text, quote}`; quote must contain the explicit year.
- `venueContext`: `{url, text, venue, address, organizerName, organizerUrl}`. Shared
  fields are copied only if the listing's complete venue name matches this
  captured venue. Fields absent from the capture remain unknown.
- `allowedCities`: defaults to `["Fayetteville"]`; explicitly include Bentonville
  or Rogers for regional crawls. Addresses outside that Arkansas scope are flagged.

```sh
node scripts/extract-listings.mjs captured-listings.json > candidates.json
# Review output, then use an existing least-privilege agent token:
python3 scripts/push-candidates.py candidates.json
```

This adapter intentionally supports one known layout. Other venue formats need
their own fixture-backed adapters, not progressively broader regex guesses. A
local model can propose fields from one isolated event block/detail page, with
exact evidence quotes, but must pass the same validation and human review.

`tests/listings.test.mjs` uses the exact three-event user example plus boundary,
year, weekday, truncation, cancellation, time, duplicate, and evidence tests.

## Reconcile before import

`reconcileCandidates(candidates, existing)` in `reconcile.js` compares the extracted
candidates against **all statuses**, including rejected and removed records. Each
candidate may have `{event, aliases}`; aliases must be exact names from that
card's linked detail page. Same venue, date, start and captured name identify an
existing occurrence even when a listing title includes supporting artists.

The result separates `add`, `matched`, and `conflicts`. Only unmatched candidates
enter new pending intake. Approved/rejected/removed matches remain unchanged;
pending enrichment requires a fresh revision and the API's `enrich` action.
Different start times or multiple matching rows require manual reconciliation.
A later performance on a different date remains a separate occurrence. Read the
current database again before applying a plan and preserve concurrent edits.

## Multi-day events

A festival or exhibition can use one candidate with `date`, inclusive `endDate`, optional final `endTime`, and `scheduleNote` for daily hours/closures. Do not split one festival into daily duplicates. Independent performances on separate dates remain separate events. A missing clock time is unknown; set `allDay: true` only when explicitly supported by source evidence and leave both clock fields empty. Range events require an end date. Conflicting/uncertain fields reduce evidence coverage and still block approval.

## Civic sources and explicit opening dates

`civic.js` parses the Fayetteville CivicPlus meeting-detail layout and flags tentative notices. Government source configuration lives in `sources/fayetteville-government.json`. Voting tables are currently reviewed and normalized with assistance; they are not an autonomous generic election parser.

Optional `sessions: [{date,startTime,endTime}]` stores one opening window per date beneath one event. Omitted dates are closed. The parent range must match the first opening and last closing. Voting notices require sessions, an official registered election source and the Civics category. Election Day may provide `locationUrl` for an official vote-center lookup instead of an invented address. Approval and revision history remain mandatory.

See [`CRAWL_PROCESS.md`](../CRAWL_PROCESS.md) for the exact current workflow, limits, and regional-engine acceptance contract.

For captured civic detail pages (`[{url,text,fetchedAt}, ...]`), run `node scripts/extract-civics.mjs captures.json 2026-10-07 2026-12-31`. This is offline extraction, not automatic fetching.
