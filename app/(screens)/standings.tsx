import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../stores/playerStore';
import { useSportStore } from '../../stores/sportStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, EmptyState, ConnectionBanner } from '../../components/StateViews';

export default function StandingsScreen() {
  const params = useLocalSearchParams();
  const sportId = params.sportId as string | undefined;
  const { standings, fetchStandings, error } = usePlayerStore();
  const { sports } = useSportStore();
  const [activeSport, setActiveSport] = useState<number | undefined>(sportId ? Number(sportId) : undefined);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    fetchStandings(activeSport, '2025-2026');
  }, [activeSport]);

  useEffect(() => { load(); }, [activeSport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStandings(activeSport, '2025-2026');
    setRefreshing(false);
  }, [activeSport]);

  const posColor = (idx: number) => {
    if (idx === 0) return Colors.gold;
    if (idx <= 3) return Colors.primary;
    return Colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Classement</Text>
          <Text style={styles.headerSub}>Saison 2025-2026</Text>
        </View>
      </View>

      <ConnectionBanner />
      {error && <ErrorBanner message={error} onRetry={load} />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportStrip} contentContainerStyle={styles.sportStripContent}>
        {sports.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.sportChip, activeSport === s.id && { backgroundColor: s.color }]} onPress={() => setActiveSport(s.id)}>
            <Text style={[styles.sportChipText, activeSport === s.id && { color: Colors.white }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {standings.length === 0 && !error && (
          <EmptyState icon="trophy-outline" title="Aucun classement disponible" />
        )}

        {standings.map((row, idx) => (
          <View key={row.id} style={[styles.rankRow, Shadow.card, activeSport ? { borderLeftColor: sports.find(s => s.id === activeSport)?.color || Colors.primary } : {}]}>
            <View style={[styles.posBadge, { backgroundColor: posColor(idx) }]}>
              <Text style={styles.posText}>{idx + 1}</Text>
            </View>
            <Text style={styles.teamName} numberOfLines={1}>{row.team_name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statLabel}>J</Text><Text style={styles.statVal}>{row.played}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>G</Text><Text style={styles.statVal}>{row.won}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>N</Text><Text style={styles.statVal}>{row.drawn}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>P</Text><Text style={styles.statVal}>{row.lost}</Text></View>
              <View style={styles.stat}><Text style={[styles.statLabel, { color: Colors.textMuted }]}>+/-</Text><Text style={styles.statVal}>{row.goals_for - row.goals_against}</Text></View>
              <View style={[styles.stat, styles.pointsStat]}>
                <Text style={styles.pointsText}>{row.points}</Text>
              </View>
            </View>
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
  sportChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  sportChipText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '600' },
  list: { flex: 1, marginTop: 12 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginBottom: 8,
    borderRadius: Radius.card, padding: 12, gap: 10,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  posBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  posText: { color: Colors.white, fontSize: FontSize.label, fontWeight: '800' },
  teamName: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700', flex: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stat: { alignItems: 'center', minWidth: 24 },
  statLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600' },
  statVal: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700', marginTop: 1 },
  pointsStat: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  pointsText: { color: Colors.primary, fontSize: FontSize.subtitle, fontWeight: '900' },
});
