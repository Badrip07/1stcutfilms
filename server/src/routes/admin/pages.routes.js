import { Router } from "express";
import { pool } from "../../db/pool.js";
import { requireAuth } from "../../middleware/requireAuth.js";

export const adminPagesRouter = Router();
adminPagesRouter.use(requireAuth);

adminPagesRouter.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const [rows] = await pool.query(
      `SELECT id, page_slug, section_key, payload, updated_at
       FROM page_sections WHERE page_slug = ? ORDER BY section_key`,
      [slug]
    );
    const parsed = rows.map((r) => ({
      ...r,
      payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
    }));
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Load failed" });
  }
});

adminPagesRouter.put("/:slug/:sectionKey", async (req, res) => {
  try {
    const page_slug = String(req.params.slug);
    const section_key = String(req.params.sectionKey);
    let payload = req.body?.payload ?? req.body;
    if (payload == null) {
      return res.status(400).json({ error: "payload required" });
    }
    if (typeof payload === "string") payload = JSON.parse(payload);
    const json = JSON.stringify(payload);
    await pool.query(
      `INSERT INTO page_sections (page_slug, section_key, payload)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`,
      [page_slug, section_key, json]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Save failed" });
  }
});

adminPagesRouter.delete("/:slug/:sectionKey", async (req, res) => {
  try {
    const [r] = await pool.query(
      "DELETE FROM page_sections WHERE page_slug = ? AND section_key = ?",
      [req.params.slug, req.params.sectionKey]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
       console.error(e);
       res.status(500).json({ error: "Delete failed" });
  }
});
