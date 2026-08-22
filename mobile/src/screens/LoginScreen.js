import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants';

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('', 'Email wajib diisi.'); return; }
    if (!password) { Alert.alert('', 'Password wajib diisi.'); return; }

    const result = await login(email.trim(), password);
    if (!result.ok) Alert.alert('Login Gagal', result.message);
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
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>TITIP<Text style={styles.logoAccent}>.JP</Text></Text>
          <Text style={styles.logoSub}>Personal Shopper · Jepang → Indonesia</Text>
        </View>

        <Text style={styles.heading}>Masuk ke Akun</Text>

        {/* Email */}
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

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeEmoji}>{showPass ? '🐵' : '🙈'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnPrimaryText}>{loading ? 'Masuk...' : 'Masuk →'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.btnSecondaryText}>Buat Akun Baru</Text>
        </TouchableOpacity>

        <Text style={styles.demo}>
          Demo: masukkan email & password apapun untuk coba tampilan.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 28, paddingTop: 60, paddingBottom: 40 },

  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: '800', color: colors.text },
  logoAccent: { color: colors.red },
  logoSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, letterSpacing: 0.5 },

  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 24 },

  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    backgroundColor: colors.white, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 15, color: colors.text },
  eyeBtn: { padding: 4 },
  eyeEmoji: { fontSize: 20 },

  btnPrimary: {
    backgroundColor: colors.red, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginTop: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: colors.textMuted },

  btnSecondary: {
    borderWidth: 1.5, borderColor: colors.text, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  btnSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 15 },

  demo: {
    fontSize: 11, color: colors.textMuted, textAlign: 'center',
    marginTop: 24, lineHeight: 18,
  },
});
