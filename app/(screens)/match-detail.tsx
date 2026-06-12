import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSportStore } from '../../stores/sportStore';
import { useGameStore } from '../../stores/gameStore';
import { api } from '../../services/localApi';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, LoadingSkeleton } from '../../components/StateViews';

export default function MatchDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchLiveScores } = useSportStore();
  const { submitPrediction, votePlayer, votedMatches, predictions } = useGameStore();
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSportMatch(Number(id));
        setMatch(data);
      } catch (err: any) {
        setError(err.message || 'Erreur de chargement');
      }
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const isLive = match?.status === 'live';
  const isUpcoming = match?.status === 'upcoming';
  const isFinished = match?.status === 'finished';
  const voted = votedMatches.includes(Number(id));
  const predicted = predictions[Number(id)];

  const handlePredict = async () => {
    if (!homeScore || !awayScore) return;
    await submitPrediction('user', Number(id), Number(homeScore), Number(awayScore));
  };

  const handleVote = async (player: string) => {
    await votePlayer('user', Number(id), player);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match</Text>
      </View>

      {error && <ErrorBanner message={error} />}

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && <LoadingSkeleton lines={6} />}

        {match && (
          <>
            <View style={styles.hero}>
              <Text style={styles.competition}>{match.competition || 'Match'}</Text>
              <View style={styles.teamsRow}>
                <View style={styles.teamCol}>
                  <View style={styles.teamBadge}><Text style={styles.badgeText}>CA</Text></View>
                  <Text style={styles.teamName}>{match.home_team}</Text>
                </View>
                <View style={styles.scoreCol}>
                  {isLive && <View style={styles.liveDot} />}
                  <Text style={styles.scoreText}>
                    {isFinished || isLive ? `${match.home_score ?? '?'} - ${match.away_score ?? '?'}` : 'VS'}
                  </Text>
                  <Text style={styles.statusText}>
                    {isLive ? 'EN DIRECT' : isFinished ? 'TERMINÉ' : new Date(match.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.teamCol}>
                  <View style={[styles.teamBadge, { backgroundColor: Colors.bg }]}>
                    <Text style={[styles.badgeText, { color: Colors.primary }]}>ADV</Text>
                  </View>
                  <Text style={styles.teamName}>{match.away_team}</Text>
                </View>
              </View>
              {match.venue && <Text style={styles.venue}>{match.venue}</Text>}
              {match.viewers > 0 && (
                <Text style={styles.viewers}>👁 {(match.viewers / 1000).toFixed(1)}K spectateurs</Text>
              )}
            </View>

            {isUpcoming && (
              <View style={[styles.section, Shadow.card]}>
                <Text style={styles.sectionTitle}>Prédire le score</Text>
                <View style={styles.predictRow}>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    value={homeScore}
                    onChangeText={setHomeScore}
                  />
                  <Text style={styles.predictVS}>-</Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                    value={awayScore}
                    onChangeText={setAwayScore}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.predictBtn, (!homeScore || !awayScore) && { opacity: 0.5 }]}
                  onPress={handlePredict}
                  disabled={!homeScore || !awayScore}
                >
                  <Text style={styles.predictBtnText}>
                    {predicted ? 'Prédiction mise à jour' : 'Valider la prédiction'}
                  </Text>
                </TouchableOpacity>
                {predicted && (
                  <Text style={styles.predictedText}>
                    Votre prédiction : {predicted.home} - {predicted.away}
                  </Text>
                )}
              </View>
            )}

            {isLive && !voted && (
              <View style={[styles.section, Shadow.card]}>
                <Text style={styles.sectionTitle}>Joueur du match</Text>
                <Text style={styles.sectionSub}>Votez pour le meilleur joueur</Text>
                <View style={styles.voteRow}>
                  {[match.home_team.split(' ').pop() || 'CA', match.away_team.split(' ').pop() || 'ADV'].map((team) => (
                    <TouchableOpacity key={team} style={styles.voteBtn} onPress={() => handleVote(team)}>
                      <Ionicons name="star" size={18} color={Colors.gold} />
                      <Text style={styles.voteBtnText}>{team}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {voted && (
              <View style={styles.votedBanner}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                <Text style={styles.votedText}>Vote enregistré ✓</Text>
              </View>
            )}

            <View style={{ height: 48 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 12, paddingHorizontal: Spacing.lg },
  competition: { color: Colors.textMuted, fontSize: FontSize.label, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%' },
  teamCol: { alignItems: 'center', flex: 1, gap: 8 },
  teamBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.white, fontSize: FontSize.title, fontWeight: '900' },
  teamName: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', textAlign: 'center' },
  scoreCol: { alignItems: 'center', gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  scoreText: { color: Colors.primary, fontSize: 32, fontWeight: '900' },
  statusText: { color: Colors.textMuted, fontSize: FontSize.caption, fontWeight: '600' },
  venue: { color: Colors.textSecondary, fontSize: FontSize.body },
  viewers: { color: Colors.textMuted, fontSize: FontSize.label },
  section: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: Radius.card, padding: 16, marginTop: 16 },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700' },
  sectionSub: { color: Colors.textMuted, fontSize: FontSize.caption, marginTop: 2 },
  predictRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 },
  scoreInput: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.btn, padding: 12, width: 64, color: Colors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  predictVS: { color: Colors.textMuted, fontSize: 20, fontWeight: '800' },
  predictBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 14, alignItems: 'center', marginTop: 16 },
  predictBtnText: { color: Colors.white, fontSize: FontSize.body, fontWeight: '700' },
  predictedText: { color: Colors.gold, fontSize: FontSize.body, textAlign: 'center', marginTop: 8 },
  voteRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surfaceLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.pill },
  voteBtnText: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  votedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0A2A12', marginHorizontal: Spacing.lg, borderRadius: Radius.card, padding: 14, marginTop: 16 },
  votedText: { color: Colors.green, fontSize: FontSize.body, fontWeight: '600' },
});
