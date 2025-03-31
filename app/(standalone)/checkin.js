import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../src/config/firebase';
import { typography } from '../styles/typography';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

// Preload images
const BRAIN_ICONS = {
  peaceful: require('../../app/Graphics/PeacefulBrain.jpg'),
  sad: require('../../app/Graphics/SadBrain.jpg'),
  rocket: require('../../app/Graphics/RocketBrain.jpg'),
  celebration: require('../../app/Graphics/CelebrationBrain.jpg')
};

const CheckInScreen = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(8);
  
  // User data
  const [sobrietyDays, setSobrietyDays] = useState(0);
  const [relapseHistory, setRelapseHistory] = useState([]);
  
  // CheckIn responses
  const [feeling, setFeeling] = useState(null);
  const [cravingLevel, setCravingLevel] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [otherSymptom, setOtherSymptom] = useState('');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Background color based on the current page
  const [backgroundColor, setBackgroundColor] = useState('#555c76');
  const [currentIcon, setCurrentIcon] = useState(BRAIN_ICONS.peaceful);
  const [iconBorderColor, setIconBorderColor] = useState('rgba(255, 255, 255, 0.2)');
  
  // Check-in cooldown state
  const [canEarnPoints, setCanEarnPoints] = useState(false);
  const [checkInCooldown, setCheckInCooldown] = useState(null); // Time in hours
  const [loadingCooldown, setLoadingCooldown] = useState(true);
  
  useEffect(() => {
    // Load user data on component mount
    loadUserData();
    
    // Set initial page style
    updatePageStyle(currentPage);
    
    // Add a subtle pulsing animation to the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Check cooldown for points
    checkPointsAvailability();
  }, []);
  
  const loadUserData = async () => {
    try {
      if (!auth.currentUser) {
        console.log('No user logged in');
        return;
      }
      
      const userId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Calculate sobriety days from streak_start_time
        if (userData.streak_start_time) {
          const streakStartTime = userData.streak_start_time;
          const currentTime = Date.now();
          const diffTime = Math.abs(currentTime - streakStartTime);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          setSobrietyDays(diffDays);
        }
        
        // Get relapse history
        if (userData.relapse_history) {
          setRelapseHistory(userData.relapse_history);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  const checkPointsAvailability = async () => {
    setLoadingCooldown(true);
    try {
      if (!auth.currentUser) {
        setCanEarnPoints(true); // Default to true if not logged in
        setLoadingCooldown(false);
        return;
      }
      
      const userId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastCheckInTime = userData.last_check_in || 0;
        const currentTime = Date.now();
        const hoursSinceLastCheckIn = (currentTime - lastCheckInTime) / (1000 * 60 * 60);
        
        // Check if 24 hours have passed
        if (hoursSinceLastCheckIn >= 24 || lastCheckInTime === 0) {
          setCanEarnPoints(true);
          setCheckInCooldown(0);
        } else {
          setCanEarnPoints(false);
          // Calculate remaining cooldown in hours
          const remainingHours = 24 - hoursSinceLastCheckIn;
          setCheckInCooldown(remainingHours);
        }
      } else {
        // New user, can earn points
        setCanEarnPoints(true);
        setCheckInCooldown(0);
      }
    } catch (error) {
      console.error('Error checking points availability:', error);
      setCanEarnPoints(true); // Default to true on error
    }
    setLoadingCooldown(false);
  };
  
  const saveCheckInData = async () => {
    try {
      if (!auth.currentUser) {
        console.log('No user logged in');
        return;
      }
      
      // Only save if the user has made a selection
      if (!feeling) {
        console.log('No mood selected, skipping save');
        return;
      }
      
      const userId = auth.currentUser.uid;
      const userDocRef = doc(db, 'users', userId);
      
      // Create check-in data object
      const checkInData = {
        timestamp: Date.now(),
        feeling,
        cravingLevel,
        symptoms: [...selectedSymptoms, ...(otherSymptom ? ['other: ' + otherSymptom] : [])],
      };
      
      // Get user document
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update user document
        const userData = userDoc.data();
        const checkIns = userData.check_ins || [];
        const currentTime = Date.now();
        const lastCheckInTime = userData.last_check_in || 0;
        const hoursSinceLastCheckIn = (currentTime - lastCheckInTime) / (1000 * 60 * 60);
        
        // Check if 24 hours have passed since the last check-in
        let pointsAwarded = 0;
        if (hoursSinceLastCheckIn >= 24 || lastCheckInTime === 0) {
          // Award 10 points for completing a check-in
          pointsAwarded = 10;
          const currentPoints = userData.points || 0;
          
          // Add new check-in to the array
          checkIns.push(checkInData);
          
          await updateDoc(userDocRef, {
            'check_ins': checkIns,
            'last_check_in': currentTime,
            'points': currentPoints + pointsAwarded
          });
          
          console.log('Check-in saved and awarded 10 points');
          
          // Show toast notification
          if (pointsAwarded > 0) {
            // Could implement a toast notification here in the future
            console.log(`+${pointsAwarded} points for daily check-in!`);
          }
        } else {
          console.log('Check-in cooldown active, no points awarded');
          // Could show a toast notification about cooldown
        }
      } else {
        // Create new document if it doesn't exist
        await setDoc(userDocRef, {
          'check_ins': [checkInData],
          'last_check_in': Date.now(),
          'points': 10 // First check-in awards 10 points
        });
        console.log('First check-in saved and awarded 10 points');
      }
      
      console.log('Check-in data saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving check-in data:', error);
      return false;
    }
  };
  
  const handleNextPage = () => {
    if (currentPage === totalPages) {
      // Save check-in data and go back home
      saveCheckInData()
        .then(() => {
          console.log('Navigating back to main screen');
          router.replace('/(main)'); // Use replace to go back to main screen
        })
        .catch(error => {
          console.error('Error saving check-in data:', error);
          router.replace('/(main)'); // Still go back even if there's an error
        });
      return;
    }
    
    // If user completes page 7 and wants to skip to the final page,
    // save the check-in data
    if (currentPage === 7) {
      saveCheckInData().catch(error => {
        console.error('Error saving check-in data:', error);
      });
    }
    
    // Update background color and icon based on the NEXT page first
    const nextPage = currentPage + 1;
    updatePageStyle(nextPage);
    
    // Animate transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Update page
      setCurrentPage(nextPage);
      
      // Reset animation values
      slideAnim.setValue(50);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    });
  };
  
  const updatePageStyle = (page) => {
    switch(page) {
      case 1:
      case 2:
      case 5:
        setBackgroundColor('#555c76');
        setCurrentIcon(BRAIN_ICONS.peaceful);
        setIconBorderColor('rgba(255, 255, 255, 0.2)');
        break;
      case 4:
        if (cravingLevel && cravingLevel >= 7) {
          setBackgroundColor('#c83e3b');
          setCurrentIcon(BRAIN_ICONS.sad);
          setIconBorderColor('rgba(255, 255, 255, 0.3)');
        } else {
          setBackgroundColor('#555c76');
          setCurrentIcon(BRAIN_ICONS.peaceful);
          setIconBorderColor('rgba(255, 255, 255, 0.2)');
        }
        break;
      case 6:
        if (feeling === 'struggling' || feeling === 'bad') {
          setBackgroundColor('#433f50');
          setCurrentIcon(BRAIN_ICONS.rocket);
          setIconBorderColor('rgba(255, 255, 255, 0.25)');
        } else {
          setBackgroundColor('#72ae82');
          setCurrentIcon(BRAIN_ICONS.celebration);
          setIconBorderColor('rgba(255, 255, 255, 0.35)');
        }
        break;
      case 7:
        setBackgroundColor('#72ae82');
        setCurrentIcon(BRAIN_ICONS.celebration);
        setIconBorderColor('rgba(255, 255, 255, 0.35)');
        break;
      case 8:
        setBackgroundColor('#72ae82');
        setCurrentIcon(BRAIN_ICONS.celebration);
        setIconBorderColor('rgba(255, 255, 255, 0.35)');
        break;
      default:
        setBackgroundColor('#555c76');
        setCurrentIcon(BRAIN_ICONS.peaceful);
        setIconBorderColor('rgba(255, 255, 255, 0.2)');
    }
  };
  
  const getExpectedSymptoms = () => {
    // Check for recent relapses
    let hasRecentRelapse = false;
    if (relapseHistory && relapseHistory.length > 0) {
      const lastRelapse = relapseHistory[relapseHistory.length - 1];
      const currentTime = Date.now();
      const diffTime = Math.abs(currentTime - lastRelapse.timestamp);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        hasRecentRelapse = true;
      }
    }
    
    if (sobrietyDays < 1 || hasRecentRelapse) {
      return "You may feel restless or have difficulty focusing today. Increased anxiety or irritability is common, and first cravings may appear. This is normal as your brain adjusts to lower dopamine levels.";
    } else if (sobrietyDays < 3) {
      return "Sleep disturbances like trouble falling asleep or vivid dreams are normal at this stage. You might experience mood swings, heightened emotions, or possibly headaches or nausea. Your body is flushing out stored THC.";
    } else if (sobrietyDays < 7) {
      return "Cravings may peak during this adjustment phase. You might notice increased appetite or changes in digestion, along with emotional sensitivity. Your brain is relearning how to regulate mood without THC.";
    } else if (sobrietyDays < 14) {
      return "Good news! Cravings should begin declining now. Your energy levels are starting to improve and mental fog is beginning to lift. Your dopamine regulation is improving.";
    } else if (sobrietyDays < 30) {
      return "You should be experiencing a significant reduction in cravings with improved sleep and mood stability. You likely have more energy and mental sharpness as THC is almost entirely out of your system.";
    } else if (sobrietyDays < 60) {
      return "At this stage, cravings are occasional if at all. Your brain has adjusted to operating without THC, and you're likely experiencing better stress management, improved motivation and focus.";
    } else {
      return "Your emotional resilience has strengthened along with increased motivation and productivity. Old triggers may still appear occasionally but should be easier to handle. Your brain and body have fully adjusted.";
    }
  };
  
  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };
  
  const handleNavigate = async (destination) => {
    try {
      // Save check-in data before navigating
      await saveCheckInData();
      
      console.log('Navigating to:', destination);
      
      // If destination is an object with pathname, use it correctly
      if (typeof destination === 'object' && destination.pathname) {
        router.push(destination);
      } else {
        // Otherwise it's a string path
        router.push(destination);
      }
    } catch (error) {
      console.error('Error during navigation:', error);
      // Navigate anyway even if saving failed
      if (typeof destination === 'object' && destination.pathname) {
        router.push(destination);
      } else {
        router.push(destination);
      }
    }
  };
  
  const renderPointsStatus = () => {
    if (loadingCooldown) {
      return (
        <View style={styles.pointsContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      );
    }
    
    if (canEarnPoints) {
      return (
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>+10 points available for check-in today!</Text>
        </View>
      );
    } else {
      const hoursRemaining = Math.ceil(checkInCooldown);
      const minutesRemaining = Math.ceil((checkInCooldown - Math.floor(checkInCooldown)) * 60);
      
      return (
        <View style={styles.pointsContainer}>
          <Text style={styles.cooldownText}>
            {hoursRemaining > 0 
              ? `Check-in cooldown: ${hoursRemaining}h ${minutesRemaining}m remaining` 
              : `Check-in cooldown: ${minutesRemaining}m remaining`}
          </Text>
        </View>
      );
    }
  };
  
  const renderContent = () => {
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    };
    
    // Page 7 is now directly a ScrollView, so we don't need special handling
    
    switch (currentPage) {
      case 1:
        return (
          <Animated.View style={[styles.pageContainer, animatedStyle]}>
            <Text style={styles.pageTitle}>Take a Minute For Yourself</Text>
            <Text style={styles.pageContent}>
              Let's take a second to reflect on your day. This check-in will help track your progress, recognize your challenges, and give you tools to keep moving forward.
            </Text>
            
            {renderPointsStatus()}
            
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextPage}
            >
              <Text style={styles.buttonText}>Let's Begin</Text>
            </TouchableOpacity>
          </Animated.View>
        );
        
      case 2:
        return (
          <Animated.View style={[styles.pageContainer, animatedStyle]}>
            <Text style={styles.pageTitle}>Don't worry, we understand...</Text>
            <Text style={styles.pageContent}>
              {getExpectedSymptoms()}
            </Text>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextPage}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        );
        
      case 3:
        return (
          <Animated.View style={[styles.pageContainer, animatedStyle]}>
            <Text style={styles.pageTitle}>How are you feeling today?</Text>
            
            <View style={styles.feelingOptionsContainer}>
              <TouchableOpacity 
                style={[styles.feelingOption, feeling === 'great' && styles.selectedFeeling]}
                onPress={() => setFeeling('great')}
              >
                <Text style={styles.feelingEmoji}>😊</Text>
                <Text style={styles.feelingText}>Great, feeling strong</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.feelingOption, feeling === 'okay' && styles.selectedFeeling]}
                onPress={() => setFeeling('okay')}
              >
                <Text style={styles.feelingEmoji}>🙂</Text>
                <Text style={styles.feelingText}>Okay, some cravings but manageable</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.feelingOption, feeling === 'struggling' && styles.selectedFeeling]}
                onPress={() => setFeeling('struggling')}
              >
                <Text style={styles.feelingEmoji}>😐</Text>
                <Text style={styles.feelingText}>Struggling, but pushing through</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.feelingOption, feeling === 'bad' && styles.selectedFeeling]}
                onPress={() => setFeeling('bad')}
              >
                <Text style={styles.feelingEmoji}>😞</Text>
                <Text style={styles.feelingText}>Bad, tempted to smoke</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.nextButton, !feeling && styles.disabledButton]}
              onPress={handleNextPage}
              disabled={!feeling}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        );
        
      case 4:
        return (
          <Animated.View style={[styles.pageContainer, animatedStyle]}>
            <Text style={styles.pageTitle}>How strong are your cravings?</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>No cravings</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={cravingLevel}
                onValueChange={setCravingLevel}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor="#FFFFFF"
              />
              <Text style={styles.sliderLabel}>Extreme cravings</Text>
              
              <Text style={styles.cravingValue}>{cravingLevel}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextPage}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        );
        
      case 5:
        return (
          <Animated.View style={[styles.pageContainer, animatedStyle]}>
            <Text style={[styles.pageTitle, { fontSize: 24, marginBottom: 10 }]}>Select symptoms you've experienced</Text>
            
            <ScrollView 
              style={[styles.symptomsScrollView, { marginBottom: 10 }]}
              contentContainerStyle={styles.symptomsScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('sleep') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('sleep')}
              >
                <Text style={styles.symptomText}>Trouble sleeping</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('vivid_dreams') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('vivid_dreams')}
              >
                <Text style={styles.symptomText}>Vivid dreams or nightmares</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('anxiety') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('anxiety')}
              >
                <Text style={styles.symptomText}>Anxiety or irritability</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('energy') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('energy')}
              >
                <Text style={styles.symptomText}>Low energy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('focus') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('focus')}
              >
                <Text style={styles.symptomText}>Lack of focus</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('mood_swings') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('mood_swings')}
              >
                <Text style={styles.symptomText}>Mood swings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('depression') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('depression')}
              >
                <Text style={styles.symptomText}>Depression or sadness</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('physical') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('physical')}
              >
                <Text style={styles.symptomText}>Nausea or headaches</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('appetite') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('appetite')}
              >
                <Text style={styles.symptomText}>Changes in appetite</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('sweating') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('sweating')}
              >
                <Text style={styles.symptomText}>Night sweats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('digestion') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('digestion')}
              >
                <Text style={styles.symptomText}>Digestive issues</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('restless') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('restless')}
              >
                <Text style={styles.symptomText}>Restlessness</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('memory') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('memory')}
              >
                <Text style={styles.symptomText}>Memory issues</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.symptomOption, selectedSymptoms.includes('other') && styles.selectedSymptom]}
                onPress={() => toggleSymptom('other')}
              >
                <Text style={styles.symptomText}>Other</Text>
              </TouchableOpacity>
              
              {selectedSymptoms.includes('other') && (
                <TextInput
                  style={styles.otherSymptomInput}
                  placeholder="Please specify..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={otherSymptom}
                  onChangeText={setOtherSymptom}
                />
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextPage}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        );
        
      case 6:
        return (
          <Animated.View style={[styles.pageContainer, animatedStyle]}>
            <Text style={styles.pageTitle}>Keep it up!</Text>
            
            <Text style={styles.pageContent}>
              {(feeling === 'struggling' || feeling === 'bad') 
                ? "This is tough, but so are you. Every craving resisted is a step toward freedom."
                : "You're making great progress! Keep stacking those wins."}
            </Text>
            
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextPage}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        );
        
      case 7:
        return (
          <View style={{ flex: 1, width: '100%' }}>
            <View style={{ flex: 1, width: '100%', alignItems: 'center', paddingHorizontal: 20 }}>
              <View 
                style={[
                  styles.iconCard, 
                  { 
                    backgroundColor: backgroundColor, 
                    borderColor: iconBorderColor,
                    shadowColor: backgroundColor,
                    marginBottom: 30,
                    marginTop: 20
                  }
                ]}
              >
                <Animated.Image
                  source={currentIcon}
                  style={[styles.brainIcon, iconAnimatedStyle]}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.pageTitle}>Check-In Completed!</Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Mood:</Text>
                  <Text style={styles.summaryValue}>
                    {feeling === 'great' ? '😊 Great' : 
                     feeling === 'okay' ? '🙂 Okay' : 
                     feeling === 'struggling' ? '😐 Struggling' : '😞 Bad'}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Craving Level:</Text>
                  <Text style={styles.summaryValue}>
                    {cravingLevel <= 3 ? 'Low' : 
                     cravingLevel <= 6 ? 'Moderate' : 'High'} ({cravingLevel}/10)
                  </Text>
                </View>
                
                {selectedSymptoms.length > 0 && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Symptoms:</Text>
                    <View style={styles.symptomsList}>
                      {selectedSymptoms.map((symptom, index) => (
                        <Text key={index} style={styles.summarySymptom}>
                          • {symptom === 'sleep' ? 'Trouble sleeping' :
                            symptom === 'vivid_dreams' ? 'Vivid dreams or nightmares' :
                            symptom === 'anxiety' ? 'Anxiety or irritability' :
                            symptom === 'energy' ? 'Low energy' :
                            symptom === 'focus' ? 'Lack of focus' :
                            symptom === 'mood_swings' ? 'Mood swings' :
                            symptom === 'depression' ? 'Depression or sadness' :
                            symptom === 'physical' ? 'Nausea or headaches' :
                            symptom === 'appetite' ? 'Changes in appetite' :
                            symptom === 'sweating' ? 'Night sweats' :
                            symptom === 'digestion' ? 'Digestive issues' :
                            symptom === 'restless' ? 'Restlessness' :
                            symptom === 'memory' ? 'Memory issues' :
                            symptom === 'other' ? otherSymptom : symptom}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleNextPage}
              >
                <Text style={styles.buttonText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case 8:
        return (
          <Animated.View style={[styles.pageContainer, animatedStyle]}>
            <Text style={styles.pageTitle}>Great job checking in!</Text>
            
            <Text style={styles.pageContent}>
              Checking in on yourself is the most important step of your quitting journey! Keep up the good work!
            </Text>
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleNavigate('/(standalone)/meditate')}
              >
                <Text style={styles.actionButtonText}>Meditate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleNavigate('/(main)')}
              >
                <Text style={styles.actionButtonText}>Journal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.skipButton, { alignSelf: 'center', marginTop: 5 }]}
                onPress={() => router.replace('/(main)')}
              >
                <Text style={[styles.skipButtonText, { fontSize: 16 }]}>I'll skip these for right now</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
        
      default:
        return null;
    }
  };
  
  // Create an animated style for the icon
  const iconAnimatedStyle = {
    transform: [{ scale: iconScaleAnim }]
  };
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#000000', backgroundColor, '#000000']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.replace('/(main)')}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              {Array.from({ length: totalPages }).map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.progressDot,
                    currentPage >= index + 1 ? styles.progressDotActive : {}
                  ]}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.content}>
            {/* On page 7, the icon is already inside the ScrollView */}
            {currentPage !== 7 && (
              <View 
                style={[
                  styles.iconCard, 
                  { 
                    backgroundColor: backgroundColor, 
                    borderColor: iconBorderColor,
                    shadowColor: backgroundColor,
                  }
                ]}
              >
                <Animated.Image
                  source={currentIcon}
                  style={[styles.brainIcon, iconAnimatedStyle]}
                  resizeMode="contain"
                />
              </View>
            )}
            
            {renderContent()}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginLeft: -40, // Offset back button width
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: 200,
    height: 200,
  },
  brainIcon: {
    width: 150,
    height: 150,
  },
  pageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  pageContent: {
    fontSize: 18,
    fontFamily: typography.fonts.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: typography.fonts.semibold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  feelingOptionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  feelingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedFeeling: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  feelingEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  feelingText: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#FFFFFF',
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cravingValue: {
    fontSize: 32,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    marginTop: 8,
  },
  symptomsScrollView: {
    width: '100%',
    marginBottom: 20,
    maxHeight: 320,
  },
  symptomsScrollContent: {
    padding: 10,
    paddingBottom: 5,
  },
  symptomOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedSymptom: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  symptomText: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#FFFFFF',
  },
  otherSymptomInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
    color: '#FFFFFF',
    fontFamily: typography.fonts.regular,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  summaryItem: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: typography.fonts.semibold,
    color: '#FFFFFF',
  },
  symptomsList: {
    marginTop: 8,
  },
  summarySymptom: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionButtonsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.semibold,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: typography.fonts.medium,
  },
  pointsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginVertical: 15,
    alignItems: 'center',
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
  cooldownText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
});

export default CheckInScreen; 