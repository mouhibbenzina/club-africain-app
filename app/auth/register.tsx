import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { signUp } = useAuthStore();

  const handleRegister = async () => {
    try {
      setError('');
      await signUp(email, password, username);
      router.back();
    } catch (e: any) {
      setError(e.message || "Erreur d'inscription");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Créer un compte</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="Nom d'utilisateur" placeholderTextColor={Colors.textSecondary} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor={Colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
        <Text style={styles.primaryBtnText}>S'inscrire</Text>
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
});
