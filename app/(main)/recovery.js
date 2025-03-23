import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { format, formatDistanceToNow } from 'date-fns';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { 
  collection, 
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import BannerNotification from '../../src/components/BannerNotification';
import { ALL_ACHIEVEMENTS, checkAndUpdateAchievements, awardJournalingPoints } from '../../src/utils/achievementUtils';
import { 
  saveJournalData, 
  calculateSobrietyDays,
  getStreakStartTime
} from '../../src/utils/soberTracker';

const { width, height } = Dimensions.get('window');

// Define mood options with templates for each mood
const moodOptions = [
  { 
    id: 'great', 
    label: 'Great', 
    icon: 'happy', 
    color: '#4CAF50',
    template: [
      "What made today great?",
      "How can you recreate this positive feeling in the future?",
      "Who were you with when you felt this way?",
      "What strengths did you use today?",
      "What are you grateful for right now?"
    ]
  },
  { 
    id: 'good', 
    label: 'Good', 
    icon: 'happy-outline', 
    color: '#8BC34A',
    template: [
      "What went well today?",
      "What contributed to your good mood?",
      "What positive choices did you make today?",
      "How did you take care of yourself today?",
      "What's something small you appreciated today?"
    ]
  },
  { 
    id: 'okay', 
    label: 'Okay', 
    icon: 'happy-outline', 
    color: '#FFC107',
    template: [
      "How would you describe your day?",
      "What was one positive moment today?",
      "What was one challenging moment?",
      "What could make tomorrow better?",
      "What self-care activity could help improve your mood?"
    ]
  },
  { 
    id: 'sad', 
    label: 'Sad', 
    icon: 'sad-outline', 
    color: '#FF9800',
    template: [
      "What's making you feel sad right now?",
      "Have you felt this way before? What helped then?",
      "Who can you reach out to for support?",
      "What's one small thing you can do to care for yourself today?",
      "What are three things you can still appreciate despite feeling sad?"
    ]
  },
  { 
    id: 'awful', 
    label: 'Awful', 
    icon: 'sad', 
    color: '#F44336',
    template: [
      "What happened that made you feel this way?",
      "On a scale of 1-10, how intense is this feeling?",
      "What are some physical sensations you're experiencing?",
      "What would help you feel even slightly better right now?",
      "What's one tiny step you can take toward caring for yourself?"
    ]
  },
  { 
    id: 'anxious', 
    label: 'Anxious', 
    icon: 'alert-circle', 
    color: '#9C27B0',
    template: [
      "What specific things are making you feel anxious?",
      "What physical symptoms are you experiencing?",
      "What thoughts are going through your mind?",
      "What's the worst that could happen? How likely is it?",
      "What coping strategies have helped you with anxiety before?"
    ]
  },
  { 
    id: 'angry', 
    label: 'Angry', 
    icon: 'flame', 
    color: '#E91E63',
    template: [
      "What triggered your anger?",
      "On a scale of 1-10, how intense is your anger?",
      "How is your anger showing up in your body?",
      "What's beneath your anger? (hurt, fear, disappointment)",
      "What's a healthy way you can express or release this energy?"
    ]
  },
  { 
    id: 'hopeful', 
    label: 'Hopeful', 
    icon: 'sunny', 
    color: '#FFEB3B',
    template: [
      "What's giving you hope right now?",
      "What positive changes are you noticing?",
      "What are you looking forward to?",
      "What steps can you take to build on this feeling?",
      "How can you maintain this hopeful outlook?"
    ]
  },
];

const RecoveryScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('progress');
  
  // Journal state
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [showJournalEditor, setShowJournalEditor] = useState(false);
  const [savingJournal, setSavingJournal] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('success');
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [journalCooldown, setJournalCooldown] = useState(null);
  
  // Add user sobriety state
  const [userSobrietyDays, setUserSobrietyDays] = useState(7); // Default to 7 for UI demo
  const [userAchievements, setUserAchievements] = useState(['onboarding_complete', 'day_1', 'day_3', 'week_1']);
  const [userPoints, setUserPoints] = useState(0);
  
  // Auto-hide banner after a duration
  useEffect(() => {
    if (bannerVisible) {
      const timer = setTimeout(() => {
        setBannerVisible(false);
      }, 3000); // Hide after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [bannerVisible]);

  // Set the active tab based on the initialTab parameter
  useEffect(() => {
    if (params.initialTab && ['progress', 'journal', 'resources'].includes(params.initialTab)) {
      setActiveTab(params.initialTab);
    }
  }, [params.initialTab]);

  // Load journal entries when tab is journal
  useEffect(() => {
    if (activeTab === 'journal') {
      // Don't show banner when just switching to the journal tab
      const loadEntries = async () => {
        try {
          await loadJournalEntries();
        } catch (error) {
          // Only show banner for critical errors
          if (error && error.critical) {
            showBanner('Unable to load journal entries. Please try again.', 'error');
          }
        }
      };
      
      loadEntries();
    }
  }, [activeTab]);

  // Fetch user data including achievements and check for new achievements
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (isFirebaseInitialized() && auth.currentUser) {
          const userId = auth.currentUser.uid;
          const userDoc = await getDoc(doc(db, 'users', userId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Calculate sobriety days if sobrietyDate exists
            if (userData.sobrietyDate) {
              const sobrietyDate = userData.sobrietyDate.toDate();
              const today = new Date();
              const diffTime = Math.abs(today - sobrietyDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setUserSobrietyDays(diffDays);
              
              // Check and update achievements based on sobriety days
              const newAchievements = await checkAndUpdateAchievements(userId, diffDays);
              
              // If new achievements were awarded, show a notification
              if (newAchievements.length > 0) {
                // Get the achievement details
                const achievementDetails = ALL_ACHIEVEMENTS.find(a => a.id === newAchievements[0]);
                if (achievementDetails) {
                  showBanner(`🎉 Achievement Unlocked: ${achievementDetails.title}`, 'success');
                }
              }
            }
            
            // Set user achievements
            if (userData.achievements) {
              setUserAchievements(userData.achievements);
            }
            
            // Set user points
            if (userData.points) {
              setUserPoints(userData.points);
            }
            
            // Check journal cooldown
            if (userData.lastJournalPoints) {
              const now = new Date().getTime();
              const threeHoursInMs = 3 * 60 * 60 * 1000;
              const cooldownEndsTime = userData.lastJournalPoints + threeHoursInMs;
              
              if (cooldownEndsTime > now) {
                const timeRemaining = cooldownEndsTime - now;
                const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
                const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
                
                const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                setJournalCooldown({
                  cooldownEnds: cooldownEndsTime,
                  cooldownEndsFormatted: formattedTime,
                  timeRemainingMs: timeRemaining
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  // Add a useEffect to update the cooldown timer every minute
  useEffect(() => {
    if (journalCooldown && journalCooldown.timeRemainingMs > 0) {
      // Update the timer every minute
      const interval = setInterval(() => {
        const now = Date.now();
        const timeRemaining = Math.max(0, journalCooldown.cooldownEnds - now);
        
        if (timeRemaining <= 0) {
          // Cooldown has ended
          setJournalCooldown(null);
          clearInterval(interval);
        } else {
          // Update the cooldown state with new time remaining
          const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
          const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
          const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
          
          const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          
          setJournalCooldown(prev => ({
            ...prev,
            timeRemainingMs: timeRemaining,
            cooldownEndsFormatted: formattedTime
          }));
        }
      }, 60000); // Update every minute
      
      // Clean up interval on unmount
      return () => clearInterval(interval);
    }
  }, [journalCooldown]);

  const loadJournalEntries = async () => {
    try {
      if (!isFirebaseInitialized() || !auth.currentUser) {
        // Don't show banner here, return error object instead
        return Promise.reject({ 
          message: 'Unable to load journal entries. Please sign in again.',
          critical: false
        });
      }

      setLoadingJournals(true);
      const userId = auth.currentUser.uid;
      const journalQuery = query(
        collection(db, 'users', userId, 'journalEntries'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(journalQuery);
      const entries = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      setJournalEntries(entries);
      return entries;
    } catch (error) {
      console.error('Error loading journal entries:', error);
      // Don't show banner here, return error object instead
      return Promise.reject({
        message: 'Failed to load journal entries',
        error,
        critical: false
      });
    } finally {
      setLoadingJournals(false);
    }
  };

  const handleCreateJournalEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJournalTitle('');
    setJournalContent('');
    setSelectedMoods([]);
    setEditingJournalId(null);
    setActiveTemplate(null);
    setShowJournalEditor(true);
  };
  
  const handleEditJournalEntry = async (entryId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (!isFirebaseInitialized() || !auth.currentUser) {
        showBanner('Unable to edit journal entry', 'error');
        return;
      }
      
      setLoadingJournals(true);
      const userId = auth.currentUser.uid;
      const entryRef = doc(db, 'users', userId, 'journalEntries', entryId);
      const docSnap = await getDoc(entryRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setJournalTitle(data.title || '');
        setJournalContent(data.content || '');
        setSelectedMoods(data.moods || []);
        setEditingJournalId(entryId);
        setActiveTemplate(null);
        setShowJournalEditor(true);
      } else {
        showBanner('Journal entry not found', 'error');
      }
    } catch (error) {
      console.error('Error loading journal entry:', error);
      showBanner('Failed to load journal entry', 'error');
    } finally {
      setLoadingJournals(false);
    }
  };
  
  const handleDeleteJournalEntry = (entryId) => {
    Alert.alert(
      'Delete Journal Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              if (!isFirebaseInitialized() || !auth.currentUser) {
                showBanner('Unable to delete journal entry', 'error');
                return;
              }

              const userId = auth.currentUser.uid;
              await deleteDoc(doc(db, 'users', userId, 'journalEntries', entryId));
              
              // Update local state
              setJournalEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
              
              showBanner('Journal entry deleted', 'success');
            } catch (error) {
              console.error('Error deleting journal entry:', error);
              showBanner('Failed to delete journal entry', 'error');
            }
          },
        },
      ]
    );
  };

  const handleSaveJournalEntry = async () => {
    if (!auth.currentUser) {
      showBanner('You must be signed in to save journal entries.', 'error');
      return;
    }

    if (!journalTitle.trim()) {
      showBanner('Please add a title to your journal entry.', 'error');
      return;
    }

    if (!journalContent.trim()) {
      showBanner('Please write something in your journal entry.', 'error');
      return;
    }

    if (selectedMoods.length === 0) {
      showBanner('Please select at least one mood for your journal entry.', 'error');
      return;
    }

    setSavingJournal(true);

    try {
      const userId = auth.currentUser.uid;
      const timestamp = serverTimestamp();
      const journalData = {
        title: journalTitle,
        content: journalContent,
        moods: selectedMoods,
        created_at: timestamp,
        updated_at: timestamp,
        user_id: userId,
      };

      // If editing, update existing document, else create new one
      if (editingJournalId) {
        const journalRef = doc(db, 'journals', editingJournalId);
        await updateDoc(journalRef, {
          title: journalTitle,
          content: journalContent,
          moods: selectedMoods,
          updated_at: timestamp,
        });
        
        showBanner('Journal entry updated successfully!', 'success');
      } else {
        // Create new journal entry
        await addDoc(collection(db, 'journals'), journalData);
        
        // Award points for new journal entry
        const pointsResult = await awardJournalingPoints(userId);
        
        // Update local state with cooldown info
        if (pointsResult) {
          if (pointsResult.alreadyAwarded) {
            // Points were not awarded due to cooldown
            setJournalCooldown(pointsResult);
            showBanner('Journal entry saved! (Points on cooldown)', 'success');
          } else {
            // Points were awarded
            setUserPoints(prev => (prev || 0) + 5);
            
            // Set cooldown for 3 hours
            const threeHoursInMs = 3 * 60 * 60 * 1000;
            const cooldownEnds = Date.now() + threeHoursInMs;
            setJournalCooldown({
              alreadyAwarded: true,
              cooldownEnds,
              cooldownEndsFormatted: '3:00:00',
              timeRemainingMs: threeHoursInMs
            });
            
            // Check if user leveled up
            if (pointsResult.levelUp) {
              showBanner(`🎉 Level up! You are now level ${pointsResult.newLevel}!`, 'success');
            } else {
              showBanner('Journal entry saved! +5 points awarded!', 'success');
            }
          }
        } else {
          showBanner('Journal entry saved!', 'success');
        }
      }

      // Reset journal editor
      setJournalTitle('');
      setJournalContent('');
      setSelectedMoods([]);
      setShowJournalEditor(false);
      setEditingJournalId(null);
      
      // Reload journal entries
      loadJournalEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      showBanner('Failed to save journal entry. Please try again.', 'error');
    } finally {
      setSavingJournal(false);
    }
  };
  
  const toggleMood = (moodId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedMoods(prevMoods => {
      if (prevMoods.includes(moodId)) {
        return prevMoods.filter(id => id !== moodId);
      } else {
        return [...prevMoods, moodId];
      }
    });
  };
  
  const applyTemplate = (mood) => {
    const moodTemplate = moodOptions.find(m => m.id === mood)?.template || [];
    if (moodTemplate.length > 0) {
      if (journalContent.trim() !== '') {
        Alert.alert(
          'Apply Template?',
          'This will replace your current content with the template. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Apply', 
              onPress: () => {
                setJournalContent(moodTemplate.join('\n\n'));
                setActiveTemplate(moodTemplate);
                
                // Also select this mood if not already selected
                if (!selectedMoods.includes(mood)) {
                  setSelectedMoods(prev => [...prev, mood]);
                }
                
                // Set a default title based on the mood if no title yet
                if (!journalTitle.trim()) {
                  const moodLabel = moodOptions.find(m => m.id === mood)?.label || '';
                  setJournalTitle(`My ${moodLabel} Reflection`);
                }
              }
            }
          ]
        );
      } else {
        setJournalContent(moodTemplate.join('\n\n'));
        setActiveTemplate(moodTemplate);
        
        // Also select this mood if not already selected
        if (!selectedMoods.includes(mood)) {
          setSelectedMoods(prev => [...prev, mood]);
        }
        
        // Set a default title based on the mood if no title yet
        if (!journalTitle.trim()) {
          const moodLabel = moodOptions.find(m => m.id === mood)?.label || '';
          setJournalTitle(`My ${moodLabel} Reflection`);
        }
      }
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
  
  const formatJournalDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const journalDate = new Date(date);
    
    // Today
    if (journalDate.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (journalDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // This week (within 7 days)
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (journalDate >= oneWeekAgo) {
      return journalDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Older entries
    return journalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMoodIcons = (moods) => {
    if (!moods || moods.length === 0) return null;
    
    return (
      <View style={styles.moodIconsContainer}>
        {moods.slice(0, 3).map((mood, index) => {
          const moodInfo = moodOptions.find(m => m.id === mood) || {};
          return (
            <View 
              key={index} 
              style={[styles.moodDot, { backgroundColor: moodInfo.color || '#999999' }]}
            />
          );
        })}
        {moods.length > 3 && (
          <Text style={styles.moodMoreText}>+{moods.length - 3}</Text>
        )}
      </View>
    );
  };

  const handleViewJournalEntries = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // We'll handle this directly in the tab now
    // router.push('/journal-list');
  };

  // Add function to handle navigation to achievements page
  const handleViewAllAchievements = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(standalone)/achievements');
  };

  // Add function to check if achievement is unlocked
  const isAchievementUnlocked = (achievementId) => {
    return userAchievements.includes(achievementId);
  };

  const getRecentAchievements = () => {
    // Get achievements user has actually unlocked
    const unlockedAchievements = ALL_ACHIEVEMENTS.filter(a => isAchievementUnlocked(a.id));
    
    // Get 3 most recent achievements (based on days requirement)
    const sortedAchievements = [...unlockedAchievements].sort((a, b) => b.days - a.days);
    return sortedAchievements.slice(0, 3);
  };

  // Add function to get next achievement to unlock
  const getNextAchievement = () => {
    return ALL_ACHIEVEMENTS.find(a => !isAchievementUnlocked(a.id) && a.days > userSobrietyDays);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return (
          <View style={styles.tabContent}>
            {/* Achievement Section - Moved to top */}
            <View style={styles.achievementCard}>
              <Text style={styles.cardTitle}>Your Achievements</Text>
              
              <View style={styles.achievementRow}>
                {getRecentAchievements().map((achievement) => (
                  <View key={achievement.id} style={styles.achievement}>
                    <View style={[styles.achievementIcon, {backgroundColor: achievement.color}]}>
                      <Ionicons name={achievement.icon} size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.achievementName}>{achievement.title}</Text>
                  </View>
                ))}
                
                {getRecentAchievements().length < 3 && getNextAchievement() && (
                  <View style={styles.achievement}>
                    <View style={[styles.achievementIcon, {backgroundColor: '#E0E0E0'}]}>
                      <Ionicons name={getNextAchievement().icon} size={24} color="#AAAAAA" />
                    </View>
                    <Text style={[styles.achievementName, {color: '#AAAAAA'}]}>
                      {getNextAchievement().title}
                    </Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.viewAllAchievements}
                onPress={handleViewAllAchievements}
              >
                <Text style={styles.viewAllText}>View All Achievements</Text>
                <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            
            {/* Stats Overview Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="calendar-outline" size={32} color="#4CAF50" style={styles.statIcon} />
                <Text style={styles.statLabel}>Sober for</Text>
                <Text style={styles.statValue}>{userSobrietyDays} days</Text>
                <Text style={styles.statSubtext}>Keep going!</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="wallet-outline" size={32} color="#4CAF50" style={styles.statIcon} />
                <Text style={styles.statLabel}>Money Saved</Text>
                <Text style={styles.statValue}>${userSobrietyDays * 17}</Text>
                <Text style={styles.statSubtext}>$17/day</Text>
              </View>
            </View>
            
            {/* Current Benefits - Moved up */}
            <View style={styles.benefitsCard}>
              <Text style={styles.cardTitle}>Benefits You're Experiencing</Text>
              
              <View style={styles.benefitItem}>
                <Ionicons name="fitness-outline" size={28} color="#4CAF50" style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Improved Lung Function</Text>
                  <Text style={styles.benefitText}>Breathing easier as your lungs begin to clear</Text>
              </View>
            </View>
            
              <View style={styles.benefitItem}>
                <Ionicons name="bed-outline" size={28} color="#4CAF50" style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Better Sleep Quality</Text>
                  <Text style={styles.benefitText}>Natural sleep patterns returning, more restful nights</Text>
              </View>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="brain-outline" size={28} color="#4CAF50" style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Increased Mental Clarity</Text>
                  <Text style={styles.benefitText}>Sharper focus and improved memory function</Text>
              </View>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="happy-outline" size={28} color="#4CAF50" style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Mood Stabilization</Text>
                  <Text style={styles.benefitText}>Less anxiety and more balanced emotions</Text>
              </View>
              </View>
            </View>
            
            {/* Milestone Timeline */}
            <View style={styles.milestoneCard}>
              <Text style={styles.cardTitle}>Recovery Timeline</Text>
              <Text style={styles.milestoneDescription}>
                Here's what's happening in your body as you stay cannabis-free:
              </Text>
              
              <View style={styles.timelineContainer}>
                {/* Day 1-2 */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Day 1-2</Text>
                    <Text style={styles.timelineText}>
                      Irritability, anxiety, and sleep difficulties as THC begins to leave your system.
                    </Text>
                  </View>
                </View>
                
                {/* Day 3-6 */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Day 3-6</Text>
                    <Text style={styles.timelineText}>
                      Peak withdrawal symptoms begin to subside. Mental clarity slowly improves.
                    </Text>
                  </View>
                </View>
                
                {/* Day 7-14 - Add interactive tooltip */}
                <TouchableOpacity 
                  style={styles.timelineItem}
                  onPress={() => showBanner("You're in this phase! Expect your sleep quality to continue improving.", "info")}
                >
                  <View style={[styles.timelineIcon, { backgroundColor: '#4CAF50', opacity: 0.6 }]}>
                    <Text style={styles.timelineProgress}>7/14</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={styles.timelineTitle}>Day 7-14</Text>
                      <Ionicons name="information-circle-outline" size={18} color="#4CAF50" />
                    </View>
                    <Text style={styles.timelineText}>
                      Sleep quality improving, dreams returning, increased mental clarity.
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {/* Day 15-30 */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, { backgroundColor: '#E0E0E0' }]}>
                    <Text style={styles.timelineFuture}>15+</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Day 15-30</Text>
                    <Text style={styles.timelineText}>
                      Significant reduction in cravings, improved focus and mental clarity.
                    </Text>
                  </View>
                </View>
                
                {/* Month 1+ */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, { backgroundColor: '#E0E0E0' }]}>
                    <Text style={styles.timelineFuture}>30+</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>1+ Month</Text>
                    <Text style={styles.timelineText}>
                      Return to normal sleep patterns, improved cognitive function, reduced anxiety.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Financial Projections */}
            <View style={styles.projectionCard}>
              <Text style={styles.cardTitle}>Money Saved Projections</Text>
              
              <View style={styles.projectionItem}>
                <View style={styles.projectionInfo}>
                  <Text style={styles.projectionLabel}>1 Month</Text>
                  <Text style={styles.projectionValue}>$514</Text>
                </View>
                <View style={styles.projectionBar}>
                  <View style={[styles.projectionFill, { width: '25%', backgroundColor: '#81C784' }]} />
                </View>
              </View>
              
              <View style={styles.projectionItem}>
                <View style={styles.projectionInfo}>
                  <Text style={styles.projectionLabel}>3 Months</Text>
                  <Text style={styles.projectionValue}>$1,542</Text>
                </View>
                <View style={styles.projectionBar}>
                  <View style={[styles.projectionFill, { width: '45%', backgroundColor: '#66BB6A' }]} />
                </View>
              </View>
              
              <View style={styles.projectionItem}>
                <View style={styles.projectionInfo}>
                  <Text style={styles.projectionLabel}>6 Months</Text>
                  <Text style={styles.projectionValue}>$3,085</Text>
                </View>
                <View style={styles.projectionBar}>
                  <View style={[styles.projectionFill, { width: '65%', backgroundColor: '#4CAF50' }]} />
                </View>
              </View>
              
              <View style={styles.projectionItem}>
                <View style={styles.projectionInfo}>
                  <Text style={styles.projectionLabel}>1 Year</Text>
                  <Text style={styles.projectionValue}>$6,171</Text>
                </View>
                <View style={styles.projectionBar}>
                  <View style={[styles.projectionFill, { width: '85%', backgroundColor: '#388E3C' }]} />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.savingsButton}
                onPress={() => showBanner("You'll be able to set your spending habits soon!", "info")}
              >
                <Text style={styles.savingsButtonText}>Update Spending Habits</Text>
                <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'journal':
        return (
          <View style={styles.tabContent}>
            {/* Only render banner when visible is true */}
            {bannerVisible && (
              <BannerNotification
                visible={bannerVisible}
                message={bannerMessage}
                type={bannerType}
                onHide={hideBanner}
              />
            )}
            
            {showJournalEditor ? (
              // Journal Editor View
              <View style={styles.journalEditorContainer}>
                <View style={styles.journalEditorHeader}>
                  <Text style={styles.journalEditorTitle}>
                    {editingJournalId ? 'Edit Journal Entry' : 'New Journal Entry'}
                  </Text>
                  <View style={styles.journalEditorActions}>
                    <TouchableOpacity
                      style={styles.journalEditorCancel}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowJournalEditor(false);
                      }}
                    >
                      <Text style={styles.journalEditorCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.journalEditorSave,
                        (!journalTitle.trim() || !journalContent.trim() || selectedMoods.length === 0) && 
                        styles.journalEditorSaveDisabled
                      ]}
                      onPress={handleSaveJournalEntry}
                      disabled={savingJournal || !journalTitle.trim() || !journalContent.trim() || selectedMoods.length === 0}
                    >
                      {savingJournal ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.journalEditorSaveText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                <ScrollView
                  style={styles.journalEditorScrollView}
                  contentContainerStyle={styles.journalEditorContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Title Input */}
                  <TextInput
                    style={styles.journalTitleInput}
                    placeholder="Title"
                    placeholderTextColor="#999999"
                    value={journalTitle}
                    onChangeText={setJournalTitle}
                    maxLength={100}
                  />
                  
                  {/* Mood Selector */}
                  <View style={styles.moodSelectorContainer}>
                    <Text style={styles.moodSelectorTitle}>How are you feeling?</Text>
                    <Text style={styles.moodSelectorSubtitle}>Select all that apply</Text>
                    
                    <View style={styles.moodsGrid}>
                      {moodOptions.map((mood) => (
                        <View key={mood.id} style={styles.moodItemContainer}>
                          <TouchableOpacity
                            style={[
                              styles.moodItem,
                              selectedMoods.includes(mood.id) && { backgroundColor: mood.color }
                            ]}
                            onPress={() => toggleMood(mood.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={mood.icon}
                              size={28}
                              color={selectedMoods.includes(mood.id) ? '#FFFFFF' : mood.color}
                            />
                          </TouchableOpacity>
                          <Text style={styles.moodLabel}>{mood.label}</Text>
                          
                          {/* Template button */}
                          <TouchableOpacity
                            style={styles.templateButton}
                            onPress={() => applyTemplate(mood.id)}
                          >
                            <Ionicons name="document-text-outline" size={14} color="#666666" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {/* Template Prompts */}
                  {activeTemplate && activeTemplate.length > 0 && (
                    <View style={styles.templateContainer}>
                      <Text style={styles.templateTitle}>Journal Prompts</Text>
                      {activeTemplate.map((prompt, index) => (
                        <View key={index} style={styles.promptItem}>
                          <Text style={styles.promptNumber}>{index + 1}</Text>
                          <Text style={styles.promptText}>{prompt}</Text>
                        </View>
                      ))}
                      <TouchableOpacity 
                        style={styles.clearTemplateButton}
                        onPress={() => {
                          setActiveTemplate(null);
                          setJournalContent('');
                        }}
                      >
                        <Text style={styles.clearTemplateText}>Clear Template</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Content Input */}
                  <TextInput
                    style={styles.journalContentInput}
                    placeholder="Write your thoughts here..."
                    placeholderTextColor="#999999"
                    value={journalContent}
                    onChangeText={setJournalContent}
                    multiline={true}
                    textAlignVertical="top"
                  />
                </ScrollView>
              </View>
            ) : (
              // Journal Listing View
              <>
                <View style={styles.journalHeader}>
                  <Text style={styles.journalTitle}>My Recovery Journal</Text>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={handleCreateJournalEntry}
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#388E3C']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                
                {/* Reward Tracker Card */}
                <View style={styles.rewardTrackerCard}>
                  <View style={styles.rewardHeaderRow}>
                    <View style={styles.rewardTitleSection}>
                      <Text style={styles.cardTitle}>Journal Rewards</Text>
                      <Text style={styles.rewardSubtitle}>Earn 5 points for each journal entry</Text>
                    </View>
                    <View style={styles.pointsBadge}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.pointsText}>{userPoints || 0}</Text>
                    </View>
                  </View>
                  
                  {journalCooldown ? (
                    <>
                      <View style={styles.rewardInfoContainer}>
                        <View style={styles.rewardInfoItem}>
                          <Ionicons name="time-outline" size={20} color="#4CAF50" />
                          <Text style={styles.rewardInfoText}>
                            Next reward in: {journalCooldown.cooldownEndsFormatted}
                          </Text>
                        </View>
                        <View style={styles.rewardInfoItem}>
                          <Ionicons name="information-circle-outline" size={20} color="#4CAF50" />
                          <Text style={styles.rewardInfoText}>
                            3-hour cooldown between rewards
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.cooldownProgressContainer}>
                        <View style={styles.cooldownProgressBar}>
                          <View 
                            style={[
                              styles.cooldownProgressFill, 
                              { 
                                width: `${100 - Math.min(100, (journalCooldown.timeRemainingMs / (3 * 60 * 60 * 1000)) * 100)}%` 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </>
                  ) : (
                    <View style={styles.rewardInfoContainer}>
                      <View style={styles.rewardInfoItem}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                        <Text style={styles.rewardInfoText}>
                          Ready for rewards! Journal now to earn points.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                {/* Recent Journals Carousel */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Recent Entries</Text>
                  </View>
                  
                  {loadingJournals ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#4CAF50" />
                    </View>
                  ) : journalEntries.length > 0 ? (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.journalCarouselContent}
                      style={styles.journalCarousel}
                      overScrollMode="never"
                    >
                      {journalEntries.map((entry) => (
                        <TouchableOpacity
                          key={entry.id}
                          style={styles.journalCard}
                          onPress={() => handleEditJournalEntry(entry.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.journalCardHeader}>
                            <Text style={styles.journalCardDate}>
                              {formatJournalDate(entry.createdAt)}
                            </Text>
                            {renderMoodIcons(entry.moods)}
                          </View>
                          <Text style={styles.journalCardTitle} numberOfLines={1}>
                            {entry.title}
                          </Text>
                          <Text style={styles.journalCardContent} numberOfLines={3}>
                            {entry.content}
                          </Text>
                          
                          {/* Delete button */}
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteJournalEntry(entry.id)}
                            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          >
                            <Ionicons name="trash-outline" size={18} color="#666666" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                      
                      {/* Add New Entry Card */}
                      <TouchableOpacity
                        style={styles.addJournalCard}
                        onPress={handleCreateJournalEntry}
                        activeOpacity={0.7}
                      >
                        <View style={styles.addJournalContent}>
                          <View style={styles.addJournalIcon}>
                            <Ionicons name="add" size={36} color="#4CAF50" />
                          </View>
                          <Text style={styles.addJournalText}>Add New Entry</Text>
                        </View>
                      </TouchableOpacity>
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyJournalContainer}>
                      <Ionicons name="journal-outline" size={32} color="rgba(0,0,0,0.2)" />
                      <Text style={styles.emptyJournalText}>No journal entries yet</Text>
                      <TouchableOpacity 
                        style={styles.startJournalingButton}
                        onPress={handleCreateJournalEntry}
                      >
                        <Text style={styles.startJournalingText}>Start Journaling</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {/* Journaling Tips */}
                <View style={styles.journalTipsCard}>
                  <Text style={styles.cardTitle}>Journaling Tips</Text>
                  
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.tipText}>Record your moods daily to track patterns</Text>
                  </View>
                  
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.tipText}>Write down triggers and how you overcame them</Text>
                  </View>
                  
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.tipText}>Celebrate small victories in your journey</Text>
                  </View>
                </View>
                
                {/* Journaling Templates */}
                <View style={styles.templatesCard}>
                  <Text style={styles.cardTitle}>Journaling Templates</Text>
                  <Text style={styles.templateDescription}>
                    Choose a template based on your current mood to help guide your journaling
                  </Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.templatesContainer}
                  >
                    {moodOptions.map((mood) => (
                      <TouchableOpacity 
                        key={mood.id}
                        style={styles.templateItem}
                        onPress={() => {
                          handleCreateJournalEntry();
                          // Use timeout to ensure the editor is open before applying template
                          setTimeout(() => {
                            applyTemplate(mood.id);
                          }, 100);
                        }}
                      >
                        <View style={[styles.templateIcon, { backgroundColor: mood.color }]}>
                          <Ionicons name={mood.icon} size={24} color="#FFFFFF" />
                        </View>
                        <Text style={styles.templateName}>{mood.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        );
      case 'resources':
        return (
          <View style={styles.tabContent}>
            <View style={styles.resourceCard}>
              <Text style={styles.cardTitle}>Helpful Resources</Text>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="document-text" size={32} color="#4CAF50" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Cannabis Withdrawal Guide</Text>
                  <Text style={styles.resourceDesc}>Learn what to expect during withdrawal</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="people" size={32} color="#4CAF50" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Support Groups</Text>
                  <Text style={styles.resourceDesc}>Connect with others on the same journey</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="fitness" size={32} color="#4CAF50" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Healthy Habits Guide</Text>
                  <Text style={styles.resourceDesc}>Replace cannabis with positive activities</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{flex: 1, backgroundColor: '#FCFCFC'}} />
      </View>
      
      {/* Header with title */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.screenTitle}>Recovery</Text>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 70 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {['progress', 'journal', 'resources'].map((tab) => (
          <TouchableOpacity 
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
          </TouchableOpacity>
          ))}
        </View>
        
        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  screenTitle: {
    fontSize: 24,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 4,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  tabText: {
    fontSize: 15,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
  activeTabText: {
    color: '#4CAF50',
    fontFamily: typography.fonts.bold,
  },
  tabContent: {
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginHorizontal: -6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontFamily: typography.fonts.regular,
  },
  statValue: {
    fontSize: 24,
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  statSubtext: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    color: '#000000',
    fontFamily: typography.fonts.semiBold,
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginBottom: 16,
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  timelineProgress: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  timelineFuture: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  projectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  projectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectionInfo: {
    flex: 1,
  },
  projectionLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginBottom: 4,
  },
  projectionValue: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  projectionBar: {
    height: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  projectionFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  savingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    marginTop: 16,
  },
  savingsButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: typography.fonts.medium,
    marginRight: 8,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  achievementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  achievement: {
    alignItems: 'center',
    width: '30%',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    color: '#000000',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
  viewAllAchievements: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: typography.fonts.medium,
    marginRight: 8,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  journalTitle: {
    fontSize: 20,
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  journalCard: {
    width: 220,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    marginBottom: 5,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
  },
  journalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 28,
  },
  journalCardDate: {
    fontSize: 12,
    fontFamily: typography.fonts.medium,
    color: '#666666',
    marginRight: 8,
  },
  moodIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  moodMoreText: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginLeft: 4,
  },
  journalCardTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    marginBottom: 8,
  },
  journalCardContent: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    lineHeight: 20,
  },
  journalEditorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  journalEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  journalEditorTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
  },
  journalEditorActions: {
    flexDirection: 'row',
  },
  journalEditorCancel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  journalEditorCancelText: {
    color: '#666666',
    fontFamily: typography.fonts.medium,
    fontSize: 14,
  },
  journalEditorSave: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  journalEditorSaveDisabled: {
    backgroundColor: '#CCCCCC',
  },
  journalEditorSaveText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    fontSize: 14,
  },
  journalEditorScrollView: {
    flex: 1,
  },
  journalEditorContent: {
    padding: 16,
  },
  journalTitleInput: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: '#333333',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 16,
  },
  journalContentInput: {
    fontSize: 16,
    fontFamily: typography.fonts.regular,
    color: '#333333',
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  moodSelectorContainer: {
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  moodSelectorTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.medium,
    color: '#333333',
    marginBottom: 4,
  },
  moodSelectorSubtitle: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginBottom: 16,
  },
  moodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  moodItemContainer: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  moodItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginTop: 4,
  },
  templateButton: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  templateContainer: {
    backgroundColor: '#F0F7F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  templateTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.medium,
    color: '#333333',
    marginBottom: 12,
  },
  promptItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  promptNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    marginRight: 12,
  },
  promptText: {
    fontSize: 16,
    fontFamily: typography.fonts.regular,
    color: '#333333',
    flex: 1,
    lineHeight: 24,
  },
  clearTemplateButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearTemplateText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#F44336',
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 5,
    marginHorizontal: -5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    marginRight: 4,
  },
  journalCarouselContent: {
    paddingRight: 20,
    paddingBottom: 10,
    paddingTop: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  addJournalCard: {
    width: 160,
    height: 180,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addJournalContent: {
    alignItems: 'center',
  },
  addJournalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addJournalText: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    textAlign: 'center',
  },
  emptyJournalContainer: {
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 5,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  emptyJournalText: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#666666',
    marginTop: 12,
    marginBottom: 16,
  },
  startJournalingButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 20,
  },
  startJournalingText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateDescription: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  templatesContainer: {
    paddingVertical: 8,
  },
  templateItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  templateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#333333',
  },
  templatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  journalTipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
    marginLeft: 12,
    flexShrink: 1,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  resourceTitle: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  journalCarousel: {
    marginHorizontal: -5, // Negative margin to counteract padding and allow shadows to render
    paddingHorizontal: 5,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rewardTrackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardTitleSection: {
    flex: 1,
  },
  rewardSubtitle: {
    fontSize: 13,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F3E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 15,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginLeft: 6,
  },
  rewardInfoContainer: {
    marginBottom: 12,
  },
  rewardInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardInfoText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: typography.fonts.regular,
    marginLeft: 8,
    flex: 1,
  },
  cooldownProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cooldownProgressBar: {
    height: '100%',
    width: '100%',
  },
  cooldownProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
});

export default RecoveryScreen; 