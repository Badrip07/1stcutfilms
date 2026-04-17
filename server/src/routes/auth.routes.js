import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const [rows] = await pool.query(
      "SELECT id, email, password_hash FROM admin_users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { sub: String(user.id), email: user.email },
      config.jwtSecret,
      { expiresIn: "7d" }
    );
    return res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (e) {
    console.error(e);
    const isDev = config.nodeEnv !== "production";
    const code = e.code || "";
    let hint = "";
    if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
      hint =
        " Cannot reach MySQL. Start MySQL and check MYSQL_HOST / MYSQL_PORT in server/.env.";
    } else if (code === "ER_ACCESS_DENIED_ERROR") {
      hint =
        " MySQL rejected the user/password. Fix MYSQL_USER and MYSQL_PASSWORD in server/.env.";
    } else if (code === "ER_BAD_DB_ERROR") {
      hint =
        ' Database missing. From the server folder run: node scripts/init-db.mjs && node scripts/seed.mjs';
    } else if (e.message?.includes("doesn't exist") || code === "ER_NO_SUCH_TABLE") {
      hint =
        " Tables missing. Run: node scripts/init-db.mjs && node scripts/seed.mjs";
    }
    return res.status(500).json({
      error: isDev ? `${e.message || "Login failed"}${hint}` : "Login failed",
      code: isDev ? code : undefined,
    });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.admin });
});
