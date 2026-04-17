import { useEffect, useState } from "react";
import { apiUrl } from "../lib/apiBase.js";
import { careerPostsDefaults } from "../Pages/Career/careerPostsDefaults.js";

function defaultsToPublicShape() {
  return careerPostsDefaults.map((row) => ({
    id: row.legacy_numeric_id,
    sort_order: row.sort_order,
    ...row.payload,
  }));
}

let cachedList = null;
let listInFlight = null;

/**
 * Career job cards for /career — same shape as GET /api/public/career-posts.
 */
export function useCareerPosts() {
  const [posts, setPosts] = useState(cachedList || defaultsToPublicShape());
  const [loading, setLoading] = useState(!cachedList);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(cachedList ? "cache" : null);

  useEffect(() => {
    if (cachedList) {
      setPosts(cachedList);
      setLoading(false);
      setSource("cache");
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!listInFlight) {
        listInFlight = fetch(apiUrl("/api/public/career-posts")).then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });
      }
      try {
        const json = await listInFlight;
        if (cancelled) return;
        cachedList = Array.isArray(json) ? json : [];
        listInFlight = null;
        setPosts(cachedList);
        setSource("api");
        setError(null);
      } catch (e) {
        listInFlight = null;
        if (cancelled) return;
        const fallback = defaultsToPublicShape();
        cachedList = fallback;
        setPosts(fallback);
        setSource("static");
        setError(
          import.meta.env.DEV
            ? "Career API unavailable — bundled defaults. Start the API and run seed."
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

  return { posts, loading, error, source };
}

const singleCache = new Map();
const singleInFlight = new Map();

/**
 * Single job for /career/:id — merges API response with optional static fallback for that id.
 */
export function useCareerPost(legacyId) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = Number.parseInt(legacyId, 10);
    if (Number.isNaN(id)) {
      setPost(null);
      setLoading(false);
      setError("Invalid id");
      return;
    }

    if (singleCache.has(id)) {
      setPost(singleCache.get(id));
      setLoading(false);
      setError(null);
      return;
    }

    setPost(null);
    setLoading(true);
    setError(null);

    let cancelled = false;

    const fallbackForId = () => {
      const row = careerPostsDefaults.find((r) => r.legacy_numeric_id === id);
      if (!row) return null;
      return { id, sort_order: row.sort_order, ...row.payload };
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      const key = id;
      try {
        if (!singleInFlight.has(key)) {
          singleInFlight.set(
            key,
            fetch(apiUrl(`/api/public/career-posts/${id}`)).then(async (res) => {
              if (res.status === 404) return null;
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
          );
        }
        let data = await singleInFlight.get(key);
        singleInFlight.delete(key);
        if (cancelled) return;
        if (!data) {
          data = fallbackForId();
          if (!data) {
            setPost(null);
            setError("not_found");
            return;
          }
        }
        singleCache.set(id, data);
        setPost(data);
      } catch (e) {
        singleInFlight.delete(key);
        if (cancelled) return;
        const fb = fallbackForId();
        if (fb) {
          singleCache.set(id, fb);
          setPost(fb);
          setError(null);
        } else {
          setPost(null);
          setError(e.message || "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [legacyId]);

  return { post, loading, error };
}
