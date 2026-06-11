import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../constants/theme';

const MISSIONS = [
  { id: 'login', label: 'Se connecter', coins: 20, completed: true, claimed: false },
  { id: 'watch_ad', label: 'Regarder 1 pub', coins: 50, completed: true, claimed: false },
  { id: 'predict', label: 'Prédire un match', coins: 30, completed: false, progress: '0/1' },
  { id: 'team', label: 'Composer équipe', coins: 40, completed: false, progress: '0/1' },
  { id: 'share', label: "Partager l'app", coins: 25, completed: false, progress: '0/1' },
];

export default function MissionsModal() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mission Quotidienne</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {MISSIONS.map((m) => (
        <View key={m.id} style={styles.missionRow}>
          <View style={[styles.missionIcon, m.completed && styles.missionDone]}>
            {m.completed ? <Ionicons name="checkmark" size={18} color={Colors.white} /> : <View style={styles.emptyCircle} />}
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionLabel}>{m.label}</Text>
            <Text style={styles.missionCoins}>+{m.coins} Coins</Text>
          </View>
          {m.completed && !m.claimed ? (
            <TouchableOpacity style={styles.claimBtn}>
              <Text style={styles.claimText}>Récupérer</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.progressText}>{m.progress || 'Fait'}</Text>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.claimAllBtn}>
        <Text style={styles.claimAllText}>Tout récupérer 70🪙</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  missionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 8, borderRadius: Radius.card, padding: 16 },
  missionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  missionDone: { backgroundColor: Colors.green },
  emptyCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.textSecondary },
  missionInfo: { flex: 1 },
  missionLabel: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  missionCoins: { color: Colors.gold, fontSize: FontSize.caption },
  claimBtn: { backgroundColor: Colors.green, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.pill },
  claimText: { color: Colors.white, fontSize: FontSize.caption, fontWeight: '700' },
  progressText: { color: Colors.textSecondary, fontSize: FontSize.caption },
  claimAllBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, marginHorizontal: 16, marginTop: 12, alignItems: 'center' },
  claimAllText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
});
