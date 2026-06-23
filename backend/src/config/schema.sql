-- ============================================================
-- LibraryOS Database Schema
-- Run this file once to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS libraryos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE libraryos;

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('admin','student') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ── BOOKS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id               INT           NOT NULL AUTO_INCREMENT,
  book_id          VARCHAR(50)   NOT NULL,
  title            VARCHAR(200)  NOT NULL,
  author           VARCHAR(150)  NOT NULL DEFAULT 'Unknown',
  genre            ENUM('Fiction','Science','History','Tech','Other') NOT NULL DEFAULT 'Other',
  total_copies     INT           NOT NULL DEFAULT 1,
  available_copies INT           NOT NULL DEFAULT 1,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_books_book_id (book_id)
) ENGINE=InnoDB;

-- ── BORROWS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS borrows (
  id          INT            NOT NULL AUTO_INCREMENT,
  user_id     INT            NOT NULL,
  book_id     INT            NOT NULL,
  borrowed_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date    DATE           NOT NULL,
  returned_at TIMESTAMP      NULL DEFAULT NULL,
  fine_amount DECIMAL(8,2)   NOT NULL DEFAULT 0.00,
  status      ENUM('active','returned','overdue') NOT NULL DEFAULT 'active',
  PRIMARY KEY (id),
  KEY idx_borrows_user_id (user_id),
  KEY idx_borrows_book_id (book_id),
  CONSTRAINT fk_borrows_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_borrows_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── SEED: Default Admin User ────────────────────────────────
-- Password: Admin@123
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES (
  'Siddanth',
  'siddanthsajwan45@gmail.com',
  '$2a$10$iCvssj0eDd84bf3TG4t83.4wFFsuN/nJO7fvlzXq1RnLhzpFwEFgK',
  'admin'
);

-- ── SEED: Sample Books ──────────────────────────────────────
INSERT IGNORE INTO books (book_id, title, author, genre, total_copies, available_copies) VALUES
('BK-001', 'Dune',                    'Frank Herbert',    'Fiction', 3, 3),
('BK-002', 'A Brief History of Time', 'Stephen Hawking',  'Science', 2, 2),
('BK-003', 'Sapiens',                 'Yuval Noah Harari','History', 4, 4),
('BK-004', 'Clean Code',              'Robert C. Martin', 'Tech',    2, 2),
('BK-005', 'The Great Gatsby',        'F. Scott Fitzgerald','Fiction',3, 3);
