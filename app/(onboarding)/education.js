import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Image, Dimensions, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

const slides = [
  {
    title: 'Weed is a drug',
    text: 'Using weed releases dopamine in your brain. This chemical makes you feel good - it\'s why you feel pleasure when you smoke.',
    image: require('../Graphics/SmokersBrain.jpg'),
    backgroundColor: [193, 62, 56], // RGB values for interpolation
  },
  {
    title: 'Weed destroys relationships',
    text: 'Weed reduces your desire for real connections and replaces it with the urge to get high.',
    image: require('../Graphics/RelationshipBrains.jpg'),
    backgroundColor: [205, 63, 61],
  },
  {
    title: 'Weed ruins your memory',
    text: 'Cannabis impairs your short-term memory and can cause lasting damage to your brain\'s memory centers with prolonged use.',
    image: require('../Graphics/RottenBrain.jpg'),
    backgroundColor: [199, 74, 57],
  },
  {
    title: 'Feeling unhappy?',
    text: 'Regular cannabis use disrupts your brain\'s natural chemical balance, leading to increased anxiety and depression when not using.',
    image: require('../Graphics/SadBrain.jpg'),
    backgroundColor: [200, 62, 59],
  },
  {
    title: 'We\'re here to help',
    text: 'Broccoli is your companion on the journey to sobriety. We\'ll keep you accountable and help you become the best version of yourself.',
    image: require('../Graphics/PeacefulBrain.jpg'),
    backgroundColor: [85, 92, 118],
  },
  {
    title: 'Boost your brain!',
    text: 'Your brain has an amazing ability to heal. By staying sober, you\'ll regain mental clarity and emotional balance.',
    image: require('../Graphics/RocketBrain.jpg'),
    backgroundColor: [67, 62, 80],
  },
  {
    title: 'Let\'s get started!',
    text: 'Congratulations on taking the first step toward sobriety! Your journey to a clearer mind begins now.',
    image: require('../Graphics/CelebrationBrain.jpg'),
    backgroundColor: [114, 173, 129],
  },
];

const EducationScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayedSlide, setDisplayedSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const slideProgress = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(1)).current;
  const slideOpacities = useRef(
    slides.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))
  ).current;
  const isLastSlide = currentSlide === slides.length - 1;

  // Create interpolated background color values
  const backgroundColor = slideProgress.interpolate({
    inputRange: slides.map((_, i) => i),
    outputRange: slides.map(slide => 
      `rgb(${slide.backgroundColor[0]}, ${slide.backgroundColor[1]}, ${slide.backgroundColor[2]})`
    ),
  });

  // Preload all images
  useEffect(() => {
    slides.forEach(slide => {
      Image.prefetch(Image.resolveAssetSource(slide.image).uri);
    });
  }, []);

  // Add initial fade-in animation
  useEffect(() => {
    // Start with everything invisible
    contentOpacity.setValue(0);
    titleOpacity.setValue(0);
    textOpacity.setValue(0);
    buttonOpacity.setValue(0);
    slideOpacities[0].setValue(0);

    // Fade in elements in sequence
    Animated.sequence([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideOpacities[0], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // Only run on mount

  // Add bounce animation
  useEffect(() => {
    const startBounceAnimation = () => {
      Animated.sequence([
        Animated.timing(bounceScale, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(bounceScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.ease,
        })
      ]).start(() => startBounceAnimation());
    };

    startBounceAnimation();
  }, []);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleNext = async () => {
    if (isTransitioning) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (isLastSlide) {
        // Set new streak start time
        const startTime = new Date().getTime();
        await AsyncStorage.setItem('streakStartTime', startTime.toString());
        router.replace('/(main)');
        return;
      }

      setIsTransitioning(true);
      const nextSlideIndex = currentSlide + 1;

      // 1. Fade out all current content
      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideOpacities[currentSlide], {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          // Animate background color transition
          Animated.timing(slideProgress, {
            toValue: nextSlideIndex,
            duration: 400, // Slightly longer duration for smoother color transition
            useNativeDriver: false,
          }),
        ]).start(resolve);
      });

      // 2. Update current slide
      setCurrentSlide(nextSlideIndex);
      
      // 3. Small delay to ensure content is ready
      await new Promise(resolve => setTimeout(resolve, 50));

      // 4. Update displayed content
      setDisplayedSlide(nextSlideIndex);

      // 5. Fade in elements in sequence
      await new Promise(resolve => {
        Animated.sequence([
          // First fade in the content container
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Then fade in text
          Animated.parallel([
            Animated.timing(titleOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          // Then fade in icon
          Animated.timing(slideOpacities[nextSlideIndex], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Finally fade in button
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      });

      setIsTransitioning(false);
    } catch (error) {
      console.error('Error:', error);
      setIsTransitioning(false);
    }
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: backgroundColor
      }
    ]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          <Pressable 
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]} 
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>

          <View style={styles.topSection}>
            <View style={styles.imagesContainer}>
              {slides.map((slide, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.imageWrapper,
                    { 
                      opacity: slideOpacities[index],
                      transform: [
                        { 
                          scale: Animated.multiply(
                            bounceScale,
                            slideOpacities[index]
                          )
                        }
                      ]
                    }
                  ]}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={slide.image}
                      style={styles.image}
                      resizeMode="contain"
                    />
                  </View>
                </Animated.View>
              ))}
            </View>

            <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
              <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
                {slides[displayedSlide].title}
              </Animated.Text>
              <Text style={styles.text}>{slides[displayedSlide].text}</Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.bottomSection, { opacity: buttonOpacity }]}>
            <View style={styles.dotsContainer}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentSlide === index && styles.activeDot
                  ]}
                />
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                isTransitioning && styles.buttonDisabled
              ]}
              onPress={handleNext}
              disabled={isTransitioning}
            >
              <Text style={styles.buttonText}>
                {isLastSlide ? 'Let\'s get started' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="black" />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  topSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  imagesContainer: {
    position: 'relative',
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: -40, // Increased negative margin to pull text up more
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 0,
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: 8, // Reduced from 12 to 8
  },
  text: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    backgroundColor: 'white',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    minWidth: 200,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ scale: 0.96 }],
  },
});

export default EducationScreen; 