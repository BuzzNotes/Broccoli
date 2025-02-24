import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Dimensions, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../app/styles/colors';

const { width } = Dimensions.get('window');

const BenefitCard = ({ icon, title, description, color }) => (
  <View style={[styles.benefitCard, { backgroundColor: color }]}>
    <LinearGradient
      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />
    <Ionicons name={icon} size={28} color="white" />
    <Text style={styles.benefitTitle}>{title}</Text>
    <Text style={styles.benefitDescription}>{description}</Text>
  </View>
);

const BenefitTag = ({ text, color, icon }) => (
  <View style={[styles.benefitTag, { backgroundColor: color }]}>
    <Ionicons name={icon} size={16} color="white" style={styles.benefitTagIcon} />
    <Text style={styles.benefitTagText}>{text}</Text>
  </View>
);

const BenefitsScreen = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/paywall');
  };

  const benefitTags = [
    { text: "Increased Testosterone", color: "rgba(66, 133, 244, 0.3)", icon: "fitness" },
    { text: "Prevent Erectile Dysfunction", color: "rgba(234, 67, 53, 0.3)", icon: "heart" },
    { text: "Increased Energy", color: "rgba(52, 168, 83, 0.3)", icon: "battery-charging" },
    { text: "Increased Motivation", color: "rgba(251, 188, 4, 0.3)", icon: "rocket" },
    { text: "Improved Focus", color: "rgba(138, 78, 247, 0.3)", icon: "brain" },
    { text: "Improved Relationships", color: "rgba(255, 64, 129, 0.3)", icon: "people" },
    { text: "Increased Confidence", color: "rgba(0, 150, 136, 0.3)", icon: "trophy" }
  ];

  // Triple the tags array for seamless looping
  const extendedTags = [...benefitTags, ...benefitTags, ...benefitTags];

  useEffect(() => {
    let scrollAnimation;
    const startScrolling = () => {
      // Calculate total width of one set including gaps and padding
      const tagWidth = 180; // Approximate width of each tag including margins and gaps
      const totalWidth = benefitTags.length * tagWidth;
      
      const animate = () => {
        scrollX.setValue(0); // Start from first set
        Animated.timing(scrollX, {
          toValue: -totalWidth,
          duration: 30000, // Increased duration for smoother scroll
          useNativeDriver: true,
          isInteraction: false,
          easing: Easing.linear
        }).start((finished) => {
          if (finished) {
            scrollX.setValue(0); // Reset to start
            animate(); // Restart animation
          }
        });
      };

      animate();
    };

    startScrolling();

    return () => {
      scrollX.stopAnimation();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark, colors.background.dark]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Custom Plan Header */}
        <View style={styles.customPlanHeader}>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.customPlanText}>We've made you a custom plan</Text>
          </View>
          
          <View style={styles.dateCard}>
            <LinearGradient
              colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {/* Twinkle Effect */}
            <View style={styles.twinkleContainer}>
              <Ionicons name="sparkles" size={24} color="#FFD700" />
            </View>
            <Text style={styles.dateLabel}>YOUR SOBRIETY BEGINS</Text>
            <Text style={styles.date}>{formattedDate}</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.dayOneTag}>DAY 1</Text>
            </View>
          </View>
          
          <Text style={styles.journeyText}>
            Start your journey today with Broccoli
          </Text>
        </View>

        {/* Benefit Tags Section */}
        <View style={[styles.benefitTagsWrapper, { overflow: 'hidden' }]}>
          <Animated.View 
            style={[
              styles.benefitTagsContainer,
              {
                transform: [{
                  translateX: scrollX
                }]
              }
            ]}
          >
            {extendedTags.map((tag, index) => (
              <BenefitTag 
                key={index} 
                text={tag.text} 
                color={tag.color} 
                icon={tag.icon}
              />
            ))}
          </Animated.View>
        </View>

        <View style={styles.benefitsGrid}>
          <BenefitCard
            icon="shield"
            title="Build unbreakable willpower"
            description="Develop the mental strength to overcome any urge and take control of your life"
            color="rgba(106, 90, 205, 0.2)"
          />
          <BenefitCard
            icon="trending-up"
            title="Track your progress"
            description="Watch your health, energy, and confidence improve day by day"
            color="rgba(46, 204, 113, 0.2)"
          />
          <BenefitCard
            icon="people"
            title="Join a community"
            description="Connect with others on the same journey and share your success"
            color="rgba(241, 196, 15, 0.2)"
          />
          <BenefitCard
            icon="medal"
            title="Achieve your goals"
            description="Transform your life and become the person you were meant to be"
            color="rgba(255, 99, 71, 0.2)"
          />
        </View>

        <View style={styles.testimonialSection}>
          <Text style={styles.sectionTitle}>Real Stories, Real Results</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <Ionicons key={i} name="star" size={24} color="#FFD700" style={styles.star} />
            ))}
          </View>
          <Text style={styles.testimonial}>
            "I never thought I could quit, but with Broccoli's support and guidance, I'm now 6 months clean. My life has completely transformed."
          </Text>
          <Text style={styles.testimonialAuthor}>- John, 3 months clean</Text>
        </View>

        <View style={styles.featureSection}>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={28} color={colors.success} />
            <Text style={styles.featureText}>Science-backed approach</Text>
          </View>
          <Text style={styles.featureDescription}>
            Our program combines proven techniques with personalized support to help you achieve lasting freedom.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={handleGetStarted}
        >
          <LinearGradient
            colors={[colors.gradients.primary.start, colors.gradients.primary.end]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.buttonText}>I'm ready to quit</Text>
        </Pressable>
        <Text style={styles.disclaimer}>Purchase appears discreetly</Text>
        <View style={styles.guaranteeContainer}>
          <Text style={styles.guaranteeText}>Cancel Anytime ✓</Text>
          <Text style={styles.guaranteeText}>Money back guarantee 🛡️</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    justifyContent: 'center',
  },
  benefitsGrid: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  benefitCard: {
    padding: 24,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  benefitTitle: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  benefitDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  testimonialSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  sectionTitle: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  testimonial: {
    fontSize: 18,
    color: 'white',
    fontStyle: 'italic',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  testimonialAuthor: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  featureSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  featureDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.background.dark,
  },
  button: {
    backgroundColor: colors.gradients.primary.start,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  disclaimer: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  guaranteeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  guaranteeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  customPlanHeader: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: colors.background.dark,
    gap: 16,
  },
  checkmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  customPlanText: {
    fontSize: 22,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  dateCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  twinkleContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    transform: [{ rotate: '15deg' }],
  },
  dateLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  date: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tagContainer: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 166, 91, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.6)',
  },
  dayOneTag: {
    fontSize: 16,
    color: '#4FA65B',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  journeyText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: 8,
  },
  star: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  benefitTagsWrapper: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  benefitTagsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  benefitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginRight: 8,
  },
  benefitTagIcon: {
    marginRight: 6,
    opacity: 0.9,
  },
  benefitTagText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    opacity: 0.9,
  },
});

export default BenefitsScreen; 