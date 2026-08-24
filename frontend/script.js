const API_URL = 'http://localhost:8080/api/catalog?page=1&limit=30';
const $ = (id) => document.getElementById(id);
const idr = (n) => 'Rp ' + Math.round(Number(n || 0)).toLocaleString('id-ID');

const categoryMap = {
  fashion: 'Fashion',
  skincare: 'Skincare',
  snack: 'Snack',
  elektronik: 'Elektronik',
  kosmetik: 'Kosmetik',
  sepatu: 'Sepatu',
  'perawatan kulit': 'Perawatan Kulit',
  'jam tangan': 'Jam Tangan',
};

const thumbStyles = {
  Fashion: 'linear-gradient(135deg,#8a6d9e,#4a3a5a)',
  Skincare: 'linear-gradient(135deg,#3A5578,#223A5E)',
  Snack: 'linear-gradient(135deg,#C1440E,#8a3009)',
  Elektronik: 'linear-gradient(135deg,#1e3a8a,#172554)',
  Kosmetik: 'linear-gradient(135deg,#D97706,#92400E)',
  Sepatu: 'linear-gradient(135deg,#6B7A4F,#4d5838)',
  'Perawatan Kulit': 'linear-gradient(135deg,#059669,#065F46)',
  'Jam Tangan': 'linear-gradient(135deg,#7C2D12,#431407)',
};

const emojiMap = {
  Fashion: '👗',
  Skincare: '✨',
  Snack: '🍡',
  Elektronik: '🔌',
  Kosmetik: '💄',
  Sepatu: '👟',
  'Perawatan Kulit': '🧴',
  'Jam Tangan': '⌚',
};

const normalizeCategory = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'Lainnya';
  const normalized = raw.toLowerCase();
  return categoryMap[normalized] || raw.charAt(0).toUpperCase() + raw.slice(1);
};

function renderCatalog(items) {
  const grid = document.querySelector('.cat-grid');
  if (!grid) return;

  const selectedFilter = document.querySelector('.chip.active')?.dataset.filter || 'Semua';
  const filtered = selectedFilter === 'Semua'
    ? items
    : items.filter((item) => normalizeCategory(item.kategori) === selectedFilter);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="cat-card" style="grid-column:1/-1;">
        <div class="cat-body">
          <div class="cat-tag">Kosong</div>
          <h3>Tidak ada produk</h3>
          <p>Belum ada item untuk kategori ini di database.</p>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((item) => {
    const category = normalizeCategory(item.kategori);
    const price = Number(item.harga_idr || 0);
    const emoji = emojiMap[category] || '📦';
    const background = thumbStyles[category] || 'linear-gradient(135deg,#223A5E,#3A5578)';

    return `
      <div class="cat-card">
        <div class="cat-thumb" style="background:${background};"><span>${emoji} ${category}</span></div>
        <div class="cat-body">
          <div class="cat-tag">${category}</div>
          <h3>${(item.nama || 'Produk Jastip').replace(/</g, '&lt;')}</h3>
          <p>${(item.deskripsi || 'Produk favorit dari katalog Jastip Japan').replace(/</g, '&lt;')}</p>
          <div class="cat-price"><span>Mulai dari</span><b>${idr(price)}</b></div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadCatalog() {
  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('API gagal');

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.data || [];
    renderCatalog(items);
  } catch (_error) {
    const grid = document.querySelector('.cat-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="cat-card" style="grid-column:1/-1;">
          <div class="cat-body">
            <div class="cat-tag">Offline</div>
            <h3>Data katalog tidak tersedia</h3>
            <p>Pastikan gateway backend berjalan di localhost:8080.</p>
          </div>
        </div>
      `;
    }
  }
}

function hitung() {
  const harga = parseFloat($('harga').value) || 0;
  const berat = parseFloat($('berat').value) || 0;
  const kurs = parseFloat($('kurs').value) || 0;
  const feePct = parseFloat($('fee').value) || 0;
  const ongkirKg = parseFloat($('ongkir').value) || 0;

  const hargaRp = harga * kurs;
  const feeRp = hargaRp * (feePct / 100);
  const ongkirRp = berat * ongkirKg;
  const total = hargaRp + feeRp + ongkirRp;

  $('r-barang').textContent = idr(hargaRp);
  $('r-fee').textContent = idr(feeRp);
  $('r-ongkir').textContent = idr(ongkirRp);
  $('r-total').textContent = idr(total);
}

function setupFaq() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((el) => {
        el.classList.remove('open');
        el.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
}

function setupFilters() {
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const selected = chip.dataset.filter || 'Semua';
      const catalogItems = JSON.parse(localStorage.getItem('catalogItems') || '[]');
      renderCatalog(catalogItems, selected);
    });
  });
}

function renderCatalog(items, selected = null) {
  const grid = document.querySelector('.cat-grid');
  if (!grid) return;

  const selectedFilter = selected || document.querySelector('.chip.active')?.dataset.filter || 'Semua';
  const filtered = selectedFilter === 'Semua'
    ? items
    : items.filter((item) => normalizeCategory(item.kategori) === selectedFilter);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="cat-card" style="grid-column:1/-1;">
        <div class="cat-body">
          <div class="cat-tag">Kosong</div>
          <h3>Tidak ada produk</h3>
          <p>Belum ada item untuk kategori ini.</p>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((item) => {
    const category = normalizeCategory(item.kategori);
    const price = Number(item.harga_idr || 0);
    const emoji = emojiMap[category] || '📦';
    const background = thumbStyles[category] || 'linear-gradient(135deg,#223A5E,#3A5578)';

    return `
      <div class="cat-card">
        <div class="cat-thumb" style="background:${background};"><span>${emoji} ${category}</span></div>
        <div class="cat-body">
          <div class="cat-tag">${category}</div>
          <h3>${(item.nama || 'Produk Jastip').replace(/</g, '&lt;')}</h3>
          <p>${(item.deskripsi || 'Produk favorit dari katalog Jastip Japan').replace(/</g, '&lt;')}</p>
          <div class="cat-price"><span>Mulai dari</span><b>${idr(price)}</b></div>
        </div>
      </div>
    `;
  }).join('');
}

async function init() {
  ['harga','berat','kurs','fee','ongkir'].forEach((id) => $(id)?.addEventListener('input', hitung));
  hitung();
  setupFaq();
  setupFilters();

  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('API failed');

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.data || [];
    localStorage.setItem('catalogItems', JSON.stringify(items));
    renderCatalog(items);
  } catch (_error) {
    const fallback = JSON.parse(localStorage.getItem('catalogItems') || '[]');
    if (fallback.length) {
      renderCatalog(fallback);
      return;
    }

    const grid = document.querySelector('.cat-grid');
    if (grid) {
      grid.innerHTML = `
      <div class="cat-card" style="grid-column:1/-1;">
        <div class="cat-body">
          <div class="cat-tag">Offline</div>
          <h3>Data katalog tidak tersedia</h3>
          <p>Pastikan gateway backend berjalan di localhost:8080.</p>
        </div>
      </div>
    `;
    }
  }
}

document.getElementById('orderForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  document.getElementById('formMsg')?.classList.add('show');
  this.reset();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
