import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../../constants/theme';

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2'];

const PITCH_POSITIONS: Record<string, { top: number; left: number }[]> = {
  '4-3-3': [
    { top: 85, left: 50 }, { top: 65, left: 20 }, { top: 65, left: 40 }, { top: 65, left: 60 }, { top: 65, left: 80 },
    { top: 45, left: 25 }, { top: 45, left: 50 }, { top: 45, left: 75 },
    { top: 25, left: 15 }, { top: 25, left: 50 }, { top: 25, left: 85 },
  ],
};

const PLAYERS = ['Hassen', 'Abdi', 'Yahia', 'Ben Y', 'Drager', 'Ltaief', 'BenR', 'Khalil', 'Hamdi', 'Bguir', 'Jebali'];

export default function TeamBuilderScreen() {
  const [formation, setFormation] = useState('4-3-3');
  const [selected, setSelected] = useState<string[]>(PLAYERS.slice(0, 11));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Équipe</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.saveText}>Sauver</Text></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formationRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {FORMATIONS.map((f) => (
          <TouchableOpacity key={f} style={[styles.formationChip, formation === f && styles.formationActive]} onPress={() => setFormation(f)}>
            <Text style={[styles.formationText, formation === f && styles.formationTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.pitch}>
        <View style={styles.fieldLines}>
          {[20, 40, 60, 80].map((pct) => (
            <View key={pct} style={[styles.fieldLine, { top: `${pct}%` }]} />
          ))}
        </View>
        {(PITCH_POSITIONS[formation] || PITCH_POSITIONS['4-3-3']).map((pos, i) => (
          <View key={i} style={[styles.playerDot, { top: `${pos.top}%`, left: `${pos.left}%` }]}>
            <Text style={styles.playerInitial}>{selected[i]?.slice(0, 3).toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.benchRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {PLAYERS.filter((p) => !selected.includes(p)).map((p) => (
          <TouchableOpacity key={p} style={styles.benchChip}>
            <Text style={styles.benchText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  saveText: { color: Colors.primary, fontSize: FontSize.subtitle, fontWeight: '700' },
  formationRow: { maxHeight: 44, marginBottom: 12 },
  formationChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  formationActive: { backgroundColor: Colors.primary },
  formationText: { color: Colors.textSecondary, fontWeight: '600' },
  formationTextActive: { color: Colors.white },
  pitch: { flex: 1, marginHorizontal: 16, borderRadius: Radius.card, backgroundColor: '#1B5E20', position: 'relative', overflow: 'hidden', marginBottom: 12 },
  fieldLines: { position: 'absolute', inset: 0 },
  fieldLine: { position: 'absolute', left: '5%', right: '5%', height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  playerDot: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: -18, marginTop: -18 },
  playerInitial: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  benchRow: { maxHeight: 44, marginBottom: 24 },
  benchChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  benchText: { color: Colors.textSecondary, fontSize: FontSize.caption, fontWeight: '600' },
});
