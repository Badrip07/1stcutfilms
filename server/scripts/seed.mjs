import path from "path";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { fileURLToPath, pathToFileURL } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const workDataUrl = pathToFileURL(
  path.join(__dirname, "..", "..", "src", "Pages", "Work", "workData.js")
).href;

const { workData } = await import(workDataUrl);
const homeContentDefaultsUrl = pathToFileURL(
  path.join(
    __dirname,
    "..",
    "..",
    "src",
    "Pages",
    "Home",
    "homeContentDefaults.js"
  )
).href;
const { homeContentDefaults } = await import(homeContentDefaultsUrl);

const aboutContentDefaultsUrl = pathToFileURL(
  path.join(
    __dirname,
    "..",
    "..",
    "src",
    "Pages",
    "About",
    "aboutContentDefaults.js"
  )
).href;
const { aboutContentDefaults } = await import(aboutContentDefaultsUrl);

const careerContentDefaultsUrl = pathToFileURL(
  path.join(
    __dirname,
    "..",
    "..",
    "src",
    "Pages",
    "Career",
    "careerContentDefaults.js"
  )
).href;
const { careerContentDefaults } = await import(careerContentDefaultsUrl);

const careerPostsDefaultsUrl = pathToFileURL(
  path.join(
    __dirname,
    "..",
    "..",
    "src",
    "Pages",
    "Career",
    "careerPostsDefaults.js"
  )
).href;
const { careerPostsDefaults } = await import(careerPostsDefaultsUrl);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DATABASE || "pritesh_photography",
  waitForConnections: true,
  connectionLimit: 5,
});

const email = process.env.ADMIN_EMAIL || "admin@example.com";
const plain = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const hash = await bcrypt.hash(plain, 10);

await pool.query("DELETE FROM work_posts");
await pool.query("DELETE FROM career_posts");
await pool.query("DELETE FROM page_sections");
await pool.query("DELETE FROM admin_users");

await pool.query(
  "INSERT INTO admin_users (email, password_hash) VALUES (?, ?)",
  [email.toLowerCase(), hash]
);

const categories = [
  ["video", workData.video || []],
  ["photography", workData.photography || []],
  ["3d", workData["3d"] || []],
  ["ai", workData.ai || []],
];

for (const [category, items] of categories) {
  let sort = 0;
  for (const item of items) {
    const { id, ...rest } = item;
    await pool.query(
      `INSERT INTO work_posts (category, legacy_numeric_id, sort_order, payload)
       VALUES (?, ?, ?, ?)`,
      [category, id, sort, JSON.stringify(rest)]
    );
    sort += 1;
  }
}

await pool.query(
  `INSERT INTO page_sections (page_slug, section_key, payload) VALUES (?, ?, ?)`,
  [
    "home",
    "home_content",
    JSON.stringify(homeContentDefaults),
  ]
);

await pool.query(
  `INSERT INTO page_sections (page_slug, section_key, payload) VALUES (?, ?, ?)`,
  [
    "about",
    "about_content",
    JSON.stringify(aboutContentDefaults),
  ]
);

await pool.query(
  `INSERT INTO page_sections (page_slug, section_key, payload) VALUES (?, ?, ?)`,
  [
    "career",
    "career_page",
    JSON.stringify(careerContentDefaults),
  ]
);

for (const row of careerPostsDefaults) {
  await pool.query(
    `INSERT INTO career_posts (legacy_numeric_id, sort_order, payload) VALUES (?, ?, ?)`,
    [row.legacy_numeric_id, row.sort_order, JSON.stringify(row.payload)]
  );
}

await pool.end();
console.log(`Seeded admin user: ${email}`);
console.log("Seeded work_posts from src/Pages/Work/workData.js");
console.log("Seeded career_posts and career page section");
console.log("Default password from ADMIN_PASSWORD in .env (see .env.example)");
