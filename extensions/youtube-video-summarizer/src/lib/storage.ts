import { LocalStorage } from "@raycast/api";

export type SummaryStatus = "queued" | "in_progress" | "done" | "error";

export type SummaryRecord = {
  key: string; // summary:<videoId>
  videoId: string;
  url: string;
  title?: string;
  channel?: string;
  thumbnailUrl?: string;
  question?: string;
  model?: string;
  status: SummaryStatus;
  createdAt: number;
  updatedAt: number;
  markdown?: string;
  error?: string;
};

export const buildKey = (videoId: string): string => `summary:${videoId}`;

export async function saveSummary(record: SummaryRecord): Promise<void> {
  await LocalStorage.setItem(record.key, JSON.stringify(record));
}

export async function getSummaryByVideoId(videoId: string): Promise<SummaryRecord | undefined> {
  const raw = await LocalStorage.getItem<string>(buildKey(videoId));
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as SummaryRecord;
  } catch {
    return undefined;
  }
}

export async function getSummaryByUrl(url: string): Promise<SummaryRecord | undefined> {
  const all = await getAllSummaries();
  return all.find((s) => s.url === url);
}

export async function getAllSummaries(): Promise<SummaryRecord[]> {
  const items = await LocalStorage.allItems();
  const results: SummaryRecord[] = [];
  for (const [key, value] of Object.entries(items)) {
    if (!key.startsWith("summary:")) continue;
    if (typeof value !== "string") continue;
    try {
      const parsed = JSON.parse(value) as SummaryRecord;
      results.push(parsed);
    } catch {
      // ignore bad entries
    }
  }
  // newest first
  results.sort((a, b) => b.updatedAt - a.updatedAt);
  return results;
}

export async function upsertStatus(
  partial: Omit<SummaryRecord, "createdAt" | "updatedAt" | "status"> & { status: SummaryStatus },
): Promise<SummaryRecord> {
  const existingRaw = await LocalStorage.getItem<string>(partial.key);
  const now = Date.now();
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw) as SummaryRecord;
      const merged: SummaryRecord = { ...existing, ...partial, updatedAt: now };
      await saveSummary(merged);
      return merged;
    } catch {
      // fallthrough to create fresh
    }
  }
  const created: SummaryRecord = {
    key: partial.key,
    videoId: partial.videoId,
    url: partial.url,
    title: partial.title,
    channel: partial.channel,
    thumbnailUrl: partial.thumbnailUrl,
    question: partial.question,
    model: partial.model,
    status: partial.status,
    createdAt: now,
    updatedAt: now,
    markdown: undefined,
    error: undefined,
  };
  await saveSummary(created);
  return created;
}

export async function updateMarkdown(
  key: string,
  markdown: string,
  extra?: Partial<Pick<SummaryRecord, "status" | "title" | "channel" | "thumbnailUrl" | "error">>,
): Promise<SummaryRecord | undefined> {
  const raw = await LocalStorage.getItem<string>(key);
  if (!raw) return undefined;
  try {
    const existing = JSON.parse(raw) as SummaryRecord;
    const updated: SummaryRecord = {
      ...existing,
      markdown,
      updatedAt: Date.now(),
      ...(extra ?? {}),
    };
    await saveSummary(updated);
    return updated;
  } catch {
    return undefined;
  }
}

export async function removeSummary(key: string): Promise<void> {
  await LocalStorage.removeItem(key);
}
