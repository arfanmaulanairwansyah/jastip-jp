import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';

const idr = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const DEFAULT = { harga: '350', berat: '0.2', kurs: '105', fee: '10', ongkir: '150000' };

const FIELDS = [
  { key: 'harga',  label: 'Harga Barang',   suffix: 'JPY', icon: 'pricetag-outline',    hint: '' },
  { key: 'berat',  label: 'Berat Barang',    suffix: 'kg',  icon: 'scale-outline',       hint: '' },
  { key: 'kurs',   label: 'Kurs IDR / JPY',  suffix: 'IDR', icon: 'swap-horizontal-outline', hint: 'Cek kurs terkini sebelum pesan' },
  { key: 'fee',    label: 'Fee Jastip',      suffix: '%',   icon: 'percent-outline',     hint: '' },
  { key: 'ongkir', label: 'Ongkir per kg',   suffix: 'IDR/kg', icon: 'airplane-outline', hint: '' },
];

export default function CalculatorScreen() {
  const [form, setForm] = useState(DEFAULT);
  const set = key => val => setForm(prev => ({ ...prev, [key]: val }));
  const reset = useCallback(() => setForm(DEFAULT), []);

  const h  = parseFloat(form.harga)  || 0;
  const b  = parseFloat(form.berat)  || 0;
  const k  = parseFloat(form.kurs)   || 0;
  const fp = parseFloat(form.fee)    || 0;
  const ok = parseFloat(form.ongkir) || 0;

  const hargaRp  = h * k;
  const feeRp    = hargaRp * (fp / 100);
  const ongkirRp = b * ok;
  const total    = hargaRp + feeRp + ongkirRp;

  // Persentase visual tiap komponen untuk progress bar
  const pct = total > 0 ? [
    Math.round((hargaRp  / total) * 100),
    Math.round((feeRp    / total) * 100),
    Math.round((ongkirRp / total) * 100),
  ] : [33, 33, 34];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Breakdown bar ── */}
      <View style={styles.barCard}>
        <Text style={styles.barTitle}>Komposisi Biaya</Text>
        <View style={styles.bar}>
          <View style={[styles.barSegment, { flex: pct[0], backgroundColor: colors.navy }]} />
          <View style={[styles.barSegment, { flex: pct[1], backgroundColor: '#F4A261' }]} />
          <View style={[styles.barSegment, { flex: pct[2], backgroundColor: colors.red }]} />
        </View>
        <View style={styles.barLegend}>
          <Legend color={colors.navy} label="Barang" />
          <Legend color="#F4A261"     label="Fee" />
          <Legend color={colors.red}  label="Ongkir" />
        </View>
      </View>

      {/* ── Input fields ── */}
      <View style={styles.inputCard}>
        {FIELDS.map(f => (
          <View key={f.key} style={styles.field}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIcon}>
                <Ionicons name={f.icon} size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.input}
                value={form[f.key]}
                onChangeText={set(f.key)}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.suffix}>
                <Text style={styles.suffixText}>{f.suffix}</Text>
              </View>
            </View>
            {f.hint ? <Text style={styles.fieldHint}>💡 {f.hint}</Text> : null}
          </View>
        ))}
      </View>

      {/* ── Rincian ── */}
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Rincian Estimasi</Text>
        <ResultRow icon="pricetag-outline"  color={colors.navy} label="Harga Barang"       value={idr(hargaRp)} />
        <ResultRow icon="percent-outline"   color="#F4A261"     label={`Fee Jastip (${fp}%)`} value={idr(feeRp)} />
        <ResultRow icon="airplane-outline"  color={colors.red}  label="Ongkir"             value={idr(ongkirRp)} />
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL ESTIMASI</Text>
          <Text style={styles.totalValue}>{idr(total)}</Text>
        </View>
        <Text style={styles.disclaimer}>* Belum termasuk pajak impor & bea cukai.</Text>
      </View>

      <TouchableOpacity style={styles.btnReset} onPress={reset}>
        <Ionicons name="refresh-outline" size={15} color={colors.textMuted} />
        <Text style={styles.btnResetText}>Reset ke Default</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Legend({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function ResultRow({ icon, color, label, value }) {
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultLeft}>
        <View style={[styles.resultIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={13} color={color} />
        </View>
        <Text style={styles.resultLabel}>{label}</Text>
      </View>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F3' },
  content: { padding: 16, paddingBottom: 40 },

  barCard: {
    backgroundColor: colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  barTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 10 },
  barSegment: { borderRadius: 4 },
  barLegend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: colors.textMuted },

  inputCard: {
    backgroundColor: colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' },
  inputIcon: { width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F9F7' },
  input: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 11, fontSize: 15, color: colors.text },
  suffix: { backgroundColor: '#F9F9F7', paddingHorizontal: 12, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.border },
  suffixText: { fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' },
  fieldHint: { fontSize: 11, color: colors.textMuted, marginTop: 5 },

  resultCard: {
    backgroundColor: colors.navy, borderRadius: 16,
    padding: 18, marginBottom: 14,
    shadowColor: colors.navy, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
  },
  resultTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  resultLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  resultValue: { fontSize: 14, fontWeight: '700', color: colors.white },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontSize: 24, fontWeight: '800', color: colors.white },
  disclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 10 },

  btnReset: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 12, backgroundColor: colors.white,
  },
  btnResetText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
});
