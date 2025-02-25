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
import { getUserProfile, saveUserProfile } from '../../src/utils/userProfile';
import { IMAGES } from '../../src/constants/assets';

const EditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  
  // State for user profile data
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  
  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user data using the utility function
      const profileData = await getUserProfile();
      
      setName(profileData.name);
      setAge(profileData.age);
      setGender(profileData.gender);
      setProfileImage(profileData.profileImage);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    }
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const validateInputs = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate age
    if (!age.trim()) {
      setAgeError('Age is required');
      isValid = false;
    } else if (isNaN(age) || parseInt(age) < 13) {
      setAgeError('Age must be at least 13');
      isValid = false;
    } else {
      setAgeError('');
    }
    
    return isValid;
  };
  
  const handleSaveChanges = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Validate inputs
      if (!validateInputs()) {
        return;
      }
      
      setIsLoading(true);
      
      // Save user data using the utility function
      await saveUserProfile({
        name,
        age,
        gender,
        profileImage
      });
      
      setIsLoading(false);
      
      // Show success message
      Alert.alert(
        "Success",
        "Your profile has been updated successfully.",
        [{ 
          text: "OK", 
          onPress: () => router.back() 
        }]
      );
    } catch (error) {
      console.error('Error saving profile data:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to save profile data. Please try again.');
    }
  };
  
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
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
  
  const handleTakePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Request camera permission
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  const handleChoosePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Request media library permission
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };
  
  const handleSelectGender = (selectedGender) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGender(selectedGender);
  };
  
  // Render gender selection button
  const renderGenderButton = (value, label) => {
    const isSelected = gender === value;
    
    return (
      <TouchableOpacity
        style={[
          styles.genderButton,
          isSelected && styles.genderButtonSelected
        ]}
        activeOpacity={0.7}
        onPress={() => handleSelectGender(value)}
      >
        <Text
          style={[
            styles.genderButtonText,
            isSelected && styles.genderButtonTextSelected
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
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
        
        <Text style={styles.headerTitle}>Edit Profile</Text>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveChanges}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FA65B" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Profile Image Section */}
            <View style={styles.profileImageSection}>
              <View style={styles.profileImageContainer}>
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={60} color="rgba(255, 255, 255, 0.3)" />
                  </View>
                )}
              </View>
              
              <View style={styles.imageButtonsContainer}>
                <TouchableOpacity 
                  style={styles.imageButton}
                  activeOpacity={0.8}
                  onPress={handleTakePhoto}
                >
                  <LinearGradient
                    colors={['rgba(79, 166, 91, 0.8)', 'rgba(79, 166, 91, 0.6)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Ionicons name="camera" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.imageButton}
                  activeOpacity={0.8}
                  onPress={handleChoosePhoto}
                >
                  <LinearGradient
                    colors={['rgba(79, 166, 91, 0.8)', 'rgba(79, 166, 91, 0.6)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Ionicons name="images" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.imageButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Personal Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>
              
              {/* Age Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your age"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
                {ageError ? <Text style={styles.errorText}>{ageError}</Text> : null}
              </View>
              
              {/* Gender Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderButtonsContainer}>
                  {renderGenderButton('male', 'Male')}
                  {renderGenderButton('female', 'Female')}
                  {renderGenderButton('non-binary', 'Non-binary')}
                  {renderGenderButton('other', 'Other')}
                </View>
              </View>
            </View>
            
            {/* Save Button (Bottom) */}
            <TouchableOpacity 
              style={styles.saveChangesButton}
              activeOpacity={0.8}
              onPress={handleSaveChanges}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#4FA65B', '#3D8549']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.saveChangesButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
            
            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
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
  saveButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  saveButtonText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4FA65B',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  buttonIcon: {
    marginRight: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: typography.fonts.medium,
  },
  detailsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },
  genderButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  genderButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  genderButtonSelected: {
    backgroundColor: 'rgba(79, 166, 91, 0.2)',
    borderColor: '#4FA65B',
  },
  genderButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: typography.fonts.medium,
  },
  genderButtonTextSelected: {
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  saveChangesButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveChangesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
  },
  cancelButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
});

export default EditProfileScreen; 