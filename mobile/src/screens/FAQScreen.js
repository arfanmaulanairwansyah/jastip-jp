import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';

const FAQ = [
  { icon: '✈️', q: 'Berapa lama pengiriman dari Jepang ke Indonesia?', a: 'Estimasi 7–14 hari kerja tergantung jadwal keberangkatan dan pengiriman domestik Indonesia.' },
  { icon: '⚖️', q: 'Apakah ada batas berat atau nilai barang?',       a: 'Maksimal 20 kg per pengiriman. Untuk barang bernilai di atas ¥200.000 ada kemungkinan dikenai bea cukai.' },
  { icon: '💳', q: 'Bagaimana metode pembayaran?',                    a: 'Transfer bank (BCA/Mandiri) atau GoPay/OVO. Pembayaran dilakukan setelah konfirmasi harga final.' },
  { icon: '📱', q: 'Apakah bisa titip barang elektronik?',            a: 'Bisa, namun ada biaya penanganan khusus dan beberapa barang memerlukan izin impor.' },
  { icon: '🔄', q: 'Bagaimana jika barang tidak tersedia?',           a: 'Kami akan langsung menghubungi kamu via WhatsApp dan menawarkan alternatif atau refund penuh.' },
  { icon: '🎁', q: 'Apakah tersedia layanan gift wrapping?',          a: 'Ya, tersedia dengan biaya tambahan ¥500. Tulis permintaan di kolom catatan saat pesan.' },
];

export default function FAQScreen() {
  const [open, setOpen] = useState(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>🙋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Ada Pertanyaan?</Text>
          <Text style={styles.bannerSub}>Pertanyaan yang sering ditanyakan seputar layanan jastip kami.</Text>
        </View>
      </View>

      {FAQ.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.item, open === i && styles.itemOpen]}
          onPress={() => setOpen(open === i ? null : i)}
          activeOpacity={0.85}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemEmoji}>{item.icon}</Text>
              <Text style={styles.question}>{item.q}</Text>
            </View>
            <View style={[styles.chevronWrap, open === i && styles.chevronWrapOpen]}>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={14} color={open === i ? colors.white : colors.textMuted} />
            </View>
          </View>
          {open === i && (
            <View style={styles.answerWrap}>
              <Text style={styles.answer}>{item.a}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F3' },
  content: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.navy, borderRadius: 16,
    padding: 16, marginBottom: 20,
  },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: colors.white, marginBottom: 4 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 17 },

  item: {
    backgroundColor: colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1,
  },
  itemOpen: { borderColor: colors.red },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, gap: 10 },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemEmoji: { fontSize: 18, marginTop: 1 },
  question: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 19 },
  chevronWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  chevronWrapOpen: { backgroundColor: colors.red },
  answerWrap: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFAF8',
  },
  answer: { fontSize: 13, color: colors.textMuted, lineHeight: 21 },
});
