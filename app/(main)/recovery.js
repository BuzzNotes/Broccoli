import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';

const { width, height } = Dimensions.get('window');

const RecoveryScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('progress');
  
  // Set the active tab based on the initialTab parameter
  useEffect(() => {
    if (params.initialTab && ['progress', 'journal', 'resources'].includes(params.initialTab)) {
      setActiveTab(params.initialTab);
    }
  }, [params.initialTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return (
          <View style={styles.tabContent}>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
                  style={[StyleSheet.absoluteFill, styles.cardGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>7 days</Text>
              </View>
              
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
                  style={[StyleSheet.absoluteFill, styles.cardGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <Text style={styles.statLabel}>Money Saved</Text>
                <Text style={styles.statValue}>$120</Text>
              </View>
            </View>
            
            <View style={styles.milestoneCard}>
              <LinearGradient
                colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
                style={[StyleSheet.absoluteFill, styles.cardGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
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
                colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
                style={[StyleSheet.absoluteFill, styles.cardGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.cardTitle}>Benefits You're Experiencing</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#5BBD68" />
                <Text style={styles.benefitText}>Improved lung function</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#5BBD68" />
                <Text style={styles.benefitText}>Better sleep quality</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#5BBD68" />
                <Text style={styles.benefitText}>Increased mental clarity</Text>
              </View>
            </View>
          </View>
        );
      case 'journal':
        return (
          <View style={styles.tabContent}>
            <View style={styles.journalHeader}>
              <Text style={styles.journalTitle}>My Recovery Journal</Text>
              <TouchableOpacity style={styles.addButton}>
                <LinearGradient
                  colors={['#5BBD68', '#45925A']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.emptyJournal}>
              <Ionicons name="book-outline" size={64} color="#5BBD68" />
              <Text style={styles.emptyText}>No journal entries yet</Text>
              <Text style={styles.emptySubtext}>Start documenting your recovery journey</Text>
            </View>
          </View>
        );
      case 'resources':
        return (
          <View style={styles.tabContent}>
            <View style={styles.resourceCard}>
              <LinearGradient
                colors={['rgba(91, 189, 104, 0.1)', 'rgba(91, 189, 104, 0.05)']}
                style={[StyleSheet.absoluteFill, styles.cardGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.cardTitle}>Helpful Resources</Text>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="document-text" size={32} color="#5BBD68" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Cannabis Withdrawal Guide</Text>
                  <Text style={styles.resourceDesc}>Learn what to expect during withdrawal</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5BBD68" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="people" size={32} color="#5BBD68" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Support Groups</Text>
                  <Text style={styles.resourceDesc}>Connect with others on the same journey</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5BBD68" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="fitness" size={32} color="#5BBD68" />
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>Healthy Habits Guide</Text>
                  <Text style={styles.resourceDesc}>Replace cannabis with positive activities</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5BBD68" />
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
      <StatusBar barStyle="dark-content" />
      
      {/* White background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{backgroundColor: '#FFFFFF', flex: 1}} />
      </View>
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Recovery</Text>
        
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  screenTitle: {
    fontSize: 32,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(91, 189, 104, 0.1)',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.2)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
  activeTabText: {
    color: '#5BBD68',
    fontFamily: typography.fonts.bold,
  },
  tabContent: {
    marginTop: 8,
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
    borderColor: 'rgba(91, 189, 104, 0.4)',
    position: 'relative',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  cardGradient: {
    borderRadius: 20,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    color: '#000000',
    fontFamily: typography.fonts.bold,
  },
  milestoneCard: {
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
  milestoneProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(91, 189, 104, 0.2)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5BBD68',
    borderRadius: 4,
  },
  milestoneText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
  },
  benefitsCard: {
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
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
    marginLeft: 12,
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
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyJournal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    fontFamily: typography.fonts.regular,
    marginTop: 8,
  },
  resourceCard: {
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
});

export default RecoveryScreen; 