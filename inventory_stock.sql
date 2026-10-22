-- ==============================================================
-- Database SQL Export for phpMyAdmin / MySQL
-- Proyek : Inventory Stock Management System
-- Waktu Ekspor : 2026-10-22
-- Kompatibilitas : MySQL 5.7+, MySQL 8.0+, MariaDB 10+
-- ==============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- --------------------------------------------------------
-- 1. Buat Database (Jika belum ada)
-- --------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `inventory_stock` 
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `inventory_stock`;

-- --------------------------------------------------------
-- 2. Struktur Tabel: `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Data Awal: `users`
-- Default: username = admin, password = admin123
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `created_at`) VALUES
(1, 'admin', '$2b$10$rNDewvDsF9uybvw1V9jx5.L38.xM1UzNs3vhbl7vFVo4J9vA00rRK', 'Administrator', 'admin', NOW());

-- --------------------------------------------------------
-- 3. Struktur Tabel: `items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `items`;
CREATE TABLE `items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 0,
  `price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Data Awal: `items`
-- --------------------------------------------------------
INSERT INTO `items` (`id`, `name`, `quantity`, `price`, `currency`, `created_at`) VALUES
(1, 'Laptop Asus Zenbook', 9, 1250.00, 'IDR', NOW()),
(2, 'Oli', 8, 10000.00, 'IDR', NOW()),
(3, 'Monitor Dell 27 Inch', 15, 299.99, 'USD', NOW()),
(4, 'Kopi Kapal Api 1kg', 20, 50000.00, 'IDR', NOW()),
(5, 'Mechanical Keyboard RGB', 5, 85.50, 'USD', NOW());

-- --------------------------------------------------------
-- 4. Struktur Tabel: `stock_logs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_logs`;
CREATE TABLE `stock_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `item_id` INT(11) NOT NULL,
  `type` ENUM('IN', 'OUT') NOT NULL,
  `quantity` INT(11) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `item_id_index` (`item_id`),
  CONSTRAINT `fk_stock_logs_items` 
    FOREIGN KEY (`item_id`) 
    REFERENCES `items` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Data Awal: `stock_logs`
-- --------------------------------------------------------
INSERT INTO `stock_logs` (`id`, `item_id`, `type`, `quantity`, `notes`, `created_at`) VALUES
(1, 2, 'IN', 6, 'Stok Awal (Penambahan Produk Baru)', NOW()),
(2, 3, 'IN', 15, 'Stok Awal (Penambahan Produk Baru)', NOW()),
(3, 2, 'IN', 5, 'Restock distributor', NOW()),
(4, 2, 'OUT', 3, 'Penjualan invoice 001', NOW()),
(5, 1, 'OUT', 1, 'PENJUALAN', NOW()),
(6, 4, 'IN', 20, 'Stok Awal (Penambahan Produk Baru)', NOW()),
(7, 5, 'IN', 5, 'Stok Awal (Penambahan Produk Baru)', NOW());

SET FOREIGN_KEY_CHECKS = 1;
