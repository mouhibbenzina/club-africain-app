import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/authStore';
import { useGameStore } from '../../../stores/gameStore';
import { Colors, FontSize, Radius } from '../../../constants/theme';

const PREDICTION_MATCH = { id: 1, home: 'Club Africain', away: 'Espérance ST' };

export default function PredictionScreen() {
  const user = useAuthStore((s) => s.user);
  const { submitPrediction } = useGameStore();
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  const handleValidate = async () => {
    if (!user) return;
    await submitPrediction(user.id, PREDICTION_MATCH.id, homeScore, awayScore);
    Alert.alert('Prédiction envoyée', `${PREDICTION_MATCH.home} ${homeScore} - ${awayScore} ${PREDICTION_MATCH.away}`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prédiction</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.matchRow}>
        <Text style={styles.team}>{PREDICTION_MATCH.home}</Text>
        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>Domicile</Text>
          <View style={styles.scoreRow}>
            <TouchableOpacity style={styles.scoreBtn} onPress={() => setHomeScore(Math.max(0, homeScore - 1))}>
              <Text style={styles.scoreBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.score}>{homeScore}</Text>
            <TouchableOpacity style={styles.scoreBtn} onPress={() => setHomeScore(homeScore + 1)}>
              <Text style={styles.scoreBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>Extérieur</Text>
          <View style={styles.scoreRow}>
            <TouchableOpacity style={styles.scoreBtn} onPress={() => setAwayScore(Math.max(0, awayScore - 1))}>
              <Text style={styles.scoreBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.score}>{awayScore}</Text>
            <TouchableOpacity style={styles.scoreBtn} onPress={() => setAwayScore(awayScore + 1)}>
              <Text style={styles.scoreBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.team}>{PREDICTION_MATCH.away}</Text>
      </View>

      <TouchableOpacity style={styles.validateBtn} onPress={handleValidate}>
        <Text style={styles.validateText}>Valider</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  matchRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', padding: 16, marginTop: 40 },
  team: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', flex: 1, textAlign: 'center', marginTop: 24 },
  vs: { color: Colors.textSecondary, fontSize: FontSize.body, fontWeight: '800', marginHorizontal: 8, marginTop: 24 },
  scoreColumn: { alignItems: 'center', gap: 8 },
  scoreLabel: { color: Colors.textSecondary, fontSize: FontSize.caption, fontWeight: '600', textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  score: { color: Colors.textPrimary, fontSize: 36, fontWeight: '900', minWidth: 40, textAlign: 'center' },
  scoreBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  scoreBtnText: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  validateBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, marginHorizontal: 24, alignItems: 'center', marginTop: 40 },
  validateText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
});
