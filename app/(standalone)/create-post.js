import React, { useState, useEffect } from 'react';
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
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, auth } from '../../src/config/firebase';
import { 
  getUserProfile, 
  getAnonymousPostingPreferenceFromProfile
} from '../../src/utils/userProfile';
import { getAnonymousPostingPreference, saveAnonymousPostingPreference } from '../../src/utils/anonymousPostingPreference';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { createPost } from '../../src/utils/communityUtils';
import { validatePostContent } from '../../src/utils/contentModeration';
import BannerNotification from '../../src/components/BannerNotification';

const CreatePostScreen = () => {
  const insets = useSafeAreaInsets();
  
  // State for post data
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [bodyError, setBodyError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [firebaseError, setFirebaseError] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('error');
  
  // Check Firebase initialization on component mount
  useEffect(() => {
    loadUserProfile();
    loadAnonymousPreference();
    checkFirebaseConnection();
  }, []);
  
  const checkFirebaseConnection = () => {
    if (!isFirebaseInitialized()) {
      setFirebaseError(true);
      Alert.alert(
        "Connection Error",
        "Could not connect to the community server. Some features may be unavailable.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  };
  
  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadAnonymousPreference = async () => {
    try {
      // First try to get from user profile
      const isAnonymousFromProfile = await getAnonymousPostingPreferenceFromProfile();
      
      // Fall back to the legacy method if needed
      const isAnonymous = isAnonymousFromProfile !== undefined 
        ? isAnonymousFromProfile 
        : await getAnonymousPostingPreference();
        
      setPostAnonymously(isAnonymous);
    } catch (error) {
      console.error('Error loading anonymous preference:', error);
      // Default to false if there's an error
      setPostAnonymously(false);
    }
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (title.trim() || body.trim() || image) {
      Alert.alert(
        "Discard Post?",
        "You have unsaved changes. Are you sure you want to discard this post?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Discard",
            onPress: () => router.back(),
            style: "destructive"
          }
        ]
      );
    } else {
      router.back();
    }
  };
  
  const validateInputs = () => {
    if (!title.trim()) {
      showBanner('Please enter a title for your post');
      return false;
    }
    
    if (!body.trim()) {
      showBanner('Please enter content for your post');
      return false;
    }
    
    // Check for offensive content using content moderation
    const contentValidation = validatePostContent(title, body);
    if (!contentValidation.isValid) {
      showBanner(contentValidation.errorMessage);
      return false;
    }
    
    return true;
  };
  
  const uploadImage = async (uri) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `post_images/${Date.now()}_${filename}`);
      
      // Convert image to blob
      fetch(uri)
        .then(response => response.blob())
        .then(blob => {
          const uploadTask = uploadBytesResumable(storageRef, blob);
          
          // Listen for state changes, errors, and completion
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Get upload progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              // Handle errors
              console.error('Error uploading image:', error);
              reject(error);
            },
            async () => {
              // Upload completed successfully, get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        })
        .catch(error => {
          console.error('Error preparing image for upload:', error);
          reject(error);
        });
    });
  };
  
  const handlePublish = async () => {
    if (!validateInputs()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    try {
      // Check if Firebase is initialized
      if (!isFirebaseInitialized()) {
        showBanner('Could not connect to the community server. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        showBanner('You must be logged in to create a post');
        setIsLoading(false);
        return;
      }
      
      const user = auth.currentUser;
      
      // Prepare post data
      const postData = {
        title: title.trim(),
        body: body.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        lastActivityTimestamp: serverTimestamp(),
        commentCount: 0,
        likeCount: 0,
        isAnonymous: postAnonymously,
      };
      
      // Add user profile information to post if not anonymous
      if (!postAnonymously && userProfile) {
        postData.userName = userProfile.displayName || 'User';
        postData.userProfileImage = userProfile.profileImage || null;
      }
      
      // Upload image if present
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // Add image URL if available
      if (imageUrl) {
        postData.imageUrl = imageUrl;
      }
      
      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      // Save user's anonymous posting preference
      await saveAnonymousPostingPreference(postAnonymously);
      
      // Update post with ID
      await updateDoc(doc(db, 'posts', docRef.id), { id: docRef.id });
      
      showBanner('Post published successfully!', 'success');
      
      // Clear form and go back after success
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Error publishing post:', error);
      showBanner('Failed to publish post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is required to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };
  
  const handleAddImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Request media library permission
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };
  
  const handleRemoveImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImage(null);
  };
  
  const handleSubmit = async () => {
    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      Alert.alert(
        "Connection Error",
        "Could not connect to the community server. Please try again later."
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validate inputs
    if (!title.trim()) {
      setBodyError('Please enter a title for your post');
      return;
    }
    
    if (!body.trim()) {
      setBodyError('Please enter some content for your post');
      return;
    }
    
    setIsLoading(true);
    setBodyError('');
    
    try {
      await createPost({
        title: title.trim(),
        body: body.trim(),
        imageUri: image,
        userName: userProfile?.name || 'Anonymous User',
        userProfileImage: userProfile?.profileImage
      });
      
      // Success - navigate back to community
      router.replace('/(main)/community');
    } catch (error) {
      console.error('Error creating post:', error);
      setBodyError('Failed to create post. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Add a function to navigate to settings
  const goToSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(main)/profile'); // Navigate to profile/settings
  };
  
  // Helper function to show banner notification
  const showBanner = (message, type = 'error') => {
    setBannerMessage(message);
    setBannerType(type);
    setBannerVisible(true);
  };
  
  // Helper function to hide banner notification
  const hideBanner = () => {
    setBannerVisible(false);
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={[styles.publishButton, (!title.trim() || !body.trim()) && styles.disabledButton]}
          onPress={handlePublish}
          disabled={!title.trim() || !body.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.publishButtonText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Banner Notification */}
      <BannerNotification
        visible={bannerVisible}
        message={bannerMessage}
        type={bannerType}
        onHide={hideBanner}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.titleInput}
                placeholder="Title"
                placeholderTextColor="#999999"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                multiline={false}
              />
              {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
            </View>
            
            {/* Post Body */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.bodyInput}
                placeholder="Share your thoughts..."
                placeholderTextColor="#999999"
                value={body}
                onChangeText={setBody}
                multiline={true}
                textAlignVertical="top"
              />
              {bodyError ? <Text style={styles.errorText}>{bodyError}</Text> : null}
            </View>

            {/* Anonymity Status Message */}
            <View style={styles.anonymityStatusContainer}>
              <Ionicons 
                name={postAnonymously ? "eye-off" : "eye-outline"} 
                size={16} 
                color={postAnonymously ? "#4CAF50" : "#666666"} 
              />
              <Text style={styles.anonymityStatusText}>
                {postAnonymously 
                  ? "Your post will be published anonymously. " 
                  : "Your post will show your name and profile picture. "}
                <Text style={styles.anonymityStatusLink} onPress={goToSettings}>
                  Change in settings
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
  },
  publishButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    fontSize: 14,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  bodyInput: {
    fontSize: 16,
    fontFamily: typography.fonts.regular,
    color: '#000000',
    lineHeight: 24,
    minHeight: 200,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },
  anonymityStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
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
});

export default CreatePostScreen; 