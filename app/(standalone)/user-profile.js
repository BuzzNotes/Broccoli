import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../styles/typography';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { getProfilePrivacyFromProfile } from '../../src/utils/userProfile';

const UserProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { userId, userName } = useLocalSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [firebaseError, setFirebaseError] = useState(false);
  const [isProfilePrivate, setIsProfilePrivate] = useState(false);
  
  useEffect(() => {
    loadUserProfile();
  }, [userId]);
  
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!isFirebaseInitialized()) {
        setFirebaseError(true);
        setIsLoading(false);
        return;
      }
      
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      // Get user document from Firestore
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setIsLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      
      // Check if profile is private
      const isPrivate = userData.profile_privacy === true;
      setIsProfilePrivate(isPrivate);
      
      // Set user profile data
      setUserProfile({
        id: userId,
        displayName: userData.displayName || userData.firstName || 'Anonymous User',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        profileImage: userData.profileImage || null,
        joinDate: userData.createdAt?.toDate() || new Date(),
        soberDays: Math.floor(Math.random() * 365), // Fake data for demo
        journalEntries: Math.floor(Math.random() * 50), // Fake data for demo
        pledgesMade: Math.floor(Math.random() * 20), // Fake data for demo
        meditationMinutes: Math.floor(Math.random() * 500), // Fake data for demo
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const formatJoinDate = (date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  const renderInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : firebaseError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color="#999999" />
          <Text style={styles.errorText}>Could not connect to server</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadUserProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !userProfile ? (
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#999999" />
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleClose}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            {userProfile.profileImage ? (
              <Image 
                source={{ uri: userProfile.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImageFallback}>
                <Text style={styles.profileImageFallbackText}>
                  {renderInitials(userProfile.displayName)}
                </Text>
              </View>
            )}
            
            <Text style={styles.displayName}>{userProfile.displayName}</Text>
            
            <Text style={styles.joinDate}>
              Joined {formatJoinDate(userProfile.joinDate)}
            </Text>
          </View>
          
          {isProfilePrivate ? (
            <View style={styles.privateProfileContainer}>
              <Ionicons name="lock-closed" size={48} color="#999999" />
              <Text style={styles.privateProfileText}>
                This profile is private
              </Text>
              <Text style={styles.privateProfileSubtext}>
                The user has chosen to keep their information private
              </Text>
            </View>
          ) : (
            <>
              {/* Stats Section */}
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Recovery Stats</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
                    <Text style={styles.statValue}>{userProfile.soberDays}</Text>
                    <Text style={styles.statLabel}>Sober Days</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="book-outline" size={24} color="#4CAF50" />
                    <Text style={styles.statValue}>{userProfile.journalEntries}</Text>
                    <Text style={styles.statLabel}>Journal Entries</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="hand-right-outline" size={24} color="#4CAF50" />
                    <Text style={styles.statValue}>{userProfile.pledgesMade}</Text>
                    <Text style={styles.statLabel}>Pledges Made</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="medkit-outline" size={24} color="#4CAF50" />
                    <Text style={styles.statValue}>{userProfile.meditationMinutes}</Text>
                    <Text style={styles.statLabel}>Meditation Minutes</Text>
                  </View>
                </View>
              </View>
              
              {/* Community Section */}
              <View style={styles.communitySection}>
                <Text style={styles.sectionTitle}>Community</Text>
                
                <View style={styles.communityStats}>
                  <View style={styles.communityStat}>
                    <Ionicons name="chatbubble-outline" size={20} color="#4CAF50" />
                    <Text style={styles.communityStatValue}>{Math.floor(Math.random() * 30)}</Text>
                    <Text style={styles.communityStatLabel}>Posts</Text>
                  </View>
                  
                  <View style={styles.communityStat}>
                    <Ionicons name="chatbox-ellipses-outline" size={20} color="#4CAF50" />
                    <Text style={styles.communityStatValue}>{Math.floor(Math.random() * 100)}</Text>
                    <Text style={styles.communityStatLabel}>Comments</Text>
                  </View>
                  
                  <View style={styles.communityStat}>
                    <Ionicons name="heart-outline" size={20} color="#4CAF50" />
                    <Text style={styles.communityStatValue}>{Math.floor(Math.random() * 200)}</Text>
                    <Text style={styles.communityStatLabel}>Likes</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileImageFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageFallbackText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  displayName: {
    fontSize: 24,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  privateProfileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  privateProfileText: {
    fontSize: 20,
    color: '#333333',
    fontFamily: typography.fonts.medium,
    marginTop: 16,
    textAlign: 'center',
  },
  privateProfileSubtext: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginTop: 8,
    textAlign: 'center',
  },
  statsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },
  communitySection: {
    padding: 16,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  communityStat: {
    alignItems: 'center',
    width: '30%',
  },
  communityStatValue: {
    fontSize: 20,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginTop: 8,
  },
  communityStatLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },
});

export default UserProfileScreen; 