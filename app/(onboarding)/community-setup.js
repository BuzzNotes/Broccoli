import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Switch, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../src/config/firebase';
import { saveAnonymousPostingPreference, saveProfilePrivacySetting, getUserProfile } from '../../src/utils/userProfile';
import CustomButton from "../../src/components/CustomButton";
import LoadingScreen from "../../src/components/LoadingScreen";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function CommunitySetupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Enable/disable button based on display name
  useEffect(() => {
    setIsButtonEnabled(displayName.trim().length > 0);
  }, [displayName]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setDisplayName(profile.displayName || '');
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setEmail(profile.email || (auth.currentUser ? auth.currentUser.email : ''));
        setProfileImage(profile.photoURL || null);
      } else if (auth.currentUser) {
        // If no profile but user is authenticated, get email from auth
        setEmail(auth.currentUser.email || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const toggleAnonymous = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAnonymous(previous => !previous);
  };

  const togglePrivate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPrivate(previous => !previous);
  };

  const handleChooseImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImage(true);
        // Upload image to Firebase Storage
        const imageUrl = await uploadImage(result.assets[0].uri);
        setProfileImage(imageUrl);
        setUploadingImage(false);
      }
    } catch (error) {
      setUploadingImage(false);
      console.error('Error choosing image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadImage = async (uri) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `profile_images/${auth.currentUser.uid}/${Date.now()}_${filename}`);
      
      // Convert image to blob
      fetch(uri)
        .then(response => response.blob())
        .then(blob => {
          const uploadTask = uploadBytesResumable(storageRef, blob);
          
          // Listen for state changes, errors, and completion
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Get upload progress if needed
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload is ${progress}% done`);
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

  const handleRemoveImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProfileImage(null);
  };

  const getInitials = () => {
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (displayName) return displayName.charAt(0).toUpperCase();
    return '?';
  };
  
  const getAvatarBackgroundColor = () => {
    // You can create a simple hash of the name to get a consistent color
    const initial = getInitials();
    const charCode = initial.charCodeAt(0) || 65;
    const hue = (charCode - 65) * 20 % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  const handleNext = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Save all profile data to user profile
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          displayName: displayName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          photoURL: profileImage,
          profileImage: profileImage, // Add profileImage field specifically for posts
          anonymousPosting: isAnonymous,
          profilePrivacy: isPrivate ? 'private' : 'public'
        });
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userDisplayName', displayName.trim());
      await AsyncStorage.setItem('userFirstName', firstName.trim());
      await AsyncStorage.setItem('userLastName', lastName.trim());
      await AsyncStorage.setItem('userEmail', email.trim());
      if (profileImage) {
        await AsyncStorage.setItem('userProfileImage', profileImage);
      }
      
      // Save privacy preferences
      await saveAnonymousPostingPreference(isAnonymous);
      await saveProfilePrivacySetting(isPrivate ? 'private' : 'public');
      
      // Navigate to main app
      router.push('/(main)');
    } catch (error) {
      console.error('Error saving community settings:', error);
      Alert.alert('Error', 'Failed to save profile data. Please try again.');
    }
  };

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile Setup</Text>
          <Text style={styles.subtitle}>Set up your profile for the community</Text>

          {/* Profile Picture Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              {uploadingImage ? (
                <View style={[styles.profileImage, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator color="#4CAF50" size="small" />
                </View>
              ) : profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: getAvatarBackgroundColor(), justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.initialText}>{getInitials()}</Text>
                </View>
              )}
              
              <View style={styles.profileImageActions}>
                <TouchableOpacity 
                  style={styles.imageActionButton} 
                  onPress={handleChooseImage}
                >
                  <Ionicons name="camera-outline" size={20} color="#4CAF50" />
                </TouchableOpacity>
                
                {profileImage && (
                  <TouchableOpacity 
                    style={[styles.imageActionButton, { marginLeft: 8 }]} 
                    onPress={handleRemoveImage}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            {/* Basic Profile Info */}
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your first name"
              placeholderTextColor="#666"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your last name"
              placeholderTextColor="#666"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
            
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Your email address"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            {/* Community Settings */}
            <Text style={styles.sectionTitle}>Community Settings</Text>
            
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a display name"
              placeholderTextColor="#666"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <Text style={styles.inputHint}>This name will be visible to others in the community</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="eye-off-outline" size={24} color="#4CAF50" style={styles.settingIcon} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Post Anonymously</Text>
                  <Text style={styles.settingDescription}>Your posts won't show your display name</Text>
                </View>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={toggleAnonymous}
                trackColor={{ false: '#D9D9D9', true: '#BCE0BE' }}
                thumbColor={isAnonymous ? '#4CAF50' : '#F5F5F5'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLabelContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="#4CAF50" style={styles.settingIcon} />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Private Profile</Text>
                  <Text style={styles.settingDescription}>Others can't see your profile details</Text>
                </View>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={togglePrivate}
                trackColor={{ false: '#D9D9D9', true: '#BCE0BE' }}
                thumbColor={isPrivate ? '#4CAF50' : '#F5F5F5'}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Continue"
              onPress={handleNext}
              backgroundColor={isButtonEnabled ? "#4CAF50" : "#A0A0A0"}
              textColor="#FFFFFF"
              disabled={!isButtonEnabled}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 28,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  initialText: {
    fontSize: 40, 
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  profileImageActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  imageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#333333',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  inputHint: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 24,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  buttonContainer: {
    marginTop: 40,
  }
}); 