import {
  Action,
  ActionPanel,
  Color,
  Grid,
  Icon,
  Image,
  List,
  LaunchType,
  launchCommand,
  openCommandPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { getAllSummaries, removeSummary, SummaryRecord } from "./lib/storage";

type Mode = "list" | "grid";

export default function Command() {
  const [items, setItems] = useState<SummaryRecord[]>([]);
  const [search, setSearch] = useState<string>("");
  const [mode, setMode] = useState<Mode>("list");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function reload() {
    setIsLoading(true);
    const all = await getAllSummaries();
    setItems(all);
    setIsLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => {
      return (
        s.title?.toLowerCase().includes(q) ||
        s.channel?.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        s.markdown?.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  if (mode === "grid") {
    return (
      <Grid
        columns={4}
        aspectRatio="16/9"
        inset={Grid.Inset.Small}
        isLoading={isLoading}
        searchBarPlaceholder="Search summaries..."
        searchText={search}
        onSearchTextChange={setSearch}
        navigationTitle="YouTube Summaries"
        throttle
      >
        {filtered.map((s) => (
          <Grid.Item
            key={s.key}
            title={s.title || s.url}
            subtitle={s.channel}
            content={{
              source: s.thumbnailUrl || Icon.Video,
            }}
            actions={<ItemActions item={s} onChanged={reload} setMode={setMode} />}
          />
        ))}
      </Grid>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search summaries..."
      searchText={search}
      onSearchTextChange={setSearch}
      navigationTitle="YouTube Summaries"
      throttle
    >
      {filtered.map((s) => (
        <List.Item
          key={s.key}
          title={s.title || s.url}
          subtitle={s.channel}
          icon={{ source: s.thumbnailUrl || Icon.Video, mask: Image.Mask.RoundedRectangle }}
          accessories={(function () {
            const acc: List.Item.Accessory[] = [
              { tag: statusTag(s.status) },
              ...(s.question ? [{ text: "custom" } as List.Item.Accessory] : []),
              ...(s.model ? [{ text: s.model } as List.Item.Accessory] : []),
              { date: new Date(s.updatedAt) },
            ];
            return acc;
          })()}
          actions={<ItemActions item={s} onChanged={reload} setMode={setMode} />}
        />
      ))}
    </List>
  );
}

function statusTag(status: SummaryRecord["status"]) {
  switch (status) {
    case "done":
      return { value: "done", color: Color.Green };
    case "in_progress":
      return { value: "working", color: Color.Blue };
    case "queued":
      return { value: "queued", color: Color.Yellow };
    case "error":
    default:
      return { value: "error", color: Color.Red };
  }
}

function ItemActions({
  item,
  onChanged,
  setMode,
}: {
  item: SummaryRecord;
  onChanged: () => void;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}) {
  return (
    <ActionPanel>
      <Action
        title="View Summary"
        icon={Icon.Text}
        onAction={async () => {
          await launchCommand({
            name: "summarize-youtube-video",
            type: LaunchType.UserInitiated,
            arguments: { url: item.url },
          });
        }}
      />
      <Action.OpenInBrowser title="Open Video" url={item.url} shortcut={{ modifiers: ["cmd"], key: "o" }} />
      <Action
        title="Re-Run Summary"
        icon={Icon.Repeat}
        onAction={async () => {
          await launchCommand({
            name: "summarize-youtube-video",
            type: LaunchType.UserInitiated,
            arguments: { url: item.url, question: item.question },
          });
        }}
      />
      <Action
        title="Toggle Grid or List"
        icon={Icon.AppWindowGrid3x3}
        onAction={() => setMode((m) => (m === "grid" ? "list" : "grid"))}
      />
      <Action
        title="Delete"
        style={Action.Style.Destructive}
        icon={Icon.Trash}
        onAction={async () => {
          await removeSummary(item.key);
          await showToast({ style: Toast.Style.Success, title: "Deleted" });
          onChanged();
        }}
      />
      <Action title="Extension Preferences" icon={Icon.Gear} onAction={() => openCommandPreferences()} />
    </ActionPanel>
  );
}
