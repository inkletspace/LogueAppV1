import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CreateScreen from '../screens/CreateScreen';
import FriendsScreen from '../screens/FriendsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import IdeaDetailScreen from '../screens/IdeaDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Enhanced Custom Tab Bar Button
const CustomTabBarButton = ({ children, onPress, navigation }) => {
  const { colors } = useTheme();
  const lastTap = useRef(0);
  const doubleTapTimeout = useRef(null);
  
  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      // Double tap detected - quick text note
      clearTimeout(doubleTapTimeout.current);
      navigation.navigate('Create', { quickCapture: true, captureType: 'text' });
    } else {
      // Single tap - wait to see if it becomes a double tap
      lastTap.current = now;
      doubleTapTimeout.current = setTimeout(() => {
        // Navigate to normal create screen
        onPress();
      }, DOUBLE_PRESS_DELAY);
    }
  };
  
  const handleLongPress = () => {
    // Clear any pending single tap
    clearTimeout(doubleTapTimeout.current);
    // Long press - quick voice recording
    navigation.navigate('Create', { quickCapture: true, captureType: 'voice' });
  };
  
  return (
    <TouchableOpacity
      style={styles.customButtonContainer}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#A855F7', '#EC4899', '#F97316']}
        style={styles.customButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.customButtonContent}>
          {children}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Custom Tab Bar Icon with Rounded Background
const CustomTabBarIcon = ({ focused, name, size = 24 }) => {
  if (focused) {
    return (
      <View style={styles.activeTabContainer}>
        <LinearGradient
          colors={['#F3E8FF', '#E0E7FF']}
          style={styles.activeTabBackground}
        >
          <Ionicons name={name} size={size} color="#A855F7" />
        </LinearGradient>
      </View>
    );
  }
  
  return <Ionicons name={name} size={size} color="#9CA3AF" />;
};

// Main tab navigator
const TabNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: '#E0E7FF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon focused={focused} name="home" />
          ),
        }}
      />
      
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon focused={focused} name="compass" />
          ),
        }}
      />
      
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add" size={32} color="white" />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} navigation={props.navigation} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon focused={focused} name="people" />
          ),
        }}
      />
      
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon focused={focused} name="calendar" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root stack navigator
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="IdeaDetail" component={IdeaDetailScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  customButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  customButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;