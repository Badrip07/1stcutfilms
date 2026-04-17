-- Prites Photography CMS — run once (see server/scripts/init-db.mjs)

CREATE DATABASE IF NOT EXISTS pritesh_photography CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pritesh_photography;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS work_posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(32) NOT NULL COMMENT 'video|photography|3d|ai',
  legacy_numeric_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_category_legacy (category, legacy_numeric_id),
  KEY idx_category_sort (category, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS page_sections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_slug VARCHAR(64) NOT NULL,
  section_key VARCHAR(128) NOT NULL,
  payload JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_page_section (page_slug, section_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS career_posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  legacy_numeric_id INT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_career_legacy (legacy_numeric_id),
  KEY idx_career_sort (sort_order, legacy_numeric_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(512) NOT NULL,
  stored_path VARCHAR(1024) NOT NULL,
  mime VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
