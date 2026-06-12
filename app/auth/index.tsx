import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, isLoading } = useAuthStore();

  const handleLogin = async () => {
    try {
      setError('');
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message || 'Erreur de connexion');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.top}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>CA</Text>
        </View>
        <Text style={styles.brand}>CLUB AFRICAIN</Text>
        <Text style={styles.tagline}>Vivez votre passion comme jamais</Text>
      </View>

      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={Colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />
        <TouchableOpacity style={[styles.primaryBtn, isLoading && styles.btnDisabled]} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Se connecter</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push('/auth/register')} disabled={isLoading}>
          <Text style={styles.ghostBtnText}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', padding: 24 },
  top: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: Colors.white, fontSize: 28, fontWeight: '900' },
  brand: { color: Colors.textPrimary, fontSize: FontSize.display, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: Colors.textSecondary, fontSize: FontSize.body, marginTop: 8 },
  form: { gap: 12 },
  input: { backgroundColor: Colors.surface, borderRadius: Radius.btn, padding: 16, color: Colors.textPrimary, fontSize: FontSize.body },
  error: { color: Colors.primary, fontSize: FontSize.body, textAlign: 'center' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  ghostBtn: { borderRadius: Radius.btn, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  ghostBtnText: { color: Colors.primary, fontSize: FontSize.subtitle, fontWeight: '700' },
});
