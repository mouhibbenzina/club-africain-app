import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriendsStore } from '../../stores/friendsStore';
import { Colors, FontSize, Radius, Shadow } from '../../constants/theme';

export default function FriendsScreen() {
  const { friends, requests, sent, isLoading, error, loadFriends, loadRequests, acceptRequest, declineRequest, cancelRequest, unfriend } = useFriendsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadFriends(), loadRequests()]);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, []);

  const handleRemove = (userId: string, username: string) => {
    Alert.alert('Retirer un ami', `Retirer ${username} de vos amis ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => unfriend(userId) },
    ]);
  };

  const userRow = ({ user_id, username, avatar, role }: any, right: React.ReactNode) => (
    <View key={user_id} style={[styles.card, Shadow.card]}>
      <View style={styles.avatarCircle}><Text style={styles.avatarText}>{(avatar || username || '?')[0].toUpperCase()}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.username}>{username}</Text>
        {role ? <Text style={styles.role}>{role === 'vip' ? 'VIP' : role === 'admin' ? 'Admin' : ''}</Text> : null}
      </View>
      {right}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes amis</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        <Text style={styles.sectionTitle}>Demandes reçues ({requests.length})</Text>
        {isLoading && requests.length === 0 ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : requests.length === 0 ? (
          <Text style={styles.emptySection}>Aucune demande en attente</Text>
        ) : (
          requests.map((r) => userRow(r, (
            <View style={styles.rowBtns}>
              <TouchableOpacity style={[styles.smallBtn, styles.primaryBtn]} onPress={() => acceptRequest(r.request_id)}>
                <Ionicons name="checkmark" size={14} color={Colors.white} />
                <Text style={styles.primaryBtnText}>Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.ghostBtn]} onPress={() => declineRequest(r.request_id)}>
                <Ionicons name="close" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Mes amis ({friends.length})</Text>
        {friends.length === 0 ? (
          <Text style={styles.emptySection}>Invitez des supporters depuis la liste des membres</Text>
        ) : (
          friends.map((f) => userRow(f, (
            <TouchableOpacity style={styles.iconBtn} onPress={() => handleRemove(f.user_id, f.username)}>
              <Ionicons name="person-remove-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Envoyées ({sent.length})</Text>
        {sent.length === 0 ? (
          <Text style={styles.emptySection}>Aucune demande en attente</Text>
        ) : (
          sent.map((s) => userRow(s, (
            <TouchableOpacity style={[styles.smallBtn, styles.ghostBtn]} onPress={() => cancelRequest(s.user_id)}>
              <Text style={styles.sentBtnText}>Annuler</Text>
            </TouchableOpacity>
          )))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 52, paddingBottom: 8 },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  errorText: { color: Colors.primary, textAlign: 'center', fontSize: FontSize.body, marginTop: 8 },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  emptySection: { color: Colors.textMuted, fontSize: FontSize.body, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, marginBottom: 10 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: Colors.white, fontSize: FontSize.subtitle, fontWeight: '800' },
  username: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700' },
  role: { color: Colors.gold, fontSize: FontSize.caption },
  rowBtns: { flexDirection: 'row', gap: 6 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.btn },
  primaryBtn: { backgroundColor: Colors.primary },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.label, fontWeight: '700' },
  ghostBtn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  sentBtnText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700' },
  iconBtn: { padding: 8 },
});