import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../stores/playerStore';
import { useSportStore } from '../../stores/sportStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, EmptyState, ConnectionBanner } from '../../components/StateViews';

export default function MediaScreen() {
  const { media, fetchMedia, error } = usePlayerStore();
  const { sports } = useSportStore();
  const [activeSport, setActiveSport] = useState<number | undefined>(undefined);
  const [activeType, setActiveType] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => { fetchMedia(activeSport, activeType); }, [activeSport, activeType]);
  useEffect(() => { load(); }, [activeSport, activeType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMedia(activeSport, activeType);
    setRefreshing(false);
  }, [activeSport, activeType]);

  const typeIcon = (t: string) => {
    if (t === 'video') return 'videocam';
    if (t === 'highlight') return 'flame';
    return 'image';
  };
  const formatDuration = (s?: number) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Médias</Text>
          <Text style={styles.headerSub}>Vidéos et temps forts</Text>
        </View>
      </View>

      <ConnectionBanner />
      {error && <ErrorBanner message={error} onRetry={load} />}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.stripContent}>
        <TouchableOpacity style={[styles.chip, activeSport === undefined && styles.chipActive]} onPress={() => setActiveSport(undefined)}>
          <Text style={[styles.chipText, activeSport === undefined && { color: Colors.white }]}>Tous</Text>
        </TouchableOpacity>
        {sports.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.chip, activeSport === s.id && { backgroundColor: s.color }]} onPress={() => setActiveSport(s.id)}>
            <Text style={[styles.chipText, activeSport === s.id && { color: Colors.white }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.stripContent}>
        <TouchableOpacity style={[styles.typeChip, activeType === undefined && styles.typeChipActive]} onPress={() => setActiveType(undefined)}>
          <Text style={[styles.chipText, activeType === undefined && { color: Colors.primary }]}>Tout</Text>
        </TouchableOpacity>
        {['highlight', 'video', 'image'].map((t) => (
          <TouchableOpacity key={t} style={[styles.typeChip, activeType === t && styles.typeChipActive]} onPress={() => setActiveType(t)}>
            <Ionicons name={typeIcon(t) as any} size={14} color={activeType === t ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.chipText, activeType === t && { color: Colors.primary }]}>{t === 'highlight' ? 'Temps forts' : t === 'video' ? 'Vidéos' : 'Photos'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        {media.length === 0 && !error && (
          <EmptyState icon="videocam-outline" title="Aucun média" subtitle="Revenez plus tard" />
        )}

        <View style={styles.grid}>
          {media.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.mediaCard, Shadow.card]}>
              <View style={styles.mediaThumb}>
                <Ionicons name={typeIcon(item.type) as any} size={28} color={Colors.textMuted} />
                {item.duration ? (
                  <View style={styles.durationBadge}>
                    <Ionicons name="play" size={10} color={Colors.white} />
                    <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                  </View>
                ) : null}
                {item.sport_label && (
                  <View style={styles.mediaSportBadge}>
                    <Text style={styles.mediaSportText}>{item.sport_label}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.mediaTitle} numberOfLines={2}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  headerSub: { color: Colors.textSecondary, fontSize: FontSize.label, marginTop: 2 },
  strip: { maxHeight: 40, marginTop: 8 },
  stripContent: { paddingHorizontal: Spacing.lg, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '600' },
  chipActive: { backgroundColor: Colors.primary },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: '#1A0000' },
  list: { flex: 1, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 10 },
  mediaCard: { width: '48%', backgroundColor: Colors.surface, borderRadius: Radius.card, overflow: 'hidden' },
  mediaThumb: { height: 110, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  durationText: { color: Colors.white, fontSize: 10, fontWeight: '600' },
  mediaSportBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill },
  mediaSportText: { color: Colors.white, fontSize: 8, fontWeight: '700' },
  mediaTitle: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '600', padding: 10, lineHeight: 18 },
});
