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
        if (!cancelled) {
          setWorkData(staticWorkData);
          setSourceTracked("static");
          setError(null);
        }
        setLoading(false);
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
        apiWorkDataCache = json;
        inFlight = null;
        setWorkData(json);
        setSourceTracked("api");
        setError(null);
      } catch (e) {
        inFlight = null;
        if (cancelled) return;
        console.warn("useWorkData: API failed, using static bundle", e);
        setWorkData(staticWorkData);
        setSourceTracked("static");
        setError(
          import.meta.env.DEV
            ? "API unavailable — showing bundled workData. Start the API (see /server)."
            : null
        );
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
