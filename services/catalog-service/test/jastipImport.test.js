const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeCategoryName, mapExcelRowToItem } = require("../src/jastipImport.js");

test("normalizeCategoryName turns Excel category names into app category names", () => {
  assert.equal(normalizeCategoryName("Perawatan Kulit"), "perawatan kulit");
  assert.equal(normalizeCategoryName("Fashion"), "fashion");
  assert.equal(normalizeCategoryName("Jam Tangan"), "jam tangan");
});

test("mapExcelRowToItem converts Excel data into catalog item format", () => {
  const item = mapExcelRowToItem([
    "UNIQLO - Kando Jacket",
    "UNIQLO",
    "Fashion",
    6990,
    null,
    null,
    null,
    null,
    null,
    111.7921,
    null,
    56000,
    null,
    "https://example.com/uniqlo",
    "2026-08-19",
  ]);

  assert.equal(item.nama, "UNIQLO - Kando Jacket");
  assert.equal(item.kategori, "fashion");
  assert.equal(item.harga_idr, 781427);
  assert.equal(item.stok, 3);
  assert.match(item.deskripsi, /UNIQLO/i);
  assert.match(item.deskripsi, /Fashion/i);
});
