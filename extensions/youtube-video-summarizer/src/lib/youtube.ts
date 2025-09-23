export function parseYouTubeVideoId(input: string): string | undefined {
  try {
    const u = new URL(input);
    if (u.hostname === "youtu.be") {
      return u.pathname.replace("/", "");
    }
    if (u.hostname.includes("youtube.com")) {
      // watch?v=, shorts/, live/
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      // shorts/<id>
      if (parts[0] === "shorts" && parts[1]) return parts[1];
      // live/<id>
      if (parts[0] === "live" && parts[1]) return parts[1];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export type OEmbed = {
  title?: string;
  author_name?: string; // channel
  thumbnail_url?: string;
};

export async function fetchYouTubeOEmbed(url: string): Promise<OEmbed | undefined> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(endpoint);
    if (!res.ok) return undefined;
    const data = (await res.json()) as OEmbed;
    return {
      title: data?.title,
      author_name: data?.author_name,
      thumbnail_url: data?.thumbnail_url,
    };
  } catch {
    return undefined;
  }
}
