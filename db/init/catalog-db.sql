CREATE TABLE IF NOT EXISTS categories (
  id   BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
  id          BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  nama        TEXT NOT NULL UNIQUE,
  harga_idr   INTEGER NOT NULL CHECK (harga_idr > 0),
  stok        INTEGER NOT NULL CHECK (stok >= 0),
  deskripsi   TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);

-- Kategori
INSERT INTO categories (nama) VALUES
  ('skincare'), ('snack'), ('fashion'), ('koleksi'),
  ('elektronik'), ('kosmetik'), ('sepatu'), ('perawatan kulit'), ('jam tangan')
ON CONFLICT DO NOTHING;

-- Seed produk
INSERT INTO items (category_id, nama, harga_idr, stok, deskripsi)
SELECT c.id, seed.nama, seed.harga_idr, seed.stok, seed.deskripsi
FROM (VALUES
  ('Skincare',       'Hada Labo Gokujyun Lotion',      135000, 50, 'Lotion hyaluronic acid varian original, 170ml'),
  ('Skincare',       'Rohto Hadalabo Gokujun Premium',  225000, 30, 'Serum premium dengan 5 jenis hyaluronic acid, 30ml'),
  ('Perawatan Kulit','Biore UV Aqua Rich',              120000, 60, 'Sunscreen SPF50+ PA++++, tekstur watery ringan, 70ml'),
  ('Snack',          'Tokyo Banana Box',                255000, 40, 'Oleh-oleh khas Tokyo Station, isi 8 pcs per kotak'),
  ('Snack',          'Kit Kat Matcha Uji',              120000, 60, 'Kit Kat matcha premium edisi Kyoto, 12 batang'),
  ('Snack',          'Pocky Choco Almond',               90000, 80, 'Pocky edisi coklat almond premium, 2 box'),
  ('Snack',          'Calbee Jagariko Salad',            53000,100, 'Snack kentang renyah varian salad, edisi Japan only'),
  ('Fashion',        'Uniqlo Japan Exclusive UT',       449000, 20, 'Koleksi UT / kolaborasi hanya rilis di toko Jepang'),
  ('Fashion',        'Uniqlo Heattech Extra Warm',      299000, 35, 'Kaos dalam Heattech extra warm untuk musim dingin'),
  ('Fashion',        'GU Wide Denim Pants',             599000, 15, 'Celana jeans wide leg edisi Japan, berbagai warna'),
  ('Koleksi',        'Nendoroid Series',                825000, 15, 'Action figure resmi Good Smile Company, edisi Jepang'),
  ('Koleksi',        'One Piece Card Game Box',         495000, 25, 'Booster pack kartu One Piece edisi terbaru'),
  ('Koleksi',        'Pokemon Card Booster Pack',       120000, 40, 'Booster pack kartu Pokemon edisi terbaru Jepang'),
  ('Jam Tangan',     'Casio G-Shock DW-5600',          1800000, 10, 'G-Shock classic square edisi Japan domestic'),
  ('Jam Tangan',     'Casio A168WA',                    525000, 20, 'Casio retro digital stainless edisi original Japan')
) AS seed(kategori, nama, harga_idr, stok, deskripsi)
JOIN categories c ON c.nama = seed.kategori
ON CONFLICT (nama) DO NOTHING;
