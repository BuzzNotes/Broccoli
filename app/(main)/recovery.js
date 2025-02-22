import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../app/styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const CircularProgress = ({ percentage }) => {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#4FA65B" stopOpacity="1" />
            <Stop offset="1" stopColor="#45E994" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1A1A2E"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={styles.progressText}>{percentage}%</Text>
        <Text style={styles.progressLabel}>Lung Health</Text>
      </View>
    </View>
  );
};

const RecoveryScreen = () => {
  // Example recovery data - in a real app, this would come from user's data
  const recoveryData = {
    lungHealth: 35, // percentage
    moneySaved: 420, // dollars
    daysClean: 7,
    carbonMonoxideLevels: "Normal",
    oxygenLevels: "98%",
    anxietyLevels: "Decreasing",
    sleepQuality: "Improving",
  };

  const milestones = [
    { days: 2, description: "Blood pressure returns to normal" },
    { days: 7, description: "Lung function begins to improve" },
    { days: 14, description: "Better sleep patterns emerge" },
    { days: 30, description: "Significant improvement in lung capacity" },
    { days: 90, description: "Brain fog completely lifts" },
    { days: 180, description: "Anxiety levels return to baseline" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Main Stats Card */}
      <View style={styles.mainCard}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMiddle]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.cardTitle}>Recovery Progress</Text>
          <View style={styles.statRow}>
            <CircularProgress percentage={recoveryData.lungHealth} />
            <View style={styles.verticalDivider} />
            <View style={styles.statsColumn}>
              <Text style={styles.statValue}>${recoveryData.moneySaved}</Text>
              <Text style={styles.statLabel}>Money Saved</Text>
              <Text style={styles.statValue}>{recoveryData.daysClean} days</Text>
              <Text style={styles.statLabel}>Clean Streak</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Health Indicators */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Indicators</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthItem}>
            <Ionicons name="pulse" size={24} color="#4FA65B" />
            <Text style={styles.healthLabel}>Carbon Monoxide</Text>
            <Text style={styles.healthValue}>{recoveryData.carbonMonoxideLevels}</Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="fitness" size={24} color="#4FA65B" />
            <Text style={styles.healthLabel}>Oxygen Levels</Text>
            <Text style={styles.healthValue}>{recoveryData.oxygenLevels}</Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="brain" size={24} color="#4FA65B" />
            <Text style={styles.healthLabel}>Anxiety</Text>
            <Text style={styles.healthValue}>{recoveryData.anxietyLevels}</Text>
          </View>
          <View style={styles.healthItem}>
            <Ionicons name="moon" size={24} color="#4FA65B" />
            <Text style={styles.healthLabel}>Sleep</Text>
            <Text style={styles.healthValue}>{recoveryData.sleepQuality}</Text>
          </View>
        </View>
      </View>

      {/* Recovery Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recovery Timeline</Text>
        {milestones.map((milestone, index) => (
          <View key={index} style={styles.milestone}>
            <View style={styles.milestoneDay}>
              <Text style={styles.milestoneDayText}>Day {milestone.days}</Text>
            </View>
            <Text style={styles.milestoneDescription}>{milestone.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    paddingTop: 34,
  },
  mainCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  verticalDivider: {
    width: 1,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
  },
  statsColumn: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
  },
  milestoneDay: {
    backgroundColor: '#4FA65B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  milestoneDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  milestoneDescription: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default RecoveryScreen; 