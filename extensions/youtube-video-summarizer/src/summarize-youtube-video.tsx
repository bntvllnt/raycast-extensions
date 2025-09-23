import { Action, ActionPanel, Detail, Icon, LaunchProps, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { fetchYouTubeOEmbed, parseYouTubeVideoId } from "./lib/youtube";
import { buildKey, getSummaryByVideoId, updateMarkdown, upsertStatus } from "./lib/storage";
// no transcript; we pass the URL directly to Gemini via messages

type Props = LaunchProps<{ arguments: { url: string; question?: string } }>;

type Preferences = {
  geminiApiKey?: string;
  maxTokens?: string;
  defaultPrompt?: string;
};

function isYouTubeUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.hostname.includes("youtube.com") || u.hostname === "youtu.be";
  } catch {
    return false;
  }
}

export default function Command(props: Props) {
  const { url, question } = props.arguments;
  const [markdown, setMarkdown] = useState<string>("Preparing…");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [thumb, setThumb] = useState<string | undefined>(undefined);
  const prefs = getPreferenceValues<Preferences>();

  const validUrl = useMemo(() => (url ? isYouTubeUrl(url) : false), [url]);

  async function rerun(): Promise<void> {
    try {
      setIsLoading(true);
      setMarkdown("Generating summary with Gemini 2.5 Pro…");

      if (!prefs.geminiApiKey) {
        await showToast({ style: Toast.Style.Failure, title: "Gemini API key required" });
        setMarkdown("Please set your Gemini API key in preferences.");
        setIsLoading(false);
        return;
      }

      const videoId = parseYouTubeVideoId(url);
      const key = videoId ? buildKey(videoId) : undefined;
      const meta = await fetchYouTubeOEmbed(url);
      if (meta?.title) setTitle(meta.title);
      if (meta?.thumbnail_url) setThumb(meta.thumbnail_url);

      process.env.GOOGLE_GENERATIVE_AI_API_KEY = prefs.geminiApiKey;
      const maxTokens = parseInt(prefs.maxTokens || "4000", 10);
      const instruction =
        question && question.trim().length > 0
          ? question.trim()
          : prefs.defaultPrompt?.trim() || "Extract key points and themes. Be concise.";

      if (key && videoId) {
        await upsertStatus({
          key,
          videoId,
          url,
          title: meta?.title,
          channel: meta?.author_name,
          thumbnailUrl: meta?.thumbnail_url,
          question,
          model: "gemini-2.5-pro",
          status: "in_progress",
        });
      }

      const { text } = await generateText({
        model: google("gemini-2.5-pro"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "file", data: url, mediaType: "video/mp4" },
            ],
          },
        ],
        maxOutputTokens: maxTokens,
        temperature: 0.2,
      });

      setMarkdown(text);
      if (key) await updateMarkdown(key, text, { status: "done" });
    } catch (err) {
      console.error(err);
      await showToast({ style: Toast.Style.Failure, title: "Failed to re-run" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      if (!url) {
        setMarkdown("No URL provided.");
        setIsLoading(false);
        return;
      }
      if (!validUrl) {
        await showToast({ style: Toast.Style.Failure, title: "Invalid YouTube URL" });
        setMarkdown("Invalid YouTube URL.");
        setIsLoading(false);
        return;
      }

      try {
        const videoId = parseYouTubeVideoId(url);
        const key = videoId ? buildKey(videoId) : undefined;

        // If saved summary exists, show it immediately
        if (videoId) {
          const existing = await getSummaryByVideoId(videoId);
          if (existing?.markdown) {
            setTitle(existing.title || undefined);
            setThumb(existing.thumbnailUrl || undefined);
            setMarkdown(existing.markdown);
            setIsLoading(false);
            return;
          }
        }

        // Otherwise generate (non-streaming) and persist
        setMarkdown("Generating summary with Gemini 2.5 Pro…");
        if (!prefs.geminiApiKey) {
          await showToast({ style: Toast.Style.Failure, title: "Gemini API key required" });
          setMarkdown("Please set your Gemini API key in preferences.");
          setIsLoading(false);
          return;
        }

        const meta = await fetchYouTubeOEmbed(url);
        if (meta?.title) setTitle(meta.title);
        if (meta?.thumbnail_url) setThumb(meta.thumbnail_url);

        process.env.GOOGLE_GENERATIVE_AI_API_KEY = prefs.geminiApiKey;
        const maxTokens = parseInt(prefs.maxTokens || "4000", 10);
        const instruction =
          question && question.trim().length > 0
            ? question.trim()
            : prefs.defaultPrompt?.trim() || "Extract key points and themes. Be concise.";

        if (key && videoId) {
          await upsertStatus({
            key,
            videoId,
            url,
            title: meta?.title,
            channel: meta?.author_name,
            thumbnailUrl: meta?.thumbnail_url,
            question,
            model: "gemini-2.5-pro",
            status: "in_progress",
          });
        }

        const { text } = await generateText({
          model: google("gemini-2.5-pro"),
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: instruction },
                { type: "file", data: url, mediaType: "video/mp4" },
              ],
            },
          ],
          maxOutputTokens: maxTokens,
          temperature: 0.2,
        });

        setMarkdown(text);
        if (key) await updateMarkdown(key, text, { status: "done" });
      } catch (err) {
        console.error(err);
        await showToast({ style: Toast.Style.Failure, title: "Failed to analyze video" });
        setMarkdown("Failed to analyze the video.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [url, validUrl, question]);

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={title || "YouTube Summary"}
      metadata={
        title || thumb ? (
          <Detail.Metadata>
            {thumb ? <Detail.Metadata.Label title="Thumbnail" text=" " icon={thumb} /> : null}
            {title ? <Detail.Metadata.Label title="Title" text={title} /> : null}
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Markdown" content={markdown} />
          <Action.OpenInBrowser title="Open Video" url={url} icon={Icon.Video} />
          <Action title="Re-Run Summary" icon={Icon.Repeat} onAction={rerun} />
        </ActionPanel>
      }
    />
  );
}
