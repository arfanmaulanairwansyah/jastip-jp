#!/usr/bin/env bash
# reset.sh — hapus semua data lama, build ulang, jalankan dari nol
# Pakai ini sebelum presentasi atau saat ingin clean state
# Jalankan di Codespaces: bash reset.sh

set -e

echo "=== [1/4] Menghentikan dan menghapus semua container + volume ==="
docker compose down -v

echo "=== [2/4] Build ulang semua image ==="
docker compose up -d --build

echo "=== [3/4] Menunggu semua service sehat (maks 60 detik) ==="
SECONDS=0
while true; do
  UNHEALTHY=$(docker compose ps --format json 2>/dev/null \
    | grep -v '"Health":"healthy"' \
    | grep -v '"Health":""' \
    | grep '"State":"running"' | wc -l || true)
  NOT_RUNNING=$(docker compose ps --format json 2>/dev/null \
    | grep -v '"State":"running"' | grep -v '"State":"exited"' | wc -l || true)

  ALL_HEALTHY=$(docker compose ps 2>/dev/null | grep -c "healthy" || true)
  TOTAL_SERVICES=9  # nginx + gateway + 3 services + redis + 3 db

  if [ "$SECONDS" -ge 60 ]; then
    echo "Timeout. Cek status dengan: docker compose ps"
    break
  fi

  if [ "$ALL_HEALTHY" -ge 7 ]; then
    echo "Sistem sudah berjalan."
    break
  fi

  echo "  Menunggu... ($SECONDS detik)"
  sleep 5
done

echo "=== [4/4] Status akhir ==="
docker compose ps

echo ""
echo "Health check gateway:"
curl -sf http://localhost:8080/health && echo "" || echo "Gateway belum siap — tunggu sebentar lalu coba lagi."

echo ""
echo "Selesai. Akses sistem di: http://localhost:8080"
echo "Untuk melihat log:        docker compose logs -f"
echo "Untuk scaling gateway:    docker compose up -d --scale gateway=3"
