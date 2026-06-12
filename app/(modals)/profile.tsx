import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius } from '../../constants/theme';
import { API, testConnection } from '../../constants/api';
import { api } from '../../services/localApi';

export default function ProfileModal() {
  const { user, signOut } = useAuthStore();
  const [connStatus, setConnStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(api.connected);

  useEffect(() => {
    const unsub = api.onConnectionChange((v) => setConnected(v));
    return () => { unsub(); };
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnStatus(null);
    const result = await testConnection();
    setConnStatus(result);
    setTesting(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.username || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{user?.username || 'Utilisateur'}</Text>
        <Text style={styles.role}>Vrai supporter</Text>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Matchs vus', value: '48' },
          { label: 'Prédictions', value: '32' },
          { label: 'Score moyen', value: '85%' },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.menuSection}>
        {['Mes tickets', 'Mes équipes', 'Mes récompenses'].map((item) => (
          <TouchableOpacity key={item} style={styles.menuRow}>
            <Text style={styles.menuText}>{item}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.menuSection}>
        {['Paramètres', 'Aide & Support'].map((item) => (
          <TouchableOpacity key={item} style={styles.menuRow}>
            <Text style={styles.menuText}>{item}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>🔧 Diagnostic connexion</Text>
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Statut</Text>
          <View style={[styles.statusDot, { backgroundColor: connected ? Colors.green : Colors.primary }]} />
          <Text style={styles.debugValue}>{connected ? 'Connecté' : 'Déconnecté'}</Text>
        </View>
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Serveur</Text>
          <Text style={styles.debugValue} numberOfLines={1}>{API.BASE_URL}</Text>
        </View>
        {connStatus && (
          <Text style={[styles.debugMessage, { color: connStatus.ok ? Colors.green : Colors.primary }]}>
            {connStatus.message}
          </Text>
        )}
        <TouchableOpacity style={styles.testBtn} onPress={handleTestConnection} disabled={testing}>
          {testing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.testBtnText}>Tester la connexion</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  profileCard: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: Colors.white, fontSize: 24, fontWeight: '900' },
  username: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  role: { color: Colors.textSecondary, fontSize: FontSize.body },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: Radius.card, padding: 16, marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '800' },
  statLabel: { color: Colors.textSecondary, fontSize: FontSize.caption },
  menuSection: { marginHorizontal: 16, marginBottom: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, marginBottom: 8 },
  menuText: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  logoutBtn: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginHorizontal: 16, padding: 16, alignItems: 'center', marginTop: 12 },
  logoutText: { color: Colors.primary, fontSize: FontSize.subtitle, fontWeight: '700' },
  debugSection: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16 },
  debugTitle: { color: Colors.textSecondary, fontSize: FontSize.caption, marginBottom: 12, fontWeight: '700', textTransform: 'uppercase' },
  debugRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  debugLabel: { color: Colors.textSecondary, fontSize: FontSize.body, flex: 1 },
  debugValue: { color: Colors.textPrimary, fontSize: FontSize.body, flex: 2, textAlign: 'right' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  debugMessage: { fontSize: FontSize.caption, marginTop: 4, marginBottom: 8 },
  testBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 12, alignItems: 'center', marginTop: 8 },
  testBtnText: { color: Colors.white, fontSize: FontSize.body, fontWeight: '700' },
});
