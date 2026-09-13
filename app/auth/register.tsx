import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius } from '../../constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const { signUp, isLoading } = useAuthStore();

  const usernameOk = username.trim().length >= 3;
  const emailOk = EMAIL_RE.test(email.trim());
  const passwordOk = password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  const confirmOk = password.length > 0 && password === confirm;
  const canSubmit = usernameOk && emailOk && passwordOk && confirmOk && !isLoading;

  const handleRegister = async () => {
    if (!canSubmit) return;
    try {
      setError('');
      await signUp(email.trim(), password, username.trim());
      router.back();
    } catch (e: any) {
      setError(e.message || "Erreur d'inscription");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Créer un compte</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="Nom d'utilisateur (min. 3 caractères)" placeholderTextColor={Colors.textSecondary} value={username} onChangeText={setUsername} autoCapitalize="none" editable={!isLoading} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
      <TextInput style={styles.input} placeholder="Mot de passe (8+ caractères, lettre et chiffre)" placeholderTextColor={Colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry editable={!isLoading} />
      <TextInput style={styles.input} placeholder="Confirmer le mot de passe" placeholderTextColor={Colors.textSecondary} value={confirm} onChangeText={setConfirm} secureTextEntry editable={!isLoading} />
      {password.length > 0 && !passwordOk ? <Text style={styles.error}>Au moins 8 caractères, une lettre et un chiffre</Text> : null}
      {confirm.length > 0 && !confirmOk ? <Text style={styles.error}>Les mots de passe ne correspondent pas</Text> : null}
      <TouchableOpacity style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]} onPress={handleRegister} disabled={!canSubmit}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.primaryBtnText}>S'inscrire</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', padding: 24 },
  title: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.btn, padding: 16, color: Colors.textPrimary, fontSize: FontSize.body, marginBottom: 12 },
  error: { color: Colors.primary, fontSize: FontSize.body, textAlign: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
