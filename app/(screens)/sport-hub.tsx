import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSportStore } from '../../stores/sportStore';
import { usePlayerStore } from '../../stores/playerStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, ConnectionBanner } from '../../components/StateViews';

export default function SportHubScreen() {
  const params = useLocalSearchParams();
  const sportId = params.sportId as string;
  const { sports, matches, fetchMatches } = useSportStore();
  const { standings, fetchStandings, players, fetchPlayers } = usePlayerStore();
  const [refreshing, setRefreshing] = useState(false);

  const sport = sports.find(s => s.id === Number(sportId));
  const color = sport?.color || Colors.primary;

  const load = useCallback(async () => {
    const id = Number(sportId);
    await Promise.all([
      fetchMatches(id),
      fetchStandings(id, '2025-2026'),
      fetchPlayers(id),
    ]);
  }, [sportId]);

  useEffect(() => { load(); }, [sportId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!sport) return null;

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcoming = matches.filter(m => m.status === 'upcoming').slice(0, 3);
  const topStandings = standings.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.sportIcon, { backgroundColor: color }]}>
          <Ionicons name={(sport.icon || 'football') as any} size={20} color={Colors.white} />
        </View>
        <Text style={styles.headerTitle}>{sport.label}</Text>
      </View>

      <ConnectionBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color} colors={[color]} />}
      >
        {/* Live / Upcoming Matches */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="football" size={14} color={color} /> Matchs
          </Text>
          {liveMatches.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.miniCard, Shadow.card, { borderLeftColor: color }]}
              onPress={() => router.push(`/(screens)/match-detail?id=${m.id}`)}
            >
              <View style={styles.miniCardTop}>
                <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
                <Text style={styles.competitionLabel}>{m.competition}</Text>
              </View>
              <Text style={styles.matchup}>{m.home_team} vs {m.away_team}</Text>
              <Text style={styles.viewerLabel}>{(m.viewers || 0) > 1000 ? `${(m.viewers! / 1000).toFixed(1)}K` : m.viewers || 0} viewers</Text>
            </TouchableOpacity>
          ))}
          {upcoming.map(m => (
            <TouchableOpacity key={m.id} style={[styles.miniCard, Shadow.card, { borderLeftColor: color }]}>
              <Text style={styles.matchup}>{m.home_team} vs {m.away_team}</Text>
              <Text style={styles.matchDate}>{new Date(m.date).toLocaleDateString('fr-FR')} · {m.competition}</Text>
            </TouchableOpacity>
          ))}
          {matches.length === 0 && (
            <Text style={styles.emptyText}>Aucun match à venir</Text>
          )}
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/(tabs)/matches')}>
            <Text style={[styles.seeAllText, { color }]}>Voir tous les matchs</Text>
          </TouchableOpacity>
        </View>

        {/* Standings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="trophy" size={14} color={color} /> Classement
          </Text>
          {topStandings.map((row, idx) => (
            <View key={row.id} style={styles.standingRow}>
              <Text style={[styles.rankText, { color: idx < 3 ? color : Colors.textMuted }]}>{idx + 1}</Text>
              <Text style={styles.standingTeam} numberOfLines={1}>{row.team_name}</Text>
              <Text style={styles.standingPts}>{row.points} pts</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push(`/(screens)/standings?sportId=${sportId}`)}>
            <Text style={[styles.seeAllText, { color }]}>Classement complet</Text>
          </TouchableOpacity>
        </View>

        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            <Ionicons name="people" size={14} color={color} /> Effectif
          </Text>
          {players.slice(0, 5).map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.playerMiniRow}
              onPress={() => router.push(`/(screens)/player-detail?id=${p.id}`)}
            >
              <View style={[styles.miniJersey, { backgroundColor: color }]}>
                <Text style={styles.miniJerseyText}>{p.number || '?'}</Text>
              </View>
              <Text style={styles.playerMiniName}>{p.name}</Text>
              <Text style={styles.playerMiniPos}>{p.position}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push(`/(screens)/players?sportId=${sportId}`)}>
            <Text style={[styles.seeAllText, { color }]}>Tout l'effectif</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 12 },
  backBtn: { padding: 4 },
  sportIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  section: { paddingHorizontal: Spacing.lg, marginTop: 20 },
  sectionLabel: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', marginBottom: 10 },
  miniCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  miniCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  liveBadge: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  liveBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  competitionLabel: { color: Colors.textMuted, fontSize: FontSize.caption },
  matchup: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700' },
  viewerLabel: { color: Colors.textMuted, fontSize: FontSize.caption, marginTop: 4 },
  matchDate: { color: Colors.textMuted, fontSize: FontSize.caption, marginTop: 4 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, textAlign: 'center', padding: 20 },
  seeAllBtn: { paddingVertical: 10, alignItems: 'center' },
  seeAllText: { fontSize: FontSize.body, fontWeight: '700' },
  standingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: 10, marginBottom: 4, gap: 10 },
  rankText: { fontSize: FontSize.label, fontWeight: '800', width: 20 },
  standingTeam: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  standingPts: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '800' },
  playerMiniRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: 10, marginBottom: 4, gap: 10 },
  miniJersey: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  miniJerseyText: { color: Colors.white, fontSize: FontSize.caption, fontWeight: '800' },
  playerMiniName: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  playerMiniPos: { color: Colors.textMuted, fontSize: FontSize.caption },
});
