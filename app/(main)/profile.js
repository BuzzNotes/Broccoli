import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getRelapseHistory, 
  formatRelapseDataForChart, 
  revertLastRelapse 
} from '../../src/utils/relapseTracker';
import { getUserProfile } from '../../src/utils/userProfile';
import { IMAGES } from '../../src/constants/assets';
import { useAuth } from '../../src/context/AuthContext';

const { width, height } = Dimensions.get('window');

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [activeTimeFrame, setActiveTimeFrame] = useState('month'); // 'today', 'week', 'month'
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysClean, setDaysClean] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalRelapses, setTotalRelapses] = useState(0);
  const [userName, setUserName] = useState('User');
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [userAge, setUserAge] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const mockData = {
    today: [
      { label: 'Morning', count: 0 },
      { label: 'Noon', count: 1 },
      { label: 'Evening', count: 0 },
      { label: 'Night', count: 0 }
    ],
    week: [
      { label: 'Mon', count: 0 },
      { label: 'Tue', count: 1 },
      { label: 'Wed', count: 0 },
      { label: 'Thu', count: 0 },
      { label: 'Fri', count: 1 },
      { label: 'Sat', count: 0 },
      { label: 'Sun', count: 0 }
    ],
    month: [
      { label: 'Week 1', count: 0 },
      { label: 'Week 2', count: 0 },
      { label: 'Week 3', count: 0 },
      { label: 'Week 4', count: 2 }
    ]
  };
  
  const currentData = mockData[activeTimeFrame];
  
  const toggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(prev => !prev);
  };
  
  const toggleDarkMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDarkMode(prev => !prev);
  };
  
  const toggleReminders = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminders(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await logout();
      // The router.replace is handled inside the logout function in AuthContext
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };
  
  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(standalone)/edit-profile');
  };
  
  const handleTimeFrameChange = (timeFrame) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTimeFrame(timeFrame);
  };
  
  const handleLogRelapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(standalone)/relapse');
  };
  
  const handleRevert = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      "Revert Last Relapse",
      "Are you sure you want to remove your most recent relapse? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Revert",
          onPress: async () => {
            const removed = await revertLastRelapse();
            if (removed) {
              loadRelapseData();
              Alert.alert("Success", "Your last relapse has been removed.");
            } else {
              Alert.alert("Error", "No relapses found to remove.");
            }
          }
        }
      ]
    );
  };
  
  // Chart rendering functions
  const renderChart = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#5BBD68" size="large" />
          <Text style={styles.loadingText}>Loading data...</Text>
      </View>
  );
    }

    if (chartData.length === 0) {
  return (
        <View style={styles.emptyChartContainer}>
          <Ionicons name="analytics-outline" size={48} color="rgba(0, 0, 0, 0.3)" />
          <Text style={styles.emptyChartText}>No data for this period</Text>
        </View>
      );
    }
    
    const chartWidth = width - 96;
    const chartHeight = 240;
    const paddingBottom = 50;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingBottom - paddingTop;
    
    const maxValue = Math.max(...chartData.map(d => d.count), 2); // Ensure scale to at least 2
    const xStep = graphWidth / (chartData.length - 1);
    
    // Generate path for the line - fix the y-coordinate calculation
    let pathD = '';
    chartData.forEach((point, index) => {
      const x = paddingLeft + (index * (graphWidth / (chartData.length - 1)));
      const y = paddingTop + graphHeight - (point.count / maxValue * graphHeight);
      
      if (index === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        // Create a smooth curve
        const prevX = paddingLeft + ((index - 1) * (graphWidth / (chartData.length - 1)));
        const prevY = paddingTop + graphHeight - (chartData[index - 1].count / maxValue * graphHeight);
        const cpX1 = prevX + (x - prevX) / 3;
        const cpX2 = x - (x - prevX) / 3;
        pathD += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
      }
    });
    
    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Y-axis */}
        <Line 
          x1={paddingLeft} 
          y1={paddingTop} 
          x2={paddingLeft} 
          y2={paddingTop + graphHeight} 
          stroke="rgba(0, 0, 0, 0.2)" 
          strokeWidth="1" 
        />
        
        {/* X-axis */}
        <Line 
          x1={paddingLeft} 
          y1={paddingTop + graphHeight} 
          x2={paddingLeft + graphWidth} 
          y2={paddingTop + graphHeight} 
          stroke="rgba(0, 0, 0, 0.2)" 
          strokeWidth="1" 
        />
        
        {/* Y-axis labels */}
        {[0, 1, 2].map((value) => {
          const y = paddingTop + graphHeight - (value / 2 * graphHeight);
          return (
            <React.Fragment key={`y-label-${value}`}>
              <Line 
                x1={paddingLeft - 5} 
                y1={y} 
                x2={paddingLeft} 
                y2={y} 
                stroke="rgba(0, 0, 0, 0.2)" 
                strokeWidth="1" 
              />
              <SvgText 
                x={paddingLeft - 10} 
                y={y + 4} 
                textAnchor="end" 
                fill="rgba(0, 0, 0, 0.6)" 
                fontSize="12"
              >
                {value}
              </SvgText>
            </React.Fragment>
          );
        })}
        
        {/* X-axis labels */}
        {chartData.map((point, index) => {
          const x = paddingLeft + (index * (graphWidth / (chartData.length - 1)));
          return (
            <SvgText 
              key={`x-label-${index}`}
              x={x} 
              y={paddingTop + graphHeight + 20} 
              textAnchor="middle" 
              fill="rgba(0, 0, 0, 0.6)" 
              fontSize="12"
            >
              {point.label}
            </SvgText>
          );
        })}
        
        {/* Line path */}
        <Path 
          d={pathD} 
          stroke="#5BBD68" 
          strokeWidth="2" 
          fill="none" 
        />
        
        {/* Data points */}
        {chartData.map((point, index) => {
          const x = paddingLeft + (index * (graphWidth / (chartData.length - 1)));
          const y = paddingTop + graphHeight - (point.count / maxValue * graphHeight);
          return (
            <Circle 
              key={`point-${index}`}
              cx={x} 
              cy={y} 
              r="4" 
              fill="#5BBD68" 
              stroke="#FFFFFF" 
              strokeWidth="2" 
            />
          );
        })}
      </Svg>
    );
  };

  // Add this effect to load data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadRelapseData();
      loadUserStats();
    }, [activeTimeFrame])
  );

  // Add these functions to load relapse data and user stats
  const loadRelapseData = async () => {
    try {
      setIsLoading(true);
      
      // Get formatted data for the chart
      const formattedData = await formatRelapseDataForChart(activeTimeFrame);
      setChartData(formattedData);
      
      // Calculate total relapses for the selected timeframe
      const total = formattedData.reduce((sum, item) => sum + item.count, 0);
      setTotalRelapses(total);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading relapse data:', error);
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Get streak start time
      const streakStartTimeStr = await AsyncStorage.getItem('streakStartTime');
      if (streakStartTimeStr) {
        const streakStartTime = parseInt(streakStartTimeStr);
        const now = Date.now();
        const diffInDays = Math.floor((now - streakStartTime) / (1000 * 60 * 60 * 24));
        setDaysClean(diffInDays);
        
        // Calculate money saved (assuming $10 per day of cannabis use)
        const dailySavings = 10; // $10 per day
        setTotalSaved(diffInDays * dailySavings);
      }
      
      // Load user profile data using the utility function
      const profileData = await getUserProfile();
      
      // Get user's name using the getUserFullName utility function
      const { getUserFullName } = require('../../src/utils/userProfile');
      const fullName = getUserFullName(profileData);
      setUserName(fullName || 'User');
      
      // Set profile image from Firestore data
      setUserProfileImage(profileData.photoURL || null);
      
      // Set user age from Firestore data
      setUserAge(profileData.age || '');
      
      // Set user email from Firestore data
      setUserEmail(profileData.email || '');
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* White background instead of green gradient */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{backgroundColor: '#FFFFFF', flex: 1}} />
      </View>
      
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>
        
        {/* User Profile Section */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={userProfileImage ? { uri: userProfileImage } : IMAGES.DEFAULT_AVATAR} 
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={styles.editAvatarButton}
                activeOpacity={0.8}
                onPress={handleEditProfile}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail || 'Email not set'}</Text>
              <Text style={styles.userAge}>{userAge ? `${userAge} years old` : 'Age not set'}</Text>
              <TouchableOpacity 
                style={styles.editProfileButton}
                activeOpacity={0.8}
                onPress={handleEditProfile}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysClean}</Text>
              <Text style={styles.statLabel}>Days Clean</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalRelapses}</Text>
              <Text style={styles.statLabel}>Relapses</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${totalSaved}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>
        </View>
        
        {/* Relapse Tracking Chart */}
        <View style={styles.chartCard}>
          <LinearGradient
            colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          
          {/* Time frame selector */}
          <View style={styles.timeFrameContainer}>
            <TouchableOpacity 
              style={[
                styles.timeFrameButton, 
                activeTimeFrame === 'today' && styles.timeFrameButtonActive
              ]}
              onPress={() => handleTimeFrameChange('today')}
            >
              <Text style={[
                styles.timeFrameText,
                activeTimeFrame === 'today' && styles.timeFrameTextActive
              ]}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.timeFrameButton, 
                activeTimeFrame === 'week' && styles.timeFrameButtonActive
              ]}
              onPress={() => handleTimeFrameChange('week')}
            >
              <Text style={[
                styles.timeFrameText,
                activeTimeFrame === 'week' && styles.timeFrameTextActive
              ]}>This Week</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.timeFrameButton, 
                activeTimeFrame === 'month' && styles.timeFrameButtonActive
              ]}
              onPress={() => handleTimeFrameChange('month')}
            >
              <Text style={[
                styles.timeFrameText,
                activeTimeFrame === 'month' && styles.timeFrameTextActive
              ]}>This Month</Text>
            </TouchableOpacity>
          </View>
          
          {/* Total relapses */}
          <View style={styles.totalRelapsesContainer}>
            <Text style={styles.totalRelapsesNumber}>{totalRelapses}</Text>
            <Text style={styles.totalRelapsesLabel}>Total Relapses</Text>
          </View>
          
          {/* Chart */}
          <View style={styles.chartContainer}>
            {renderChart()}
          </View>
          
          {/* Action buttons */}
          <TouchableOpacity 
            style={styles.logRelapseButton}
            activeOpacity={0.8}
            onPress={handleLogRelapse}
          >
            <LinearGradient
              colors={['#FF3B30', '#CC2D25']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="thumbs-down" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.logRelapseText}>Log Relapse</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.revertButton}
            activeOpacity={0.7}
            onPress={handleRevert}
          >
            <Text style={styles.revertText}>Revert</Text>
          </TouchableOpacity>
      </View>

        {/* Settings Section */}
        <View style={styles.settingsCard}>
          <LinearGradient
            colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={styles.cardTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#5BBD68" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#3e3e3e', true: 'rgba(91, 189, 104, 0.5)' }}
              thumbColor={notifications ? '#5BBD68' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={24} color="#5BBD68" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#3e3e3e', true: 'rgba(91, 189, 104, 0.5)' }}
              thumbColor={darkMode ? '#5BBD68' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="time" size={24} color="#5BBD68" />
              <Text style={styles.settingText}>Daily Reminders</Text>
            </View>
            <Switch
              value={reminders}
              onValueChange={toggleReminders}
              trackColor={{ false: '#3e3e3e', true: 'rgba(91, 189, 104, 0.5)' }}
              thumbColor={reminders ? '#5BBD68' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
      </View>

      {/* Support Section */}
        <View style={styles.supportCard}>
          <LinearGradient
            colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={styles.cardTitle}>Support</Text>
          
          <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
            <Ionicons name="help-circle" size={24} color="#5BBD68" />
            <Text style={styles.supportText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color="#5BBD68" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#5BBD68" />
            <Text style={styles.supportText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#5BBD68" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.supportItem, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <Ionicons name="star" size={24} color="#5BBD68" />
            <Text style={styles.supportText}>Rate the App</Text>
            <Ionicons name="chevron-forward" size={20} color="#5BBD68" />
          </TouchableOpacity>
      </View>

      {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={['rgba(255, 59, 48, 0.2)', 'rgba(255, 59, 48, 0.1)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="log-out" size={20} color="#FF3B30" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Extra padding for tab bar
  },
  screenTitle: {
    fontSize: 28,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    position: 'relative',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#5BBD68',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5BBD68',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginBottom: 4,
  },
  userAge: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.regular,
    marginBottom: 12,
  },
  editProfileButton: {
    backgroundColor: 'rgba(91, 189, 104, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  editProfileText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: typography.fonts.medium,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartCard: {
    borderRadius: 20,
    padding: 24,
    paddingBottom: 40,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    position: 'relative',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  timeFrameContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    padding: 4,
    marginTop: 16,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  timeFrameButtonActive: {
    backgroundColor: 'rgba(91, 189, 104, 0.2)',
  },
  timeFrameText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
  timeFrameTextActive: {
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  totalRelapsesContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  totalRelapsesNumber: {
    fontSize: 36,
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  totalRelapsesLabel: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
    height: 260,
    width: '100%',
  },
  logRelapseButton: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  logRelapseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
  },
  revertButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  revertText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
  settingsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    position: 'relative',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
    marginLeft: 16,
  },
  supportCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    position: 'relative',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  supportText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
    marginLeft: 16,
  },
  logoutButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
  },
  versionText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: typography.fonts.regular,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginTop: 8,
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginTop: 12,
  },
});

export default ProfileScreen; 