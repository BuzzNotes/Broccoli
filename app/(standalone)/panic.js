import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Pressable,
  ScrollView,
  SafeAreaView,
  Animated,
  Modal,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../styles/typography';
import { colors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

const PanicScreen = () => {
  const insets = useSafeAreaInsets();
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const typingInProgress = useRef(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  
  // Set up pulsing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);
  
  // Set up heartbeat animation for the main message
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [heartbeatAnim]);
  
  // Play an attention-grabbing haptic pattern when the screen first loads
  useEffect(() => {
    const playInitialHaptics = async () => {
      // First a heavy impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Short pause
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Medium impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Short pause
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Final heavy impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Add warning notification
      await new Promise(resolve => setTimeout(resolve, 300));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };
    
    playInitialHaptics();
  }, []);
  
  // Library of motivational messages
  const motivationalMessages = [
    "STOP! YOU WILL REGRET THIS DECISION.",
    "THIS MOMENT OF WEAKNESS WILL COST YOU EVERYTHING.",
    "THINK ABOUT WHO YOU'RE DISAPPOINTING RIGHT NOW.",
    "YOUR FUTURE SELF IS BEGGING YOU TO STOP.",
    "EVERY RELAPSE MAKES THE NEXT ONE EASIER. DON'T START.",
    "YOU'LL HATE YOURSELF IN 10 MINUTES IF YOU GIVE IN.",
    "IS THIS REALLY WORTH THROWING AWAY ALL YOUR PROGRESS?",
    "THE SHAME YOU'LL FEEL ISN'T WORTH IT.",
    "REMEMBER HOW BAD YOU FELT LAST TIME YOU RELAPSED.",
    "YOUR BRAIN IS LYING TO YOU RIGHT NOW.",
    "THIS URGE IS TEMPORARY. THE REGRET IS NOT.",
    "YOU'RE STRONGER THAN THIS URGE. PROVE IT.",
    "DON'T BECOME A STATISTIC. MOST PEOPLE FAIL HERE.",
    "IMAGINE EXPLAINING THIS MOMENT TO SOMEONE YOU RESPECT.",
    "YOUR ADDICTION IS TRYING TO TAKE CONTROL. FIGHT BACK.",
    "EVERY RELAPSE REWIRES YOUR BRAIN FOR FAILURE.",
    "THE PLEASURE LASTS SECONDS. THE SHAME LASTS DAYS.",
    "YOU'RE ONE DECISION AWAY FROM RESTARTING YOUR COUNTER.",
    "WHAT WOULD THE PERSON YOU WANT TO BE DO RIGHT NOW?",
    "THIS IS THE MOMENT THAT DEFINES YOUR CHARACTER.",
    "WALK AWAY NOW OR REGRET IT LATER. YOUR CHOICE."
  ];
  
  // Shuffle the messages array on component mount
  const shuffledMessages = useMemo(() => {
    // Create a copy of the array to shuffle
    const messagesCopy = [...motivationalMessages];
    
    // Fisher-Yates shuffle algorithm
    for (let i = messagesCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [messagesCopy[i], messagesCopy[j]] = [messagesCopy[j], messagesCopy[i]];
    }
    
    return messagesCopy;
  }, []);
  
  const typingSpeed = 40; // milliseconds per character - fast typing
  
  // Function to type out a message
  const typeMessage = (message, onComplete) => {
    typingInProgress.current = true;
    let currentIndex = 0;
    setTypedText('');
    
    const typingInterval = setInterval(() => {
      if (currentIndex < message.length) {
        // Enhanced haptic feedback pattern
        if (currentIndex === 0) {
          // Strong impact at the start of each message
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (currentIndex % 5 === 0) {
          // Medium impact every 5 characters
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (currentIndex % 2 === 0) {
          // Light impact for other characters (every 2nd character)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        // Add the next character to our displayed text
        setTypedText(message.substring(0, currentIndex + 1).toUpperCase());
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        typingInProgress.current = false;
        
        // Final notification-style haptic when message is complete
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (onComplete) onComplete();
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  };
  
  // Set up cycling animation
  useEffect(() => {
    let pauseTimer;
    
    // Start typing the first message
    const clearTyping = typeMessage(shuffledMessages[currentMessageIndex], () => {
      // After typing completes, wait a bit before moving to next message
      pauseTimer = setTimeout(() => {
        // Provide a warning haptic feedback before transitioning to the next message
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Move to next message (with wrapping)
        setCurrentMessageIndex((prevIndex) => 
          (prevIndex + 1) % shuffledMessages.length
        );
      }, 2500); // Wait 2.5 seconds before showing next message
    });
    
    // Clean up both the typing interval and the pause timer
    return () => {
      clearTyping();
      if (pauseTimer) clearTimeout(pauseTimer);
    };
  }, [currentMessageIndex, shuffledMessages]);
  
  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500); // Blink every 500ms
    
    return () => clearInterval(cursorInterval);
  }, []);
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowHelpModal(true);
  };
  
  const handleCloseHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowHelpModal(false);
  };
  
  const handleCallHotline = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Linking.openURL('tel:+18006624357'); // National Helpline
  };
  
  const handleRelapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // First close the panic page by going back to the timer
    router.back();
    
    // Then open the relapse page after a short delay
    setTimeout(() => {
      router.push('/(standalone)/relapse');
    }, 100);
  };
  
  const handleThinking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show coping strategies
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHelpModal}
        onRequestClose={handleCloseHelp}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header with Gradient */}
            <LinearGradient
              colors={['#8B0000', '#5A0000']}
              style={styles.modalHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>EMERGENCY RESOURCES</Text>
                <Pressable onPress={handleCloseHelp} style={styles.modalCloseButton}>
                  <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                </Pressable>
              </View>
            </LinearGradient>
            
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              {/* Breathing Technique Section - Moved to Top */}
              <View style={styles.helpSection}>
                <View style={styles.helpSectionHeader}>
                  <Ionicons name="pulse" size={20} color="#FF3B30" />
                  <Text style={styles.helpSectionTitle}>BREATHING TECHNIQUE</Text>
                </View>
                
                <View style={styles.breathingContainer}>
                  <View style={styles.breathingStep}>
                    <View style={styles.breathingNumberContainer}>
                      <Text style={styles.breathingNumber}>1</Text>
                    </View>
                    <Text style={styles.breathingText}>BREATHE IN FOR 4 SECONDS</Text>
                  </View>
                  
                  <View style={styles.breathingStep}>
                    <View style={styles.breathingNumberContainer}>
                      <Text style={styles.breathingNumber}>2</Text>
                    </View>
                    <Text style={styles.breathingText}>HOLD FOR 4 SECONDS</Text>
                  </View>
                  
                  <View style={styles.breathingStep}>
                    <View style={styles.breathingNumberContainer}>
                      <Text style={styles.breathingNumber}>3</Text>
                    </View>
                    <Text style={styles.breathingText}>EXHALE FOR 6 SECONDS</Text>
                  </View>
                  
                  <View style={styles.breathingStep}>
                    <View style={styles.breathingNumberContainer}>
                      <Text style={styles.breathingNumber}>4</Text>
                    </View>
                    <Text style={styles.breathingText}>REPEAT 5 TIMES</Text>
                  </View>
                </View>
              </View>
              
              {/* Immediate Actions - Moved to middle */}
              <View style={styles.helpSection}>
                <View style={styles.helpSectionHeader}>
                  <Ionicons name="flash" size={20} color="#FF3B30" />
                  <Text style={styles.helpSectionTitle}>IMMEDIATE ACTIONS</Text>
                </View>
                
                <View style={styles.helpItemsGrid}>
                  <View style={styles.helpItem}>
                    <View style={styles.helpIconContainer}>
                      <Ionicons name="water" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.helpText}>DRINK COLD WATER</Text>
                  </View>
                  
                  <View style={styles.helpItem}>
                    <View style={styles.helpIconContainer}>
                      <Ionicons name="walk" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.helpText}>GO FOR A WALK</Text>
                  </View>
                  
                  <View style={styles.helpItem}>
                    <View style={styles.helpIconContainer}>
                      <Ionicons name="call" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.helpText}>CALL A FRIEND</Text>
                  </View>
                  
                  <View style={styles.helpItem}>
                    <View style={styles.helpIconContainer}>
                      <Ionicons name="fitness" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.helpText}>DO PUSHUPS</Text>
                  </View>
                </View>
              </View>
              
              {/* Emergency Contacts - Kept at end */}
              <View style={styles.helpSection}>
                <View style={styles.helpSectionHeader}>
                  <Ionicons name="call" size={20} color="#FF3B30" />
                  <Text style={styles.helpSectionTitle}>EMERGENCY CONTACTS</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.emergencyButton} 
                  onPress={handleCallHotline}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF3B30', '#CC2D25']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Ionicons name="call" size={24} color="#FFFFFF" style={styles.emergencyIcon} />
                  <Text style={styles.emergencyText}>CALL NATIONAL HELPLINE</Text>
                </TouchableOpacity>
                
                <Text style={styles.emergencyNote}>
                  AVAILABLE 24/7 • FREE • CONFIDENTIAL
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Enhanced red gradient background */}
      <LinearGradient
        colors={['#2A0505', '#3A0A0A', '#2A0505']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Pulsing overlay for intensity */}
      <Animated.View 
        style={[
          styles.pulsingOverlay,
          {
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.7]
            })
          }
        ]} 
      />
      
      {/* Red vignette effect */}
      <View style={styles.vignetteOverlay} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
        
        <View style={styles.titleContainer}>
          <Text style={styles.logoText}>{'BROCCOLI'.toUpperCase()}</Text>
          <Text style={styles.headerTitle}>{'DANGER ZONE'.toUpperCase()}</Text>
        </View>
        
        <Pressable 
          style={styles.helpButton} 
          onPress={handleHelp}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="help-circle" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
      
      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <Ionicons name="warning" size={20} color="#FFFFFF" style={styles.warningIcon} />
        <Text style={styles.warningText}>DON'T THROW AWAY YOUR PROGRESS</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.container}>
        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{
            transform: [{ scale: heartbeatAnim }],
          }}>
            <Text style={styles.mainMessage}>
              {typedText.toUpperCase()}
              {showCursor && <Text style={styles.cursor}>|</Text>}
            </Text>
          </Animated.View>
          
          <View style={styles.sideEffectsSection}>
            <Text style={styles.sectionTitle}>{'Side effects of Relapsing:'.toUpperCase()}</Text>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="eye-off" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>{'DESENSITIZATION'.toUpperCase()}</Text>
                <Text style={styles.effectDescription}>{'Needing more extreme content for arousal.'.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="heart-dislike" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>{'RELATIONSHIP ISSUES'.toUpperCase()}</Text>
                <Text style={styles.effectDescription}>{'Decreased intimacy and trust.'.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="brain" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>{'COGNITIVE IMPAIRMENT'.toUpperCase()}</Text>
                <Text style={styles.effectDescription}>{'Reduced memory and concentration abilities.'.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="medkit" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>{'RESPIRATORY ISSUES'.toUpperCase()}</Text>
                <Text style={styles.effectDescription}>{'Increased risk of bronchitis and lung infections.'.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="sad" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>{'MENTAL HEALTH DECLINE'.toUpperCase()}</Text>
                <Text style={styles.effectDescription}>{'Higher rates of anxiety, depression, and paranoia.'.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="wallet" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>{'FINANCIAL STRAIN'.toUpperCase()}</Text>
                <Text style={styles.effectDescription}>{'Wasting money that could be used for better things.'.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="trending-down" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>{'ERECTILE DYSFUNCTION'.toUpperCase()}</Text>
                <Text style={styles.effectDescription}>{'Inability to get hard in bed.'.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Fixed Action Buttons */}
        <View style={[styles.actionButtons, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
          <TouchableOpacity 
            style={styles.relapseButton} 
            activeOpacity={0.8}
            onPress={handleRelapse}
          >
            <LinearGradient
              colors={['#CC2D25', '#FF3B30']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="thumbs-down" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{'I Relapsed'.toUpperCase()}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.thinkingButton} 
            activeOpacity={0.8}
            onPress={handleThinking}
          >
            <LinearGradient
              colors={['#8B0000', '#5A0000']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="warning" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{'I\'m thinking of relapsing'.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2A0505',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  pulsingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 59, 48, 0.4)',
    backgroundColor: 'rgba(42, 5, 5, 0.9)',
    zIndex: 10,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D83232',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FF3B30',
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    letterSpacing: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FF3B30',
    fontFamily: typography.fonts.bold,
    marginTop: 4,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 200,
  },
  mainMessage: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: 40,
    minHeight: 120,
    letterSpacing: 1,
    lineHeight: 36,
    textShadowColor: 'rgba(255, 59, 48, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    paddingHorizontal: 10,
  },
  sideEffectsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    marginBottom: 20,
  },
  effectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  effectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  effectTextContainer: {
    flex: 1,
  },
  effectTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    marginBottom: 4,
  },
  effectDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: typography.fonts.regular,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: 'rgba(26, 5, 5, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 59, 48, 0.3)',
    zIndex: 100,
  },
  relapseButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  thinkingButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#1A0505',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
  },
  cursor: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    marginLeft: 2,
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#1A0505',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeaderGradient: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  modalTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    maxHeight: '75%',
  },
  modalScrollContent: {
    paddingBottom: 0,
  },
  modalWarningBanner: {
    display: 'none',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  modalWarningText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  helpSection: {
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  helpSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpSectionTitle: {
    fontSize: 16,
    color: '#FF3B30',
    fontFamily: typography.fonts.bold,
    marginLeft: 8,
    letterSpacing: 1,
  },
  helpItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  helpItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  helpIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
  breathingContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  breathingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  breathingNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  breathingNumber: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  breathingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 6,
  },
  emergencyIcon: {
    marginRight: 8,
  },
  emergencyText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  emergencyNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 0,
  },
});

export default PanicScreen; 