import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';

const STATS = [
  { value: '500+', label: 'Produk' },
  { value: '7-14', label: 'Hari kirim' },
  { value: '100%', label: 'Terpercaya' },
];

const STEPS = [
  { num: '01', icon: 'search-outline',    title: 'Cari Produk',    desc: 'Temukan produk dari Jepang yang ingin kamu titip beli.' },
  { num: '02', icon: 'calculator-outline',title: 'Hitung Biaya',   desc: 'Estimasi harga barang + fee jastip + ongkir internasional.' },
  { num: '03', icon: 'create-outline',    title: 'Isi Pesanan',   desc: 'Kirim detail produk, alamat, dan nomor WhatsApp kamu.' },
  { num: '04', icon: 'airplane-outline',  title: 'Kami Belikan',  desc: 'Personal shopper kami di Jepang membeli dan mengirimkan.' },
  { num: '05', icon: 'home-outline',      title: 'Terima di Rumah', desc: 'Paket tiba di depan pintumu. Selesai!' },
];

const FEATURES = [
  { icon: 'shield-checkmark-outline', label: 'Aman & Terpercaya' },
  { icon: 'flash-outline',            label: 'Proses Cepat' },
  { icon: 'chatbubble-outline',       label: 'Update Real-time' },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero Banner ── */}
      <View style={styles.heroBanner}>
        <Text style={styles.eyebrow}>✈️  Personal Shopper · JP → ID</Text>
        <Text style={styles.heroTitle}>Titip beli dari{' '}
          <Text style={styles.heroAccent}>Jepang</Text>,{`\n`}kami antar ke pintumu.
        </Text>
        <Text style={styles.heroDesc}>
          Dari minimarket Shibuya sampai rumahmu di Jakarta — satu jastip, satu jalur, satu tanggung jawab.
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.body}>

        {/* ── Route Card ── */}
        <View style={styles.routeCard}>
          <View style={styles.routeInner}>
            <View style={styles.routeNode}>
              <View style={[styles.routeDot, { backgroundColor: colors.navy }]}>
                <Text style={styles.routeCode}>JP</Text>
              </View>
              <Text style={styles.routeCity}>Tokyo</Text>
            </View>
            <View style={styles.routeMid}>
              <View style={styles.routeLine} />
              <Text style={styles.routePlane}>✈️</Text>
              <View style={styles.routeLine} />
            </View>
            <View style={styles.routeNode}>
              <View style={[styles.routeDot, { backgroundColor: colors.red }]}>
                <Text style={styles.routeCode}>ID</Text>
              </View>
              <Text style={styles.routeCity}>Jakarta</Text>
            </View>
          </View>
          <Text style={styles.routeEst}>Estimasi tiba 7–14 hari kerja</Text>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Katalog')}>
            <Ionicons name="grid-outline" size={16} color={colors.white} />
            <Text style={styles.btnPrimaryText}>Lihat Katalog</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Kalkulator')}>
            <Ionicons name="calculator-outline" size={16} color={colors.text} />
            <Text style={styles.btnSecondaryText}>Kalkulator</Text>
          </TouchableOpacity>
        </View>

        {/* ── Fitur unggulan ── */}
        <View style={styles.featuresRow}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={colors.red} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Cara Kerja ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cara Kerja</Text>
          <Text style={styles.sectionSub}>5 langkah mudah</Text>
        </View>

        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepLeft}>
              <View style={styles.stepNumWrap}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
            </View>
            <View style={styles.stepBody}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={step.icon} size={18} color={colors.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* ── Note ── */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
          <Text style={styles.noteText}>Proyek tugas kuliah / portofolio — bukan layanan komersial aktif.</Text>
        </View>

        {/* ── Bottom CTA ── */}
        <TouchableOpacity style={styles.btnFull} onPress={() => navigation.navigate('Pesan')}>
          <Text style={styles.btnFullText}>Mulai Titip Sekarang →</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F3' },

  heroBanner: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20, paddingTop: 32, paddingBottom: 28,
  },
  eyebrow: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 12, letterSpacing: 0.4 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: colors.white, lineHeight: 36, marginBottom: 12 },
  heroAccent: { color: '#F4A261' },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginBottom: 20 },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  body: { padding: 20, paddingBottom: 40 },

  routeCard: {
    backgroundColor: colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    elevation: 2,
  },
  routeInner: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  routeNode: { alignItems: 'center', gap: 6 },
  routeDot: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  routeCode: { fontSize: 13, fontWeight: '800', color: colors.white },
  routeCity: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  routeMid: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  routeLine: { flex: 1, height: 1, backgroundColor: colors.border },
  routePlane: { fontSize: 18, marginHorizontal: 6 },
  routeEst: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  ctaRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.red, borderRadius: 12, paddingVertical: 14,
    shadowColor: colors.red, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 14, backgroundColor: colors.white,
  },
  btnSecondaryText: { color: colors.text, fontWeight: '600', fontSize: 14 },

  featuresRow: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 28, gap: 4,
  },
  featureItem: { flex: 1, alignItems: 'center', gap: 8 },
  featureIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: 10, fontWeight: '600', color: colors.text, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 12, color: colors.textMuted },

  stepCard: { flexDirection: 'row', marginBottom: 4 },
  stepLeft: { width: 36, alignItems: 'center' },
  stepNumWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 10, fontWeight: '800', color: colors.white },
  stepConnector: { flex: 1, width: 2, backgroundColor: '#FECACA', marginVertical: 2 },
  stepBody: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    padding: 12, marginLeft: 8, marginBottom: 8, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
    elevation: 1,
  },
  stepIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 3 },
  stepDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.surface, borderRadius: 10,
    padding: 12, marginTop: 8, marginBottom: 20,
  },
  noteText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  btnFull: {
    backgroundColor: colors.red, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.red, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
    elevation: 4,
  },
  btnFullText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
