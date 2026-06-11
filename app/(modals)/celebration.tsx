import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function CelebrationModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.sparkles}>✨</Text>
      <Text style={styles.coinAmount}>10 000</Text>
      <Text style={styles.coinLabel}>CAT Coins</Text>

      <View style={styles.ticketIcon}>
        <Text style={styles.ticketEmoji}>🎟️</Text>
      </View>

      <Text style={styles.desc}>
        Échangez vos 10 000 Coins contre un ticket de match!
      </Text>

      <TouchableOpacity style={styles.ctaBtn} onPress={() => router.back()}>
        <Text style={styles.ctaText}>Échanger maintenant</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeText}>Plus tard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sparkles: { fontSize: 48, marginBottom: 8 },
  coinAmount: { color: Colors.gold, fontSize: 48, fontWeight: '900' },
  coinLabel: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700', marginBottom: 24 },
  ticketIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ticketEmoji: { fontSize: 36 },
  desc: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginBottom: 32 },
  ctaBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, width: '100%', alignItems: 'center', marginBottom: 12 },
  ctaText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  closeBtn: { padding: 12 },
  closeText: { color: Colors.textSecondary, fontSize: FontSize.body },
});
