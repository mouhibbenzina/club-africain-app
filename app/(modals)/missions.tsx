import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useMissionStore } from '../../stores/missionStore';
import { useBalanceStore } from '../../stores/balanceStore';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function MissionsModal() {
  const user = useAuthStore((s) => s.user);
  const { missions, isLoading, fetchMissions, claimMission, claimAll } = useMissionStore();
  const fetchBalance = useBalanceStore((s) => s.fetch);

  useEffect(() => {
    if (user) fetchMissions(user.id);
  }, [user]);

  const handleClaim = async (id: number) => {
    await claimMission(id);
    if (user) fetchBalance(user.id);
  };

  const handleClaimAll = async () => {
    await claimAll();
    if (user) fetchBalance(user.id);
  };

  const pendingCoins = missions
    .filter((m) => m.completed && !m.claimed)
    .reduce((sum, m) => sum + m.coins, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mission Quotidienne</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        missions.map((m) => (
          <View key={m.id} style={styles.missionRow}>
            <View style={[styles.missionIcon, m.completed && styles.missionDone]}>
              {m.completed ? <Ionicons name="checkmark" size={18} color={Colors.white} /> : <View style={styles.emptyCircle} />}
            </View>
            <View style={styles.missionInfo}>
              <Text style={styles.missionLabel}>{m.label}</Text>
              <Text style={styles.missionCoins}>+{m.coins} Coins</Text>
            </View>
            {m.completed && !m.claimed ? (
              <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaim(m.id)}>
                <Text style={styles.claimText}>Récupérer</Text>
              </TouchableOpacity>
            ) : m.claimed ? (
              <Text style={styles.claimedText}>Récupéré</Text>
            ) : (
              <Text style={styles.progressText}>{m.progress}</Text>
            )}
          </View>
        ))
      )}

      {pendingCoins > 0 && (
        <TouchableOpacity style={styles.claimAllBtn} onPress={handleClaimAll}>
          <Text style={styles.claimAllText}>Tout récupérer {pendingCoins}🪙</Text>
        </TouchableOpacity>
      )}
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
  claimedText: { color: Colors.green, fontSize: FontSize.caption, fontWeight: '600' },
  progressText: { color: Colors.textSecondary, fontSize: FontSize.caption },
  claimAllBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, marginHorizontal: 16, marginTop: 12, alignItems: 'center' },
  claimAllText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
});
