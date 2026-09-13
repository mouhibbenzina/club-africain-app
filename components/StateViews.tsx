import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';
import { useEffect, useState } from 'react';
import { api } from '../services/localApi';

export function ErrorBanner({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={16} color={Colors.white} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={[styles.skeletonLine, { width: `${80 - i * 15}%` }]} />
      ))}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

export function ConnectionBanner() {
  const [connected, setConnected] = useState(api.connected);
  useEffect(() => {
    api.onConnectionChange(setConnected);
  }, []);

  if (connected) return null;

  return (
    <View style={styles.offlineBanner}>
      <Ionicons name="wifi-outline" size={14} color={Colors.white} />
      <Text style={styles.offlineText}>Hors ligne — données en cache</Text>
      <ActivityIndicator size="small" color={Colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    gap: 8,
  },
  errorText: { color: Colors.white, fontSize: FontSize.body, flex: 1 },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  retryText: { color: Colors.white, fontSize: FontSize.label, fontWeight: '700' },
  skeletonContainer: { padding: Spacing.lg, gap: 12 },
  skeletonLine: { height: 14, backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { color: Colors.textMuted, fontSize: FontSize.subtitle, fontWeight: '600', marginTop: 12 },
  emptySub: { color: Colors.textMuted, fontSize: FontSize.body, marginTop: 4, textAlign: 'center' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#333', paddingVertical: 6, gap: 6,
  },
  offlineText: { color: Colors.white, fontSize: FontSize.caption },
});
