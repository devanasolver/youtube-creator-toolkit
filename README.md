# Creator Toolkit

Free, honest tools for YouTube creators. Most tools run entirely in the browser. Transcript, channel and keyword lookups go through a small free Cloudflare proxy (see `proxy/`) that stores nothing. No accounts, no tracking.

**Live site:** https://devanasolver.github.io/youtube-creator-toolkit/

## Tools

- **Thumbnail Grabber** - paste any YouTube link (watch, youtu.be, Shorts, embed or a bare video ID) and download every available thumbnail size, straight from YouTube's image CDN.
- **Title & Tag Ideas** - type a video topic and get ten clickable title angles plus a copy-ready tag set.
- **Monetization Progress** - enter subscribers, public watch hours and Shorts views to see exactly how far you are from the YouTube Partner Program (both the full tier and the fan funding tier).
- **Channel Audit Checklist** - twenty checks across setup, content, discoverability and analytics. Progress is saved on your device.
- **Transcript Download** - paste a YouTube link, copy the captions or download .txt, .srt or .vtt. Also cleans and converts your own .srt/.vtt files in the browser. Says so plainly when a video has no captions.
- **Channel Stats Lookup** - subscribers (rounded), recent upload pace, average and median views and outlier videos for any public channel. Limited to the 15 newest uploads in YouTube's public feed.
- **Keyword & Tag Suggestions** - live YouTube search autocomplete, copy-ready tags and hashtags. No search volume data.
- **Title & Description Analyzer** - checklist score against published best practice (not a ranking prediction).
- **Thumbnail Preview & A/B Compare** - mock desktop feed, phone feed and sidebar, light and dark.
- **Revenue Estimator** - range from your views and your own RPM.
- **Chapters Checker & Formatter** - validates YouTube's chapter rules and formats the list.
- **Upload Time Planner** - converts your audience's peak time into your publish time.
- **Free & CC Footage Finder** - search links for reusable footage plus a credit-line helper.

## What this does not do

No video or audio downloading and no view, sub or watch-hour services. Those break YouTube's terms and are not what this site is for.

## Known limits

YouTube intermittently refuses requests from data-center networks. The transcript tool retries automatically (up to 14 times); if it still fails the page says so and you can try again. Videos with captions disabled have no transcript to fetch.

## Why this exists

Real channel growth comes from better titles, thumbnails and consistency - not bought views or watch hours, which violate YouTube's fake engagement policy and get channels removed from monetization. This toolkit only does things that genuinely help.

## Tech

Plain HTML, CSS and JavaScript on GitHub Pages. No build step, no dependencies, no tracking. The proxy in `proxy/` is three small Cloudflare Pages Functions.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Deploy

The site is a static page served with GitHub Pages from the `main` branch root.

## License

MIT. Not affiliated with YouTube or Google.
