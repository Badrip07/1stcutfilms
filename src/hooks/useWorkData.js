import { useEffect, useRef, useState } from "react";
import { apiUrl, getApiBase } from "../lib/apiBase.js";
import { workData as staticWorkData } from "../Pages/Work/workData.js";

/** Successful GET /api/public/work only — never the bundled fallback. */
let apiWorkDataCache = null;
let inFlight = null;

function wantsForcedStaticWork() {
  const v = import.meta.env.VITE_USE_STATIC_WORK;
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Vercel SPA rewrites send /api/* to index.html (200 + HTML). Without a real API
 * origin (VITE_API_URL), fetches are useless and may briefly confuse the app.
 */
function shouldSkipApiFetchInThisBuild() {
  if (wantsForcedStaticWork()) return true;
  if (import.meta.env.DEV) return false;
  return !getApiBase();
}

function isValidWorkApiPayload(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.video)) return false;
  if (!Array.isArray(data.photography)) return false;
  return true;
}

/** Optional /work-youtube-overrides.json — keyed by legacy video id → full YouTube URL. */
function applyYoutubeOverridesFromMap(workData, map) {
  if (!map || typeof map !== "object") return workData;
  const video = (workData.video || []).map((p) => {
    const raw = map[String(p.id)] ?? map[p.id];
    if (raw == null) return p;
    const yt = String(raw).trim();
    if (!yt) return p;
    return { ...p, youtubeUrl: yt };
  });
  return { ...workData, video };
}

async function loadYoutubeOverrideMap() {
  try {
    const res = await fetch("/work-youtube-overrides.json", { cache: "no-store" });
    if (!res.ok) return null;
    const map = await res.json();
    return map && typeof map === "object" ? map : null;
  } catch {
    return null;
  }
}

async function withYoutubeOverrides(workData) {
  const map = await loadYoutubeOverrideMap();
  return map ? applyYoutubeOverridesFromMap(workData, map) : workData;
}

export function clearWorkDataCache() {
  apiWorkDataCache = null;
  inFlight = null;
}

/**
 * Loads portfolio JSON from GET /api/public/work (same shape as workData.js).
 * Bundled static data is used only when the API is unreachable; it is not stored
 * in the module cache so a later successful fetch (or tab refocus) can replace it.
 */
export function useWorkData() {
  const sourceRef = useRef(null);
  const [workData, setWorkData] = useState(() => apiWorkDataCache);
  const [loading, setLoading] = useState(() => !apiWorkDataCache);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(() => (apiWorkDataCache ? "cache" : null));

  useEffect(() => {
    let cancelled = false;

    const setSourceTracked = (s) => {
      sourceRef.current = s;
      setSource(s);
    };

    const applyApiCache = () => {
      if (!apiWorkDataCache) return false;
      setWorkData(apiWorkDataCache);
      setLoading(false);
      setSourceTracked("cache");
      return true;
    };

    const load = async () => {
      if (applyApiCache()) return;

      setLoading(true);

      if (shouldSkipApiFetchInThisBuild()) {
        try {
          const merged = await withYoutubeOverrides(staticWorkData);
          if (!cancelled) {
            setWorkData(merged);
            setSourceTracked("static");
            setError(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (!inFlight) {
        inFlight = fetch(apiUrl("/api/public/work"), { cache: "no-store" }).then(
          async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!isValidWorkApiPayload(json)) {
              throw new Error("Invalid work API payload");
            }
            return json;
          }
        );
      }

      try {
        const json = await inFlight;
        if (cancelled) return;
        inFlight = null;
        const merged = await withYoutubeOverrides(json);
        if (cancelled) return;
        apiWorkDataCache = merged;
        setWorkData(merged);
        setSourceTracked("api");
        setError(null);
      } catch (e) {
        inFlight = null;
        if (cancelled) return;
        console.warn("useWorkData: API failed, using static bundle", e);
        const merged = await withYoutubeOverrides(staticWorkData);
        if (!cancelled) {
          setWorkData(merged);
          setSourceTracked("static");
          setError(
            import.meta.env.DEV
              ? "API unavailable — showing bundled workData. Start the API (see /server)."
              : null
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (sourceRef.current !== "static") return;
      void load();
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { workData, loading, error, source };
}
