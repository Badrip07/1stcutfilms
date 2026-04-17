import { Router } from "express";
import { pool } from "../../db/pool.js";
import { requireAuth } from "../../middleware/requireAuth.js";

export const adminWorkRouter = Router();
adminWorkRouter.use(requireAuth);

adminWorkRouter.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, category, legacy_numeric_id, sort_order, payload, updated_at
       FROM work_posts
       ORDER BY category, sort_order, legacy_numeric_id`
    );
    const parsed = rows.map((r) => ({
      ...r,
      payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
    }));
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "List failed" });
  }
});

adminWorkRouter.get("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      "SELECT id, category, legacy_numeric_id, sort_order, payload, updated_at FROM work_posts WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const row = rows[0];
    row.payload =
      typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Load failed" });
  }
});

adminWorkRouter.post("/", async (req, res) => {
  try {
    const category = String(req.body?.category || "");
    const legacy_numeric_id = Number.parseInt(req.body?.legacy_numeric_id, 10);
    const sort_order = Number.parseInt(req.body?.sort_order ?? 0, 10);
    const payload = req.body?.payload;
    if (!["video", "photography", "3d", "ai"].includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (Number.isNaN(legacy_numeric_id) || payload == null) {
      return res.status(400).json({ error: "legacy_numeric_id and payload required" });
    }
    const body = typeof payload === "string" ? JSON.parse(payload) : payload;
    const [r] = await pool.query(
      `INSERT INTO work_posts (category, legacy_numeric_id, sort_order, payload)
       VALUES (?, ?, ?, ?)`,
      [category, legacy_numeric_id, sort_order, JSON.stringify(body)]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Duplicate category + legacy id" });
    }
    console.error(e);
    res.status(500).json({ error: "Create failed" });
  }
});

adminWorkRouter.put("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const category = req.body?.category;
    const legacy_numeric_id = req.body?.legacy_numeric_id;
    const sort_order = req.body?.sort_order;
    const payload = req.body?.payload;

    const fields = [];
    const values = [];
    if (category !== undefined) {
      fields.push("category = ?");
      values.push(String(category));
    }
    if (legacy_numeric_id !== undefined) {
      fields.push("legacy_numeric_id = ?");
      values.push(Number.parseInt(legacy_numeric_id, 10));
    }
    if (sort_order !== undefined) {
      fields.push("sort_order = ?");
      values.push(Number.parseInt(sort_order, 10));
    }
    if (payload !== undefined) {
      fields.push("payload = ?");
      values.push(
        JSON.stringify(typeof payload === "string" ? JSON.parse(payload) : payload)
      );
    }
    if (!fields.length) {
      return res.status(400).json({ error: "No fields to update" });
    }
    values.push(id);
    const [r] = await pool.query(
      `UPDATE work_posts SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Update failed" });
  }
});

adminWorkRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const [r] = await pool.query("DELETE FROM work_posts WHERE id = ?", [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Delete failed" });
  }
});
