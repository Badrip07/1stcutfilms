import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const sqlPath = path.join(__dirname, "..", "db", "schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  multipleStatements: true,
});

await conn.query(sql);
await conn.end();
console.log("Database schema applied.");
