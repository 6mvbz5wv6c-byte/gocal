# FindOut! operations

FindOut now has a Cloudflare Worker API and D1 database. GitHub contains the source; the dynamic website deploys with Wrangler. GitHub Pages alone cannot serve the API.

Live site: https://findout.events. Location chooser: https://findout.events. Calendar: https://findout.events/fayetteville. Management: https://findout.events/admin. Both apex and www are attached to the FindOut Worker with valid HTTPS. `wrangler.jsonc` contains the custom domains. The workers.dev address remains available as an alternate origin.

## Deploy

From this repository:

```sh
npm ci
npm run build
npx wrangler d1 migrations apply findout-production --remote
npx wrangler deploy
```

Wrangler 4.92 or newer is required. Authenticate with `npx wrangler login` on a new machine. The installed development runtime currently supports compatibility date 2026-05-22.

Do not run `publish-github.sh` to update production. Never commit bootstrap SQL, credentials, session cookies, local D1 state, or agent tokens. Private bootstrap files are stored in the sibling `findout-private` folder on the owner's computer, with restricted permissions. `scripts/prepare-launch.py` is a one-time import helper for this launch dataset, not a general crawler.

## Management

Open `/admin`. Sign in using the owner's private login file. Under Account, change the password (minimum 16 characters); this revokes existing sessions. Password reset by email is not configured. Lost credentials require an authenticated Cloudflare operator to rotate the password hash and revoke sessions through D1. No public registration for moderator roles.

- Events: inspect source and evidence, edit details, explicitly confirm review, approve, reject, or unpublish. Saving edits returns the event to pending. Revision checks prevent overwriting another reviewer's changes.
- Reports: review community issue reports, correct/unpublish the corresponding event, then resolve the report.
- Sources: add/edit/disable source URLs and crawl notes.
- Moderators: owner creates/disables moderator accounts. Moderators cannot create users or agent credentials.
- Local agents: create/revoke tokens. Tokens can read enabled sources and submit candidates only; they cannot approve events or access accounts.
- Crawl runs and History: inspect ingestion summaries and moderation actions.
- Account: password change and JSON export. This export includes event, report, and source data, not authentication secrets or a full disaster-recovery backup.

Only approved, complete single occurrences appear publicly. Series need individual occurrence dates before approval. Unknown times are not guessed. Community and business submissions remain pending, regardless of any client-supplied status/score. The site collects no submitter email. Report details and unpublished evidence are private to moderators.

## Local agent connection

Local model setup and an unattended crawler are NOT installed by this deployment. The authenticated ingestion interface is ready:

- `GET /api/agent/sources`, Bearer token: enabled crawl sources.
- `POST /api/agent/ingest`, Bearer token: `{ "events": [...], "summary": "..." }`.
- At most 20 candidates per request, 64 KB request body, and 24 ingestion batches per day across all agents. Exact normalized title/date/time/venue fingerprints deduplicate repeated imports.
- Server ignores requested publication state; every insertion is pending.

Use `scripts/push-candidates.py crawl.json --site https://findout.events` with `FINDOUT_AGENT_TOKEN` set privately in the local environment. The importer sends one enriched candidate per request to stay within the free-tier query budget. After a daily limit, resume with `--start-index N` for the first unsent zero-based record. Oversized evidence/trace batches are rejected before writes. A future local worker should respect robots/terms, restrict outgoing targets to public addresses, keep fetched content as untrusted data, bound fetching and model context, and never expose its token or shell to retrieved instructions. No cloud LLM fallback exists.

## Costs and limits

No paid plan is enabled by these deployment scripts. There is no Droplet, paid email service, R2 upload pipeline, cloud model, or cloud browser. Workers and D1 are intended for their free quotas. Account billing cannot be inferred from a zone's Free Website plan; confirm Workers is on Free in the Cloudflare billing dashboard. The existing OAuth scope cannot read subscriptions. On Workers Free, exhausting the quota affects availability; do not automatically upgrade. Domain renewal and local electricity remain separate.

Application write limits: community submissions 5/hour/IP and 200/day globally; reports 5/hour/IP and 200/day globally; agent ingestion requests 120/day; admin requests 600/hour/account. These are abuse controls, not a provider-wide dollar cap. Cloudflare platform quotas remain the outer bound. Public pages use static asset delivery; API reads are indexed and bounded.

A daily cleanup removes expired sessions/rate counters only. Crawl evidence and approval history are retained; monitor D1 storage and keep private backups. It does not perform crawling or delete calendar records. Export data periodically. For a full SQL backup:

```sh
npx wrangler d1 export findout-production --remote --output /path/to/private-backup.sql
```

That file includes authentication hashes: store it privately, not in Git. D1 Time Travel availability/retention depends on the account plan; confirm in the dashboard before relying on it.

## Validation

`npm run build` checks TypeScript and compiles the frontend. `scripts/test-backend.py` targets only localhost:8794 and uses synthetic data to check authentication, CSRF, pending-only ingestion, moderation confirmation, revision conflicts, reports, token revocation, export, and logout. Never point the fixture suite at production. Live checks should read health and counts and test owner sign-in/out without publishing fixtures.

