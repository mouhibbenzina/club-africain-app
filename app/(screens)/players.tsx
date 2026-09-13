import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../stores/playerStore';
import { useSportStore } from '../../stores/sportStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, EmptyState, ConnectionBanner } from '../../components/StateViews';

const positionLabels: Record<string, string> = {
  G: 'Gardien', D: 'Défenseur', M: 'Milieu', A: 'Attaquant',
};

export default function PlayersScreen() {
  const params = useLocalSearchParams();
  const sportId = params.sportId as string | undefined;
  const { players, fetchPlayers, error } = usePlayerStore();
  const { sports } = useSportStore();
  const [activeSport, setActiveSport] = useState<number | undefined>(sportId ? Number(sportId) : undefined);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => { fetchPlayers(activeSport); }, [activeSport]);
  useEffect(() => { load(); }, [activeSport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlayers(activeSport);
    setRefreshing(false);
  }, [activeSport]);

  const grouped = players.reduce((acc: Record<string, typeof players>, p) => {
    const pos = p.position || 'X';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Effectif</Text>
          <Text style={styles.headerSub}>Joueurs par section</Text>
        </View>
      </View>

      <ConnectionBanner />
      {error && <ErrorBanner message={error} onRetry={load} />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportStrip} contentContainerStyle={styles.sportStripContent}>
        {sports.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.sportChip, activeSport === s.id && { backgroundColor: s.color }]} onPress={() => setActiveSport(s.id)}>
            <Ionicons name={(s.icon || 'football') as any} size={14} color={activeSport === s.id ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.sportChipText, activeSport === s.id && { color: Colors.white }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {players.length === 0 && !error && (
          <EmptyState icon="people-outline" title="Aucun joueur" subtitle="Sélectionnez une section" />
        )}

        {Object.entries(grouped).map(([pos, posPlayers]) => (
          <View key={pos}>
            <Text style={styles.posHeader}>{positionLabels[pos] || pos}</Text>
            {posPlayers.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.playerRow, Shadow.card]} onPress={() => router.push(`/(screens)/player-detail?id=${p.id}`)}>
                <View style={styles.jerseyCircle}>
                  <Text style={styles.jerseyNum}>{p.number || '?'}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerMeta}>{p.nationality} · {p.age} ans</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

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
  headerSub: { color: Colors.textSecondary, fontSize: FontSize.label, marginTop: 2 },
  sportStrip: { maxHeight: 40, marginTop: 8 },
  sportStripContent: { paddingHorizontal: Spacing.lg, gap: 8 },
  sportChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  sportChipText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '600' },
  list: { flex: 1, marginTop: 12 },
  posHeader: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: Spacing.lg, marginBottom: 8, marginTop: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginBottom: 6, borderRadius: Radius.card, padding: 12, gap: 12 },
  jerseyCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  jerseyNum: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '900' },
  playerInfo: { flex: 1 },
  playerName: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700' },
  playerMeta: { color: Colors.textMuted, fontSize: FontSize.caption, marginTop: 2 },
});
