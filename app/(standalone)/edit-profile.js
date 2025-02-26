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
import { getUserProfile, updateUserProfile, getUserFullName } from '../../src/utils/userProfile';
import { IMAGES } from '../../src/constants/assets';
import { useAuth } from '../../src/context/AuthContext';

const EditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // State for user profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isApplePrivateEmail, setIsApplePrivateEmail] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  
  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user data using the utility function
      const profileData = await getUserProfile();
      
      setFirstName(profileData.firstName || '');
      setLastName(profileData.lastName || '');
      setDisplayName(profileData.displayName || '');
      
      // Check if user has an Apple private relay email
      const userEmail = profileData.email || (user ? user.email : '');
      const isPrivateRelay = userEmail.includes('privaterelay.appleid.com');
      
      setIsApplePrivateEmail(isPrivateRelay);
      
      // If it's a private relay email and there's no stored email in the profile,
      // set the email field to empty to encourage the user to add their real email
      if (isPrivateRelay && !profileData.email) {
        setEmail('');
      } else {
        setEmail(userEmail);
      }
      
      setAge(profileData.age || '');
      setGender(profileData.gender || '');
      setPhotoURL(profileData.photoURL || null);
      
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
    
    // Validate first name or last name
    if (!firstName.trim() && !lastName.trim()) {
      setFirstNameError('First name or last name is required');
      setLastNameError('First name or last name is required');
      isValid = false;
    } else {
      setFirstNameError('');
      setLastNameError('');
    }
    
    // Validate age
    if (age && (isNaN(age) || parseInt(age) < 13)) {
      setAgeError('Age must be at least 13');
      isValid = false;
    } else {
      setAgeError('');
    }
    
    // Validate email if user is using Apple Sign In with private relay
    if (isApplePrivateEmail) {
      if (!email.trim()) {
        setEmailError('Please provide an email address');
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        setEmailError('Please enter a valid email address');
        isValid = false;
      } else {
        setEmailError('');
      }
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
      
      // Create display name from first and last name if both are provided
      let updatedDisplayName = displayName;
      if (firstName && lastName) {
        updatedDisplayName = `${firstName} ${lastName}`;
      }
      
      // Create profile update object
      const profileUpdate = {
        firstName,
        lastName,
        displayName: updatedDisplayName,
        age,
        gender,
        photoURL
      };
      
      // Include email in the update if user is using Apple Sign In with private relay
      if (isApplePrivateEmail) {
        profileUpdate.email = email;
      }
      
      // Save user data using the utility function
      await updateUserProfile(profileUpdate);
      
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
      setShowImageOptions(false);
      
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
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };
  
  const handleChoosePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowImageOptions(false);
      
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
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };
  
  const toggleImageOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowImageOptions(!showImageOptions);
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
  
  // Image Options Popup Component
  const ImageOptionsPopup = () => {
    if (!showImageOptions) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => setShowImageOptions(false)}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Photo</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={24} color="#4FA65B" style={styles.modalOptionIcon} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleChoosePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="images" size={24} color="#4FA65B" style={styles.modalOptionIcon} />
              <Text style={styles.modalOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setShowImageOptions(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveChanges}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={photoURL ? { uri: photoURL } : IMAGES.DEFAULT_AVATAR} 
              style={styles.profileImage}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
              style={styles.imageGradient}
            />
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={toggleImageOptions}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>
        
        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={[styles.input, firstNameError && styles.inputError]}
              placeholder="Enter your first name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            {firstNameError ? (
              <Text style={styles.errorText}>{firstNameError}</Text>
            ) : null}
          </View>
          
          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={[styles.input, lastNameError && styles.inputError]}
              placeholder="Enter your last name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
            {lastNameError ? (
              <Text style={styles.errorText}>{lastNameError}</Text>
            ) : null}
          </View>
          
          {/* Email (editable if Apple private relay) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[
                styles.input, 
                emailError && styles.inputError,
                !isApplePrivateEmail && { opacity: 0.7 }
              ]}
              placeholder={isApplePrivateEmail ? "Enter your email address" : ""}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={email}
              onChangeText={setEmail}
              editable={isApplePrivateEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : isApplePrivateEmail ? (
              <Text style={styles.helperText}>
                Please provide your email address as you're using Apple Sign In with private email relay
              </Text>
            ) : (
              <Text style={styles.helperText}>Email cannot be changed</Text>
            )}
          </View>
          
          {/* Age */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={[styles.input, ageError && styles.inputError]}
              placeholder="Enter your age"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
            />
            {ageError ? (
              <Text style={styles.errorText}>{ageError}</Text>
            ) : null}
          </View>
          
          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderButtonsContainer}>
              {renderGenderButton('male', 'Male')}
              {renderGenderButton('female', 'Female')}
              {renderGenderButton('other', 'Other')}
              {renderGenderButton('', 'Prefer not to say')}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Image Options Popup */}
      <ImageOptionsPopup />
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4FA65B',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#4FA65B',
    fontFamily: typography.fonts.medium,
    marginTop: 4,
  },
  formSection: {
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },
  helperText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontFamily: typography.fonts.medium,
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
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 30,
  },
  modalContent: {
    backgroundColor: '#1A2721',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalOptionIcon: {
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  cancelOption: {
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
});

export default EditProfileScreen; 