# YouTube Video Summarizer

Summarize any YouTube video into a crisp markdown summary and key points. Streams results live in Raycast so you can skim faster and decide what’s worth watching.

## Features
- Real‑time streaming summary (Gemini 2.5 Pro via `ai` + `@ai-sdk/google`)
- Works with any YouTube URL (watch, shorts, live)
- Lightweight metadata via YouTube oEmbed (title, channel) — no YouTube Data API
- Two ways to start:
  - Paste a URL
  - One‑shot from the active YouTube tab (Raycast Web Extension)

## Commands
- Summarize YouTube Video: prompts for a YouTube URL and shows a streaming summary in a `Detail` view
- Summarize Active YouTube Tab: grabs the current YouTube tab via Raycast Web Extension and launches the summarizer

### Optional custom instruction/question
- Both commands accept an optional `question` argument to override the default prompt.
- Examples:
  - Paste URL flow: provide `question` like "5 bullets for execs" or "focus on architecture".
  - Active tab flow: pass a `question` when invoking the command, it forwards to the summarizer.

## Requirements
- Google AI Studio API key (Gemini): set in extension preferences
- Optional: Raycast Web Extension (for the “active tab” command)

## Preferences
- Gemini API Key (required)
- Max Tokens (default 4000)
- Default Prompt (analysis instruction; overridden by `question` when provided)

## Usage
1) Run “Summarize YouTube Video” and paste a YouTube URL, or run “Summarize Active YouTube Tab”.
2) Optionally add a `question` to steer the analysis (e.g. "compare pros/cons", "for beginners").
3) Watch the summary stream in; copy/paste the markdown anywhere.

## Privacy
- Your API key is stored locally by Raycast preferences
- No tracking, no external storage by this extension

## Why Gemini
- Direct URL grounding on YouTube links — no brittle transcript scraping
- Works when transcripts are missing, auto‑generated, language‑mismatched, or rate‑limited
- Handles watch, Shorts, and live streams without YouTube Data API keys
- Faster setup and fewer failure modes than transcript‑based pipelines

## Notes
- The extension does not fetch full transcripts; the URL is provided to the model for retrieval/analysis
- If the Web Extension isn’t installed/connected, the “active tab” command will prompt you