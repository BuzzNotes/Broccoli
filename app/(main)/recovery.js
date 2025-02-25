import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';

const { width, height } = Dimensions.get('window');

const RecoveryScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('progress');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return (
          <View style={styles.tabContent}>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>7 days</Text>
              </View>
              
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.statLabel}>Money Saved</Text>
                <Text style={styles.statValue}>$120</Text>
              </View>
            </View>
            
            <View style={styles.milestoneCard}>
              <LinearGradient
                colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.cardTitle}>Next Milestone</Text>
              <View style={styles.milestoneProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '70%' }]} />
                </View>
                <Text style={styles.milestoneText}>7 days until 2 weeks cannabis-free</Text>
              </View>
            </View>
            
            <View style={styles.benefitsCard}>
              <LinearGradient
                colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.cardTitle}>Benefits You're Experiencing</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4FA65B" />
                <Text style={styles.benefitText}>Improved lung function</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4FA65B" />
                <Text style={styles.benefitText}>Better sleep quality</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4FA65B" />
                <Text style={styles.benefitText}>Increased mental clarity</Text>
              </View>
            </View>
          </View>
        );
      case 'journal':
        return (
          <View style={styles.tabContent}>
            <View style={styles.journalCard}>
              <LinearGradient
                colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.cardTitle}>Your Journal</Text>
              <Text style={styles.journalPrompt}>Record your thoughts and feelings about your cannabis-free journey.</Text>
              
              <TouchableOpacity style={styles.addEntryButton} activeOpacity={0.8}>
                <LinearGradient
                  colors={['rgba(79, 166, 91, 0.3)', 'rgba(79, 166, 91, 0.1)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.addEntryText}>Add New Entry</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.emptyJournal}>
              <Ionicons name="book-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyText}>No journal entries yet</Text>
              <Text style={styles.emptySubtext}>Start documenting your journey today</Text>
            </View>
          </View>
        );
      case 'resources':
        return (
          <View style={styles.tabContent}>
            <View style={styles.resourceCard}>
              <LinearGradient
                colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.cardTitle}>Helpful Resources</Text>
              
              <TouchableOpacity style={styles.resourceItem} activeOpacity={0.7}>
                <Ionicons name="document-text" size={24} color="#4FA65B" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Cannabis Withdrawal Guide</Text>
                  <Text style={styles.resourceDesc}>Learn about common symptoms and how to manage them</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4FA65B" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem} activeOpacity={0.7}>
                <Ionicons name="people" size={24} color="#4FA65B" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Support Communities</Text>
                  <Text style={styles.resourceDesc}>Connect with others on the same journey</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4FA65B" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem} activeOpacity={0.7}>
                <Ionicons name="fitness" size={24} color="#4FA65B" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Healthy Alternatives</Text>
                  <Text style={styles.resourceDesc}>Activities to replace cannabis use</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4FA65B" />
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
      <StatusBar barStyle="light-content" />
      
      {/* Enhanced green gradient background */}
      <LinearGradient
        colors={['#0F1A15', '#122A1E', '#0F1A15']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Recovery</Text>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'progress' && styles.activeTab]} 
            onPress={() => setActiveTab('progress')}
          >
            <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'journal' && styles.activeTab]} 
            onPress={() => setActiveTab('journal')}
          >
            <Text style={[styles.tabText, activeTab === 'journal' && styles.activeTabText]}>Journal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'resources' && styles.activeTab]} 
            onPress={() => setActiveTab('resources')}
          >
            <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>Resources</Text>
          </TouchableOpacity>
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
    backgroundColor: '#0F1A15',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Extra padding for tab bar
  },
  screenTitle: {
    fontSize: 28,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(79, 166, 91, 0.2)',
  },
  tabText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  activeTabText: {
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  tabContent: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    position: 'relative',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    fontFamily: typography.fonts.medium,
  },
  statValue: {
    fontSize: 24,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  milestoneCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    position: 'relative',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 16,
  },
  milestoneProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4FA65B',
    borderRadius: 4,
  },
  milestoneText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  benefitsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    position: 'relative',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
    marginLeft: 12,
  },
  journalCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    position: 'relative',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  journalPrompt: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    marginBottom: 20,
    lineHeight: 22,
  },
  addEntryButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
  },
  addEntryText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  emptyJournal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: typography.fonts.regular,
    marginTop: 8,
  },
  resourceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    position: 'relative',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  resourceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  resourceTitle: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  },
});

export default RecoveryScreen; 