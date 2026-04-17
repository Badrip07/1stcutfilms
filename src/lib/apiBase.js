/** Empty string = same origin (use Vite proxy in dev: /api → API server). */
export function getApiBase() {
  return (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
}

export function apiUrl(path) {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
