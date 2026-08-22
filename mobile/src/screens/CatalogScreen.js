import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, API_URL } from '../constants';

// Warna aksen thumbnail per kategori
const CAT_COLOR = {
  Snack:     { bg: '#FEF3C7', text: '#92400E' },
  Skincare:  { bg: '#FCE7F3', text: '#9D174D' },
  Lifestyle: { bg: '#D1FAE5', text: '#065F46' },
  Kolektibel:{ bg: '#EDE9FE', text: '#5B21B6' },
  default:   { bg: '#F0EFEB', text: '#4B5563' },
};

const KATALOG_DUMMY = [
  { id: 1, nama: 'Kit Kat Matcha', kategori: 'Snack',     harga_jpy: 350,  stok: true,  populer: true,  emoji: '🍫', deskripsi: 'Edisi matcha eksklusif Jepang.' },
  { id: 2, nama: 'Pocky Strawberry Giant', kategori: 'Snack', harga_jpy: 450, stok: true, populer: false, emoji: '🍓', deskripsi: 'Rasa strawberry ukuran jumbo.' },
  { id: 3, nama: 'Tokyo Banana', kategori: 'Snack',       harga_jpy: 1200, stok: true,  populer: true,  emoji: '🍌', deskripsi: 'Oleh-oleh ikonik Tokyo.' },
  { id: 4, nama: 'Shiseido Sunscreen SPF50+', kategori: 'Skincare', harga_jpy: 2800, stok: true, populer: true, emoji: '🧴', deskripsi: 'Tabir surya terlaris dari Jepang.' },
  { id: 5, nama: 'Hada Labo Toner', kategori: 'Skincare', harga_jpy: 1600, stok: false, populer: false, emoji: '💧', deskripsi: 'Toner hyaluronic acid legendaris.' },
  { id: 6, nama: 'Muji Diffuser',   kategori: 'Lifestyle',harga_jpy: 4900, stok: true,  populer: false, emoji: '🌿', deskripsi: 'Diffuser minimalis favorit warga Muji.' },
  { id: 7, nama: 'Gashapon Capsule',kategori: 'Kolektibel',harga_jpy: 500, stok: true,  populer: false, emoji: '🎰', deskripsi: 'Random character, satu kapsul.' },
  { id: 8, nama: 'Calbee Jagabee',  kategori: 'Snack',    harga_jpy: 320,  stok: true,  populer: false, emoji: '🥔', deskripsi: 'Kentang stik Hokkaido premium.' },
];

const CATEGORIES = [
  { label: 'Semua',     icon: '🗾' },
  { label: 'Snack',     icon: '🍡' },
  { label: 'Skincare',  icon: '✨' },
  { label: 'Lifestyle', icon: '🏡' },
  { label: 'Kolektibel',icon: '🎁' },
];

// Estimasi kasar IDR dari JPY (kurs ~105)
const toIdr = jpy => {
  const n = jpy * 105;
  return n >= 1_000_000
    ? `~Rp ${(n / 1_000_000).toFixed(1)}jt`
    : `~Rp ${Math.round(n / 1000)}rb`;
};

export default function CatalogScreen({ navigation }) {
  const [items, setItems] = useState(KATALOG_DUMMY);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/catalog`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setItems(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const matchCat = activeCategory === 'Semua' || item.kategori === activeCategory;
    const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.container}>

      {/* ── Search ── */}
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

      {/* ── Filter chips ── */}
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={c => c.label}
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

      {/* ── Counter ── */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} produk</Text>
        {activeCategory !== 'Semua' && (
          <TouchableOpacity onPress={() => setActiveCategory('Semua')}>
            <Text style={styles.resetFilter}>Tampilkan semua ×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Grid ── */}
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
          keyExtractor={item => String(item.id)}
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
                {/* Thumbnail dengan warna aksen kategori */}
                <View style={[styles.thumb, { backgroundColor: accent.bg }]}>
                  <Text style={styles.thumbEmoji}>{item.emoji || '📦'}</Text>
                  {item.populer && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>⭐ Populer</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  {/* Kategori tag */}
                  <View style={[styles.catTag, { backgroundColor: accent.bg }]}>
                    <Text style={[styles.catTagText, { color: accent.text }]}>{item.kategori}</Text>
                  </View>

                  <Text style={styles.cardName} numberOfLines={2}>{item.nama}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.deskripsi}</Text>

                  {/* Harga + tombol */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.cardPrice}>¥{item.harga_jpy.toLocaleString()}</Text>
                      <Text style={styles.cardPriceIdr}>{toIdr(item.harga_jpy)}</Text>
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

                  {/* Status stok */}
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

  /* Search */
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

  /* Chips */
  chipsRow: { flexGrow: 0 },
  chipsContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 22,
    paddingHorizontal: 13, paddingVertical: 7,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.white },

  /* Counter */
  countRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  resetFilter: { fontSize: 12, color: colors.red, fontWeight: '600' },

  /* Grid */
  grid: { paddingHorizontal: 12, paddingBottom: 32 },
  row: { gap: 10, marginBottom: 10 },

  /* Card */
  card: {
    flex: 1, backgroundColor: colors.white,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
    elevation: 3,
  },
  cardDimmed: { opacity: 0.55 },

  thumb: {
    width: '100%', height: 100,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 44 },

  popularBadge: {
    position: 'absolute', top: 7, right: 7,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  popularText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  cardBody: { padding: 10 },

  catTag: {
    alignSelf: 'flex-start', borderRadius: 5,
    paddingHorizontal: 7, paddingVertical: 2, marginBottom: 6,
  },
  catTagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  cardName: { fontSize: 13, fontWeight: '700', color: colors.text, lineHeight: 18, marginBottom: 4 },
  cardDesc: { fontSize: 11, color: colors.textMuted, lineHeight: 15, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: colors.navy },
  cardPriceIdr: { fontSize: 10, color: colors.textMuted, marginTop: 1 },

  btnOrder: {
    backgroundColor: colors.red, borderRadius: 9,
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
  },
  btnOrderDisabled: { backgroundColor: '#E5E7EB' },

  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockLabel: { fontSize: 10, fontWeight: '600' },

  /* Empty */
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: {
    borderWidth: 1.5, borderColor: colors.text, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
});
