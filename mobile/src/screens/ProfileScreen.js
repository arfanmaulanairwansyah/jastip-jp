import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants';

const MENU = [
  { icon: 'receipt-outline',         label: 'Riwayat Pesanan',   color: colors.navy,  bg: '#EFF6FF' },
  { icon: 'notifications-outline',   label: 'Notifikasi',        color: '#F4A261',    bg: '#FFF7ED' },
  { icon: 'help-circle-outline',     label: 'Bantuan & FAQ',     color: '#10B981',    bg: '#ECFDF5' },
  { icon: 'shield-checkmark-outline',label: 'Kebijakan Privasi', color: '#8B5CF6',    bg: '#F5F3FF' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  const initial = user?.nama?.[0]?.toUpperCase() ?? '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Header card ── */}
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="checkmark" size={10} color={colors.white} />
          </View>
        </View>
        <Text style={styles.nama}>{user?.nama}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.token === 'demo-token' && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>⚡ Mode Demo</Text>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>0</Text>
            <Text style={styles.statLbl}>Pesanan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>0</Text>
            <Text style={styles.statLbl}>Selesai</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>0</Text>
            <Text style={styles.statLbl}>Poin</Text>
          </View>
        </View>
      </View>

      {/* ── Menu ── */}
      <View style={styles.menuCard}>
        {MENU.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < MENU.length - 1 && styles.menuBorder]}
            onPress={() => Alert.alert(item.label, 'Fitur ini belum tersedia.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout} activeOpacity={0.8}>
        <View style={styles.logoutIconWrap}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        </View>
        <Text style={styles.btnLogoutText}>Keluar dari Akun</Text>
        <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
      </TouchableOpacity>

      <Text style={styles.version}>TITIP.JP v1.0.0 · Proyek Portofolio</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F3' },
  content: { padding: 16, paddingBottom: 40 },

  headerCard: {
    backgroundColor: colors.navy, borderRadius: 20,
    padding: 24, alignItems: 'center', marginBottom: 16,
    shadowColor: colors.navy, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: colors.white },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  nama: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  demoBadge: {
    backgroundColor: 'rgba(244,162,97,0.25)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14,
  },
  demoBadgeText: { fontSize: 11, color: '#F4A261', fontWeight: '700' },
  statsRow: { flexDirection: 'row', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.white },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  menuCard: {
    backgroundColor: colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '500', color: colors.text },

  btnLogout: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF2F2', borderRadius: 14,
    borderWidth: 1, borderColor: '#FECACA',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24,
  },
  logoutIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  btnLogoutText: { flex: 1, color: '#EF4444', fontWeight: '700', fontSize: 14 },

  version: { textAlign: 'center', fontSize: 11, color: colors.textMuted },
});
