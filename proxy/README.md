# Transcript / channel / keyword / video proxy

Small Cloudflare Pages Functions project (free tier) that the static site calls, because YouTube does not allow browsers on other sites to read this data directly.

- `GET /api/transcript?v=VIDEO_ID[&lang=xx]` - captions as JSON cues
- `GET /api/channel?q=@handle|url|UC id` - public channel info and the 15 newest uploads (public RSS feed)
- `GET /api/video?v=VIDEO_ID` - public video title, channel, views, optional likes, duration, publish date and keyword tags. No private analytics; explicit unavailable/upstream errors.
- `GET /api/suggest?q=topic` - YouTube search autocomplete

It stores nothing and allows browser reads from configured origins (CORS allow-list in `functions/api/_util.js`). It never downloads video or audio.

Deploy: `cd proxy && npx wrangler pages deploy public --project-name yt-transcript-proxy --branch main` (needs a Cloudflare API token with Pages edit access).
