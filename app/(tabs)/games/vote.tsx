import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/authStore';
import { useGameStore } from '../../../stores/gameStore';
import { Colors, FontSize, Radius } from '../../../constants/theme';

const PLAYERS = ['Hamdi', 'Bguir', 'Jebali', 'Ltaief', 'Hassen'];
const MATCH_ID = 1;

export default function VoteScreen() {
  const user = useAuthStore((s) => s.user);
  const { votePlayer, votedMatches } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const alreadyVoted = votedMatches.includes(MATCH_ID);

  const handleVote = async () => {
    if (!selected || !user) return;
    await votePlayer(user.id, MATCH_ID, selected);
    Alert.alert('Vote enregistré', `Vous avez voté pour ${selected}`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Joueur du Match</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>Votez pour le meilleur joueur</Text>

      {PLAYERS.map((player) => {
        const isSelected = selected === player;
        return (
          <TouchableOpacity key={player} style={[styles.playerRow, isSelected && styles.playerSelected]} onPress={() => !alreadyVoted && setSelected(player)}>
            <View style={[styles.avatar, isSelected && { backgroundColor: Colors.gold }]}>
              <Text style={styles.avatarText}>{player[0]}</Text>
            </View>
            <Text style={styles.playerName}>{player}</Text>
            <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={22} color={isSelected ? Colors.gold : Colors.textSecondary} />
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={[styles.voteBtn, !selected && { opacity: 0.5 }]} onPress={handleVote} disabled={!selected || alreadyVoted}>
        <Text style={styles.voteText}>{alreadyVoted ? 'Déjà voté' : 'Voter'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginBottom: 24 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 8, borderRadius: Radius.card, padding: 16 },
  playerSelected: { borderWidth: 1, borderColor: Colors.gold },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '800' },
  playerName: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600' },
  voteBtn: { backgroundColor: Colors.primary, borderRadius: Radius.btn, padding: 16, marginHorizontal: 16, alignItems: 'center', marginTop: 12 },
  voteText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '700' },
});
