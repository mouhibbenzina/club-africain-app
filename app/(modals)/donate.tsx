import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function DonateModal() {
  const [summary, setSummary] = useState({ goal: 500000, raised: 327450 });
  const [topDonors, setTopDonors] = useState<{ username: string; total: number }[]>([]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { api } = require('../../services/localApi');
        const s = await api.getDonationSummary();
        if (s) setSummary(s);
        const d = await api.getTopDonors();
        if (d?.length) setTopDonors(d);
      } catch { /* keep fallback */ }
    };
    load();
  }, []);

  const handleDonate = async () => {
    const val = Number(amount);
    if (!val || val <= 0) {
      Alert.alert('Montant invalide', 'Entrez un montant valide en DT');
      return;
    }
    try {
      const { api } = require('../../services/localApi');
      await api.makeDonation(val);
      Alert.alert('Merci!', `Don de ${val} DT effectué`);
      setAmount('');
      const s = await api.getDonationSummary();
      if (s) setSummary(s);
    } catch {
      Alert.alert('Erreur', 'Impossible de faire le don');
    }
  };

  const pct = Math.min(100, (summary.raised / summary.goal) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Caisse de Don</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.goalSection}>
        <Text style={styles.goalText}>{summary.goal.toLocaleString()} DT</Text>
        <Text style={styles.raisedText}>{summary.raised.toLocaleString()} DT atteints</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <Text style={styles.motivation}>Votre don compte pour notre ❤️</Text>

      <View style={styles.donateInputRow}>
        <TextInput
          style={styles.donateInput}
          placeholder="Montant (DT)"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity style={styles.donateBtn} onPress={handleDonate}>
          <Text style={styles.donateBtnText}>Donner</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.topTitle}>Top Donateurs:</Text>
      {(topDonors.length > 0 ? topDonors : [
        { username: 'Tunisian Power', total: 20000 },
        { username: 'Clubiste', total: 10000 },
        { username: 'Red & White', total: 7500 },
      ]).map((d, i) => (
        <View key={i} style={styles.donorRow}>
          <Text style={styles.donorRank}>{i + 1}.</Text>
          <Text style={styles.donorName}>{d.username}</Text>
          <Text style={styles.donorAmount}>{d.total.toLocaleString()} DT</Text>
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
  donateInputRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 24 },
  donateInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.btn, padding: 16, color: Colors.textPrimary, fontSize: FontSize.body },
  donateBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  donateBtnText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  topTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700', marginHorizontal: 16, marginBottom: 12 },
  donorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  donorRank: { color: Colors.textSecondary, fontSize: FontSize.body, fontWeight: '700', width: 24 },
  donorName: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  donorAmount: { color: Colors.gold, fontSize: FontSize.body, fontWeight: '700' },
});
