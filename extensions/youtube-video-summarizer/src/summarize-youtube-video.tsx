import { Detail, LaunchProps, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
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
  const prefs = getPreferenceValues<Preferences>();

  const validUrl = useMemo(() => (url ? isYouTubeUrl(url) : false), [url]);

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
        setMarkdown("Streaming response from Gemini 2.5 Pro…");
        if (!prefs.geminiApiKey) {
          await showToast({ style: Toast.Style.Failure, title: "Gemini API key required" });
          setMarkdown("Please set your Gemini API key in preferences.");
          setIsLoading(false);
          return;
        }

        // Set API key for Google AI SDK
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = prefs.geminiApiKey;

        // Parse max tokens from preferences (default: 4000)
        const maxTokens = parseInt(prefs.maxTokens || "4000", 10);

        const instruction =
          question && question.trim().length > 0
            ? question.trim()
            : prefs.defaultPrompt?.trim() || "Extract key points and themes. Be concise.";

        const result = await streamText({
          model: google("gemini-2.5-pro"),
          // Provide URL in prompt; gateway/provider handles retrieval
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: instruction,
                },
                {
                  type: "file",
                  data: url,
                  mediaType: "video/mp4",
                },
              ],
            },
          ],
          maxOutputTokens: maxTokens,
          temperature: 0.2,
        });

        // Stream the response incrementally for better UX
        let fullText = "";
        for await (const delta of result.textStream) {
          fullText += delta;
          setMarkdown(fullText);
        }
      } catch (err) {
        console.error(err);
        await showToast({ style: Toast.Style.Failure, title: "Failed to analyze video" });
        setMarkdown("Failed to analyze the video.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [url, validUrl, question]);

  return <Detail isLoading={isLoading} markdown={markdown} />;
}
