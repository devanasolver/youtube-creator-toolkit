---
slug: clean-srt-vtt-caption-files
title: How to Clean and Convert SRT and VTT Caption Files
short: Clean SRT and VTT files
description: Remove style tags and sound cues, merge repeated lines, shift timing and convert between SRT, VTT and plain text, all in your browser without uploading the file.
date: 2026-10-07
category: Transcripts
tool: transcript
toolName: SRT and VTT cleaner
tldr: Caption files often come with formatting tags, [music] cues, repeated lines and timing that is slightly off. The SRT and VTT cleaner in the Transcript section removes the noise, merges duplicates, shifts timing by a number of seconds and exports .txt, .srt or .vtt. It runs in your browser, so the file is never uploaded.
cta: Open the Transcript section and scroll to the cleaner. Drop in a .srt or .vtt file or paste the text, choose your options and copy or download the result.
related: how-to-get-a-youtube-transcript, how-to-add-youtube-chapters, youtube-channel-audit-checklist
sources: https://support.google.com/youtube/answer/6373554 https://support.google.com/youtube/answer/2734796
howtoName: How to clean a caption file
---

Caption files are simple text, but real ones are messy. Auto-generated files repeat lines. Subtitle tools leave tags like `<i>` or `{\an8}` in the text. Sound cues such as [music] or (applause) get in the way when you want to read the words. And if you cut the start of a video, every timestamp is now off. The cleaner in the [Transcript section](@/#transcript) fixes these without any account or upload.

## What the two formats look like

An **SRT** file is numbered blocks, each with a time range and the text:

`1`, then `00:00:01,000 --> 00:00:03,500`, then the line of text.

A **VTT** file is similar but starts with the word WEBVTT, and uses a dot instead of a comma in the time: `00:00:01.000`. Both are plain text, so you can open them in any text editor.

## How to clean a caption file

1. Open the [cleaner](@/#transcript) and choose your file, or paste the text into the box. A .srt, .vtt or .txt file works.
2. Choose what to remove:
   - **Style tags** like `<i>` and `{\an8}`. On by default.
   - **Bracketed cues** like [music] and (applause). Off by default, because sometimes you want them.
   - **Repeated lines**. On by default. This merges lines that repeat across neighboring cues, which is common in auto-captions.
3. Optionally set **Shift timing** in seconds. Use a positive number to move captions later and a negative number to move them earlier.
4. Check the result in the output box.
5. Copy the clean text, or download .txt, .srt or .vtt.

## When to shift timing

Say you trimmed 4 seconds from the start of your video after making the captions. Enter -4 and every cue moves 4 seconds earlier. If the captions appear too early, use a positive number. Decimal values work, so 0.5 moves things by half a second. Always play the video once to confirm the sync.

## Which output should you pick?

- **.txt** for reading, notes and writing.
- **.srt** for most editors and many video platforms.
- **.vtt** for web players.

If you plan to upload captions to your own YouTube video, YouTube's [help page on adding subtitles and captions](https://support.google.com/youtube/answer/2734796) lists the file types it accepts and how to upload them. Check that page for the current list.

## Fixing auto-captions properly

Cleaning is not the same as correcting. The tool removes noise, it does not fix wrong words. YouTube says automatic captions can misrepresent the spoken content and recommends reviewing them. If you care about accuracy, read through the cleaned text once and fix names and terms.

## Privacy and limits

- The file is processed in your browser and never uploaded.
- If no timed captions are found in what you pasted, the tool says so. It expects SRT or VTT style timing lines such as `00:00:01,000 --> 00:00:03,000`.
- It does not translate captions or check them for accuracy.
- Very large files may be slow on an old phone or computer.

## FAQ

### What is the difference between SRT and VTT?
Both hold captions with timecodes. SRT is the older and simpler one. VTT is the web standard, begins with WEBVTT and uses dots in the timecodes.

### How do I remove [music] from a caption file?
Tick the option to remove bracketed cues. It removes text in square brackets and parentheses such as [music] and (applause).

### How do I fix captions that are out of sync?
Use the Shift timing box. A positive number delays all captions, a negative number moves them earlier.

### Is my caption file uploaded anywhere?
No. The cleaner runs in your browser.

### Can it convert SRT to VTT?
Yes. Load an SRT file and download the result as .vtt, or the other way around.
