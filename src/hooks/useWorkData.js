import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../lib/apiBase.js";
import { workData as staticWorkData } from "../Pages/Work/workData.js";

/** Successful GET /api/public/work only — never the bundled fallback. */
let apiWorkDataCache = null;
let inFlight = null;

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

      if (!inFlight) {
        inFlight = fetch(apiUrl("/api/public/work"), { cache: "no-store" }).then(
          async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
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
