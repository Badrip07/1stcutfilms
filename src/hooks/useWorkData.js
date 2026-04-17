import { useEffect, useState } from "react";
import { apiUrl } from "../lib/apiBase.js";
import { workData as staticWorkData } from "../Pages/Work/workData.js";

let cached = null;
let inFlight = null;

/**
 * Loads portfolio JSON from GET /api/public/work (same shape as workData.js).
 * Falls back to bundled static data if the API is unreachable.
 */
export function useWorkData() {
  const [workData, setWorkData] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(cached ? "cache" : null);

  useEffect(() => {
    if (cached) {
      setWorkData(cached);
      setLoading(false);
      setSource("cache");
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!inFlight) {
        inFlight = fetch(apiUrl("/api/public/work")).then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });
      }
      try {
        const json = await inFlight;
        if (cancelled) return;
        cached = json;
        inFlight = null;
        setWorkData(json);
        setSource("api");
        setError(null);
      } catch (e) {
        inFlight = null;
        if (cancelled) return;
        console.warn("useWorkData: API failed, using static bundle", e);
        cached = staticWorkData;
        setWorkData(staticWorkData);
        setSource("static");
        setError(
          import.meta.env.DEV
            ? "API unavailable — showing bundled workData. Start the API (see /server)."
            : null
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { workData, loading, error, source };
}
