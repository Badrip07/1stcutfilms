import { useEffect, useState } from "react";
import { apiUrl } from "../lib/apiBase.js";

const cache = new Map();

export function usePageSections(pageSlug) {
  const [sections, setSections] = useState(() => cache.get(pageSlug) || {});
  const [loading, setLoading] = useState(!cache.has(pageSlug));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(apiUrl(`/api/public/pages/${pageSlug}`));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const nextSections = json?.sections || {};
        cache.set(pageSlug, nextSections);
        if (!cancelled) {
          setSections(nextSections);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load page sections");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [pageSlug]);

  return { sections, loading, error };
}

