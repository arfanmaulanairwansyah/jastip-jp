const XLSX = require("xlsx");

function normalizeCategoryName(value) {
  if (typeof value !== "string") return "lainnya";
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return "lainnya";
  return cleaned.replace(/\s+/g, " ");
}

function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapExcelRowToItem(row, index = 0) {
  const [
    nama,
    merek,
    kategori,
    hargaJpy,
    beratGram,
    hsCode,
    beaMasuk,
    pajak,
    ongkirJapan,
    kursJpyIdr,
    ongkirEmsIdr,
    ongkirDomestikIdr,
    totalEstimasiIdr,
    sumberProduk,
    tanggalAkses,
  ] = row;

  const kurs = safeNumber(kursJpyIdr, 111.7921);
  const hargaIdr = Math.round(safeNumber(hargaJpy, 0) * kurs);
  const normalizedKategori = normalizeCategoryName(kategori || "lainnya");
  const itemName = String(nama || `Produk ${index + 1}`).trim();

  return {
    nama: itemName,
    kategori: normalizedKategori,
    harga_idr: Math.max(1, hargaIdr),
    stok: Math.max(1, Math.min(20, (index % 10) + 3)),
    deskripsi: `Produk ${String(merek || "Jastip").trim()} ${itemName} - kategori ${String(kategori || "lainnya").trim()}. Sumber: ${String(sumberProduk || "Dataset Excel").trim()}.`,
    merek: String(merek || "").trim(),
    sumber_produk: String(sumberProduk || "Dataset Excel").trim(),
    tanggal_akses: tanggalAkses ? new Date(tanggalAkses).toISOString() : new Date().toISOString(),
    hs_code: hsCode || null,
    berat_gram: safeNumber(beratGram, 0),
    bea_masuk: beaMasuk || null,
    pajak: pajak || null,
    ongkir_japan_jpy: safeNumber(ongkirJapan, 0),
    kurs_jpy_idr: kurs,
    ongkir_ems_idr: safeNumber(ongkirEmsIdr, 0),
    ongkir_domestik_idr: safeNumber(ongkirDomestikIdr, 0),
    total_estimasi_idr: safeNumber(totalEstimasiIdr, hargaIdr),
    url_produk: "",
  };
}

async function importExcelDatasetToCatalog(pool, excelFilePath) {
  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null, raw: false });
  const entries = [];

  rows.forEach((row, index) => {
    if (index === 0) return;
    if (!row || Object.values(row).every((cell) => cell === null || cell === undefined || String(cell).trim() === "")) {
      return;
    }
    entries.push(mapExcelRowToItem([
      row["Nama Produk"],
      row["Merek"],
      row["Kategori"],
      row["Harga Jepang (JPY / ¥)"],
      row["Berat (gram)"],
      row["HS Code"],
      row["Bea Masuk"],
      row["Pajak"],
      row["Ongkir Japan Post EMS (JPY / ¥)"],
      row["Kurs JPY → IDR (Rp)"],
      row["Ongkir EMS (IDR / Rp)"],
      row["Ongkir Domestik (IDR / Rp)"],
      row["Total Estimasi (IDR / Rp)"],
      row["Sumber Produk"],
      row["Tanggal Akses"],
    ], entries.length));
  });

  for (const item of entries) {
    const categoryResult = await pool.query(
      `
        INSERT INTO categories (nama)
        VALUES ($1)
        ON CONFLICT (nama) DO UPDATE SET nama = EXCLUDED.nama
        RETURNING id
      `,
      [item.kategori],
    );

    const categoryId = categoryResult.rows[0].id;

    await pool.query(
      `
        INSERT INTO items (category_id, nama, harga_idr, stok, deskripsi)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (nama) DO UPDATE
        SET harga_idr = EXCLUDED.harga_idr,
            stok = EXCLUDED.stok,
            deskripsi = EXCLUDED.deskripsi
      `,
      [categoryId, item.nama, item.harga_idr, item.stok, item.deskripsi],
    );
  }

  return entries.length;
}

module.exports = {
  normalizeCategoryName,
  safeNumber,
  mapExcelRowToItem,
  importExcelDatasetToCatalog,
};
