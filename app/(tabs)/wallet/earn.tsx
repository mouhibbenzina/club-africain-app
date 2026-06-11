import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../../constants/theme';

export default function EarnScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regarder & Gagner</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🎁</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinAmount}>+50 🪙</Text>
        </View>
      </View>

      <Text style={styles.desc}>Regardez des vidéos et gagnez des coins</Text>

      <TouchableOpacity style={styles.watchBtn}>
        <Ionicons name="play" size={20} color={Colors.white} />
        <Text style={styles.watchBtnText}>Regarder une pub</Text>
      </TouchableOpacity>

      <View style={styles.progressSection}>
        <Text style={styles.progressText}>Aujourd'hui: 3/10 pubs regardées</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '30%' }]} />
        </View>
        <Text style={styles.resetText}>Revenez demain pour plus de récompenses!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  hero: { alignItems: 'center', paddingVertical: 40 },
  heroIcon: { fontSize: 64 },
  coinBadge: { backgroundColor: Colors.gold, paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.pill, marginTop: 16 },
  coinAmount: { color: Colors.black, fontSize: FontSize.heading, fontWeight: '800' },
  desc: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginBottom: 24 },
  watchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, marginHorizontal: 16, marginBottom: 32 },
  watchBtnText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  progressSection: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginHorizontal: 16, padding: 20, alignItems: 'center' },
  progressText: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#333', borderRadius: 4, width: '100%', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  resetText: { color: Colors.textSecondary, fontSize: FontSize.caption },
});
