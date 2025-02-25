import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  serverTimestamp, 
  increment,
  startAfter
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { getUserProfile } from './userProfile';
import { isFirebaseInitialized } from './firebaseCheck';

/**
 * Create a new post in the community
 * @param {Object} postData - Post data
 * @param {string} postData.title - Post title
 * @param {string} postData.body - Post body content
 * @param {string} postData.imageUri - Local URI of image to upload (optional)
 * @param {string} postData.userName - User's display name
 * @param {string} postData.userProfileImage - User's profile image URL
 * @returns {Promise<Object>} Created post data with ID
 */
export const createPost = async (postData) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Cannot create post.');
  }

  try {
    const { title, body, imageUri, userName, userProfileImage } = postData;
    
    // Validate inputs
    if (!title.trim()) {
      throw new Error('Post title is required');
    }
    
    if (!body.trim()) {
      throw new Error('Post content is required');
    }
    
    // Get current user
    const user = auth?.currentUser;
    const userId = user?.uid || 'anonymous';
    
    // Prepare post data
    const newPost = {
      title: title.trim(),
      body: body.trim(),
      userId,
      userName: userName || 'Anonymous User',
      userProfileImage,
      createdAt: serverTimestamp(),
      lastActivityTimestamp: serverTimestamp(),
      commentCount: 0,
      likeCount: 0,
      likes: []
    };
    
    // Upload image if provided
    if (imageUri) {
      const imageUrl = await uploadImage(imageUri);
      newPost.imageUrl = imageUrl;
    }
    
    // Add post to Firestore
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, newPost);
    
    return {
      id: docRef.id,
      ...newPost
    };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

/**
 * Upload an image to Firebase Storage
 * @param {string} uri - Local URI of image to upload
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadImage = async (uri) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Cannot upload image.');
  }

  try {
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Generate a unique filename
    const filename = `post_images/${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create storage reference
    const storageRef = ref(storage, filename);
    
    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Return a promise that resolves with the download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
        },
        (error) => {
          // Handle upload errors
          console.error('Error uploading image:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully, get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in image upload process:', error);
    throw error;
  }
};

/**
 * Add a comment to a post
 * @param {Object} commentData - Comment data
 * @param {string} commentData.postId - ID of the post to comment on
 * @param {string} commentData.text - Comment text
 * @param {string} commentData.userName - User's display name
 * @param {string} commentData.userProfileImage - User's profile image URL
 * @returns {Promise<Object>} Created comment data with ID
 */
export const addComment = async (commentData) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Cannot add comment.');
  }

  try {
    const { postId, text, userName, userProfileImage } = commentData;
    
    // Validate inputs
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    if (!text.trim()) {
      throw new Error('Comment text is required');
    }
    
    // Get current user
    const user = auth?.currentUser;
    const userId = user?.uid || 'anonymous';
    
    // Prepare comment data
    const newComment = {
      postId,
      text: text.trim(),
      userId,
      userName: userName || 'Anonymous User',
      userProfileImage,
      createdAt: serverTimestamp()
    };
    
    // Add comment to Firestore
    const commentsRef = collection(db, 'comments');
    const docRef = await addDoc(commentsRef, newComment);
    
    // Update post's comment count and last activity timestamp
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1),
      lastActivityTimestamp: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...newComment,
      createdAt: new Date() // Return a JavaScript Date object since serverTimestamp() returns null client-side
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Toggle like status for a post
 * @param {string} postId - ID of the post to like/unlike
 * @returns {Promise<boolean>} True if post is now liked, false if unliked
 */
export const toggleLikePost = async (postId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Cannot like/unlike post.');
  }

  try {
    // Validate input
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    // Get current user
    const user = auth?.currentUser;
    if (!user) {
      throw new Error('You must be logged in to like posts');
    }
    
    const userId = user.uid;
    
    // Get post document
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = postSnap.data();
    const likes = postData.likes || [];
    const isLiked = likes.includes(userId);
    
    // Toggle like status
    if (isLiked) {
      // Unlike: Remove user ID from likes array and decrement count
      await updateDoc(postRef, {
        likes: likes.filter(id => id !== userId),
        likeCount: increment(-1),
        lastActivityTimestamp: serverTimestamp()
      });
      return false;
    } else {
      // Like: Add user ID to likes array and increment count
      await updateDoc(postRef, {
        likes: [...likes, userId],
        likeCount: increment(1),
        lastActivityTimestamp: serverTimestamp()
      });
      return true;
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    throw error;
  }
};

/**
 * Delete a post and all its comments
 * @param {string} postId - ID of post to delete
 * @returns {Promise<void>}
 */
export const deletePost = async (postId) => {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to delete posts');
    }
    
    // Get post data
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = postSnap.data();
    
    // Check if user is the post author
    if (postData.userId !== user.uid) {
      throw new Error('You can only delete your own posts');
    }
    
    // Delete post image if it exists
    if (postData.imageUrl) {
      const storage = getStorage();
      const imageRef = ref(storage, postData.imageUrl);
      await deleteObject(imageRef).catch(error => {
        console.error('Error deleting image:', error);
        // Continue with post deletion even if image deletion fails
      });
    }
    
    // Delete all comments for this post
    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(commentsRef, where('postId', '==', postId));
    const commentsSnapshot = await getDocs(commentsQuery);
    
    const commentDeletions = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(commentDeletions);
    
    // Delete all likes for this post
    const likesRef = collection(db, 'likes');
    const likesQuery = query(likesRef, where('postId', '==', postId));
    const likesSnapshot = await getDocs(likesQuery);
    
    const likeDeletions = likesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(likeDeletions);
    
    // Delete the post
    await deleteDoc(postRef);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

/**
 * Get posts from Firestore with pagination
 * @param {number} postLimit - Maximum number of posts to fetch
 * @param {Object} lastPost - Last post document for pagination
 * @returns {Promise<Array>} Array of post objects
 */
export const getPosts = async (postLimit = 20, lastPost = null) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Cannot fetch posts.');
  }

  try {
    const postsRef = collection(db, 'posts');
    let postsQuery;
    
    if (lastPost) {
      // Paginated query
      postsQuery = query(
        postsRef,
        orderBy('lastActivityTimestamp', 'desc'),
        startAfter(lastPost),
        limit(postLimit)
      );
    } else {
      // Initial query
      postsQuery = query(
        postsRef,
        orderBy('lastActivityTimestamp', 'desc'),
        limit(postLimit)
      );
    }
    
    const querySnapshot = await getDocs(postsQuery);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Process posts
    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActivityTimestamp: data.lastActivityTimestamp?.toDate() || new Date()
      };
    });
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

/**
 * Get comments for a specific post
 * @param {string} postId - ID of the post to get comments for
 * @returns {Promise<Array>} Array of comment objects
 */
export const getComments = async (postId) => {
  // Check if Firebase is initialized
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase is not initialized. Cannot fetch comments.');
  }

  try {
    // Validate input
    if (!postId) {
      throw new Error('Post ID is required');
    }
    
    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    
    // Process comments
    const comments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}; 