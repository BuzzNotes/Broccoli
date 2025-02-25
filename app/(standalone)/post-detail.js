import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { getUserProfile } from '../../src/utils/userProfile';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { IMAGES } from '../../src/constants/assets';

const PostDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams();
  const commentInputRef = useRef(null);
  
  // State
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [liked, setLiked] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);
  
  useEffect(() => {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      Alert.alert(
        "Connection Error",
        "Could not connect to the community server. Please try again later."
      );
      setLoading(false);
      setFirebaseError(true);
      return;
    }
    
    loadPost();
    loadUserProfile();
  }, [postId]);

  // Load post data
  const loadPost = async () => {
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        Alert.alert(
          "Connection Error",
          "Could not connect to the community server. Please try again later."
        );
        setLoading(false);
        setFirebaseError(true);
        return;
      }
      
      // Get post document
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const postData = {
          id: postSnap.id,
          ...postSnap.data(),
          createdAt: postSnap.data().createdAt?.toDate() || new Date(),
        };
        
        setPost(postData);
        
        // Check if user has liked this post
        if (auth.currentUser) {
          const likesRef = collection(db, 'posts', postId, 'likes');
          const q = query(likesRef, where('userId', '==', auth.currentUser.uid));
          const likesSnap = await getDocs(q);
          setLiked(!likesSnap.empty);
        }
        
        // Get comments
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }));
          
          setComments(commentsData);
          
          // Load user profiles for comments
          commentsData.forEach(comment => {
            if (comment.userId && !userProfiles[comment.userId]) {
              getUserDataById(comment.userId);
            }
          });
        });
        
        return () => unsubscribe();
      } else {
        console.log('Post not found');
        Alert.alert('Error', 'Post not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load user profile
  const loadUserProfile = async () => {
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        return;
      }
      
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };
  
  // Get user data by ID
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
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleSubmitComment = async () => {
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        Alert.alert(
          "Connection Error",
          "Could not connect to the community server. Please try again later."
        );
        return;
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (!commentText.trim()) {
        return;
      }
      
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to comment');
        return;
      }
      
      setSubmitting(true);
      
      // Get user profile
      const profile = userProfile || await getUserProfile();
      
      // Add comment to Firestore
      const commentData = {
        text: commentText.trim(),
        userId: auth.currentUser.uid,
        userName: profile.name || 'Anonymous User',
        userProfileImage: profile.profileImage,
        createdAt: serverTimestamp(),
      };
      
      // Add comment to post
      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      
      // Update post comment count
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1),
        lastActivityTimestamp: serverTimestamp(),
      });
      
      // Clear input
      setCommentText('');
      
      // Dismiss keyboard
      commentInputRef.current?.blur();
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleLikePost = async () => {
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        Alert.alert(
          "Connection Error",
          "Could not connect to the community server. Please try again later."
        );
        return;
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }
      
      const likesRef = collection(db, 'posts', postId, 'likes');
      const q = query(likesRef, where('userId', '==', auth.currentUser.uid));
      const likesSnap = await getDocs(q);
      
      if (likesSnap.empty) {
        // User hasn't liked the post yet, add like
        await addDoc(likesRef, {
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
        
        // Update post like count
        await updateDoc(doc(db, 'posts', postId), {
          likeCount: increment(1),
          lastActivityTimestamp: serverTimestamp(),
        });
        
        setLiked(true);
        
        // Update local post data
        setPost(prev => ({
          ...prev,
          likeCount: (prev.likeCount || 0) + 1,
        }));
      } else {
        // User already liked the post, remove like
        const likeDoc = likesSnap.docs[0];
        await deleteDoc(doc(db, 'posts', postId, 'likes', likeDoc.id));
        
        // Update post like count
        await updateDoc(doc(db, 'posts', postId), {
          likeCount: increment(-1),
          lastActivityTimestamp: serverTimestamp(),
        });
        
        setLiked(false);
        
        // Update local post data
        setPost(prev => ({
          ...prev,
          likeCount: Math.max((prev.likeCount || 0) - 1, 0),
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };
  
  // Format timestamp
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
  
  // Render comment item
  const renderCommentItem = ({ item }) => {
    return (
      <View style={styles.commentItem}>
        <Image 
          source={item.userProfileImage ? { uri: item.userProfileImage } : IMAGES.DEFAULT_AVATAR} 
          style={styles.commentAvatar} 
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUserName}>{item.userName}</Text>
            <Text style={styles.commentTime}>{formatTimestamp(item.createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Post</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4FA65B" />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      ) : (
        <>
          {/* Post Content */}
          <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={item => item.id}
            ListHeaderComponent={() => (
              <View style={styles.postContainer}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                  <View style={styles.userInfo}>
                    <Image 
                      source={post.userProfileImage ? { uri: post.userProfileImage } : IMAGES.DEFAULT_AVATAR} 
                      style={styles.userAvatar}
                    />
                    <View>
                      <Text style={styles.userName}>{post.userName || 'Anonymous User'}</Text>
                      <Text style={styles.postTime}>{formatTimestamp(post.createdAt)}</Text>
                    </View>
                  </View>
                </View>
                
                {/* Post Content */}
                <View style={styles.postContent}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postBody}>{post.body}</Text>
                  
                  {post.imageUrl && (
                    <Image 
                      source={{ uri: post.imageUrl }} 
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
                
                {/* Post Actions */}
                <View style={styles.postActions}>
                  <TouchableOpacity 
                    style={styles.postAction}
                    onPress={handleLikePost}
                  >
                    <Ionicons 
                      name={liked ? "heart" : "heart-outline"} 
                      size={24} 
                      color={liked ? "#FF3B30" : colors.text.secondary} 
                    />
                    <Text style={[
                      styles.postActionText,
                      liked && { color: "#FF3B30" }
                    ]}>
                      {post.likeCount || 0}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.postAction}
                    onPress={() => commentInputRef.current?.focus()}
                  >
                    <Ionicons name="chatbubble-outline" size={24} color={colors.text.secondary} />
                    <Text style={styles.postActionText}>{post.commentCount || 0}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Comments Header */}
                <View style={styles.commentsHeader}>
                  <Text style={styles.commentsTitle}>Comments</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyCommentsContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubText}>Be the first to share your thoughts!</Text>
              </View>
            )}
            contentContainerStyle={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <Image 
              source={userProfile?.profileImage ? { uri: userProfile.profileImage } : IMAGES.DEFAULT_AVATAR} 
              style={styles.commentInputAvatar}
            />
            
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!commentText.trim() || submitting) && styles.sendButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1A15',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  postContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.5)',
  },
  userName: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  postTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  },
  postContent: {
    paddingBottom: 16,
  },
  postTitle: {
    fontSize: 22,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 12,
  },
  postBody: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    lineHeight: 24,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  postActionText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
    marginLeft: 8,
  },
  commentsHeader: {
    paddingVertical: 16,
  },
  commentsTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  commentsList: {
    paddingBottom: 100,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
  },
  commentContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  commentTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  },
  commentText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    marginLeft: 4,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginTop: 12,
  },
  emptyCommentsSubText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0F1A15',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4FA65B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(79, 166, 91, 0.3)',
  },
});

export default PostDetailScreen; 