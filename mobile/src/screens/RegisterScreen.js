import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants';

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuth();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!nama.trim()) { Alert.alert('', 'Nama wajib diisi.'); return; }
    if (!email.trim()) { Alert.alert('', 'Email wajib diisi.'); return; }
    if (password.length < 8) { Alert.alert('', 'Password minimal 8 karakter.'); return; }
    if (password !== konfirmasi) { Alert.alert('', 'Password dan konfirmasi tidak cocok.'); return; }

    const result = await register(nama.trim(), email.trim(), password);
    if (!result.ok) Alert.alert('Registrasi Gagal', result.message);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>TITIP<Text style={styles.logoAccent}>.JP</Text></Text>
        </View>

        <Text style={styles.heading}>Buat Akun Baru</Text>
        <Text style={styles.subheading}>Daftar untuk mulai menitip dari Jepang.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Arfan Maulana"
              placeholderTextColor={colors.textMuted}
              value={nama}
              onChangeText={setNama}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="nama@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min. 8 karakter"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeEmoji}>{showPass ? '🐵' : '🙈'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Konfirmasi Password</Text>
          <View style={[
            styles.inputWrap,
            konfirmasi && password !== konfirmasi && styles.inputError,
          ]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ulangi password"
              placeholderTextColor={colors.textMuted}
              value={konfirmasi}
              onChangeText={setKonfirmasi}
              secureTextEntry={!showPass}
            />
          </View>
          {konfirmasi && password !== konfirmasi && (
            <Text style={styles.errorText}>Password tidak cocok.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.btnPrimaryText}>{loading ? 'Mendaftar...' : 'Daftar Sekarang →'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Sudah punya akun? <Text style={styles.linkBold}>Masuk</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 28, paddingTop: 60, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 28, fontWeight: '800', color: colors.text },
  logoAccent: { color: colors.red },

  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subheading: { fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 20 },

  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.white, paddingHorizontal: 12,
  },
  inputError: { borderColor: '#EF4444' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 15, color: colors.text },
  eyeBtn: { padding: 4 },
  eyeEmoji: { fontSize: 20 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 5 },

  btnPrimary: {
    backgroundColor: colors.red, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginTop: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  linkRow: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: 14, color: colors.textMuted },
  linkBold: { color: colors.text, fontWeight: '700' },
});
