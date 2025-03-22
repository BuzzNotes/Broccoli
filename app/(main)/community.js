import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Animated
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
  startAfter,
  updateDoc,
  addDoc,
  increment,
  serverTimestamp,
  deleteDoc,
  setDoc,
  where
} from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { getUserProfile } from '../../src/utils/userProfile';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { Asset } from 'expo-asset';
import { IMAGES } from '../../src/constants/assets';
import BannerNotification from '../../src/components/BannerNotification';
import { filterOffensiveWords } from '../../src/utils/contentModeration';

const CommunityScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [userProfiles, setUserProfiles] = useState({});
  const [firebaseError, setFirebaseError] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('success');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'friends'
  const flatListRef = useRef(null);
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
      let postsQuery;
      
      // If/when friends functionality is implemented, this will be updated
      // to filter posts by user's friends
      if (activeFilter === 'friends') {
        // For now, just use the same query as 'all'
        // In the future, this would include a where clause to filter by friends
        postsQuery = query(
          postsRef,
          orderBy('lastActivityTimestamp', 'desc'),
          limit(POST_LIMIT)
        );
        
        // TODO: When friend system is implemented, update this query:
        // 1. Get user's friends IDs
        // 2. Use where('userId', 'in', friendIds) to filter posts by friends
      } else {
        // Default 'all' filter - show all posts
        postsQuery = query(
          postsRef,
          orderBy('lastActivityTimestamp', 'desc'),
          limit(POST_LIMIT)
        );
      }

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
          lastActivityTimestamp: data.lastActivityTimestamp?.toDate() || new Date(),
          userLiked: false // Default to false, will be updated if user is logged in
        };
      });

      // Check if the current user has liked any of these posts
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const likedPostsPromises = postsData.map(async (post) => {
          const userLikedPostRef = doc(db, 'users', userId, 'likedPosts', post.id);
          const likedPostDoc = await getDoc(userLikedPostRef);
          return { postId: post.id, liked: likedPostDoc.exists() };
        });
        
        const likedPostsResults = await Promise.all(likedPostsPromises);
        
        // Update posts with user liked status
        likedPostsResults.forEach(result => {
          const postIndex = postsData.findIndex(post => post.id === result.postId);
          if (postIndex !== -1) {
            postsData[postIndex].userLiked = result.liked;
          }
        });
      }

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
      let postsQuery;
      
      // Apply the same filter logic as in loadPosts
      if (activeFilter === 'friends') {
        // For now, just use the same query as 'all' with pagination
        postsQuery = query(
          postsRef,
          orderBy('lastActivityTimestamp', 'desc'),
          startAfter(lastVisible),
          limit(POST_LIMIT)
        );
        
        // TODO: When friend system is implemented, update this query
        // with the same friend filtering logic as in loadPosts
      } else {
        // Default 'all' filter with pagination
        postsQuery = query(
          postsRef,
          orderBy('lastActivityTimestamp', 'desc'),
          startAfter(lastVisible),
          limit(POST_LIMIT)
        );
      }

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
          lastActivityTimestamp: data.lastActivityTimestamp?.toDate() || new Date(),
          userLiked: false // Default to false, will be updated if user is logged in
        };
      });

      // Check if the current user has liked any of these posts
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const likedPostsPromises = postsData.map(async (post) => {
          const userLikedPostRef = doc(db, 'users', userId, 'likedPosts', post.id);
          const likedPostDoc = await getDoc(userLikedPostRef);
          return { postId: post.id, liked: likedPostDoc.exists() };
        });
        
        const likedPostsResults = await Promise.all(likedPostsPromises);
        
        // Update posts with user liked status
        likedPostsResults.forEach(result => {
          const postIndex = postsData.findIndex(post => post.id === result.postId);
          if (postIndex !== -1) {
            postsData[postIndex].userLiked = result.liked;
          }
        });
      }

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
    setRefreshProgress(100);
    loadPosts(true);
  };

  const onRefreshChange = (progress) => {
    // Convert native refresh values (usually 0 to 1) to percentage (0 to 100)
    const progressPercentage = Math.min(Math.floor(progress * 100), 100);
    setRefreshProgress(progressPercentage);
  };

  const handleCreatePost = () => {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      showBanner("Could not connect to the community server.", "error");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(standalone)/create-post');
  };

  const handlePostPress = (post) => {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      showBanner("Could not connect to the community server.", "error");
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

  const navigateToUserProfile = (userId, userName) => {
    if (!userId || userId === auth.currentUser?.uid) return; // Don't navigate to own profile
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(standalone)/user-profile',
      params: { userId, userName }
    });
  };

  const handleLikePost = async (postId, isLiked) => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        showBanner('You must be logged in to like posts', 'error');
        return;
      }
      
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        showBanner("Could not connect to the community server.", "error");
        return;
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const userId = auth.currentUser.uid;
      const postRef = doc(db, 'posts', postId);
      const userLikedPostRef = doc(db, 'users', userId, 'likedPosts', postId);
      
      // Optimistically update UI
      const newLikedState = !isLiked;
      const likeChange = newLikedState ? 1 : -1;
      
      // Update local state immediately for better UX
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                userLiked: newLikedState,
                likeCount: (post.likeCount || 0) + likeChange 
              } 
            : post
        )
      );
      
      if (newLikedState) {
        // User is liking the post
        await setDoc(userLikedPostRef, {
          likedAt: serverTimestamp()
        });
        
        // Increment post like count
        await updateDoc(postRef, {
          likeCount: increment(1)
        });
      } else {
        // User is unliking the post
        await deleteDoc(userLikedPostRef);
        
        // Decrement post like count, but ensure it doesn't go below 0
        await updateDoc(postRef, {
          likeCount: increment(-1)
        });
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      showBanner('Failed to update like status. Please try again.', 'error');
      
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                userLiked: isLiked,
                likeCount: (post.likeCount || 0) + (isLiked ? 0 : 1) - (!isLiked ? 0 : 1)
              } 
            : post
        )
      );
    }
  };

  // Add a function to handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        showBanner('You must be logged in to delete posts', 'error');
        return;
      }
      
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        showBanner("Could not connect to the community server.", "error");
        return;
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Optimistically update UI
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      // Delete post from Firestore
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      
      showBanner('Post deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting post:', error);
      showBanner('Failed to delete post. Please try again.', 'error');
      
      // Refresh posts to restore the deleted post
      fetchPosts();
    }
  };

  const handleFilterChange = (filter) => {
    if (filter === activeFilter) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
    
    // Reset pagination
    setLastVisible(null);
    setAllLoaded(false);
    
    // Show loading state
    setLoading(true);
    setPosts([]);
    
    // In a future implementation, this would fetch friend-only posts
    // For now, we'll just simulate the filter change
    setTimeout(() => {
      if (filter === 'friends') {
        // Show banner explaining the feature is coming soon
        showBanner("Friends filter will be available soon!", "info");
      }
      
      // For now, just reload all posts regardless of filter
      loadPosts(true);
    }, 300);
  };

  const renderPostItem = ({ item }) => {
    const navigateToPost = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/(standalone)/post-detail',
        params: { postId: item.id }
      });
    };

    // Check if the current user is the creator of this post
    const isPostOwner = auth.currentUser && 
                       auth.currentUser.uid === item.userId &&
                       item.userId !== undefined;

    // Filter any offensive content in title and body
    const filteredTitle = filterOffensiveWords(item.title);
    const filteredBody = filterOffensiveWords(item.body);

    return (
      <TouchableOpacity 
        style={styles.postCard}
        onPress={navigateToPost}
        activeOpacity={0.8}
      >
        <View style={styles.postHeader}>
          {/* Show different header based on anonymous setting */}
          {item.isAnonymous ? (
            <View style={styles.anonymousHeader}>
              <View style={styles.anonymousAvatar}>
                <Ionicons name="eye-off-outline" size={16} color="#999999" />
              </View>
              <Text style={styles.anonymousName}>Anonymous</Text>
              
              {/* Show delete button if user is post owner */}
              {isPostOwner && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePost(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#F44336" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.userHeader}>
              {item.userProfileImage ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    navigateToUserProfile(item.userId, item.userName);
                  }}
                  disabled={!item.userId}
                >
                  <Image 
                    source={{ uri: item.userProfileImage }} 
                    style={styles.userAvatar}
                    defaultSource={IMAGES.DEFAULT_AVATAR}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    navigateToUserProfile(item.userId, item.userName);
                  }}
                  disabled={!item.userId}
                  style={styles.userAvatar}
                >
                  <Text style={styles.avatarText}>
                    {item.userName?.charAt(0) || '?'}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.postHeaderInfo}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    navigateToUserProfile(item.userId, item.userName);
                  }}
                  disabled={!item.userId}
                >
                  <Text style={styles.userName}>{item.userName || 'User'}</Text>
                </TouchableOpacity>
                <Text style={styles.postTime}>{formatTimestamp(item.createdAt)}</Text>
              </View>
              
              {/* Show delete button if user is post owner */}
              {isPostOwner && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePost(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#F44336" />
                </TouchableOpacity>
              )}
            </View>
          )}
          {item.pinned && (
            <View style={styles.pinnedIndicator}>
              <Ionicons name="pin-outline" size={14} color="#5BBD68" />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.postTitle}>{filteredTitle}</Text>
        <Text style={styles.postBody} numberOfLines={3}>{filteredBody}</Text>
        
        <View style={styles.postStats}>
          <TouchableOpacity 
            style={styles.postStat}
            onPress={(e) => {
              e.stopPropagation();
              navigateToPost();
            }}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#666666" />
            <Text style={styles.postStatText}>{item.commentCount || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.postStat}
            onPress={(e) => {
              e.stopPropagation();
              handleLikePost(item.id, item.userLiked);
            }}
          >
            <Ionicons 
              name={item.userLiked ? "heart" : "heart-outline"} 
              size={18} 
              color={item.userLiked ? "#F44336" : "#666666"} 
            />
            <Text style={styles.postStatText}>{item.likeCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          {firebaseError ? (
            <>
              <Ionicons name="cloud-offline" size={64} color="#4CAF50" />
              <Text style={styles.emptyTitle}>Connection Error</Text>
              <Text style={styles.emptyText}>
                Could not connect to the community server. Please check your internet connection and try again.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => loadPosts(true)}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  borderRadius={24}
                />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </>
          ) : activeFilter === 'friends' ? (
            <>
              <Ionicons name="people" size={64} color="#4CAF50" />
              <Text style={styles.emptyTitle}>Friends Coming Soon</Text>
              <Text style={styles.emptyText}>
                The friends feature is still in development. Soon you'll be able to connect with other users on their sobriety journey!
              </Text>
              <TouchableOpacity 
                style={styles.createFirstPostButton}
                onPress={() => handleFilterChange('all')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  borderRadius={24}
                />
                <Text style={styles.createFirstPostText}>View All Posts</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="people" size={64} color="#4CAF50" />
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
                  colors={['#4CAF50', '#388E3C']}
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
      </View>
    );
  };

  const renderRefreshHeader = () => {
    if (!refreshProgress || refreshProgress === 0) return null;
    
    return (
      <View style={styles.refreshHeader}>
        <View style={styles.refreshProgress}>
          <View 
            style={[
              styles.refreshProgressFill, 
              { width: `${refreshProgress}%` }
            ]} 
          />
        </View>
        <Text style={styles.refreshText}>
          {refreshProgress < 100 
            ? `Pull down to refresh (${refreshProgress}%)` 
            : 'Refreshing...'}
        </Text>
      </View>
    );
  };

  // Helper function to show banner notification
  const showBanner = (message, type = 'success') => {
    setBannerMessage(message);
    setBannerType(type);
    setBannerVisible(true);
  };
  
  // Helper function to hide banner notification
  const hideBanner = () => {
    setBannerVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Banner Notification */}
      <BannerNotification
        visible={bannerVisible}
        message={bannerMessage}
        type={bannerType}
        onHide={hideBanner}
      />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{flex: 1, backgroundColor: '#FCFCFC'}} />
      </View>
      
      {/* Header with title */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.screenTitle}>Community</Text>
        
        <TouchableOpacity 
          style={styles.createPostButton}
          activeOpacity={0.7}
          onPress={handleCreatePost}
        >
          <LinearGradient
            colors={['rgba(76, 175, 80, 0.8)', 'rgba(56, 142, 60, 0.9)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={20}
          />
          <View style={styles.createPostButtonContent}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.createPostButtonText}>New Post</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Filter Toggle - moved inside the header component */}
      <View style={[styles.filterContainer, { paddingTop: insets.top + 50 }]}>
        <View style={styles.filterToggle}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              activeFilter === 'all' && styles.filterOptionActive
            ]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[
              styles.filterOptionText,
              activeFilter === 'all' && styles.filterOptionTextActive
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterOption,
              activeFilter === 'friends' && styles.filterOptionActive
            ]}
            onPress={() => handleFilterChange('friends')}
          >
            <Text style={[
              styles.filterOptionText,
              activeFilter === 'friends' && styles.filterOptionTextActive
            ]}>Friends</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.contentContainer, { paddingTop: insets.top + 110 }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={posts}
            renderItem={renderPostItem}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.listContent,
              posts.length === 0 ? { flex: 1, justifyContent: 'center' } : null
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#4CAF50"
                colors={["#4CAF50"]}
                progressViewOffset={50}
                progressBackgroundColor="#ffffff"
                onRefreshChange={onRefreshChange}
              />
            }
            ListEmptyComponent={renderEmptyComponent}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListHeaderComponent={renderRefreshHeader()}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  screenTitle: {
    fontSize: 32,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  createPostButton: {
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 8,
  },
  createPostButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    marginLeft: 4,
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousName: {
    fontSize: 16,
    color: '#999999',
    fontFamily: typography.fonts.medium,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    color: '#222222',
    fontFamily: typography.fonts.bold,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  postTitle: {
    fontSize: 18,
    color: '#222222',
    fontFamily: typography.fonts.bold,
    marginBottom: 8,
  },
  postBody: {
    fontSize: 14,
    color: '#444444',
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  pinnedText: {
    fontSize: 12,
    color: '#5BBD68',
    fontFamily: typography.fonts.regular,
  },
  unreadBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  avatarText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  filterContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    position: 'absolute',
    zIndex: 5,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 4,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    flexDirection: 'row',
  },
  filterOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#666666',
  },
  filterOptionTextActive: {
    color: '#4CAF50',
    fontFamily: typography.fonts.bold,
  },
  comingSoonBadge: {
    backgroundColor: '#FFB74D',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: typography.fonts.bold,
  },
  refreshHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshProgress: {
    width: '80%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  refreshProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  refreshText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
});

export default CommunityScreen; 