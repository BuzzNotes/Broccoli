import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../app/styles/colors';
import { useAuth } from '../../src/context/AuthContext';
import { getUserFullName, getUserProfile } from '../../src/utils/userProfile';

export default function GoodNewsScreen() {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();
  const [userName, setUserName] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);

  // Debug user profile and fetch if needed
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      console.log("GoodNewsScreen - Starting user data fetch");
      console.log("GoodNewsScreen - User object:", user ? `UID: ${user.uid}` : "No user");
      
      if (user && user.uid) {
        try {
          // First try to get the profile from the user object
          if (user.profile) {
            console.log("GoodNewsScreen - Found profile in user object:", JSON.stringify(user.profile));
            const fullName = getUserFullName(user.profile);
            if (fullName && fullName.trim() !== '') {
              console.log("GoodNewsScreen - Using name from user.profile:", fullName);
              setUserName(fullName);
              setIsLoading(false);
              return;
            } else {
              console.log("GoodNewsScreen - No valid name in user.profile, will try Firestore");
            }
          } else {
            console.log("GoodNewsScreen - No profile in user object, will try Firestore");
          }
          
          // If we don't have a valid name yet, try to fetch from Firestore
          console.log("GoodNewsScreen - Fetching profile from Firestore");
          const userProfile = await getUserProfile();
          
          if (userProfile && Object.keys(userProfile).length > 0) {
            console.log("GoodNewsScreen - Got profile from Firestore:", JSON.stringify(userProfile));
            const fullName = getUserFullName(userProfile);
            
            if (fullName && fullName.trim() !== '') {
              console.log("GoodNewsScreen - Using name from Firestore profile:", fullName);
              setUserName(fullName);
              setIsLoading(false);
              return;
            } else {
              console.log("GoodNewsScreen - No valid name in Firestore profile");
            }
          } else {
            console.log("GoodNewsScreen - No profile found in Firestore or empty profile");
          }
          
          // If we still don't have a name, use a provider-specific fallback
          if (user.providerData && user.providerData.length > 0) {
            const provider = user.providerData[0].providerId;
            console.log("GoodNewsScreen - Using provider-specific fallback for:", provider);
            
            if (provider === 'apple.com') {
              setUserName("Apple User");
            } else if (provider === 'google.com') {
              setUserName("Google User");
            } else if (provider === 'password') {
              // For email users, try to format the email
              const email = user.email || '';
              if (email && !email.includes('privaterelay.appleid.com')) {
                const emailName = email.split('@')[0];
                const formattedName = emailName
                  .split(/[._-]/)
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
                setUserName(formattedName);
              } else {
                setUserName("Email User");
              }
            } else {
              setUserName("Broccoli User");
            }
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("GoodNewsScreen - Error fetching user profile:", error);
        }
      } else {
        console.log("GoodNewsScreen - No authenticated user found");
      }
      
      // If we get here, we couldn't find a valid name
      console.log("GoodNewsScreen - Using default 'Anonymous User'");
      setUserName("Anonymous User");
      setIsLoading(false);
    };
    
    fetchUserData();
  }, [user]);

  useEffect(() => {
    const bounceAnimation = Animated.sequence([
      Animated.delay(1000),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]);

    bounceAnimation.start();

    return () => bounceAnimation.stop();
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/questions/personal/age');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Background Gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Overlay Gradient */}
      <LinearGradient
        colors={['rgba(79, 166, 91, 0.6)', 'rgba(79, 166, 91, 0)']}
        style={styles.overlayGradient}
      />

      <View style={styles.content}>
        {/* Header Text */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Good News!</Text>
          <Text style={styles.message}>
            We've built your profile. Your progress will be tracked here.
          </Text>
        </View>

        {/* Profile Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.sparkleContainer}>
            <Ionicons name="sparkles" size={32} color="#FFD700" />
          </View>
          <View style={styles.newBanner}>
            <Text style={styles.newText}>NEW</Text>
          </View>
          <LinearGradient
            colors={['#5BCD6B', '#025A5C']}
            style={[StyleSheet.absoluteFill, styles.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.userContainer}>
                <Ionicons name="leaf" size={20} color="white" style={styles.userIcon} />
                <Text style={styles.userName}>
                  {isLoading ? "Loading..." : userName}
                </Text>
              </View>
            </View>

            {/* Active Streak Section */}
            <Text style={styles.streakLabel}>Active Streak</Text>
            <Text style={styles.streakCount}>0 days</Text>

            {/* Footer Section */}
            <View style={styles.cardFooter}>
              <Text style={styles.freeSince}>
                Free since{'\n'}
                {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom Section with Next Button */}
        <View style={styles.bottomSection}>
          <Text style={styles.subtitle}>
            Now, let's find out why you're struggling.
          </Text>

          {/* Next Button */}
          <Animated.View style={{ 
            width: '100%',
            transform: [{ scale: bounceAnim }]
          }}>
            <Pressable 
              style={({ pressed }) => [
                styles.nextButton,
                pressed && styles.nextButtonPressed
              ]}
              onPress={handleNext}
            >
              <LinearGradient
                colors={['rgba(79, 166, 91, 0.8)', 'rgba(2, 90, 92, 0.5)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Next</Text>
                <View style={styles.iconContainer}>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '53%',
    opacity: 0.8,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    zIndex: 2,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 40,
    color: colors.text.primary,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -15,
    right: '15%',
    transform: [{ rotate: '15deg' }],
    zIndex: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  newBanner: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newText: {
    color: '#000',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 40,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userIcon: {
    marginRight: 8,
  },
  userName: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    fontSize: 18,
  },
  streakLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  streakCount: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 48,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardFooter: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  freeSince: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'right',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: 'rgba(79, 166, 91, 0.6)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  nextButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
}); 