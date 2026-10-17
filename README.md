# Creator Toolkit

Free, honest tools for YouTube creators. Most tools run entirely in the browser. Transcript, channel, video metadata and keyword lookups go through a small free Cloudflare proxy (see `proxy/`) that stores nothing. No accounts, no tracking.

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
- **YouTube App Link Maker** - compact, self-hosted bio links for videos, Shorts, playlists and channels. Best-effort Android intent / iOS scheme launch, tappable retry, normal YouTube fallback, copy and downloadable QR.
- **Subscribe Link Generator** - channel URL, @handle or UC ID to a `sub_confirmation=1` link, copy and QR. @handles resolve through the public-channel proxy.
- **YouTube Video Public Stats** - public views, likes when exposed, like/view rate, duration, publish date and tag count. No invented private analytics or revenue.
- **YouTube Tags Extractor** - actual keyword tags exposed by a public video, with copy and .txt export. Clear empty/error states.
- **Free & CC Footage Finder** - search links for reusable footage plus a credit-line helper.

## What this does not do

No video or audio downloading and no view, sub or watch-hour services. Those break YouTube's terms and are not what this site is for.

## Known limits

YouTube intermittently refuses requests from data-center networks. The transcript tool retries automatically (up to 14 times); if it still fails the page says so and you can try again. Videos with captions disabled have no transcript to fetch.

### App / subscribe links

The App Link Maker is intended for link-in-bio sharing from Instagram, TikTok, Facebook, Threads and similar apps. It cannot force those apps to open an external app or browser. The landing page tries an app deep link on phones, offers a real user-tap anchor, and redirects to the ordinary YouTube URL after 4 seconds (8 in a detected in-app browser). Viewers can stop the automatic redirect. Leaving the page for the app cancels the fallback. Desktop viewers go straight to the web URL. Detection is a hint, not a guarantee.

Examples of the **relative** share format under this site's root:
- `open/#v=dQw4w9WgXcQ` - video, with optional `&t=43` and `&list=...`
- `open/#s=dQw4w9WgXcQ` - Short
- `open/#p=PLAYLIST_ID` - playlist
- `open/#c=UC_CHANNEL_ID` or `open/#h=%40handle` - channel

The fragment holds the destination without a database or URL-shortener service. Only valid YouTube destinations are accepted. No proxy is needed for app links or UC-ID subscribe links; QR generation runs locally using the bundled MIT-licensed [Project Nayuki QR generator](https://github.com/nayuki/QR-Code-generator/tree/master/typescript-javascript). This is a compact format on the existing Pages domain, not a separately branded short domain.

The YouTube app must be installed. A webview may block the launch, require a tap or require its menu's "Open in browser" option. `youtube://` and `vnd.youtube://` routing is best-effort and can change between app versions. Device-emulated Chrome tests verify URL construction, navigation attempts and fallback behavior, **not** actual YouTube app handoff on physical iPhones or Android phones. Test your bio link on a real phone before publishing it widely.

Subscribe links request YouTube's confirmation UI with `sub_confirmation=1`; they never auto-subscribe a viewer. The prompt may not appear in the mobile app, in some browsers, or for existing subscribers. YouTube controls it.

Public metadata and tags may be unavailable for private, deleted, restricted or blocked videos. Views and likes can lag, likes can be hidden, and some videos expose no tags. No private Studio access is claimed.

## Reference-site coverage

Compared with [Apgy's online-tools directory](https://tools.apgy.in/online-tools/), the missing creator tools added here are App Link Maker, Subscribe Link Generator, public video stats (the honest public-data subset of Video Analytics), and Tags Extractor. Implementations and UI are original. Thumbnail Downloader is already covered by Thumbnail Grabber; Tags Generator is already covered by Keyword & Tag Suggestions and Title & Tag Ideas. UPI payment links and insurance calculators are not YouTube creator tools. Video/audio downloaders, view inflation and guessed private analytics were not added.

## Tests

```
node tests/applink.test.js
node tests/video-metadata.test.mjs
```

Optional browser QA (requires Node, Playwright and Chrome):

```
npm install --no-save playwright
npx playwright install chromium
node tests/browser-qa.cjs
```

`CHROME_PATH` can select an existing Chrome executable. The browser suite uses a saved public-video fixture by default for repeatable stats/tag checks, while @handle resolution calls the live proxy. Set `LIVE_VIDEO=1` to test live video metadata too; YouTube may refuse those requests. Screenshots and the QA report are written to a printed temporary directory. Run with port 8000 free.

The unit tests cover supported URL formats, compact-link roundtrips, deep links, hostile / malformed URLs, metadata parsing, missing fields, public-count conversion, CORS and upstream errors. Browser QA also covers live handle and video lookups, copy / QR download, desktop and phone widths in both themes, device-emulated iOS / Android launch attempts, web fallbacks, in-app browser guidance and cancellation when the page is backgrounded. Physical app handoff remains unverified.

## Why this exists

Real channel growth comes from better titles, thumbnails and consistency - not bought views or watch hours, which violate YouTube's fake engagement policy and get channels removed from monetization. This toolkit only does things that genuinely help.

## Tech

Plain HTML, CSS and JavaScript on GitHub Pages. No build step, no runtime network dependencies for local tools, no tracking. The bundled QR generator is MIT licensed; its license header is retained. The proxy in `proxy/` is four small Cloudflare Pages Functions.

## Run locally

Serve the folder (recommended for app-link generation and live proxy CORS):

```
python3 -m http.server 8000
```

## Deploy

The site is a static page served with GitHub Pages from the `main` branch root.

## Support

If the toolkit helps you, you can [buy me a coffee](https://buymeacoffee.com/isaac49). Totally optional; the tools stay free.

## License

MIT. Not affiliated with YouTube or Google.


## Blog

Posts live in `blog-src/*.md` (small front matter, then Markdown). Run `node scripts/build-blog.mjs` to regenerate `blog/`, `sitemap.xml`, `feed.xml`, `robots.txt`, `llms.txt` and `llms-full.txt`. Commit the generated files; GitHub Pages serves them as-is.
