import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { adminWorkRouter } from "./routes/admin/work.routes.js";
import { adminPagesRouter } from "./routes/admin/pages.routes.js";
import { adminMediaRouter } from "./routes/admin/media.routes.js";
import { adminCareerRouter } from "./routes/admin/career.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "uploads");
const legacyUploadRoot = path.join(__dirname, "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(legacyUploadRoot, { recursive: true });

const app = express();
app.use(express.json({ limit: "25mb" }));

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        config.corsOrigins.length === 0 ||
        config.corsOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use("/uploads", express.static(uploadRoot));
// Backward compatibility: previously files were stored in server/src/uploads.
app.use("/uploads", express.static(legacyUploadRoot));

const apiRootPayload = {
  service: "Prites Photography API",
  ok: true,
  health: "/api/health",
  healthDb: "/api/health/db",
  prefixes: {
    public: "/api/public",
    auth: "/api/auth",
    adminWork: "/api/admin/work-posts",
    adminPages: "/api/admin/page-sections",
    adminMedia: "/api/admin/media",
    adminCareer: "/api/admin/career-posts",
  },
};

function apiRootHtml() {
  const p = apiRootPayload.prefixes;
  const links = [
    ["Health", apiRootPayload.health],
    ["Database health", apiRootPayload.healthDb],
    ["Public API", p.public],
    ["Auth", p.auth],
    ["Admin: work posts", p.adminWork],
    ["Admin: page sections", p.adminPages],
    ["Admin: media", p.adminMedia],
  ];
  const lis = links
    .map(
      ([label, href]) =>
        `<li><a href="${href}">${label}</a> <code>${href}</code></li>`
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Prites Photography API</title>
  <style>
    :root { color-scheme: light dark; --fg: #e8e6e3; --bg: #121418; --muted: #8b8680; --accent: #c4a574; --card: #1a1d24; }
    @media (prefers-color-scheme: light) {
      :root { --fg: #1a1a1a; --bg: #f4f2ef; --muted: #5c5855; --accent: #8b6914; --card: #fff; }
    }
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; min-height: 100vh;
      background: var(--bg); color: var(--fg); line-height: 1.5; padding: clamp(1.5rem, 4vw, 2.5rem); }
    main { max-width: 36rem; margin: 0 auto; }
    h1 { font-size: 1.35rem; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 0.25rem; }
    .status { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; color: var(--muted); margin-bottom: 1.5rem; }
    .dot { width: 0.45rem; height: 0.45rem; border-radius: 50%; background: #3d9a62; }
    .card { background: var(--card); border-radius: 12px; padding: 1.25rem 1.35rem; box-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 8px 32px rgba(0,0,0,.12); }
    ul { list-style: none; margin: 0; padding: 0; }
    li { padding: 0.55rem 0; border-bottom: 1px solid rgba(127,127,127,.15); display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 1rem; }
    li:last-child { border-bottom: 0; padding-bottom: 0; }
    a { color: var(--accent); text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    code { font-size: 0.8rem; color: var(--muted); }
    .note { margin-top: 1.25rem; font-size: 0.85rem; color: var(--muted); }
    .note a { font-weight: 400; }
  </style>
</head>
<body>
  <main>
    <h1>${apiRootPayload.service}</h1>
    <p class="status"><span class="dot" aria-hidden="true"></span> Running on this host</p>
    <div class="card">
      <ul>${lis}</ul>
    </div>
    <p class="note">The public site and admin UI call these routes through the Vite dev proxy (same-origin <code>/api</code>). JSON for this page: <a href="/?format=json">?format=json</a></p>
  </main>
</body>
</html>`;
}

app.get("/", (req, res) => {
  const accept = req.get("Accept") || "";
  const asJson =
    req.query.format === "json" ||
    !accept.includes("text/html");
  if (asJson) {
    return res.json(apiRootPayload);
  }
  res.type("html").send(apiRootHtml());
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/health/db", async (_req, res) => {
  try {
    const { pool } = await import("./db/pool.js");
    await pool.query("SELECT 1 AS ok");
    return res.json({ ok: true, database: "connected" });
  } catch (e) {
    return res.status(503).json({
      ok: false,
      error: e.message,
      code: e.code,
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/admin/work-posts", adminWorkRouter);
app.use("/api/admin/page-sections", adminPagesRouter);
app.use("/api/admin/media", adminMediaRouter);
app.use("/api/admin/career-posts", adminCareerRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
