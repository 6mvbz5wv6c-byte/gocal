# GoCal — public GitHub Pages edition

This version opens publicly with no GPT account or other login required to browse. It contains the Fayetteville calendar, category filters, month/agenda views, event details, and sharing. It is a static edition of the private pilot, not a deployment of the backend.

## Publish from your Mac

The `docs/` folder is already built. You do not need Node or npm to publish this prepared version. Install GitHub CLI from https://cli.github.com/ if needed.

Run in Terminal:

```sh
cd "/Users/losto/Documents/ChatGPT/Geode PCB Review/gocal-github-pages"
bash publish-github.sh
```

The script signs into GitHub if needed, detects your personal GitHub username, creates a NEW PUBLIC repository named `gocal`, uploads the source and static build, and enables GitHub Pages from `main` → `/docs`. It never replaces an existing repository. It prints the site URL and settings URL. A first deployment can take up to 10 minutes.

If the repository name is already taken, use a different new name:

```sh
bash publish-github.sh gocal-public
```

Default URL: `https://YOUR-USERNAME.github.io/gocal/`. The script uses your personal account; organization publishing needs an explicit owner change.

## Publish using only GitHub's website

1. Extract the ZIP locally.
2. On GitHub, create a new PUBLIC repository named `gocal` (or another available name). Initialize it with a README so the main branch exists.
3. Choose **Add file → Upload files**. Upload the `docs` folder from this package, keeping the folder named `docs`. Do not upload the ZIP itself. Commit to `main`.
4. Open **Settings → Pages**.
5. Choose **Deploy from a branch**, then branch **main**, folder **/docs**, and **Save**.
6. Wait for deployment, then use **Visit site** on that page.

The prepared build has relative asset URLs, so it works under a repository path or a custom domain. `docs/.nojekyll` disables Jekyll when included; this build also uses ordinary filenames without leading underscores. The website-only method only needs the docs folder; upload the remaining source files too if you want to keep the editable source in that repository.

## What this edition does and does not do

Browsing and sharing work without authentication. Sample listings are prominently labeled and cannot be exported as real events. Real, human-reviewed events can be published in `events.json`; the calendar switches to live listings when the file contains events. The site loads that file on page load; reload after publishing changes.

Community submissions, reports, accounts, moderator workflows, AI extraction, and scheduled crawling are NOT running on GitHub Pages. Their controls explain the limitation rather than collecting data or pretending to save it. GitHub Pages serves static files and cannot run the original Worker API, D1, or R2 backend. That backend can be deployed separately to Cloudflare, then connected to this public frontend with its own public authentication and security checks. Never place credentials, submissions, private reports, or API keys in this public repository.

The original Sites deployment remains separate and unchanged.

## Publish real approved events manually

For the no-build workflow, edit `docs/events.json` on GitHub. Use this shape and replace every illustrative value with a verified listing:

```json
{
  "events": [
    {
      "id": "unique-stable-event-id",
      "title": "Verified event title",
      "date": "2026-10-20",
      "time": "18:00",
      "venue": "Verified venue",
      "address": "Verified street address, Fayetteville, AR",
      "category": "community",
      "price": "Free",
      "description": "Accurate event description.",
      "source": "https://example.org/replace-with-real-source"
    }
  ]
}
```

Categories: `music`, `arts`, `community`, `outdoors`, `food`, `learning`. Date is YYYY-MM-DD; time is 24-hour America/Chicago local time. Each occurrence needs a separate stable ID. Do not upload the example as a real event. Only the repository owner/editor can publish these records; this is the human approval boundary for the static edition.

If rebuilding from source, edit `public/events.json` first. A rebuild copies that file to docs and will overwrite edits made only in docs.

## Develop and update

Use Node 22.13 or newer:

```sh
npm ci
npm run dev
```

Build an update:

```sh
npm run build
git add src public docs package.json package-lock.json
git commit -m "Update GoCal"
git push
```

Pages republishes changes pushed to main. Commit the generated docs output because this edition publishes from a branch, not a build workflow. For event-only edits, commit the edited `docs/events.json` (and matching `public/events.json` when keeping source in sync).

## Custom domain later

Use **Settings → Pages → Custom domain** after purchasing your domain. Follow GitHub's domain verification and DNS instructions; do not reuse Sites DNS records. Keep the default GitHub URL until the certificate and custom domain are working. No custom domain has been configured by this package.

## References

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site

## Validation

TypeScript and the static production build passed. This package has no dependency on the private Sites API or GPT sign-in. Publishing has not been executed; the provided script creates the public repository when you run it.
