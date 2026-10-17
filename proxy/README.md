# Transcript / channel / keyword proxy

Small Cloudflare Pages Functions project (free tier) that the static site calls, because YouTube does not allow browsers on other sites to read this data directly.

- `GET /api/transcript?v=VIDEO_ID[&lang=xx]` - captions as JSON cues
- `GET /api/channel?q=@handle|url|UC id` - public channel info and the 15 newest uploads (public RSS feed)
- `GET /api/suggest?q=topic` - YouTube search autocomplete

It stores nothing and only answers requests from the live site (CORS allow-list in `functions/api/_util.js`). It never downloads video or audio.

Deploy: `npx wrangler pages deploy proxy/public --project-name yt-transcript-proxy --branch main` (run from the repo root so `proxy/functions` is picked up; use `cd proxy` first).
