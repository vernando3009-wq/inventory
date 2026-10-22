# Inventory Management System

Sistem manajemen inventaris berbasis web sederhana, cepat, dan profesional menggunakan Node.js, Express, EJS, dan SQLite/MySQL.

## Fitur Utama

- **Autentikasi & Login:** Pengamanan sistem dengan autentikasi berbasis sesi (`express-session`) dan password terenkripsi (`bcryptjs`).
- **Kelola Produk (CRUD):** Tambah, ubah, cari, dan hapus barang inventaris.
- **Dukungan Multi-Mata Uang:** Pilihan mata uang Rupiah (`IDR - Rp`) dan US Dollar (`USD - $`) dengan format standar.
- **Transaksi Stok (In / Out):** Catat stok masuk dan keluar dengan validasi proteksi stok minus.
- **Riwayat Transaksi:** Riwayat lengkap perubahan stok dengan filter status masuk/keluar.
- **Statistik Inventaris:** Ringkasan total produk, total unit stok, dan total nilai inventaris per mata uang.
- **Database MySQL / phpMyAdmin:** Tersedia file `inventory_stock.sql` yang siap diimport langsung ke phpMyAdmin / MySQL.

## Akun Default Login

- **Username:** `admin`
- **Password:** `admin123`

## Cara Menjalankan

1. Clone repositori ini:
   ```bash
   git clone https://github.com/vernando3009-wq/inventory.git
   cd inventory
   ```

2. Install dependensi:
   ```bash
   npm install
   ```

3. Jalankan aplikasi:
   ```bash
   npm start
   ```

4. Buka di browser:
   ```
   http://localhost:3000
   ```

## Import Database ke MySQL / phpMyAdmin

1. Buka phpMyAdmin di browser Anda.
2. Pilih tab **Import**.
3. Pilih file `inventory_stock.sql` yang berada di root folder proyek.
4. Klik **Import / Kirim**. Database `inventory_stock` beserta seluruh tabel dan data awal akan otomatis terbuat.
