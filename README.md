# NURU
Static job + scholarship platform fed by **data/hub_repo.xlsx** (columns: path, title, url, details).
**Add a listing = add a row at the bottom of that sheet, commit, push.** Vercel rebuilds automatically.
- path: `Jobs/Medical` or `Scholarships/Open now`; title: `Employer - Job title`; url: listing page (the Apply link)
- details: `Location. Closes 11 Oct 2026. Requirements... Email CV to hr@x.com` (a closing date and an email are picked up automatically; no date = shown as Open)
- optional extra column `image` (image URL or Google Drive share link) shows a logo/tile.
The in-app "Post a job" screen builds a ready-to-paste row. Listings closed 30+ days are dropped at build; closed ones are hidden from search.
Deploy: push to GitHub, import in Vercel (build `npm run build`, output `public`). Local: `npm i && npm run build && npm start`.
Dashboard (`#/dashboard`) shows this device only until you add Upstash Redis from the Vercel Marketplace (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) plus an `ADMIN_KEY` env var.
