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
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>7 days</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Money Saved</Text>
                <Text style={styles.statValue}>$120</Text>
              </View>
            </View>
            
            <View style={styles.milestoneCard}>
              <Text style={styles.cardTitle}>Next Milestone</Text>
              <View style={styles.milestoneProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '70%' }]} />
                </View>
                <Text style={styles.milestoneText}>7 days until 2 weeks cannabis-free</Text>
              </View>
            </View>
            
            <View style={styles.benefitsCard}>
              <Text style={styles.cardTitle}>Benefits You're Experiencing</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.benefitText}>Improved lung function</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.benefitText}>Better sleep quality</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
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
                  colors={['#4CAF50', '#388E3C']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.emptyJournal}>
              <Ionicons name="book-outline" size={64} color="#4CAF50" />
              <Text style={styles.emptyText}>No journal entries yet</Text>
              <Text style={styles.emptySubtext}>Start documenting your recovery journey</Text>
            </View>
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
        <LinearGradient
          colors={['#FFFFFF', '#E8F5E9', '#C8E6C9']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
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
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(76, 175, 80, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    fontFamily: typography.fonts.bold,
    marginBottom: 16,
  },
  milestoneProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  milestoneText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: typography.fonts.medium,
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
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyJournal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
});

export default RecoveryScreen; 