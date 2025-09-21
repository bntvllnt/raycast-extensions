## Changelog

All notable changes to the Raycast extension `youtube-video-summarizer` will be documented in this file.

This project adheres to Keep a Changelog and uses Semantic Versioning.

## [Unreleased]

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