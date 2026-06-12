import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../stores/playerStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, LoadingSkeleton } from '../../components/StateViews';

const positionLabels: Record<string, string> = {
  G: 'Gardien', D: 'Défenseur', M: 'Milieu', A: 'Attaquant',
};

export default function PlayerDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { selectedPlayer, fetchPlayer, isLoading, error } = usePlayerStore();

  useEffect(() => {
    if (id) fetchPlayer(Number(id));
  }, [id]);

  const p = selectedPlayer;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Joueur</Text>
      </View>

      {error && <ErrorBanner message={error} />}

      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading && !p && <LoadingSkeleton lines={6} />}

        {p && (
          <>
            <View style={styles.hero}>
              <View style={styles.heroJersey}>
                <Text style={styles.heroNum}>{p.number || '?'}</Text>
              </View>
              <Text style={styles.heroName}>{p.name}</Text>
              <View style={[styles.sportTag, { backgroundColor: Colors.primary }]}>
                <Text style={styles.sportTagText}>{p.sport_label}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={[styles.infoCard, Shadow.card]}>
                <Ionicons name="shirt" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Position</Text>
                <Text style={styles.infoValue}>{positionLabels[p.position || ''] || p.position || '-'}</Text>
              </View>
              <View style={[styles.infoCard, Shadow.card]}>
                <Ionicons name="flag" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Nationalité</Text>
                <Text style={styles.infoValue}>{p.nationality || '-'}</Text>
              </View>
              <View style={[styles.infoCard, Shadow.card]}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Âge</Text>
                <Text style={styles.infoValue}>{p.age || '-'} ans</Text>
              </View>
            </View>

            {p.stats && p.stats !== '{}' && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Statistiques</Text>
                <View style={[styles.statsCard, Shadow.card]}>
                  <Text style={styles.statsPlaceholder}>Données à venir</Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  heroJersey: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.cardLg },
  heroNum: { color: Colors.white, fontSize: 32, fontWeight: '900' },
  heroName: { color: Colors.textPrimary, fontSize: FontSize.display, fontWeight: '800' },
  sportTag: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: Radius.pill },
  sportTagText: { color: Colors.white, fontSize: FontSize.label, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 10, marginTop: 16 },
  infoCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, alignItems: 'center', gap: 6 },
  infoLabel: { color: Colors.textMuted, fontSize: FontSize.caption },
  infoValue: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700', textAlign: 'center' },
  statsSection: { marginTop: 24, paddingHorizontal: Spacing.lg },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  statsCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 24, alignItems: 'center' },
  statsPlaceholder: { color: Colors.textMuted, fontSize: FontSize.body },
});
