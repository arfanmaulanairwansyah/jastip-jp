import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, API_URL } from '../constants';

const CAT_COLOR = {
  Snack: { bg: '#FEF3C7', text: '#92400E' },
  Skincare: { bg: '#FCE7F3', text: '#9D174D' },
  Elektronik: { bg: '#DBEAFE', text: '#1D4ED8' },
  Fashion: { bg: '#F3E8FF', text: '#7C3AED' },
  'Perawatan Kulit': { bg: '#DCFCE7', text: '#166534' },
  Kosmetik: { bg: '#FDE68A', text: '#92400E' },
  Sepatu: { bg: '#E0F2FE', text: '#0F172A' },
  'Jam Tangan': { bg: '#FCE7F3', text: '#831843' },
  default: { bg: '#F0EFEB', text: '#4B5563' },
};

const CATEGORY_ICONS = {
  Semua: '🗾',
  Snack: '🍡',
  Skincare: '✨',
  Fashion: '👗',
  Elektronik: '🔌',
  Kosmetik: '💄',
  Sepatu: '👟',
  'Perawatan Kulit': '🧴',
  'Jam Tangan': '⌚',
  Lainnya: '📦',
};

const CATEGORIES = [
  { label: 'Semua', icon: '🗾' },
  { label: 'Fashion', icon: '👗' },
  { label: 'Skincare', icon: '✨' },
  { label: 'Snack', icon: '🍡' },
  { label: 'Elektronik', icon: '🔌' },
  { label: 'Kosmetik', icon: '💄' },
  { label: 'Sepatu', icon: '👟' },
  { label: 'Perawatan Kulit', icon: '🧴' },
  { label: 'Jam Tangan', icon: '⌚' },
];

const normalizeCategory = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'Lainnya';
  const lower = raw.toLowerCase();
  const map = {
    fashion: 'Fashion',
    skincare: 'Skincare',
    snack: 'Snack',
    elektronik: 'Elektronik',
    kosmetik: 'Kosmetik',
    sepatu: 'Sepatu',
    'perawatan kulit': 'Perawatan Kulit',
    'jam tangan': 'Jam Tangan',
  };
  return map[lower] || raw.charAt(0).toUpperCase() + raw.slice(1);
};

const normalizeItem = (item) => {
  const hargaIdr = Number(item.harga_idr || item.harga || 0);
  const hargaJpy = hargaIdr > 0 ? Math.round(hargaIdr / 110) : 0;
  const kategori = normalizeCategory(item.kategori);

  return {
    id: Number(item.id || 0),
    nama: String(item.nama || 'Produk Jastip').trim(),
    kategori,
    harga_jpy: hargaJpy,
    harga_idr: hargaIdr,
    stok: Number(item.stok || 0) > 0,
    populer: false,
    emoji: CATEGORY_ICONS[kategori] || '📦',
    deskripsi: String(item.deskripsi || 'Produk unggulan dari katalog Jastip Japan').trim(),
  };
};

const toIdr = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `~Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return `~Rp ${Math.round(n / 1000)}rb`;
};

export default function CatalogScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/catalog?page=1&limit=20`)
      .then((response) => response.json())
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload.data || [];
        setItems(list.map(normalizeItem));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'Semua' || item.kategori === activeCategory;
    const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk dari Jepang..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={(cat) => cat.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
        style={styles.chipsRow}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.chip, activeCategory === cat.label && styles.chipActive]}
            onPress={() => setActiveCategory(cat.label)}
          >
            <Text style={styles.chipEmoji}>{cat.icon}</Text>
            <Text style={[styles.chipText, activeCategory === cat.label && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} produk</Text>
        {activeCategory !== 'Semua' && (
          <TouchableOpacity onPress={() => setActiveCategory('Semua')}>
            <Text style={styles.resetFilter}>Tampilkan semua ×</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} size="large" style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Tidak ada produk</Text>
          <Text style={styles.emptyDesc}>Coba kata kunci lain atau pilih kategori berbeda.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => { setSearch(''); setActiveCategory('Semua'); }}>
            <Text style={styles.emptyBtnText}>Reset pencarian</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const accent = CAT_COLOR[item.kategori] || CAT_COLOR.default;
            return (
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.card, !item.stok && styles.cardDimmed]}
                onPress={() => item.stok && navigation.navigate('Pesan', { produk: item.nama, harga: item.harga_jpy })}
              >
                <View style={[styles.thumb, { backgroundColor: accent.bg }]}>
                  <Text style={styles.thumbEmoji}>{item.emoji || '📦'}</Text>
                  {item.populer && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>⭐ Populer</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={[styles.catTag, { backgroundColor: accent.bg }]}>
                    <Text style={[styles.catTagText, { color: accent.text }]}>{item.kategori}</Text>
                  </View>

                  <Text style={styles.cardName} numberOfLines={2}>{item.nama}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.deskripsi}</Text>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.cardPrice}>¥{item.harga_jpy.toLocaleString()}</Text>
                      <Text style={styles.cardPriceIdr}>{toIdr(item.harga_idr)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.btnOrder, !item.stok && styles.btnOrderDisabled]}
                      disabled={!item.stok}
                      onPress={() => navigation.navigate('Pesan', { produk: item.nama, harga: item.harga_jpy })}
                    >
                      <Ionicons
                        name={item.stok ? 'bag-add' : 'close'}
                        size={15}
                        color={item.stok ? colors.white : colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.stockRow}>
                    <View style={[styles.stockDot, { backgroundColor: item.stok ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.stockLabel, { color: item.stok ? '#065F46' : '#991B1B' }]}>
                      {item.stok ? 'Tersedia' : 'Stok habis'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F3' },
  searchRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, height: 46,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  chipsRow: { flexGrow: 0 },
  chipsContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F0EFEB', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  chipActive: { backgroundColor: '#223A5E' },
  chipEmoji: { fontSize: 14, marginRight: 6 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#FFFFFF' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  resetFilter: { fontSize: 12, color: colors.red, fontWeight: '600' },
  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: { width: '48%', backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', elevation: 1 },
  cardDimmed: { opacity: 0.75 },
  thumb: { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  thumbEmoji: { fontSize: 36 },
  popularBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FFF7ED', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  popularText: { fontSize: 10, color: '#C1440E', fontWeight: '700' },
  cardBody: { padding: 10 },
  catTag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 },
  catTagText: { fontSize: 10, fontWeight: '700' },
  cardName: { fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  cardDesc: { fontSize: 11, color: '#6B7280', lineHeight: 16, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardPriceIdr: { fontSize: 10, color: '#6B7280' },
  btnOrder: { backgroundColor: colors.red, width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnOrderDisabled: { backgroundColor: '#E5E7EB' },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stockDot: { width: 8, height: 8, borderRadius: 999, marginRight: 6 },
  stockLabel: { fontSize: 11, fontWeight: '600' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.navy, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: '700' },
});
