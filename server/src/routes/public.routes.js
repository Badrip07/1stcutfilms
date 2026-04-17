import { Router } from "express";
import { pool } from "../db/pool.js";

export const publicRouter = Router();

const CATEGORIES = ["video", "photography", "3d", "ai"];

function buildWorkData(rows) {
  const out = {
    video: [],
    photography: [],
    "3d": [],
    ai: [],
  };
  for (const row of rows) {
    const cat = row.category;
    if (!out[cat]) continue;
    const payload =
      typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    out[cat].push({
      id: Number(row.legacy_numeric_id),
      ...payload,
    });
  }
  return out;
}

publicRouter.get("/work", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT category, legacy_numeric_id, sort_order, payload
       FROM work_posts
       ORDER BY category, sort_order, legacy_numeric_id`
    );
    return res.json(buildWorkData(rows));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load work data" });
  }
});

publicRouter.get("/work-post/:category/:legacyId", async (req, res) => {
  try {
    const category = String(req.params.category);
    const legacyId = Number.parseInt(req.params.legacyId, 10);
    if (!CATEGORIES.includes(category) || Number.isNaN(legacyId)) {
      return res.status(404).json({ error: "Not found" });
    }
    const [rows] = await pool.query(
      `SELECT category, legacy_numeric_id, payload FROM work_posts
       WHERE category = ? AND legacy_numeric_id = ? LIMIT 1`,
      [category, legacyId]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const row = rows[0];
    const payload =
      typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    return res.json({ id: legacyId, category, ...payload });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load post" });
  }
});

function buildCareerPost(row) {
  const payload =
    typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  return {
    id: Number(row.legacy_numeric_id),
    sort_order: Number(row.sort_order),
    ...payload,
  };
}

publicRouter.get("/career-posts", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT legacy_numeric_id, sort_order, payload
       FROM career_posts
       ORDER BY sort_order, legacy_numeric_id`
    );
    return res.json(rows.map(buildCareerPost));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load career posts" });
  }
});

publicRouter.get("/career-posts/:legacyId", async (req, res) => {
  try {
    const legacyId = Number.parseInt(req.params.legacyId, 10);
    if (Number.isNaN(legacyId)) {
      return res.status(404).json({ error: "Not found" });
    }
    const [rows] = await pool.query(
      `SELECT legacy_numeric_id, sort_order, payload FROM career_posts
       WHERE legacy_numeric_id = ? LIMIT 1`,
      [legacyId]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    return res.json(buildCareerPost(rows[0]));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load career post" });
  }
});

publicRouter.get("/pages/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const [rows] = await pool.query(
      `SELECT section_key, payload FROM page_sections WHERE page_slug = ?`,
      [slug]
    );
    const sections = {};
    for (const row of rows) {
      sections[row.section_key] =
        typeof row.payload === "string"
          ? JSON.parse(row.payload)
          : row.payload;
    }
    return res.json({ pageSlug: slug, sections });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load page content" });
  }
});
