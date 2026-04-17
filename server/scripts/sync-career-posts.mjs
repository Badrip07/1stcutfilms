import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath, pathToFileURL } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const defaultsUrl = pathToFileURL(
  path.join(__dirname, "..", "..", "src", "Pages", "Career", "careerPostsDefaults.js")
).href;
const { careerPostsDefaults } = await import(defaultsUrl);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE || "pritesh_photography",
  waitForConnections: true,
  connectionLimit: 5,
});

let upserted = 0;
for (const row of careerPostsDefaults) {
  await pool.query(
    `INSERT INTO career_posts (legacy_numeric_id, sort_order, payload)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       sort_order = VALUES(sort_order),
       payload = VALUES(payload),
       updated_at = CURRENT_TIMESTAMP`,
    [row.legacy_numeric_id, row.sort_order, JSON.stringify(row.payload)]
  );
  upserted += 1;
}

await pool.end();
console.log(`Career posts synced: ${upserted}`);
