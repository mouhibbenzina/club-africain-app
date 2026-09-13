import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriendsStore } from '../../stores/friendsStore';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, Radius, Shadow } from '../../constants/theme';

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', vip: 'VIP', fan: 'Supporter' };
const ROLE_COLOR: Record<string, string> = { admin: Colors.gold, vip: Colors.blue, fan: Colors.textMuted };

export default function CommunityMembersScreen() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const {
    members, friends, requests, sent, isLoading, error,
    loadMembers, loadFriends, loadRequests, sendRequest, acceptRequest, declineRequest, unfriend, cancelRequest,
  } = useFriendsStore();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMembers();
    loadFriends();
    loadRequests();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMembers(query), loadFriends(), loadRequests()]);
    setRefreshing(false);
  }, [query]);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.user_id)), [friends]);
  const sentIds = useMemo(() => new Set(sent.map((s) => s.user_id)), [sent]);
  const incomingMap = useMemo(() => {
    const m = new Map<number, string>();
    requests.forEach((r) => m.set(r.request_id, r.user_id));
    return m;
  }, [requests]);

  const handleSend = async (userId: string) => {
    try {
      await sendRequest(userId);
    } catch {}
  };

  const handleRemoveFriend = (userId: string, username: string) => {
    Alert.alert('Retirer un ami', `Retirer ${username} de vos amis ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => unfriend(userId) },
    ]);
  };

  const renderActions = (item: { user_id: string; username: string }) => {
    if (item.user_id === currentUserId) {
      return <Text style={styles.selfTag}>Moi</Text>;
    }
    if (friendIds.has(item.user_id)) {
      return (
        <TouchableOpacity style={[styles.smallBtn, styles.friendBtn]} onPress={() => handleRemoveFriend(item.user_id, item.username)}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
          <Text style={styles.friendBtnText}>Amis</Text>
        </TouchableOpacity>
      );
    }
    const incomingRelId = incomingMap.size ? [...incomingMap.entries()].find(([, uid]) => uid === item.user_id)?.[0] : undefined;
    if (incomingRelId !== undefined) {
      return (
        <View style={styles.rowBtns}>
          <TouchableOpacity style={[styles.smallBtn, styles.primaryBtn]} onPress={() => acceptRequest(incomingRelId)}>
            <Text style={styles.primaryBtnText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, styles.ghostBtn]} onPress={() => declineRequest(incomingRelId)}>
            <Text style={styles.ghostBtnText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (sentIds.has(item.user_id)) {
      return (
        <TouchableOpacity style={[styles.smallBtn, styles.sentBtn]} onPress={() => cancelRequest(item.user_id)}>
          <Text style={styles.sentBtnText}>Envoyée</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={[styles.smallBtn, styles.primaryBtn]} onPress={() => handleSend(item.user_id)}>
        <Ionicons name="person-add" size={14} color={Colors.white} />
        <Text style={styles.primaryBtnText}>Inviter</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membres</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un supporter..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={(t) => { setQuery(t); loadMembers(t); }}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); loadMembers(''); }}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          isLoading && members.length === 0 ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
          ) : (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={styles.emptyText}>Aucun membre trouvé</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.card, Shadow.card]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(item.avatar || item.username || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={[styles.role, { color: ROLE_COLOR[item.role || 'fan'] || Colors.textMuted }]}>{ROLE_LABEL[item.role || 'fan'] || item.role}</Text>
              <View style={styles.statsLine}>
                <Text style={styles.stat}><Ionicons name="logo-usd" size={10} color={Colors.gold} /> {item.cat_coins}</Text>
                <Text style={styles.stat}><Ionicons name="create-outline" size={10} color={Colors.textSecondary} /> {item.predictions_count ?? 0}</Text>
                <Text style={styles.stat}><Ionicons name="chatbubble-outline" size={10} color={Colors.textSecondary} /> {item.posts_count ?? 0}</Text>
              </View>
            </View>
            {renderActions(item)}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 52, paddingBottom: 8 },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, backgroundColor: Colors.surface, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.body },
  errorText: { color: Colors.primary, textAlign: 'center', fontSize: FontSize.body, marginTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14, marginBottom: 10 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: Colors.white, fontSize: FontSize.title, fontWeight: '800' },
  info: { flex: 1 },
  username: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700' },
  role: { fontSize: FontSize.caption, marginTop: 1 },
  statsLine: { flexDirection: 'row', gap: 10, marginTop: 6 },
  stat: { color: Colors.textSecondary, fontSize: FontSize.caption },
  selfTag: { color: Colors.textMuted, fontSize: FontSize.label, fontWeight: '700' },
  rowBtns: { flexDirection: 'row', gap: 6 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.btn },
  primaryBtn: { backgroundColor: Colors.primary },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.label, fontWeight: '700' },
  ghostBtn: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceLight },
  ghostBtnText: { color: Colors.textSecondary, fontSize: FontSize.label, fontWeight: '700' },
  friendBtn: { backgroundColor: 'rgba(39,174,96,0.15)' },
  friendBtnText: { color: Colors.green, fontSize: FontSize.label, fontWeight: '700' },
  sentBtn: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  sentBtnText: { color: Colors.textMuted, fontSize: FontSize.label, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body },
});