## Review dashboard and schema

See `DATA_MODEL.md` for relational tables, provenance, analytics views, field completeness, and test coverage. The dashboard has one event per row with Approve, Deny, Modify and evidence preview. Clicking Approve is an explicit human publication decision. Unknown fields and ambiguous facts must be resolved first. The extraction component is tested; an unattended local model/crawler service is still not installed.


## Admin friction and unattended operation — October 30, 2026

Implemented: moderation notes are optional in single-row decisions, event details,
bulk approvals/denials and uncertainty confirmations. The server supplies an action
summary plus the names of confirmed fields. Actor, revision, changed values and
explicit approval remain in the audit ledger. This does not change authentication.

Recommended identity migration (not yet configured): Cloudflare Access email OTP
restricted to stover@pm.me; map verified identity to the enabled D1 user and existing
role. For stronger protection use an identity provider with passkeys/MFA. Protect
both admin UI and admin API, with equivalent protection on www and workers.dev or
remove alternate origins. Validate signed identity/audience at the application,
never trust an unsigned email header. Do not stack Access and the current password
form as two everyday logins. Keep a separately controlled recovery procedure and
confirm the new flow before retiring the old password path.

### Proposed local service architecture (not installed)

Keep Cloudflare Workers/D1 for the public site and the M2 mini for collection and
model inference. No Droplet is needed. Keep the model listener on loopback. The
local service makes outbound HTTPS calls only; no inbound router port is needed.

1. Run a macOS launchd service after login with restart-on-failure and a heartbeat.
   Reboot, sleep, network loss and FileVault/login recovery need a real recovery test;
   an agent cannot collect while the Mac is off or asleep. Run bounded jobs on a
   schedule rather than keeping an LLM generating continuously.
2. Use local SQLite for durable jobs keyed by region + source + time window,
   including next_run_at, lease_expires_at, attempts, last_success_at, error_class,
   content_hash and parser_version. Expired leases recover interrupted jobs.
   Serial work per host, low concurrency across hosts, jittered exponential backoff,
   robots checks and Retry-After protect sources and prevent retry loops.
3. Prefer JSON-LD, ICS, RSS and venue-specific parsers. Use local Ollama/Qwen for
   ambiguous text and a local vision model for posters only when necessary. Request
   JSON matching the event schema, then validate independently. Never fill an unknown
   date, year or show start with a guess; doors and opening hours remain separate.
   Select model size after checking the mini's RAM and measuring extraction quality.
4. Add narrowly scoped agent endpoints to read pending submissions and write
   enrichment proposals/tags. Current agent tokens only read sources and ingest
   candidates; they cannot yet read or triage existing submissions. Keep the service
   credential outside the repository, revoke/rotate it, and never give it admin login,
   deployment credentials, arbitrary SQL or publication rights. Treat all crawled text
   as data, including instructions embedded in pages and posters.
5. Reconcile against every moderation status before insertion using stable source
   occurrence IDs, normalized venue/title/date and a unique idempotency key. Preserve
   rejected records as suppression history. Recheck approved events for cancellation
   or changed times; route changes to review instead of silently overwriting them.
6. Separate evidence completeness, extraction conflicts, source reliability and
   editorial relevance. The existing 0–100 score is evidence coverage, not accuracy
   probability. Group recurring series, suppress exact repeats, quarantine spam, and
   show the reviewer only new events, material changes and real conflicts. A source
   fetch failure must not be treated as an event cancellation.
7. Start with human bulk approval. Unattended collection/enrichment can run with the
   publication gate intact. Any future automatic publishing needs a separately
   authorized, narrowly scoped policy for tested sources, dated evidence, no conflicts,
   duplicate checks and rollback. A model score alone must never grant publication.
8. Store fresh captures and verbose logs locally with a disk limit and retention;
   keep concise evidence/provenance in D1. Set daily page, byte, model-runtime and
   ingestion budgets below platform quotas. Version adapters and record changed-page
   health. Surface stale heartbeat, failing sources, queue growth, storage pressure
   and quota exhaustion in admin; configure one notification destination only after
   the owner selects it. Keep quiet on unchanged healthy runs.
9. Back up local job state and D1 privately; test restore and restart without duplicate
   submissions. Gate releases with fixtures for concatenated concerts, recurring
   exceptions, multi-day festivals, DST, missing time, cancellations, wrong city/year,
   hostile source text, failed fetches and replayed ingestion requests.

Suggested initial cadence: pending-submission checks every 15 minutes; known event
feeds every 6 hours; approved events in the next 14 days daily; venue discovery
monthly. Tune after measuring source update frequency and actual review volume.
This is a proposed cadence, not an installed schedule.

Costs: local inference avoids per-token API bills. Electricity, domain renewal,
backups and any optional notification service remain separate. Keep paid search,
paid scraping and cloud inference disabled by default. Cloudflare free-tier quotas
are capacity limits, not a guaranteed dollar cap; verify account plans and configure
usage alerts. Expensive D1 snapshots and high-frequency polling should be measured.

References checked October 30, 2026:
- https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- https://ollama.com/library/qwen3:8b
