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
  FlatList,
  SafeAreaView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
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
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { getUserProfile } from '../../src/utils/userProfile';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { IMAGES } from '../../src/constants/assets';
import { getAnonymousPostingPreference, saveAnonymousPostingPreference } from '../../src/utils/anonymousPostingPreference';
import { getAnonymousPostingPreferenceFromProfile } from '../../src/utils/userProfile';
import BannerNotification from '../../src/components/BannerNotification';
import { validateCommentContent, filterOffensiveWords } from '../../src/utils/contentModeration';

const PostDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams();
  const routerNav = useRouter();
  const scrollViewRef = useRef(null);
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
  const [anonymousCommenting, setAnonymousCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('success');
  
  // Auto-hide banner after a duration
  useEffect(() => {
    if (bannerVisible) {
      const timer = setTimeout(() => {
        setBannerVisible(false);
      }, 3000); // Hide after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [bannerVisible]);
  
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
    loadAnonymousPreference();
  }, [postId]);

  // Add keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Load post data
  const loadPost = async () => {
    try {
      setLoading(true);
      
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        console.error("Firebase is not initialized. Cannot load post details.");
        setLoading(false);
        setFirebaseError(true);
        return;
      }
      
      // Get post document
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        setPost(null);
        setLoading(false);
        return;
      }
      
        const postData = {
          id: postSnap.id,
          ...postSnap.data(),
          createdAt: postSnap.data().createdAt?.toDate() || new Date(),
        lastActivityTimestamp: postSnap.data().lastActivityTimestamp?.toDate() || new Date(),
        userLiked: false // Default to false, will be updated if user is logged in
        };
        
      // Check if current user has liked the post
        if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        
        // Get user-specific data for this post
        try {
          const userPostRef = doc(db, 'users', userId, 'likedPosts', postId);
          const userPostSnap = await getDoc(userPostRef);
          
          postData.userLiked = userPostSnap.exists();
        } catch (error) {
          console.error('Error checking if user liked post:', error);
          postData.userLiked = false; // Ensure default value if lookup fails
        }
      }
      
      setPost(postData);
      
      // Load comments after post data is loaded
      await loadComments();
      
      // Get user profile for the post creator
      if (postData.userId && !postData.isAnonymous) {
        await getUserDataById(postData.userId);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading post:', error);
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
  
  const loadAnonymousPreference = async () => {
    try {
      // First try to get from user profile
      const isAnonymousFromProfile = await getAnonymousPostingPreferenceFromProfile();
      
      // Fall back to the legacy method if needed
      const isAnonymous = isAnonymousFromProfile !== undefined 
        ? isAnonymousFromProfile 
        : await getAnonymousPostingPreference();
        
      setAnonymousCommenting(isAnonymous);
    } catch (error) {
      console.error('Error loading anonymous preference:', error);
      // Default to false if there's an error
      setAnonymousCommenting(false);
    }
  };
  
  const toggleAnonymousCommenting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnonymousCommenting(prev => !prev);
  };
  
  const loadComments = async () => {
    try {
      if (!postId || !isFirebaseInitialized()) return;
      
      // Get comments collection
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      
      const commentSnap = await getDocs(commentsQuery);
      
      if (commentSnap.empty) {
        setComments([]);
        return;
      }
      
      // Process comments to create a threaded structure
      const commentsData = commentSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        replies: [] // Initialize empty replies array
      }));
      
      // Create a threaded structure by nesting replies
      const threadedComments = [];
      const commentMap = {};
      
      // First, create a map of all comments by ID
      commentsData.forEach(comment => {
        commentMap[comment.id] = comment;
      });
      
      // Then organize them into a threaded structure
      commentsData.forEach(comment => {
        if (comment.parentId) {
          // This is a reply, add it to its parent
          if (commentMap[comment.parentId]) {
            commentMap[comment.parentId].replies.push(comment);
          }
        } else {
          // This is a top-level comment
          threadedComments.push(comment);
        }
      });
      
      setComments(threadedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };
  
  const handleSubmitComment = async () => {
    try {
      // Trim whitespace
      const trimmedComment = commentText.trim();
      
      // Check if comment is empty
      if (!trimmedComment) {
        showBanner('Please enter a comment', 'error');
        return;
      }
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        showBanner('You must be logged in to comment', 'error');
        return;
      }
      
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        showBanner("Could not connect to the community server.", "error");
        return;
      }
      
      // Validate comment content for inappropriate language
      const contentValidation = validateCommentContent(trimmedComment);
      if (!contentValidation.isValid) {
        showBanner(contentValidation.errorMessage, 'error');
        return;
      }
      
      // Continue with existing comment posting logic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setSubmitting(true);
      
      // Get user profile
      const profile = await getUserProfile();
      
      // Ensure we have a valid profile or default values
      const userName = profile?.displayName || profile?.firstName || 'Anonymous User';
      const userProfileImage = profile?.profileImage || profile?.photoURL || null;
      
      // Create comment document
      const commentData = {
        postId: post.id,
        userId: auth.currentUser.uid,
        isAnonymous: anonymousCommenting,
        userName: anonymousCommenting ? 'Anonymous' : userName,
        userProfileImage: anonymousCommenting ? null : userProfileImage,
        text: trimmedComment,
        createdAt: serverTimestamp(),
        parentId: replyingTo,
        replyCount: 0,
      };
      
      // Add to Firestore
      const commentRef = await addDoc(collection(db, 'comments'), commentData);
      
      // If this is a reply to another comment, increment the reply count of the parent
      if (replyingTo) {
        const parentCommentRef = doc(db, 'comments', replyingTo);
        await updateDoc(parentCommentRef, {
          replyCount: increment(1)
        });
      }
      
      // Update post's comment count in Firestore
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        commentCount: increment(1),
        lastActivityTimestamp: serverTimestamp()
      });
      
      // Update local post data with incremented comment count
      setPost(prevPost => ({
        ...prevPost,
        commentCount: (prevPost.commentCount || 0) + 1
      }));
      
      // Save anonymous preference
      await saveAnonymousPostingPreference(anonymousCommenting);
      
      // Clear comment input and reset replyingTo
      setCommentText('');
      setReplyingTo(null);
      
      // Create local version of comment for immediate display
      const localComment = {
        id: commentRef.id,
        ...commentData,
        createdAt: new Date(),
        replies: []
      };
      
      // Update comments state to include the new comment
      if (replyingTo) {
        // Find the parent comment and add this as a reply
        const updatedComments = [...comments];
        const findAndAddReply = (commentsList, parentId) => {
          for (let i = 0; i < commentsList.length; i++) {
            if (commentsList[i].id === parentId) {
              if (!commentsList[i].replies) {
                commentsList[i].replies = [];
              }
              commentsList[i].replies.push(localComment);
              return true;
            }
            if (commentsList[i].replies && commentsList[i].replies.length > 0) {
              if (findAndAddReply(commentsList[i].replies, parentId)) {
                return true;
              }
            }
          }
          return false;
        };
        
        findAndAddReply(updatedComments, replyingTo);
        setComments(updatedComments);
      } else {
        // Add as a top-level comment
        setComments(prevComments => [...prevComments, localComment]);
      }
      
      // Show success banner notification
      showBanner("Comment posted successfully", "success");
      
      // Scroll to bottom after a short delay
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      console.error('Error adding comment:', error);
      showBanner("Failed to add comment. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReply = (commentId, userName) => {
    setReplyingTo(commentId);
    setCommentText(`@${userName} `);
    // Focus the comment input
    commentInputRef.current?.focus();
  };
  
  const toggleReplies = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };
  
  const handleLikePost = async () => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }
      
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        Alert.alert(
          "Connection Error",
          "Could not connect to the community server. Please try again later."
        );
        return;
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const userId = auth.currentUser.uid;
      const postRef = doc(db, 'posts', post.id);
      const userLikedPostRef = doc(db, 'users', userId, 'likedPosts', post.id);
      
      // Optimistically update UI
      const newLikedState = !post.userLiked;
      const likeChange = newLikedState ? 1 : -1;
      
      // Update local state immediately for better UX
      setPost(prevPost => ({
        ...prevPost,
        userLiked: newLikedState,
        likeCount: (prevPost.likeCount || 0) + likeChange
      }));
      
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
      Alert.alert('Error', 'Failed to update like status. Please try again.');
      
      // Revert optimistic update on error
      setPost(prevPost => ({
        ...prevPost,
        userLiked: !prevPost.userLiked,
        likeCount: (prevPost.likeCount || 0) + (!prevPost.userLiked ? 1 : -1)
      }));
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
  
  // Add navigation to user profile when clicking on username or profile picture
  const navigateToUserProfile = (userId, userName) => {
    if (!userId || userId === auth.currentUser?.uid) return; // Don't navigate to own profile
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(standalone)/user-profile',
      params: { userId, userName }
    });
  };

  // Add a function to handle comment deletion
  const handleDeleteComment = async (commentId, parentId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // First, check if the user is authenticated
      if (!auth.currentUser) {
        showBanner("You must be logged in to delete comments.", "error");
        return;
      }
      
      // Fetch the comment to verify ownership
      const commentRef = doc(db, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        showBanner("This comment no longer exists.", "error");
        return;
      }
      
      const commentData = commentSnap.data();
      
      // Check if the current user is the owner of this comment
      if (auth.currentUser.uid !== commentData.userId) {
        showBanner("You can only delete comments that you have created.", "error");
        return;
      }
      
      // Ask for confirmation
      Alert.alert(
        "Delete Comment",
        "Are you sure you want to delete this comment? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            onPress: async () => {
              try {
                // Check if Firebase is initialized
                if (!isFirebaseInitialized()) {
                  showBanner("Could not connect to the community server.", "error");
                  return;
                }
                
                // Delete the comment from Firestore
                await deleteDoc(commentRef);
                
                // Update the post's comment count
                const postRef = doc(db, 'posts', post.id);
                await updateDoc(postRef, {
                  commentCount: increment(-1)
                });
                
                // If this was a reply, update the parent comment's reply count
                if (parentId) {
                  const parentCommentRef = doc(db, 'comments', parentId);
                  await updateDoc(parentCommentRef, {
                    replyCount: increment(-1)
                  });
                }
                
                // Update local state
                setPost(prevPost => ({
                  ...prevPost,
                  commentCount: Math.max(0, (prevPost.commentCount || 1) - 1)
                }));
                
                // Remove the comment from the local state
                if (parentId) {
                  // This is a reply
                  setComments(prevComments => {
                    const updatedComments = [...prevComments];
                    const removeReply = (commentsList, targetParentId, targetReplyId) => {
                      for (let i = 0; i < commentsList.length; i++) {
                        if (commentsList[i].id === targetParentId) {
                          if (commentsList[i].replies) {
                            commentsList[i].replies = commentsList[i].replies.filter(
                              reply => reply.id !== targetReplyId
                            );
                            return true;
                          }
                        }
                        if (commentsList[i].replies && commentsList[i].replies.length > 0) {
                          if (removeReply(commentsList[i].replies, targetParentId, targetReplyId)) {
                            return true;
                          }
                        }
                      }
                      return false;
                    };
                    
                    removeReply(updatedComments, parentId, commentId);
                    return updatedComments;
                  });
                } else {
                  // This is a top-level comment
                  setComments(prevComments => 
                    prevComments.filter(comment => comment.id !== commentId)
                  );
                }
                
                // Show success banner notification
                showBanner("Comment successfully deleted");
              } catch (error) {
                console.error('Error deleting comment:', error);
                showBanner("Failed to delete comment. Please try again.", "error");
              }
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      console.error('Error handling comment deletion:', error);
      showBanner("An unexpected error occurred while trying to delete the comment.", "error");
    }
  };
  
  // Add a function to handle post deletion
  const handleDeletePost = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Ensure user is authenticated and is the post owner
      if (!auth.currentUser || auth.currentUser.uid !== post.userId) {
        showBanner("You can only delete posts that you have created.", "error");
        return;
      }
      
      // Ask for confirmation
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post? All comments will also be deleted. This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            onPress: async () => {
              try {
                // Check if Firebase is initialized
                if (!isFirebaseInitialized()) {
                  showBanner("Could not connect to the community server.", "error");
                  return;
                }
                
                // Delete the post from Firestore
                const postRef = doc(db, 'posts', post.id);
                await deleteDoc(postRef);
                
                // Delete all comments associated with this post
                const commentsQuery = query(
                  collection(db, 'comments'),
                  where('postId', '==', post.id)
                );
                
                const commentSnap = await getDocs(commentsQuery);
                const batch = [];
                
                commentSnap.forEach((doc) => {
                  batch.push(deleteDoc(doc.ref));
                });
                
                // Execute all delete operations
                await Promise.all(batch);
                
                // Remove user's liked post reference if it exists
                if (auth.currentUser) {
                  const userLikedPostRef = doc(db, 'users', auth.currentUser.uid, 'likedPosts', post.id);
                  const likedDoc = await getDoc(userLikedPostRef);
                  if (likedDoc.exists()) {
                    await deleteDoc(userLikedPostRef);
                  }
                }
                
                // Show success banner notification
                showBanner("Post successfully deleted");
                
                // Navigate back after a short delay to allow the banner to be seen
                setTimeout(() => {
                  router.back();
                }, 1500);
              } catch (error) {
                console.error('Error deleting post:', error);
                showBanner("Failed to delete post. Please try again.", "error");
              }
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      console.error('Error handling post deletion:', error);
      showBanner("An unexpected error occurred while trying to delete the post.", "error");
    }
  };

  // Update the renderPostHeader function to add a delete option for the post owner
  const renderPostHeader = () => {
    if (!post) return null;
    
    // Check if the current user is the creator of this post
    const isPostOwner = auth.currentUser && 
                       auth.currentUser.uid === post.userId &&
                       post.userId !== undefined;
    
    return (
      <View style={styles.postHeader}>
        {post.isAnonymous ? (
          // Anonymous post header
          <View style={styles.anonymousHeader}>
            <View style={styles.anonymousAvatar}>
              <Ionicons name="eye-off-outline" size={16} color="#999999" />
            </View>
            <Text style={styles.anonymousName}>Anonymous</Text>
            
            {/* Show delete button for anonymous posts if the user is the creator */}
            {isPostOwner && (
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDeletePost}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // Regular post header
          <View style={styles.userHeader}>
            {post.userProfileImage ? (
              <TouchableOpacity
                onPress={() => navigateToUserProfile(post.userId, post.userName)}
                disabled={!post.userId || post.userId === auth.currentUser?.uid}
              >
        <Image 
                  source={{ uri: post.userProfileImage }} 
                  style={styles.userAvatar}
                  defaultSource={IMAGES.DEFAULT_AVATAR}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.userAvatar}
                onPress={() => navigateToUserProfile(post.userId, post.userName)}
                disabled={!post.userId || post.userId === auth.currentUser?.uid}
              >
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.headerInfo}>
              <TouchableOpacity
                onPress={() => navigateToUserProfile(post.userId, post.userName)}
                disabled={!post.userId || post.userId === auth.currentUser?.uid}
              >
                <Text style={styles.userName}>{post.userName || 'User'}</Text>
              </TouchableOpacity>
              <Text style={styles.postTime}>{formatTimestamp(post.createdAt)}</Text>
          </View>
            
            {/* Show delete button if the user is the creator */}
            {isPostOwner && (
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDeletePost}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            )}
        </View>
        )}
      </View>
    );
  };

  // Update the renderCommentItem function to include a delete button for the comment owner
  const renderCommentItem = ({ item, isReply = false, parentId = null }) => {
    const isExpanded = expandedComments[item.id] || false;
    const hasReplies = item.replies && item.replies.length > 0;
    const isCommentOwner = auth.currentUser && item.userId === auth.currentUser.uid;
    
    // Filter offensive content in comment text
    const filteredText = filterOffensiveWords(item.text);
  
  return (
      <View style={[
        styles.commentItem,
        isReply && styles.replyItem,
      ]}>
        {item.isAnonymous ? (
          // Anonymous comment
          <View style={styles.anonymousCommentHeader}>
            <View style={styles.anonymousAvatar}>
              <Ionicons name="eye-off-outline" size={16} color="#999999" />
            </View>
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.anonymousName}>Anonymous</Text>
                <View style={styles.commentTimeContainer}>
                  <Text style={styles.commentTime}>{formatTimestamp(item.createdAt)}</Text>
                  
                  {/* Show delete button for anonymous comments if the user is the creator */}
                  {isCommentOwner && (
                    <TouchableOpacity 
                      style={styles.deleteCommentButton} 
                      onPress={() => handleDeleteComment(item.id, parentId)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.commentText}>{filteredText}</Text>
              
              <View style={styles.commentActions}>
        <TouchableOpacity 
                  style={styles.replyButton}
                  onPress={() => handleReply(item.id, 'Anonymous')}
        >
                  <Ionicons name="return-down-back-outline" size={16} color="#4CAF50" />
                  <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
        
                {hasReplies && (
                  <TouchableOpacity 
                    style={styles.showRepliesButton}
                    onPress={() => toggleReplies(item.id)}
                  >
                    <Ionicons 
                      name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                      size={16} 
                      color="#666666" 
                    />
                    <Text style={styles.showRepliesText}>
                      {isExpanded ? "Hide Replies" : `View Replies (${item.replies.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
      </View>
            </View>
        </View>
      ) : (
          // Regular comment
          <>
            {item.userProfileImage ? (
              <TouchableOpacity 
                onPress={() => navigateToUserProfile(item.userId, item.userName)}
                disabled={!item.userId || item.userId === auth.currentUser?.uid}
              >
                    <Image 
                  source={{ uri: item.userProfileImage }} 
                  style={styles.commentAvatar}
                  defaultSource={IMAGES.DEFAULT_AVATAR}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => navigateToUserProfile(item.userId, item.userName)}
                disabled={!item.userId || item.userId === auth.currentUser?.uid}
                style={styles.commentDefaultAvatar}
              >
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <TouchableOpacity 
                  onPress={() => navigateToUserProfile(item.userId, item.userName)}
                  disabled={!item.userId || item.userId === auth.currentUser?.uid}
                >
                  <Text style={styles.commentUserName}>{item.userName || 'User'}</Text>
                </TouchableOpacity>
                <View style={styles.commentTimeContainer}>
                  <Text style={styles.commentTime}>{formatTimestamp(item.createdAt)}</Text>
                  
                  {/* Show delete button if the user is the creator */}
                  {isCommentOwner && (
                    <TouchableOpacity 
                      style={styles.deleteCommentButton} 
                      onPress={() => handleDeleteComment(item.id, parentId)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F44336" />
                    </TouchableOpacity>
                  )}
                    </View>
                  </View>
              <Text style={styles.commentText}>{filteredText}</Text>
              
              <View style={styles.commentActions}>
                <TouchableOpacity 
                  style={styles.replyButton}
                  onPress={() => handleReply(item.id, item.userName || 'User')}
                >
                  <Ionicons name="return-down-back-outline" size={16} color="#4CAF50" />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </TouchableOpacity>
                
                {hasReplies && (
                  <TouchableOpacity 
                    style={styles.showRepliesButton}
                    onPress={() => toggleReplies(item.id)}
                  >
                    <Ionicons 
                      name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                      size={16} 
                      color="#666666" 
                    />
                    <Text style={styles.showRepliesText}>
                      {isExpanded ? "Hide Replies" : `View Replies (${item.replies.length})`}
                    </Text>
                  </TouchableOpacity>
                  )}
                </View>
            </View>
          </>
        )}
      </View>
    );
  };

  // Update the renderReplies function to pass the parent ID to renderCommentItem
  const renderReplies = (replies, parentId) => {
    if (!replies || replies.length === 0) return null;
    
    return (
      <View style={styles.repliesContainer}>
        {replies.map(reply => (
          <View key={reply.id}>
            {renderCommentItem({ 
              item: reply, 
              isReply: true,
              parentId: parentId
            })}
            {/* Recursively render all nested replies */}
            {expandedComments[reply.id] && reply.replies && reply.replies.length > 0 && 
              renderReplies(reply.replies, reply.id)}
          </View>
        ))}
      </View>
    );
  };

  const renderPostStats = () => {
    return (
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={18} color="#666666" />
          <Text style={styles.statText}>{post.commentCount || 0}</Text>
        </View>
        <TouchableOpacity style={styles.statItem} onPress={handleLikePost}>
                    <Ionicons 
            name={post.userLiked ? "heart" : "heart-outline"} 
            size={18} 
            color={post.userLiked ? "#F44336" : "#666666"} 
          />
          <Text style={styles.statText}>{post.likeCount || 0}</Text>
                  </TouchableOpacity>
        <Text style={styles.postTime}>{formatTimestamp(post.createdAt)}</Text>
      </View>
    );
  };

  const goToSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(main)/profile'); // Navigate to profile/settings
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
      
      {/* Light background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{flex: 1, backgroundColor: '#FFFFFF'}} />
      </View>
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
          <Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 40 }} />
                </View>
                
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading post...</Text>
                </View>
      ) : firebaseError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color="#4CAF50" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>
            Could not connect to the community server. Please check your internet connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPost}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
              </View>
      ) : post ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.scrollContainer} 
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={styles.postContainer}>
              {renderPostHeader()}
              <Text style={styles.postTitle}>{filterOffensiveWords(post.title)}</Text>
              <Text style={styles.postBody}>{filterOffensiveWords(post.body)}</Text>
              {renderPostStats()}
            </View>

            <View style={styles.commentsContainer}>
              <Text style={styles.commentsTitle}>
                Replies ({post.commentCount || 0})
              </Text>
              
              {comments.length === 0 ? (
                <View style={styles.noCommentsContainer}>
                  <Text style={styles.noCommentsText}>No replies yet. Be the first to reply!</Text>
                </View>
              ) : (
                comments.map(comment => (
                  <View key={comment.id}>
                    {renderCommentItem({ item: comment })}
                    {/* Render replies if they exist and are expanded */}
                    {expandedComments[comment.id] && (
                      renderReplies(comment.replies, comment.id)
                    )}
              </View>
                ))
              )}
            </View>
          </ScrollView>
          
          <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Text style={styles.replyingToText}>
                  Replying to a comment
                </Text>
                <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyButton}>
                  <Ionicons name="close-circle" size={16} color="#666666" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
                  ref={commentInputRef}
            />
              </View>
            
            <TouchableOpacity 
              style={[
                  styles.commentButton, 
                  (!commentText.trim() || submitting) && styles.commentButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
            >
                <Ionicons name="send" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
            
            {/* Only show the anonymity status message when anonymous posting is enabled */}
            {anonymousCommenting && (
              <View style={styles.anonymityStatusContainer}>
                <Ionicons 
                  name="eye-off" 
                  size={16} 
                  color="#4CAF50" 
                />
                <Text style={styles.anonymityStatusText}>
                  Your comment will be posted anonymously. 
                  <Text style={styles.anonymityStatusLink} onPress={goToSettings}>
                    Change in settings
                  </Text>
                </Text>
              </View>
            )}
          </View>
    </KeyboardAvoidingView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#4CAF50" />
          <Text style={styles.errorTitle}>Post Not Found</Text>
          <Text style={styles.errorText}>
            The post you're looking for could not be found.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    fontFamily: typography.fonts.bold,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: '#222222',
    fontFamily: typography.fonts.medium,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  postTitle: {
    fontSize: 20,
    color: '#222222',
    fontFamily: typography.fonts.bold,
    marginTop: 12,
    marginBottom: 8,
  },
  postBody: {
    fontSize: 16,
    color: '#444444',
    fontFamily: typography.fonts.regular,
    lineHeight: 24,
    marginBottom: 16,
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
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginLeft: 8,
  },
  commentsHeader: {
    paddingVertical: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222222',
    fontFamily: typography.fonts.bold,
  },
  commentsList: {
    paddingBottom: 100,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  replyItem: {
    marginTop: -4,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    marginLeft: 20,
  },
  repliesContainer: {
    marginTop: -8,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 20,
    backgroundColor: '#E0E0E0', // Fallback background
  },
  commentDefaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  anonymousCommentHeader: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentUserName: {
    fontSize: 14,
    color: '#222222',
    fontFamily: typography.fonts.bold,
    flex: 1,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  commentText: {
    fontSize: 14,
    color: '#444444',
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  replyButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4,
  },
  showRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  showRepliesText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 4,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  cancelReplyButton: {
    padding: 4,
  },
  commentInputContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    marginRight: 12,
    marginBottom: 0,
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#222222',
    maxHeight: 100,
    minHeight: 40,
  },
  commentInputOptions: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  anonymousToggleActive: {
    backgroundColor: '#4CAF50',
  },
  anonymousToggleText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  anonymousToggleTextActive: {
    color: '#FFFFFF',
  },
  commentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: 'rgba(79, 166, 91, 0.3)',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginLeft: 6,
  },
  commentsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    paddingBottom: 16,
  },
  noCommentsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  commentAnonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAnonAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAnonName: {
    fontSize: 14,
    color: '#999999',
    fontFamily: typography.fonts.medium,
    marginLeft: 8,
  },
  commentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: typography.fonts.medium,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    color: '#4CAF50',
    fontFamily: typography.fonts.bold,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
    marginLeft: 8,
  },
  repliesTitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  anonymityStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  anonymityStatusText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
    flex: 1,
  },
  anonymityStatusLink: {
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    textDecorationLine: 'underline',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  deleteCommentButton: {
    marginLeft: 8,
    padding: 2,
  },
  commentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PostDetailScreen; 