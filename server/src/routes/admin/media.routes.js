import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { pool } from "../../db/pool.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Keep uploads in server/uploads (same folder served by Express static middleware).
const uploadRoot = path.join(__dirname, "..", "..", "..", "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
});

export const adminMediaRouter = Router();
adminMediaRouter.use(requireAuth);

adminMediaRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file required" });
    const publicPath = `/uploads/${req.file.filename}`;
    await pool.query(
      `INSERT INTO media_assets (original_name, stored_path, mime) VALUES (?, ?, ?)`,
      [req.file.originalname, publicPath, req.file.mimetype]
    );
    res.status(201).json({
      url: publicPath,
      originalName: req.file.originalname,
      mime: req.file.mimetype,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Upload failed" });
  }
});

adminMediaRouter.get("/list", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, original_name, stored_path, mime, created_at FROM media_assets ORDER BY id DESC LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "List failed" });
  }
});
