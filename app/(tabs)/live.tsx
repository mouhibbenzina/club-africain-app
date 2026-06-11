import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMatchStore } from '../../stores/matchStore';
import { MatchCard } from '../../components/MatchCard';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function LiveScreen() {
  const { liveMatch, upcomingMatches, pastMatches, fetchMatches } = useMatchStore();

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live</Text>
      </View>

      {liveMatch ? (
        <MatchCard
          home={liveMatch.home_team}
          away={liveMatch.away_team}
          viewers={liveMatch.viewers}
          is_live={liveMatch.is_live}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📺</Text>
          <Text style={styles.emptyText}>Aucun match en direct</Text>
          <Text style={styles.emptySub}>Revenez pendant un match pour regarder</Text>
        </View>
      )}

      {upcomingMatches.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>À venir</Text>
          {upcomingMatches.map((m) => (
            <View key={m.id} style={styles.matchRow}>
              <View style={styles.teamCol}>
                <Text style={styles.teamName}>{m.home_team}</Text>
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchDate}>{new Date(m.date).toLocaleDateString()}</Text>
                <Text style={styles.matchVenue}>{m.venue}</Text>
              </View>
              <View style={styles.teamCol}>
                <Text style={styles.teamName}>{m.away_team}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {pastMatches.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Résultats</Text>
          {pastMatches.map((m) => (
            <View key={m.id} style={styles.matchRow}>
              <View style={styles.teamCol}>
                <Text style={styles.teamName}>{m.home_team}</Text>
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.scoreText}>{m.home_score} - {m.away_score}</Text>
                <Text style={styles.matchVenue}>{m.venue}</Text>
              </View>
              <View style={styles.teamCol}>
                <Text style={styles.teamName}>{m.away_team}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '600' },
  emptySub: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginTop: 8 },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  matchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 8, borderRadius: Radius.card, padding: 16 },
  teamCol: { flex: 1, alignItems: 'center' },
  teamName: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600', textAlign: 'center' },
  matchInfo: { alignItems: 'center', paddingHorizontal: 12 },
  matchDate: { color: Colors.textSecondary, fontSize: FontSize.caption },
  matchVenue: { color: Colors.textSecondary, fontSize: FontSize.caption },
  scoreText: { color: Colors.primary, fontSize: FontSize.title, fontWeight: '800' },
});
