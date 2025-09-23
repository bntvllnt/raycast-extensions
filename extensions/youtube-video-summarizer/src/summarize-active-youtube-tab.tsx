import { BrowserExtension, LaunchType, launchCommand, showToast, Toast, LaunchProps } from "@raycast/api";
// storage is used by the summarizer view; no need to pre-check here

function isYouTubeUrl(input: string): boolean {
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtube.com")) {
      // watch, shorts, live, etc.
      return true;
    }
    if (u.hostname === "youtu.be") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

type Props = LaunchProps<{ arguments: { question?: string } }>;

export default async function Command(props: Props): Promise<void> {
  try {
    const tabs = await BrowserExtension.getTabs();
    // Prefer the active YouTube tab in the focused window; otherwise, any YouTube tab
    const activeYouTube = tabs.find((t) => t.active && isYouTubeUrl(t.url)) ?? tabs.find((t) => isYouTubeUrl(t.url));

    if (!activeYouTube) {
      await showToast({ style: Toast.Style.Failure, title: "No YouTube tab found" });
      return;
    }

    // Always open the view. If an existing summary exists, it will load instantly; otherwise, it will stream and persist.
    await launchCommand({
      name: "summarize-youtube-video",
      type: LaunchType.UserInitiated,
      arguments: { url: activeYouTube.url, question: props.arguments?.question },
    });
  } catch {
    await showToast({ style: Toast.Style.Failure, title: "Raycast Web Extension required" });
    // Swallow error; most likely the web extension isn't installed or connected
  }
}
