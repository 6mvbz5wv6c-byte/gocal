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

Application write limits: community submissions 5/hour/IP and 200/day globally; reports 5/hour/IP and 200/day globally; agent batches 24/day; admin requests 600/hour/account. These are abuse controls, not a provider-wide dollar cap. Cloudflare platform quotas remain the outer bound. Public pages use static asset delivery; API reads are indexed and bounded.

A daily cleanup removes expired sessions/rate counters only. Crawl evidence and approval history are retained; monitor D1 storage and keep private backups. It does not perform crawling or delete calendar records. Export data periodically. For a full SQL backup:

```sh
npx wrangler d1 export findout-production --remote --output /path/to/private-backup.sql
```

That file includes authentication hashes: store it privately, not in Git. D1 Time Travel availability/retention depends on the account plan; confirm in the dashboard before relying on it.

## Validation

`npm run build` checks TypeScript and compiles the frontend. `scripts/test-backend.py` targets only localhost:8794 and uses synthetic data to check authentication, CSRF, pending-only ingestion, moderation confirmation, revision conflicts, reports, token revocation, export, and logout. Never point the fixture suite at production. Live checks should read health and counts and test owner sign-in/out without publishing fixtures.

## Review dashboard and schema

See `DATA_MODEL.md` for relational tables, provenance, analytics views, field completeness, and test coverage. The dashboard has one event per row with Approve, Deny, Modify and evidence preview. Clicking Approve is an explicit human publication decision. Unknown fields and ambiguous facts must be resolved first. The extraction component is tested; an unattended local model/crawler service is still not installed.
