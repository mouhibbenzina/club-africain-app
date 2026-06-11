import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function RewardsModal() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Récompenses Saison</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.tagline}>Plus vous jouez, plus vous gagnez!</Text>

      <View style={styles.rewardCard}>
        <Text style={styles.rewardEmoji}>🥇</Text>
        <Text style={styles.rewardTitle}>Top 1</Text>
        <Text style={styles.rewardDesc}>Maillot Officiel</Text>
      </View>
      <View style={styles.rewardCard}>
        <Text style={styles.rewardEmoji}>🥈</Text>
        <Text style={styles.rewardTitle}>Top 2-5</Text>
        <Text style={styles.rewardDesc}>Ticket VIP</Text>
      </View>
      <View style={styles.rewardCard}>
        <Text style={styles.rewardEmoji}>🎁</Text>
        <Text style={styles.rewardTitle}>Top 6-10</Text>
        <Text style={styles.rewardDesc}>Rencontre Joueurs</Text>
      </View>
      <View style={styles.rewardCard}>
        <Text style={styles.rewardEmoji}>🎁</Text>
        <Text style={styles.rewardTitle}>Tirage au sort</Text>
        <Text style={styles.rewardDesc}>Gadgets & Cadeaux</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  tagline: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginBottom: 24 },
  rewardCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginHorizontal: 16, marginBottom: 8, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  rewardEmoji: { fontSize: 32 },
  rewardTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', flex: 1 },
  rewardDesc: { color: Colors.textSecondary, fontSize: FontSize.body },
});
