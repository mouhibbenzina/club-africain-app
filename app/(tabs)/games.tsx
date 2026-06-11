import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../../constants/theme';

const GAMES = [
  { icon: 'football', label: 'Prédiction Match', desc: 'Prédisez le score', route: '/(tabs)/games/prediction' },
  { icon: 'people', label: 'Composer Équipe', desc: 'Choisissez votre formation', route: '/(tabs)/games/my-team' },
  { icon: 'star', label: 'Joueur du Match', desc: 'Votez pour le meilleur', route: '/(tabs)/games/vote' },
  { icon: 'trophy', label: 'Classement', desc: 'Voir le classement', route: '/(tabs)/games/leaderboard' },
];

export default function GamesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jeux</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {GAMES.map((game) => (
          <TouchableOpacity key={game.label} style={styles.card} onPress={() => router.push(game.route as any)}>
            <View style={styles.cardLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name={game.icon as any} size={24} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>{game.label}</Text>
                <Text style={styles.cardDesc}>{game.desc}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: Radius.card, padding: 20 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.subtitle, fontWeight: '700' },
  cardDesc: { color: Colors.textSecondary, fontSize: FontSize.caption, marginTop: 2 },
});
