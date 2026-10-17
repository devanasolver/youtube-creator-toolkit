# Changelog

## 2.2.0 - 2026-10-18

### Added
- YouTube App Link Maker: static `/open/` landing page, compact fragment links, Android intents with browser fallback, iOS scheme links and alternate video retry, webview guidance, copy and local downloadable QR. Desktop uses normal YouTube.
- Subscribe Link Generator: @handle resolution to UC IDs using the existing proxy, `sub_confirmation=1` links, copy and QR. No auto-subscribe claims.
- YouTube Video Public Stats and Tags Extractor: original tools based on public page metadata; optional likes and like/view rate, upload date, duration, exposed tags, copy and .txt export. Missing data stays unavailable.
- `/api/video` proxy endpoint with input checks, timeout, metadata parsing and honest upstream errors.
- New-tool navigation shortcuts, responsive layouts, keyboard labels/focus styles and parser/proxy tests.

### Limits
- App escape cannot be forced from Instagram/TikTok/Facebook/Threads. Device-emulated Chrome verifies launch attempts and fallbacks, not physical-app handoff.
- Public video stats are not YouTube Studio analytics. No private metrics, guessed earnings, video/audio downloaders or artificial views.
- Apgy directory coverage: thumbnail grabbing and tag generation already existed; non-creator financial tools were skipped.

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
