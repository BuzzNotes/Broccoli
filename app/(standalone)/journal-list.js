import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert
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
  where,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import BannerNotification from '../../src/components/BannerNotification';

// Import mood options from journal-entry.js for consistency
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

// Mood lookup helper
const getMoodInfo = (moodId) => {
  return moodOptions.find(mood => mood.id === moodId) || {
    icon: 'help-circle-outline',
    color: '#757575',
    label: 'Unknown'
  };
};

const JournalListScreen = () => {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('success');
  
  useEffect(() => {
    loadJournalEntries();
  }, []);
  
  const loadJournalEntries = async (isRefreshing = false) => {
    try {
      if (!isFirebaseInitialized() || !auth.currentUser) {
        showBanner('Unable to load journal entries', 'error');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const userId = auth.currentUser.uid;
      const journalRef = collection(db, 'users', userId, 'journalEntries');
      const journalQuery = query(
        journalRef,
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(journalQuery);
      
      const journalEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
      
      setEntries(journalEntries);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      showBanner('Failed to load journal entries', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    loadJournalEntries(true);
  };
  
  const handleCreateEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/journal-entry');
  };
  
  const handleEditEntry = (entryId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/journal-entry',
      params: { entryId }
    });
  };
  
  const handleDeleteEntry = async (entryId) => {
    try {
      if (!isFirebaseInitialized() || !auth.currentUser) {
        showBanner('Unable to delete journal entry', 'error');
        return;
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Confirm deletion
      Alert.alert(
        "Delete Journal Entry",
        "Are you sure you want to delete this journal entry? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            onPress: async () => {
              try {
                const userId = auth.currentUser.uid;
                const entryRef = doc(db, 'users', userId, 'journalEntries', entryId);
                await deleteDoc(entryRef);
                
                // Update the UI
                setEntries(prev => prev.filter(entry => entry.id !== entryId));
                showBanner('Journal entry deleted', 'success');
              } catch (error) {
                console.error('Error deleting journal entry:', error);
                showBanner('Failed to delete journal entry', 'error');
              }
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      console.error('Error handling deletion:', error);
      showBanner('Failed to delete journal entry', 'error');
    }
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const showBanner = (message, type = 'success') => {
    setBannerMessage(message);
    setBannerType(type);
    setBannerVisible(true);
  };
  
  const hideBanner = () => {
    setBannerVisible(false);
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const renderEntryItem = ({ item }) => {
    const moodInfo = getMoodInfo(item.mood);
    
    return (
      <TouchableOpacity 
        style={styles.entryCard}
        onPress={() => handleEditEntry(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.entryHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.entryTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteEntry(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.entryMood}>
          <View style={[styles.moodIndicator, { backgroundColor: moodInfo.color }]}>
            <Ionicons name={moodInfo.icon} size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.moodLabel}>{moodInfo.label}</Text>
        </View>
        
        <Text style={styles.entryPreview} numberOfLines={2}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={64} color="#4CAF50" />
        <Text style={styles.emptyTitle}>No Journal Entries Yet</Text>
        <Text style={styles.emptyText}>
          Start documenting your recovery journey by creating your first journal entry.
        </Text>
        <TouchableOpacity
          style={styles.createEntryButton}
          onPress={handleCreateEntry}
        >
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={24}
          />
          <Text style={styles.createEntryButtonText}>Create First Entry</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
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
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recovery Journal</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateEntry}
        >
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={20}
          />
          <View style={styles.createButtonContent}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading journal entries...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        />
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
  createButton: {
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    fontSize: 14,
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
    fontFamily: typography.fonts.regular,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.medium,
    color: '#333333',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: '#757575',
  },
  deleteButton: {
    padding: 4,
  },
  entryMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
  },
  entryPreview: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#555555',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createEntryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  createEntryButtonText: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#FFFFFF',
  },
});

export default JournalListScreen; 