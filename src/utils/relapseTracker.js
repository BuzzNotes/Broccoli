import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const RELAPSE_HISTORY_KEY = 'relapseHistory';

/**
 * Log a new relapse event with current timestamp
 */
export const logRelapse = async (reason = '') => {
  try {
    // Get existing relapse history
    const historyString = await AsyncStorage.getItem(RELAPSE_HISTORY_KEY);
    const history = historyString ? JSON.parse(historyString) : [];
    
    // Create new relapse entry with timestamp
    const newRelapse = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: new Date().toISOString(),
      reason: reason
    };
    
    // Add to history and save
    const updatedHistory = [...history, newRelapse];
    await AsyncStorage.setItem(RELAPSE_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    console.log('Relapse logged:', newRelapse);
    return newRelapse;
  } catch (error) {
    console.error('Error logging relapse:', error);
    return null;
  }
};

/**
 * Get all relapse history
 */
export const getRelapseHistory = async () => {
  try {
    const historyString = await AsyncStorage.getItem(RELAPSE_HISTORY_KEY);
    return historyString ? JSON.parse(historyString) : [];
  } catch (error) {
    console.error('Error getting relapse history:', error);
    return [];
  }
};

/**
 * Get relapse count for today
 */
export const getTodayRelapses = async () => {
  try {
    const history = await getRelapseHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return history.filter(relapse => {
      const relapseDate = new Date(relapse.timestamp);
      return relapseDate >= today;
    });
  } catch (error) {
    console.error('Error getting today relapses:', error);
    return [];
  }
};

/**
 * Get relapse count for current week
 */
export const getWeekRelapses = async () => {
  try {
    const history = await getRelapseHistory();
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    const day = today.getDay() || 7; // Convert Sunday (0) to 7
    firstDayOfWeek.setDate(today.getDate() - day + 1); // Monday
    firstDayOfWeek.setHours(0, 0, 0, 0);
    
    return history.filter(relapse => {
      const relapseDate = new Date(relapse.timestamp);
      return relapseDate >= firstDayOfWeek;
    });
  } catch (error) {
    console.error('Error getting week relapses:', error);
    return [];
  }
};

/**
 * Get relapse count for current month
 */
export const getMonthRelapses = async () => {
  try {
    const history = await getRelapseHistory();
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return history.filter(relapse => {
      const relapseDate = new Date(relapse.timestamp);
      return relapseDate >= firstDayOfMonth;
    });
  } catch (error) {
    console.error('Error getting month relapses:', error);
    return [];
  }
};

/**
 * Clear all relapse history (for testing)
 */
export const clearRelapseHistory = async () => {
  try {
    await AsyncStorage.removeItem(RELAPSE_HISTORY_KEY);
    console.log('Relapse history cleared');
    return true;
  } catch (error) {
    console.error('Error clearing relapse history:', error);
    return false;
  }
};

/**
 * Remove the most recent relapse (for Revert functionality)
 */
export const revertLastRelapse = async () => {
  try {
    const history = await getRelapseHistory();
    if (history.length === 0) return null;
    
    const updatedHistory = history.slice(0, -1);
    await AsyncStorage.setItem(RELAPSE_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    console.log('Last relapse reverted');
    return history[history.length - 1]; // Return the removed relapse
  } catch (error) {
    console.error('Error reverting last relapse:', error);
    return null;
  }
};

/**
 * Format relapse data for the chart based on timeframe
 */
export const formatRelapseDataForChart = async (timeFrame) => {
  try {
    let relapses = [];
    
    if (timeFrame === 'today') {
      relapses = await getTodayRelapses();
      
      // Group by parts of day
      const morning = relapses.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 5 && hour < 12;
      }).length;
      
      const afternoon = relapses.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 12 && hour < 17;
      }).length;
      
      const evening = relapses.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 17 && hour < 21;
      }).length;
      
      const night = relapses.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 21 || hour < 5;
      }).length;
      
      return [
        { label: 'Morning', count: morning },
        { label: 'Noon', count: afternoon },
        { label: 'Evening', count: evening },
        { label: 'Night', count: night }
      ];
      
    } else if (timeFrame === 'week') {
      relapses = await getWeekRelapses();
      
      // Create array for days of week
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayData = days.map(day => ({ label: day, count: 0 }));
      
      // Count relapses by day of week
      relapses.forEach(relapse => {
        const date = new Date(relapse.timestamp);
        const dayIndex = date.getDay() || 7; // Convert Sunday (0) to 7
        dayData[dayIndex - 1].count++; // -1 because array is 0-indexed
      });
      
      return dayData;
      
    } else { // month
      relapses = await getMonthRelapses();
      
      // Group by week of month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      // Create week ranges
      const weekData = [
        { label: 'Week 1', count: 0 },
        { label: 'Week 2', count: 0 },
        { label: 'Week 3', count: 0 },
        { label: 'Week 4', count: 0 }
      ];
      
      // Count relapses by week
      relapses.forEach(relapse => {
        const date = new Date(relapse.timestamp);
        const day = date.getDate();
        
        if (day <= 7) {
          weekData[0].count++;
        } else if (day <= 14) {
          weekData[1].count++;
        } else if (day <= 21) {
          weekData[2].count++;
        } else {
          weekData[3].count++;
        }
      });
      
      return weekData;
    }
  } catch (error) {
    console.error('Error formatting relapse data:', error);
    return [];
  }
}; 