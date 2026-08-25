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
  ('Skincare'), ('Snack'), ('Fashion'), ('Koleksi'),
  ('Elektronik'), ('Kosmetik'), ('Sepatu'), ('Perawatan Kulit'), ('Jam Tangan')
ON CONFLICT DO NOTHING;

-- Seed produk
INSERT INTO items (nama, deskripsi, harga_jpy, stok, berat_kg, kategori_id) VALUES
  ('Hada Labo Gokujyun Lotion',       'Lotion hyaluronic acid varian original, 170ml',           900,  50, 0.30, (SELECT id FROM categories WHERE nama = 'Skincare')),
  ('Rohto Hadalabo Gokujun Premium',  'Serum premium dengan 5 jenis hyaluronic acid, 30ml',      1500, 30, 0.20, (SELECT id FROM categories WHERE nama = 'Skincare')),
  ('Biore UV Aqua Rich',              'Sunscreen SPF50+ PA++++, teksur watery ringan, 70ml',     800,  60, 0.15, (SELECT id FROM categories WHERE nama = 'Perawatan Kulit')),
  ('Tokyo Banana Box',                'Oleh-oleh khas Tokyo Station, isi 8 pcs per kotak',       1700, 40, 0.50, (SELECT id FROM categories WHERE nama = 'Snack')),
  ('Kit Kat Matcha Uji',              'Kit Kat matcha premium edisi Kyoto, 12 batang',           800,  60, 0.20, (SELECT id FROM categories WHERE nama = 'Snack')),
  ('Pocky Choco Almond',              'Pocky edisi coklat almond premium, 2 box',                600,  80, 0.30, (SELECT id FROM categories WHERE nama = 'Snack')),
  ('Calbee Jagariko Salad',           'Snack kentang renyah varian salad, edisi Japan only',     350, 100, 0.15, (SELECT id FROM categories WHERE nama = 'Snack')),
  ('Uniqlo Japan Exclusive UT',       'Koleksi UT / kolaborasi hanya rilis di toko Jepang',      2990, 20, 0.40, (SELECT id FROM categories WHERE nama = 'Fashion')),
  ('Uniqlo Heattech Extra Warm',      'Kaos dalam Heattech extra warm untuk musim dingin',       1990, 35, 0.30, (SELECT id FROM categories WHERE nama = 'Fashion')),
  ('GU Wide Denim Pants',             'Celana jeans wide leg edisi Japan, tersedia berbagai warna', 3990, 15, 0.60, (SELECT id FROM categories WHERE nama = 'Fashion')),
  ('Nendoroid Series',                'Action figure resmi Good Smile Company, edisi rilis Jepang', 5500, 15, 0.40, (SELECT id FROM categories WHERE nama = 'Koleksi')),
  ('One Piece Card Game Box',         'Booster pack kartu One Piece edisi terbaru',              3300, 25, 0.50, (SELECT id FROM categories WHERE nama = 'Koleksi')),
  ('Pokémon Card Booster Pack',       'Booster pack kartu Pokémon edisi terbaru Jepang',        800,  40, 0.10, (SELECT id FROM categories WHERE nama = 'Koleksi')),
  ('Casio G-Shock DW-5600',          'G-Shock classic square edisi Japan domestic',             12000, 10, 0.20, (SELECT id FROM categories WHERE nama = 'Jam Tangan')),
  ('Casio A168WA',                    'Casio retro digital stainless edisi original Japan',      3500, 20, 0.15, (SELECT id FROM categories WHERE nama = 'Jam Tangan'))
ON CONFLICT DO NOTHING;
