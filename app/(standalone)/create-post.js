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
  Platform
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
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, auth } from '../../src/config/firebase';
import { getUserProfile } from '../../src/utils/userProfile';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { createPost } from '../../src/utils/communityUtils';

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
  
  // Check Firebase initialization on component mount
  useEffect(() => {
    loadUserProfile();
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
    let isValid = true;
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.length > 100) {
      setTitleError('Title must be less than 100 characters');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    // Validate body
    if (!body.trim()) {
      setBodyError('Post content is required');
      isValid = false;
    } else {
      setBodyError('');
    }
    
    return isValid;
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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Check Firebase initialization
      if (!isFirebaseInitialized()) {
        Alert.alert(
          "Connection Error",
          "Could not connect to the community server. Please try again later."
        );
        return;
      }
      
      // Validate inputs
      if (!validateInputs()) {
        return;
      }
      
      setIsLoading(true);
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a post');
        setIsLoading(false);
        return;
      }
      
      // Get user profile data
      const profileData = await getUserProfile();
      
      // Upload image if present
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // Create post document
      const postData = {
        title: title.trim(),
        body: body.trim(),
        userId: user.uid,
        userName: profileData.name || 'Anonymous User',
        userProfileImage: profileData.profileImage,
        createdAt: serverTimestamp(),
        lastActivityTimestamp: serverTimestamp(),
        commentCount: 0,
        likeCount: 0,
      };
      
      // Add image URL if available
      if (imageUrl) {
        postData.imageUrl = imageUrl;
      }
      
      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      setIsLoading(false);
      
      // Show success message
      Alert.alert(
        "Success",
        "Your post has been published!",
        [{ 
          text: "OK", 
          onPress: () => router.back() 
        }]
      );
    } catch (error) {
      console.error('Error publishing post:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to publish post. Please try again.');
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
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Post</Text>
        
        <TouchableOpacity 
          style={styles.publishButton} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {firebaseError && (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline" size={18} color="#fff" />
            <Text style={styles.errorBannerText}>
              Connection issues detected. Your post may not be saved.
            </Text>
          </View>
        )}
        
        {bodyError ? <Text style={styles.errorText}>{bodyError}</Text> : null}
        
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoCapitalize="sentences"
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>
        
        {/* Body Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.bodyInput}
            placeholder="Share your thoughts, experiences, or ask for advice..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
          {bodyError ? <Text style={styles.errorText}>{bodyError}</Text> : null}
        </View>
        
        {/* Image Preview */}
        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: image }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <Ionicons name="close-circle" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Add Image Button */}
        {!image && (
          <TouchableOpacity 
            style={styles.addImageButton}
            activeOpacity={0.8}
            onPress={handleAddImage}
          >
            <LinearGradient
              colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="image-outline" size={24} color="#4FA65B" style={styles.buttonIcon} />
            <Text style={styles.addImageText}>Add Image</Text>
          </TouchableOpacity>
        )}
        
        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Community Guidelines</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4FA65B" />
            <Text style={styles.tipText}>Be respectful and supportive of others</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4FA65B" />
            <Text style={styles.tipText}>Share your experiences and ask questions</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4FA65B" />
            <Text style={styles.tipText}>Keep content relevant to recovery</Text>
          </View>
        </View>
      </ScrollView>
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
  publishButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  publishButtonText: {
    fontSize: 16,
    color: '#4FA65B',
    fontFamily: typography.fonts.bold,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
    fontSize: 18,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  },
  bodyInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    fontSize: 16,
    minHeight: 200,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },
  imagePreviewContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    overflow: 'hidden',
  },
  buttonIcon: {
    marginRight: 8,
  },
  addImageText: {
    color: '#4FA65B',
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
  tipsContainer: {
    backgroundColor: 'rgba(79, 166, 91, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    marginLeft: 8,
  },
});

export default CreatePostScreen; 