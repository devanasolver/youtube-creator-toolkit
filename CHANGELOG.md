# Changelog

## 2.1.0 - 2026-10-17

### Added
- Transcript Download: captions as copyable text and .txt/.srt/.vtt downloads, language picker, honest message when a video has no captions.
- SRT/VTT cleaner and converter that runs fully in the browser.
- Channel Stats Lookup, Keyword & Tag Suggestions (with hashtags), Title & Description Analyzer, Thumbnail Preview & A/B Compare, Revenue Estimator, Chapters Checker, Upload Time Planner, Free & CC Footage Finder.
- `proxy/`: free Cloudflare Pages Functions (transcript, channel, suggest) with a CORS allow-list.

### Notes
- Deliberately not added: video or audio downloading.
- Transcript fetching retries automatically because YouTube sometimes blocks the proxy's network.

## 2.0.0 - 2026-10-17

Full rebuild. The repo previously contained a 2023 storefront template selling paid YouTube views and watch hours (with a broken placeholder contact form and fake testimonials). Selling views and watch hours violates YouTube's fake engagement policy, so that content was removed entirely.

### Added
- Thumbnail Grabber: fetch and download every available thumbnail size for any YouTube video link or ID.
- Title & Tag Ideas: title angle generator and copy-ready tag sets from a topic.
- Monetization Progress: live progress toward YouTube Partner Program thresholds (full and fan funding tiers).
- Channel Audit Checklist: 20-point audit with on-device progress saving.
- Dark and light themes, responsive layout, custom logo and favicon.
- MIT license.

### Removed
- All paid "views" and "watch hours" service pages, pricing, fake testimonials and placeholder contact details.
- Broken Formspree contact form wired to a placeholder ID.
