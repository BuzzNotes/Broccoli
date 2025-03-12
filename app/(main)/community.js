import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
  startAfter
} from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { getUserProfile } from '../../src/utils/userProfile';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { Asset } from 'expo-asset';
import { IMAGES } from '../../src/constants/assets';

const CommunityScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [firebaseError, setFirebaseError] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const POST_LIMIT = 10;

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (refresh = false) => {
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        console.error("Firebase is not initialized. Cannot load community posts.");
        setLoading(false);
        setRefreshing(false);
        setFirebaseError(true);
        return;
      }

      if (refresh) {
        setRefreshing(true);
        setPosts([]);
        setLastVisible(null);
        setAllLoaded(false);
      }

      // Create query
      const postsRef = collection(db, 'posts');
      let postsQuery = query(
        postsRef,
        orderBy('lastActivityTimestamp', 'desc'),
        limit(POST_LIMIT)
      );

      // Get posts
      const querySnapshot = await getDocs(postsQuery);
      
      if (querySnapshot.empty) {
        setLoading(false);
        setRefreshing(false);
        setAllLoaded(true);
        return;
      }

      // Get last visible document for pagination
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);

      // Process posts
      const postsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivityTimestamp: data.lastActivityTimestamp?.toDate() || new Date()
        };
      });

      setPosts(postsData);
      
      // Load user profiles for posts
      postsData.forEach(post => {
        if (post.userId && !userProfiles[post.userId]) {
          getUserDataById(post.userId);
        }
      });
    } catch (error) {
      console.error('Error loading posts:', error);
      setFirebaseError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || allLoaded || !lastVisible) return;
    
    try {
      setLoadingMore(true);
      
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        setLoadingMore(false);
        return;
      }

      // Create query with startAfter for pagination
      const postsRef = collection(db, 'posts');
      const postsQuery = query(
        postsRef,
        orderBy('lastActivityTimestamp', 'desc'),
        startAfter(lastVisible),
        limit(POST_LIMIT)
      );

      // Get more posts
      const querySnapshot = await getDocs(postsQuery);
      
      if (querySnapshot.empty) {
        setAllLoaded(true);
        setLoadingMore(false);
        return;
      }

      // Get last visible document for pagination
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);

      // Process posts
      const postsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivityTimestamp: data.lastActivityTimestamp?.toDate() || new Date()
        };
      });

      setPosts(prev => [...prev, ...postsData]);
      
      // Load user profiles for posts
      postsData.forEach(post => {
        if (post.userId && !userProfiles[post.userId]) {
          getUserDataById(post.userId);
        }
      });
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getUserDataById = async (userId) => {
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        return;
      }
      
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserProfiles(prev => ({
          ...prev,
          [userId]: userSnap.data()
        }));
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  };

  const handleRefresh = () => {
    loadPosts(true);
  };

  const handleCreatePost = () => {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      Alert.alert(
        "Connection Error",
        "Could not connect to the community server. Please try again later."
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(standalone)/create-post');
  };

  const handlePostPress = (post) => {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      Alert.alert(
        "Connection Error",
        "Could not connect to the community server. Please try again later."
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(standalone)/post-detail', params: { postId: post.id } });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderPostItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.postCard}
        onPress={() => handlePostPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.postHeader}>
          <Image 
            source={item.userProfileImage ? { uri: item.userProfileImage } : IMAGES.DEFAULT_AVATAR} 
            style={styles.userAvatar} 
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.postTime}>{formatTimestamp(item.createdAt)}</Text>
          </View>
        </View>
        
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={3}>{item.body}</Text>
        
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <Ionicons name="heart" size={16} color="#5BBD68" />
            <Text style={styles.postStatText}>{item.likeCount || 0}</Text>
          </View>
          
          <View style={styles.postStat}>
            <Ionicons name="chatbubble" size={16} color="#5BBD68" />
            <Text style={styles.postStatText}>{item.commentCount || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#5BBD68" />
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        {firebaseError ? (
          <>
            <Ionicons name="cloud-offline" size={64} color="#5BBD68" />
            <Text style={styles.emptyTitle}>Connection Error</Text>
            <Text style={styles.emptyText}>
              Could not connect to the community server. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadPosts(true)}
            >
              <LinearGradient
                colors={['#5BBD68', '#45925A']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                borderRadius={24}
              />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Ionicons name="people" size={64} color="#5BBD68" />
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share your journey with the community!
            </Text>
            <TouchableOpacity 
              style={styles.createFirstPostButton}
              onPress={handleCreatePost}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5BBD68', '#45925A']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                borderRadius={24}
              />
              <Text style={styles.createFirstPostText}>Create First Post</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* White background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{backgroundColor: '#FFFFFF', flex: 1}} />
      </View>
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.screenTitle}>Community</Text>
        
        <TouchableOpacity 
          style={styles.createPostButton}
          activeOpacity={0.8}
          onPress={handleCreatePost}
        >
          <LinearGradient
            colors={['rgba(91, 189, 104, 0.2)', 'rgba(91, 189, 104, 0.1)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={20}
          />
          <Ionicons name="add" size={24} color="#5BBD68" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5BBD68" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#5BBD68"
              colors={["#5BBD68"]}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
      
      {!loading && (
        <TouchableOpacity 
          style={styles.floatingButton}
          activeOpacity={0.8}
          onPress={handleCreatePost}
        >
          <LinearGradient
            colors={['#5BBD68', '#45925A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={28}
          />
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 32,
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  createPostButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.5)',
  },
  userName: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  postTitle: {
    fontSize: 18,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 8,
  },
  postBody: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginLeft: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  createFirstPostButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  createFirstPostText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
});

export default CommunityScreen; 