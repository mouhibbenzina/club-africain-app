import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function DonateModal() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Caisse de Don</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.goalSection}>
        <Text style={styles.goalText}>500 000 DT</Text>
        <Text style={styles.raisedText}>327 450 DT atteints</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '65%' }]} />
        </View>
      </View>

      <Text style={styles.motivation}>Votre don compte pour notre ❤️</Text>

      <TouchableOpacity style={styles.donateBtn}>
        <Text style={styles.donateBtnText}>Faire un don</Text>
      </TouchableOpacity>

      <Text style={styles.topTitle}>Top Donateurs:</Text>
      {[
        { name: 'Tunisian Power', amount: 20000 },
        { name: 'Clubiste', amount: 10000 },
        { name: 'Red & White', amount: 7500 },
        { name: 'SAIF', amount: 5000 },
      ].map((d, i) => (
        <View key={i} style={styles.donorRow}>
          <Text style={styles.donorRank}>{i + 1}.</Text>
          <Text style={styles.donorName}>{d.name}</Text>
          <Text style={styles.donorAmount}>{d.amount.toLocaleString()} DT</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  goalSection: { backgroundColor: Colors.surface, borderRadius: Radius.card, marginHorizontal: 16, padding: 20, marginBottom: 16 },
  goalText: { color: Colors.textPrimary, fontSize: FontSize.display, fontWeight: '800' },
  raisedText: { color: Colors.green, fontSize: FontSize.subtitle, fontWeight: '600', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#333', borderRadius: 4, marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  motivation: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginBottom: 16 },
  donateBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, marginHorizontal: 16, alignItems: 'center', marginBottom: 24 },
  donateBtnText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  topTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', marginHorizontal: 16, marginBottom: 12 },
  donorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  donorRank: { color: Colors.textSecondary, fontSize: FontSize.body, fontWeight: '700', width: 24 },
  donorName: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  donorAmount: { color: Colors.gold, fontSize: FontSize.body, fontWeight: '700' },
});
