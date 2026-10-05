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
