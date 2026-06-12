import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommunityStore } from '../../stores/communityStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '../../constants/theme';
import { ErrorBanner, EmptyState, ConnectionBanner } from '../../components/StateViews';

export default function CommunityScreen() {
  const { posts, fetchPosts, createPost, likePost, isLoading, error } = useCommunityStore();
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    await createPost(newPost.trim());
    setNewPost('');
    setPosting(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communauté</Text>
        <Text style={styles.headerSub}>Les Clubistes parlent aux Clubistes</Text>
      </View>

      <ConnectionBanner />
      {error && <ErrorBanner message={error} onRetry={fetchPosts} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {isLoading && posts.length === 0 && (
          <View style={styles.skeleton}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonCard, { opacity: 1 - (i - 1) * 0.2 }]}>
                <View style={styles.skeletonHeader}>
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonName} />
                </View>
                <View style={styles.skeletonBody} />
              </View>
            ))}
          </View>
        )}

        {!isLoading && posts.length === 0 && (
          <EmptyState icon="chatbubbles-outline" title="Soyez le premier à poster !" subtitle="Partagez votre passion pour le Club Africain" />
        )}

        {posts.map((post) => (
          <View key={post.id} style={[styles.postCard, Shadow.card]}>
            <View style={styles.postHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(post.username || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.postAuthorInfo}>
                <Text style={styles.postUsername}>{post.username || 'Anonyme'}</Text>
                <Text style={styles.postTime}>{new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => likePost(post.id)}>
                <Ionicons name="heart-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.actionText}>{post.replies}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Partagez votre passion..."
          placeholderTextColor={Colors.textMuted}
          value={newPost}
          onChangeText={setNewPost}
          multiline
          maxLength={280}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newPost.trim() || posting) && styles.sendBtnDisabled]}
          onPress={handlePost}
          disabled={!newPost.trim() || posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.heading, fontWeight: '700' },
  headerSub: { color: Colors.textSecondary, fontSize: FontSize.label, marginTop: 2 },
  list: { flex: 1, marginTop: 12 },
  skeleton: { paddingHorizontal: Spacing.lg, gap: 12 },
  skeletonCard: { height: 120, backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 14 },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  skeletonAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceLight },
  skeletonName: { width: 120, height: 12, backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm },
  skeletonBody: { height: 40, backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm },
  postCard: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, marginBottom: 12, borderRadius: Radius.card, padding: 14 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: FontSize.body, fontWeight: '800' },
  postAuthorInfo: { flex: 1 },
  postUsername: { color: Colors.textPrimary, fontSize: FontSize.body, fontWeight: '700' },
  postTime: { color: Colors.textMuted, fontSize: FontSize.caption },
  postContent: { color: Colors.textPrimary, fontSize: FontSize.body, lineHeight: 20, marginBottom: 12 },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 20, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: Colors.textSecondary, fontSize: FontSize.label },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.lg, paddingBottom: 28, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  input: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 10, color: Colors.textPrimary, fontSize: FontSize.body, maxHeight: 80 },
  sendBtn: { backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
