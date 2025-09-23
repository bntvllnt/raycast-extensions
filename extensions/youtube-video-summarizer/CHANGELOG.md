## Changelog

All notable changes to the Raycast extension `youtube-video-summarizer` will be documented in this file.

This project adheres to Keep a Changelog and uses Semantic Versioning.

## [Unreleased]

## [0.2.0] - 2025-09-23
### Added
- Command `list-summaries` ("YouTube Summaries"): browse and search saved summaries with titles, channels, and thumbnails; toggle list/grid view; actions to view, re‑run, open video, and delete.
- Local summary persistence and status tracking. Existing summaries open instantly; in‑progress streams persist to the list.

### Changed
- `summarize-youtube-video` and `summarize-active-youtube-tab` open the streaming view immediately and load any existing saved summary.
- Internal: set explicit command `path` fields in the extension manifest for these commands.

## [0.1.0] - 2025-09-21
### Added
- Optional `question` argument on both commands to override the default prompt/instruction.
- Command `summarize-youtube-video`: summarize any YouTube URL into a concise markdown summary and key points.
- Command `summarize-active-youtube-tab`: detect the active YouTube tab (via Raycast Web Extension) and launch the summarizer.
- Streaming responses using `ai` + `@ai-sdk/google` (Gemini 2.5 Pro) for incremental updates in the Raycast `Detail` view.
- Preferences:
  - `geminiApiKey` (required): Google AI Studio API key.
  - `maxTokens` (default 4000).
  - `defaultPrompt` (analysis instruction).
- Lightweight metadata via YouTube oEmbed (title, channel) without requiring YouTube Data API.
- Inline validation and user feedback with toasts for invalid URL, missing API key, or missing browser extension.
- Cross‑platform support (macOS, Windows). MIT licensed.