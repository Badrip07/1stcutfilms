/**
 * Parse a YouTube watch, embed, shorts, or youtu.be URL into a video id.
 */
export function getYoutubeIdFromUrl(url = "") {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
    const host = u.hostname.replace(/^www\./i, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (!host.includes("youtube.com") && !host.includes("youtube-nocookie.com")) {
      return null;
    }
    const embedMatch = u.pathname.match(/^\/embed\/([\w-]+)/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = u.pathname.match(/^\/shorts\/([\w-]+)/);
    if (shortsMatch) return shortsMatch[1];
    const v = u.searchParams.get("v");
    if (v && /^[\w-]{6,}$/.test(v)) return v;
  } catch {
    return null;
  }
  return null;
}

export function getYoutubeThumbnailUrl(videoId) {
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

const YT_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

function minimalEmbedQuery(extra) {
  const q = new URLSearchParams({
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    fs: "0",
    disablekb: "1",
    iv_load_policy: "3",
    ...extra,
  });
  return q.toString();
}

/** Background-style embed (muted autoplay loop, minimal chrome). */
export function getYoutubeEmbedSrcBackground(videoId) {
  if (!videoId) return "";
  const q = minimalEmbedQuery({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: videoId,
  });
  return `${YT_EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?${q}`;
}

/**
 * After an explicit user click to play — still chromeless (no control bar / share strip).
 * YouTube may still show a small watermark; full removal is not supported by their embed.
 */
export function getYoutubeEmbedSrcWithControls(videoId) {
  if (!videoId) return "";
  const q = minimalEmbedQuery({
    autoplay: "1",
    mute: "0",
  });
  return `${YT_EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?${q}`;
}
