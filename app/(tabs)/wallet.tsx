import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../constants/theme';

export default function WalletScreen() {
  const [tab, setTab] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.balancesRow}>
          <View style={styles.balanceChip}><Text style={styles.balanceValue}>35 DT</Text></View>
          <View style={styles.balanceChip}><Text style={styles.balanceValue}>250K $CA</Text></View>
          <View style={styles.balanceChip}><Text style={styles.balanceValue}>12 450 🪙</Text></View>
        </View>

        <View style={styles.tabRow}>
          {['Historique', 'Convertir'].map((t, i) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        ) : (
          <View style={styles.convertSection}>
            <Text style={styles.convertTitle}>Convertir Game Money en Coins</Text>
            <Text style={styles.convertRate}>100 000 $CA = 500 🪙</Text>
            <View style={styles.convertInputRow}>
              <TextInput style={styles.convertInput} placeholder="0" placeholderTextColor={Colors.textSecondary} keyboardType="numeric" />
              <Text style={styles.convertLabel}>$CA</Text>
            </View>
            <Text style={styles.convertResult}>= 0 🪙</Text>
            <TouchableOpacity style={styles.convertBtn}>
              <Text style={styles.convertBtnText}>Convertir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shopLink} onPress={() => router.push('/(tabs)/wallet/shop')}>
              <Text style={styles.shopLinkText}>🛒 Boutique Coins</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.earnLink} onPress={() => router.push('/(tabs)/wallet/earn')}>
              <Text style={styles.earnLinkText}>📺 Regarder & Gagner</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  balancesRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  balanceChip: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.pill },
  balanceValue: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: Radius.btn, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.white },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.body },
  convertSection: { paddingHorizontal: 16, gap: 12 },
  convertTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '600' },
  convertRate: { color: Colors.textSecondary, fontSize: FontSize.body },
  convertInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.btn, paddingHorizontal: 16 },
  convertInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.title, paddingVertical: 16 },
  convertLabel: { color: Colors.textSecondary, fontSize: FontSize.subtitle, fontWeight: '700' },
  convertResult: { color: Colors.gold, fontSize: FontSize.title, fontWeight: '800' },
  convertBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, alignItems: 'center' },
  convertBtnText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
  shopLink: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, alignItems: 'center' },
  shopLinkText: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '600' },
  earnLink: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 16, alignItems: 'center', marginBottom: 32 },
  earnLinkText: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '600' },
});
