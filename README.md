# AJK Election Live Dashboard

A self-refreshing Node.js dashboard that combines election-related updates from
official pages, RSS feeds, HTML pages, and JSON APIs.

## Run locally

1. Install Node.js 18 or newer.
2. Open this folder in Terminal.
3. Run:

```bash
npm install
npm start
```

4. Open `http://localhost:3000`

## Add or change data sources

Edit `sources.json`.

Supported source types:

- `rss`: RSS/Atom feed URL
- `html`: webpage plus CSS selectors
- `json`: API endpoint returning an array or `{ "items": [...] }`

Set `priority` to 90 or above for an official source. Official sources are shown
first and marked clearly.

## Important limitations

- “Real-time” depends on how often each source publishes updates.
- Some sites block automated requests or change their HTML layout.
- Use official APIs where available.
- Check each site’s terms, robots policy, and copyright restrictions.
- Do not present media projections as official final results.
- For production, deploy behind HTTPS and add caching, rate limiting, logging,
  source health monitoring, and a database.

## Deploy

This app can be deployed to Render, Railway, Fly.io, a VPS, or another Node.js host.
Set the start command to `npm start`.
