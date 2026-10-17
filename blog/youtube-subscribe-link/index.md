# How to Make a YouTube Subscribe Link (and Why It Cannot Force a Subscribe)

Source: https://devanasolver.github.io/youtube-creator-toolkit/blog/youtube-subscribe-link/
Published: 2026-10-17 | Updated: 2026-10-18 | Site: Creator Toolkit (free YouTube creator tools)
Related free tool: Subscribe Link Generator - https://devanasolver.github.io/youtube-creator-toolkit/#subscribe-links

**TL;DR:** Add ?sub_confirmation=1 to a YouTube channel URL and, on the website, YouTube can show a prompt asking the viewer to confirm a subscription. The Subscribe Link Generator builds the link from an @handle, channel URL or channel ID. The viewer still has to confirm. The prompt may not appear in the mobile app, in some browsers, or for people who already subscribe.

A subscribe link is a normal channel link with one extra piece on the end. Creators use it in descriptions, emails and social bios so a click leads a viewer straight to the question "Do you want to subscribe?".

## How to make a YouTube subscribe link

1. Open the [Subscribe Link Generator](https://devanasolver.github.io/youtube-creator-toolkit/#subscribe-links).
2. Paste a channel @handle, a channel URL, or a channel ID that starts with `UC`.
3. Press the button. If you gave a handle, the tool looks up the channel ID for you.
4. Copy the link, or download the QR code.
5. Open it yourself in a private window and on your phone to see what viewers will see.

## What the link looks like

A subscribe link is your channel address with `sub_confirmation=1` added:

```
https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx?sub_confirmation=1
```

The generator builds it from the channel ID, which does not change when a channel renames itself. You can build one by hand from a handle URL too, by adding `?sub_confirmation=1` to the end.

## What it does, and what it does not

**It can show a subscribe prompt.** On YouTube's website, a viewer who opens the link can see a confirmation window asking them to subscribe.

**It never subscribes anyone by itself.** The viewer has to press the button. Be wary of anyone who offers "auto subscribe" links. You cannot subscribe another person's account without them acting.

**It may not show a prompt at all.** The prompt may not appear in the mobile app, in some browsers, or for viewers who already subscribe. It can also change when YouTube changes its site. We could not find the parameter described on YouTube's own help pages, so treat it as a widely used convention, not a promise.

**It is not a growth hack.** It removes one step. The reason someone subscribes is still your content.

## Handles, IDs and which to use

YouTube's [channel URL help page](https://support.google.com/youtube/answer/6180214) lists the address types a channel can have: the ID-based URL, the handle URL, custom URLs and legacy usernames. The [handle page](https://support.google.com/youtube/answer/11585688) says handles start with @ and identify a channel. For a link you plan to keep for years, the ID is the most stable, since it does not change if you edit your handle. The generator resolves the handle to the ID for you using the same free lookup as the [Channel Stats Lookup](https://devanasolver.github.io/youtube-creator-toolkit/blog/youtube-channel-stats-lookup-what-public-data-shows/).

## Using it well

- Put it where a subscribe request is natural, such as the end of an email or a "start here" page.
- Say what the viewer gets. "New video every Friday" is better than "please subscribe".
- Do not use it in a way that tricks people, for example hiding it behind a misleading button.
- If the link is for a phone bio, also look at the [YouTube App Link Maker](https://devanasolver.github.io/youtube-creator-toolkit/blog/youtube-app-link-for-bio-links/).

## FAQ

### How do I make a YouTube subscribe link?
Take your channel URL and add ?sub_confirmation=1 at the end, or paste your handle or channel ID into the Subscribe Link Generator.

### Does a subscribe link subscribe people automatically?
No. At most it shows a prompt that the viewer has to confirm.

### Why does the prompt not appear for some people?
It may not show in the mobile app or some browsers, and not for people who already subscribe. It can also change when YouTube updates its site.

### Where do I find my channel ID?
YouTube's help page says to sign in, select your profile picture, then Settings, then Advanced settings, where you must be the channel's primary owner to see it. You can also read it from the address of a channel page that has the form /channel/UC..., or let the generator look it up from an @handle.

### Does the generator cost anything or need a login?
No. It is free and needs no sign-in.

## Sources

- https://support.google.com/youtube/answer/6180214
- https://support.google.com/youtube/answer/11585688
- https://support.google.com/youtube/answer/3250431

---
From Creator Toolkit: https://devanasolver.github.io/youtube-creator-toolkit/