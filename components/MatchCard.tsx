import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius } from '../constants/theme';

interface MatchCardProps {
  home: string;
  away: string;
  viewers: number;
  is_live: boolean;
}

export function MatchCard({ home, away, viewers, is_live }: MatchCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>
          EN DIRECT {home.toUpperCase().slice(0, 4)}
        </Text>
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.team}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>CA</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>
            {home}
          </Text>
        </View>

        <Text style={styles.vs}>VS</Text>

        <View style={styles.team}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>EST</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>
            {away}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.viewerRow}>
          <Ionicons name="people" size={14} color={Colors.textSecondary} />
          <Text style={styles.viewerText}>
            {(viewers / 1000).toFixed(1)}K
          </Text>
        </View>
        <TouchableOpacity style={styles.watchBtn}>
          <Text style={styles.watchText}>Regarder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    marginHorizontal: 16,
    padding: 16,
    gap: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveText: {
    color: Colors.primary,
    fontSize: FontSize.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  team: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: Colors.white,
    fontSize: FontSize.subtitle,
    fontWeight: '900',
  },
  vs: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '800',
  },
  teamName: {
    color: Colors.textPrimary,
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  watchBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.btn,
  },
  watchText: {
    color: Colors.white,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
});
