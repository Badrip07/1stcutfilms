const TOKEN_KEY = "fb_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const SESSION_ENDED_MESSAGES = new Set([
  "Invalid token",
  "Unauthorized",
  "Session expired",
]);

export async function api(path, options = {}) {
  const headers = { ...options.headers };
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }
  const method = String(options.method || "GET").toUpperCase();
  const skipAuth =
    path === "/auth/login" && method === "POST";
  const t = getToken();
  let sentAuth = false;
  if (t && !skipAuth) {
    headers.Authorization = `Bearer ${t}`;
    sentAuth = true;
  }
  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const fromJson =
      data && typeof data === "object" && (data.error || data.message);
    const fromText =
      typeof data === "string" && data.length < 400 ? data.trim() : "";
    const msg =
      fromJson ||
      fromText ||
      res.statusText ||
      `Request failed (${res.status})`;
    if (
      res.status === 401 &&
      sentAuth &&
      SESSION_ENDED_MESSAGES.has(String(msg).trim())
    ) {
      setToken(null);
      window.dispatchEvent(new Event("fb-auth-lost"));
    }
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}
