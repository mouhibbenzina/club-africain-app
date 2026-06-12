import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSportStore } from '../../stores/sportStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, EmptyState, ConnectionBanner } from '../../components/StateViews';

const statusConfig: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  live: { label: 'EN DIRECT', icon: 'radio', color: Colors.primary },
  upcoming: { label: 'À VENIR', icon: 'calendar', color: Colors.gold },
  finished: { label: 'TERMINÉ', icon: 'checkmark-circle', color: Colors.green },
};

export default function MatchesScreen() {
  const { sports, activeSportId, setActiveSport, matches, liveMatches, fetchSports, fetchMatches, fetchLiveScores, error, isLoading } = useSportStore();
  const [activeStatus, setActiveStatus] = useState<string>('live');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    fetchSports();
    fetchLiveScores();
    fetchMatches(activeSportId || undefined, activeStatus);
  }, [activeSportId, activeStatus]);

  useEffect(() => {
    load();
    const interval = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchMatches(activeSportId || undefined, activeStatus);
  }, [activeSportId, activeStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSports(), fetchLiveScores(), fetchMatches(activeSportId || undefined, activeStatus)]);
    setRefreshing(false);
  }, [activeSportId, activeStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Match Center</Text>
        <Text style={styles.headerSub}>Toutes les sections</Text>
      </View>

      <ConnectionBanner />
      {error && <ErrorBanner message={error} onRetry={load} />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportStrip} contentContainerStyle={styles.sportStripContent}>
        <TouchableOpacity style={[styles.sportChip, activeSportId === null && styles.sportChipActive]} onPress={() => setActiveSport(null)}>
          <Ionicons name="grid" size={16} color={activeSportId === null ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.sportChipText, activeSportId === null && styles.sportChipTextActive]}>Tous</Text>
        </TouchableOpacity>
        {sports.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sportChip, activeSportId === s.id && { backgroundColor: s.color }]}
            onPress={() => setActiveSport(s.id)}
          >
            <Ionicons name={(s.icon || 'football') as any} size={16} color={activeSportId === s.id ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.sportChipText, activeSportId === s.id && styles.sportChipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusStrip} contentContainerStyle={styles.statusStripContent}>
        {['live', 'upcoming', 'finished'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.statusChip, activeStatus === s && styles.statusChipActive]}
            onPress={() => setActiveStatus(s)}
          >
            <Ionicons name={statusConfig[s]?.icon || 'calendar'} size={14} color={activeStatus === s ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.statusChipText, activeStatus === s && { color: Colors.primary }]}>
              {statusConfig[s]?.label || s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {activeStatus === 'live' && liveMatches.length > 0 && (
          <View style={styles.liveNowSection}>
            <Text style={styles.sectionLabel}>En ce moment</Text>
            {liveMatches.map((m) => (
              <TouchableOpacity key={m.id} style={[styles.matchCard, Shadow.card]}>
                <View style={styles.matchCardHeader}>
                  <View style={[styles.sportBadge, { backgroundColor: (m as any).sport_color || Colors.primary }]}>
                    <Text style={styles.sportBadgeText}>{(m as any).sport_label}</Text>
                  </View>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveIndicatorText}>LIVE</Text>
                  </View>
                </View>
                <View style={styles.matchTeams}>
                  <Text style={styles.teamName}>{m.home_team}</Text>
                  <View style={styles.scoreBox}>
                    {m.home_score !== null && m.home_score !== undefined ? (
                      <Text style={styles.scoreText}>{m.home_score} - {m.away_score}</Text>
                    ) : (
                      <Text style={styles.scorePlaceholder}>VS</Text>
                    )}
                  </View>
                  <Text style={styles.teamName}>{m.away_team}</Text>
                </View>
                <View style={styles.matchFooter}>
                  <View style={styles.matchMeta}>
                    <Ionicons name="people" size={12} color={Colors.textSecondary} />
                    <Text style={styles.matchMetaText}>{(m.viewers || 0) > 1000 ? `${(m.viewers! / 1000).toFixed(1)}K` : m.viewers || 0}</Text>
                  </View>
                  <Text style={styles.matchCompetition}>{(m as any).competition}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isLoading && matches.length === 0 && activeStatus !== 'live' && (
          <EmptyState icon="calendar-outline" title={`Aucun match ${statusConfig[activeStatus]?.label.toLowerCase()}`} />
        )}

        {isLoading && matches.length === 0 && (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonRow, { opacity: 1 - (i - 1) * 0.2 }]}>
                <View style={styles.skeletonBar} />
              </View>
            ))}
          </View>
        )}

        {matches.map((m) => (
          <TouchableOpacity key={m.id} style={[styles.matchRow, Shadow.card]}>
            <View style={[styles.miniBadge, { backgroundColor: (m as any).sport_color || Colors.primary }]}>
              <Text style={styles.miniBadgeText}>{(m as any).sport_label || 'Sport'}</Text>
            </View>
            <View style={styles.matchRowTeams}>
              <Text style={styles.teamNameSmall} numberOfLines={1}>{m.home_team}</Text>
              <Text style={styles.matchRowScore}>
                {m.home_score !== null && m.home_score !== undefined ? `${m.home_score} - ${m.away_score}` : 'VS'}
              </Text>
              <Text style={styles.teamNameSmall} numberOfLines={1}>{m.away_team}</Text>
            </View>
            <View style={styles.matchRowMeta}>
              <Ionicons name="time" size={10} color={Colors.textMuted} />
              <Text style={styles.matchRowDate}>{new Date(m.date).toLocaleDateString('fr-FR')}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  headerSub: { color: Colors.textSecondary, fontSize: FontSize.label, marginTop: 2 },
  sportStrip: { maxHeight: 44, marginTop: 8 },
  sportStripContent: { paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' },
  sportChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  sportChipActive: { backgroundColor: Colors.primary },
  sportChipText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '600' },
  sportChipTextActive: { color: Colors.white },
  statusStrip: { maxHeight: 40, marginTop: 8 },
  statusStripContent: { paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  statusChipActive: { borderColor: Colors.primary, backgroundColor: '#1A0000' },
  statusChipText: { color: Colors.textSecondary, fontSize: FontSize.caption, fontWeight: '600' },
  list: { flex: 1, marginTop: 12 },
  liveNowSection: { marginBottom: 12 },
  sectionLabel: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: Spacing.lg, marginBottom: 10 },
  matchCard: { backgroundColor: Colors.surface, borderRadius: Radius.cardLg, marginHorizontal: Spacing.lg, marginBottom: 12, overflow: 'hidden' },
  matchCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 0 },
  sportBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  sportBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  liveIndicatorText: { color: Colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  matchTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  teamName: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', flex: 1, textAlign: 'center' },
  scoreBox: { alignItems: 'center', paddingHorizontal: 16 },
  scoreText: { color: Colors.primary, fontSize: 28, fontWeight: '900' },
  scorePlaceholder: { color: Colors.textMuted, fontSize: 14, fontWeight: '800' },
  matchFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingHorizontal: 16, backgroundColor: Colors.surfaceLight },
  matchMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchMetaText: { color: Colors.textSecondary, fontSize: FontSize.caption },
  matchCompetition: { color: Colors.textMuted, fontSize: FontSize.caption },
  matchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginBottom: 8, borderRadius: Radius.card, padding: 14, gap: 10 },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill },
  miniBadgeText: { color: Colors.white, fontSize: 8, fontWeight: '700' },
  matchRowTeams: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  teamNameSmall: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600', flex: 1, textAlign: 'center' },
  matchRowScore: { color: Colors.textSecondary, fontSize: FontSize.body, fontWeight: '700', paddingHorizontal: 12 },
  matchRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchRowDate: { color: Colors.textMuted, fontSize: FontSize.caption },
  skeletonContainer: { padding: Spacing.lg, gap: 12 },
  skeletonRow: { height: 72, backgroundColor: Colors.surface, borderRadius: Radius.card },
  skeletonBar: { flex: 1 },
});
