import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { 
  collection, 
  addDoc, 
  getDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import BannerNotification from '../../src/components/BannerNotification';

// Define mood options
const moodOptions = [
  { id: 'great', label: 'Great', icon: 'happy', color: '#4CAF50' },
  { id: 'good', label: 'Good', icon: 'happy-outline', color: '#8BC34A' },
  { id: 'okay', label: 'Okay', icon: 'happy-outline', color: '#FFC107' },
  { id: 'sad', label: 'Sad', icon: 'sad-outline', color: '#FF9800' },
  { id: 'awful', label: 'Awful', icon: 'sad', color: '#F44336' },
  { id: 'anxious', label: 'Anxious', icon: 'alert-circle', color: '#9C27B0' },
  { id: 'angry', label: 'Angry', icon: 'flame', color: '#E91E63' },
  { id: 'hopeful', label: 'Hopeful', icon: 'sunny', color: '#FFEB3B' },
];

const JournalEntryScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { entryId } = params;
  const isEditing = !!entryId;
  
  // State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('success');
  
  // Load entry if editing
  useEffect(() => {
    if (isEditing) {
      loadJournalEntry();
    }
  }, [entryId]);
  
  const loadJournalEntry = async () => {
    try {
      if (!isFirebaseInitialized() || !auth.currentUser) {
        showBanner('Unable to load journal entry', 'error');
        return;
      }
      
      setIsLoading(true);
      
      const entryRef = doc(db, 'users', auth.currentUser.uid, 'journalEntries', entryId);
      const entrySnap = await getDoc(entryRef);
      
      if (entrySnap.exists()) {
        const entryData = entrySnap.data();
        setTitle(entryData.title || '');
        setContent(entryData.content || '');
        setSelectedMood(entryData.mood || null);
      } else {
        showBanner('Journal entry not found', 'error');
        router.back();
      }
    } catch (error) {
      console.error('Error loading journal entry:', error);
      showBanner('Failed to load journal entry', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateInputs = () => {
    if (!title.trim()) {
      showBanner('Please enter a title for your journal entry', 'error');
      return false;
    }
    
    if (!content.trim()) {
      showBanner('Please enter some content for your journal entry', 'error');
      return false;
    }
    
    if (!selectedMood) {
      showBanner('Please select a mood for your journal entry', 'error');
      return false;
    }
    
    return true;
  };
  
  const handleSave = async () => {
    if (!validateInputs()) return;
    
    try {
      if (!isFirebaseInitialized() || !auth.currentUser) {
        showBanner('Unable to save journal entry', 'error');
        return;
      }
      
      setIsLoading(true);
      
      const userId = auth.currentUser.uid;
      const journalData = {
        title: title.trim(),
        content: content.trim(),
        mood: selectedMood,
        updatedAt: serverTimestamp(),
      };
      
      if (isEditing) {
        // Update existing entry
        const entryRef = doc(db, 'users', userId, 'journalEntries', entryId);
        await updateDoc(entryRef, journalData);
        showBanner('Journal entry updated successfully', 'success');
      } else {
        // Create new entry
        journalData.createdAt = serverTimestamp();
        const journalRef = collection(db, 'users', userId, 'journalEntries');
        await addDoc(journalRef, journalData);
        showBanner('Journal entry saved successfully', 'success');
      }
      
      // Give some time for the user to see the success message before going back
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      showBanner('Failed to save journal entry', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check if there are unsaved changes
    if (title.trim() || content.trim() || selectedMood) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to leave without saving?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", onPress: () => router.back(), style: "destructive" }
        ]
      );
    } else {
      router.back();
    }
  };
  
  const showBanner = (message, type = 'success') => {
    setBannerMessage(message);
    setBannerType(type);
    setBannerVisible(true);
  };
  
  const hideBanner = () => {
    setBannerVisible(false);
  };
  
  const handleSelectMood = (mood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMood(mood);
  };
  
  const handleEditEntry = (entryId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/journal-entry',
      params: { entryId }
    });
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{flex: 1, backgroundColor: '#FCFCFC'}} />
      </View>
      
      {/* Banner notification */}
      <BannerNotification
        visible={bannerVisible}
        message={bannerMessage}
        type={bannerType}
        onHide={hideBanner}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleClose} disabled={isLoading}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, !validateInputs() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading || !validateInputs()}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Give your entry a title..."
            placeholderTextColor="#999999"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus={!isEditing}
            editable={!isLoading}
          />
        </View>
        
        {/* Content input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Journal Entry</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind today..."
            placeholderTextColor="#999999"
            value={content}
            onChangeText={setContent}
            multiline={true}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>
        
        {/* Mood selector */}
        <View style={styles.moodContainer}>
          <Text style={styles.label}>How are you feeling?</Text>
          <View style={styles.moodOptions}>
            {moodOptions.map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodOption,
                  selectedMood === mood.id && { borderColor: mood.color, borderWidth: 2 }
                ]}
                onPress={() => handleSelectMood(mood.id)}
                disabled={isLoading}
              >
                <Ionicons 
                  name={mood.icon} 
                  size={24} 
                  color={selectedMood === mood.id ? mood.color : '#666666'} 
                />
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.id && { color: mood.color, fontFamily: typography.fonts.bold }
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Tips for journaling */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Journaling Tips</Text>
          <Text style={styles.tipText}>• Be honest with yourself about your feelings</Text>
          <Text style={styles.tipText}>• Track your triggers and cravings</Text>
          <Text style={styles.tipText}>• Celebrate small victories</Text>
          <Text style={styles.tipText}>• Reflect on your recovery progress</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.medium,
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#333333',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: typography.fonts.regular,
    color: '#333333',
  },
  contentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: typography.fonts.regular,
    color: '#333333',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  moodContainer: {
    marginBottom: 20,
  },
  moodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  moodOption: {
    width: '25%',
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    margin: 5,
    backgroundColor: '#F5F5F5',
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#F9FBE7',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default JournalEntryScreen; 