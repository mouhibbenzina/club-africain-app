import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../../constants/theme';

const PREDICTION_MATCH = { home: 'Club Africain', away: 'Espérance ST' };

export default function PredictionScreen() {
  const handleValidate = () => {
    // TODO: submit to Supabase via gameStore
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
        <View style={styles.scoreRow}>
          <TouchableOpacity style={styles.scoreBtn}><Text style={styles.scoreBtnText}>-</Text></TouchableOpacity>
          <Text style={styles.score}>2</Text>
          <TouchableOpacity style={styles.scoreBtn}><Text style={styles.scoreBtnText}>+</Text></TouchableOpacity>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.scoreRow}>
          <TouchableOpacity style={styles.scoreBtn}><Text style={styles.scoreBtnText}>-</Text></TouchableOpacity>
          <Text style={styles.score}>1</Text>
          <TouchableOpacity style={styles.scoreBtn}><Text style={styles.scoreBtnText}>+</Text></TouchableOpacity>
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
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 24, marginTop: 40 },
  team: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', flex: 1, textAlign: 'center' },
  vs: { color: Colors.textSecondary, fontSize: FontSize.body, fontWeight: '800', marginHorizontal: 8 },
  scoreRow: { alignItems: 'center', gap: 8 },
  score: { color: Colors.textPrimary, fontSize: 36, fontWeight: '900' },
  scoreBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  scoreBtnText: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  validateBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, marginHorizontal: 24, alignItems: 'center', marginTop: 40 },
  validateText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
});
