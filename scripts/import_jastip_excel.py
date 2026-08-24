#!/usr/bin/env python3
import openpyxl
from pathlib import Path

EXCEL_PATH = Path(__file__).resolve().parents[1] / "jastip_japan_indonesia_dataset_FINAL.xlsx"


def parse_number(value):
    if value is None or value == "":
        return 0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


def main():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb["DATASET_FINAL"]
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise SystemExit("Excel file kosong")

    header = rows[0]
    mapped = []
    for row in rows[1:]:
        if row is None or all(cell is None or str(cell).strip() == "" for cell in row):
            continue
        item = dict(zip(header, row))
        nama = str(item.get("Nama Produk") or "").strip()
        kategori = str(item.get("Kategori") or "").strip()
        if not nama:
            continue
        harga_jpy = parse_number(item.get("Harga Jepang (JPY / ¥)"))
        kurs = parse_number(item.get("Kurs JPY → IDR (Rp)")) or 111.7921
        harga_idr = max(1, round(harga_jpy * kurs))
        nomor = len(mapped) + 1
        description = (
            f"{nama} — {kategori}. "
            f"Merek: {item.get('Merek') or '-'}; "
            f"Sumber: {item.get('Sumber Produk') or 'Dataset Excel'}; "
            f"Tanggal akses: {item.get('Tanggal Akses') or '-'}"
        )
        mapped.append({
            "nama": nama,
            "kategori": kategori.lower(),
            "harga_idr": harga_idr,
            "stok": max(1, min(20, (nomor % 10) + 3)),
            "deskripsi": description,
        })

    categories = sorted({item["kategori"] for item in mapped})
    sql = ["BEGIN;"]
    for category in categories:
        sql.append(f"INSERT INTO categories (nama) VALUES ('{category}') ON CONFLICT (nama) DO NOTHING;")

    for item in mapped:
        sql.append(
            "INSERT INTO items (category_id, nama, harga_idr, stok, deskripsi) "
            "VALUES ((SELECT id FROM categories WHERE nama = '{cat}'), '{name}', {price}, {stock}, '{desc}') "
            "ON CONFLICT (nama) DO UPDATE SET harga_idr = EXCLUDED.harga_idr, stok = EXCLUDED.stok, deskripsi = EXCLUDED.deskripsi;".format(
                cat=item["kategori"].replace("'", "''"),
                name=item["nama"].replace("'", "''"),
                price=item["harga_idr"],
                stock=item["stok"],
                desc=item["deskripsi"].replace("'", "''"),
            )
        )

    sql.append("COMMIT;")
    print("\n".join(sql))


if __name__ == "__main__":
    main()
