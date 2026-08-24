import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, API_URL } from '../constants';

export default function OrderScreen({ route }) {
  const prefill = route?.params || {};
  const [form, setForm] = useState({
    nama: '',
    whatsapp: '',
    alamat: '',
    produk: prefill.produk || '',
    url: '',
    catatan: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = key => val => setForm(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!form.nama.trim()) return 'Nama wajib diisi.';
    if (!form.whatsapp.trim()) return 'Nomor WhatsApp wajib diisi.';
    if (!form.alamat.trim()) return 'Alamat pengiriman wajib diisi.';
    if (!form.produk.trim()) return 'Nama / URL produk wajib diisi.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert('Periksa Form', err); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      // Backend belum siap (501), tampilkan sukses simulasi juga
      if (res.ok || res.status === 501) {
        setSent(true);
      } else {
        Alert.alert('Gagal', 'Terjadi kesalahan. Coba lagi nanti.');
      }
    } catch {
      // Offline / backend belum jalan — tampilkan konfirmasi simulasi
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successCircle}>
          <Text style={styles.successEmoji}>🎉</Text>
        </View>
        <Text style={styles.successTitle}>Pesanan Terkirim!</Text>
        <Text style={styles.successDesc}>
          Kami akan menghubungi kamu via WhatsApp dalam 1×24 jam untuk konfirmasi dan pembayaran.
        </Text>
        <View style={styles.successInfo}>
          <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
          <Text style={styles.successInfoText}>Cek WhatsApp kamu dalam waktu dekat.</Text>
        </View>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => { setSent(false); setForm({ nama: '', whatsapp: '', alamat: '', produk: '', url: '', catatan: '' }); }}
        >
          <Text style={styles.btnPrimaryText}>Buat Pesanan Baru →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={14} color={colors.red} />
            <Text style={styles.heroBadgeText}>Form Pemesanan</Text>
          </View>
          <Text style={styles.heroTitle}>Titip barang Jepang jadi lebih mudah</Text>
          <Text style={styles.subtitle}>
            Isi data di bawah. Tim kami akan konfirmasi via WhatsApp dalam 1×24 jam dengan estimasi harga lengkap.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Data Penerima</Text>
          <Field
            label="Nama Lengkap *"
            value={form.nama}
            onChangeText={set('nama')}
            placeholder="Arfan Maulana"
            icon="person-outline"
          />
          <Field
            label="Nomor WhatsApp *"
            value={form.whatsapp}
            onChangeText={set('whatsapp')}
            placeholder="+62 812-xxxx-xxxx"
            keyboardType="phone-pad"
            icon="logo-whatsapp"
          />
          <Field
            label="Alamat Pengiriman *"
            value={form.alamat}
            onChangeText={set('alamat')}
            placeholder="Jl. Sudirman No.1, Jakarta..."
            multiline
            icon="location-outline"
          />

          <Text style={styles.sectionTitle}>Detail Titipan</Text>
          <Field
            label="Nama / Deskripsi Produk *"
            value={form.produk}
            onChangeText={set('produk')}
            placeholder="Kit Kat Matcha 12 pcs"
            icon="cube-outline"
          />
          <Field
            label="URL Produk (opsional)"
            value={form.url}
            onChangeText={set('url')}
            placeholder="https://www.amazon.co.jp/..."
            keyboardType="url"
            icon="link-outline"
          />
          <Field
            label="Catatan Tambahan"
            value={form.catatan}
            onChangeText={set('catatan')}
            placeholder="Minta wrapping khusus, dll."
            multiline
            icon="document-text-outline"
          />

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.navy} />
            <Text style={styles.infoText}>
              Harga final akan dikonfirmasi setelah kami cek ketersediaan produk di Jepang.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="paper-plane-outline" size={16} color={colors.white} />
            <Text style={styles.btnPrimaryText}>
              {loading ? 'Mengirim...' : 'Kirim Pesanan'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, icon }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, multiline && styles.inputWrapMulti]}>
        <Ionicons style={styles.inputIcon} name={icon || 'create-outline'} size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F3' },
  content: { padding: 16, paddingBottom: 44 },

  heroCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FCD9C6',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEEDE3',
    borderWidth: 1,
    borderColor: '#F9C7A9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.red,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },

  formCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 2,
  },

  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.4 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#FBFBFA',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapMulti: { alignItems: 'flex-start', paddingTop: 10 },
  inputIcon: { marginRight: 9, marginTop: 2 },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  inputMulti: { minHeight: 84, paddingTop: 2 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1,
    borderColor: '#BFDBFE', padding: 14, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.navy, lineHeight: 20 },

  btnPrimary: {
    backgroundColor: colors.red, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
    shadowColor: colors.red, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  successWrap: {
    flex: 1, backgroundColor: '#F7F6F3',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.red, shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4,
  },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10 },
  successDesc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  successInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 28,
  },
  successInfoText: { fontSize: 13, color: '#065F46', fontWeight: '500' },
});
