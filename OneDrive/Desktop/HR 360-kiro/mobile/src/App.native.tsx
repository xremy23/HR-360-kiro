/**
 * Main App Component
 * Sets up navigation and Redux store
 * Initializes network monitoring and offline sync
 */

import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from './styles/designSystem';
import store, { RootState } from './store';
import DeviceRedirect from './DeviceRedirect';
import networkStatusService from './services/networkStatusService';
import enhancedSyncService from './services/enhancedSyncService';

// Screens
import HomeScreen from './screens/HomeScreen';
import CheckInScreen from './screens/CheckInScreen';
import KnowledgeBaseScreen from './screens/KnowledgeBaseScreen';
import ContactsScreen from './screens/ContactsScreen';
import ToBagScreen from './screens/ToBagScreen';
import AlertsScreen from './screens/AlertsScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Home Stack Navigator
 */
const HomeStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.primary.white },
    }}
  >
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen
      name="CheckIn"
      component={CheckInScreen}
      options={{
        headerShown: true,
        headerTitle: 'Check-In',
        headerBackTitle: 'Back',
        headerTintColor: colors.primary.teal,
      }}
    />
  </Stack.Navigator>
);

/**
 * Knowledge Base Stack Navigator
 */
const KBStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.primary.white },
    }}
  >
    <Stack.Screen name="KBMain" component={KnowledgeBaseScreen} />
  </Stack.Navigator>
);

/**
 * Contacts Stack Navigator
 */
const ContactsStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.primary.white },
    }}
  >
    <Stack.Screen name="ContactsMain" component={ContactsScreen} />
  </Stack.Navigator>
);

/**
 * To-Go Bag Stack Navigator
 */
const ToBagStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.primary.white },
    }}
  >
    <Stack.Screen name="ToBagMain" component={ToBagScreen} />
  </Stack.Navigator>
);

/**
 * Alerts Stack Navigator
 */
const AlertsStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.primary.white },
    }}
  >
    <Stack.Screen name="AlertsMain" component={AlertsScreen} />
  </Stack.Navigator>
);

/**
 * Settings Stack Navigator
 */
const SettingsStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.primary.white },
    }}
  >
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
  </Stack.Navigator>
);

/**
 * Bottom Tab Navigator
 */
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary.teal,
      tabBarInactiveTintColor: colors.neutral[400],
      tabBarStyle: {
        backgroundColor: colors.primary.white,
        borderTopColor: colors.neutral[200],
        borderTopWidth: 1,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStackNavigator}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
      }}
    />
    <Tab.Screen
      name="KnowledgeBase"
      component={KBStackNavigator}
      options={{
        tabBarLabel: 'Guides',
        tabBarIcon: ({ color }) => <TabIcon icon="📚" color={color} />,
      }}
    />
    <Tab.Screen
      name="Contacts"
      component={ContactsStackNavigator}
      options={{
        tabBarLabel: 'Contacts',
        tabBarIcon: ({ color }) => <TabIcon icon="📞" color={color} />,
      }}
    />
    <Tab.Screen
      name="ToBag"
      component={ToBagStackNavigator}
      options={{
        tabBarLabel: 'To-Go Bag',
        tabBarIcon: ({ color }) => <TabIcon icon="🎒" color={color} />,
      }}
    />
    <Tab.Screen
      name="Alerts"
      component={AlertsStackNavigator}
      options={{
        tabBarLabel: 'Alerts',
        tabBarIcon: ({ color }) => <TabIcon icon="🔔" color={color} />,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsStackNavigator}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
      }}
    />
  </Tab.Navigator>
);

/**
 * Tab Icon Component
 */
interface TabIconProps {
  icon: string;
  color: string;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, color }) => (
  <Text style={{ fontSize: 24, color }}>
    {icon}
  </Text>
);

/**
 * Root Navigator with Initialization
 */
const RootNavigator = () => {
  useEffect(() => {
    // Initialize network monitoring, sync service, and WebSocket
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing app services...');
        
        // Initialize sync service with store
        enhancedSyncService.initialize(store);
        
        // Initialize network status monitoring
        await networkStatusService.initialize(store);
        
        // Start periodic sync
        enhancedSyncService.startPeriodicSync();
        
        // Initialize WebSocket for real-time updates
        const state = store.getState();
        if (state.auth?.token) {
          // Import here to avoid circular dependencies
          const websocketService = require('./services/websocketService').default;
          await websocketService.connect();
          websocketService.subscribeToAlerts();
          websocketService.subscribeToIncidents();
          websocketService.subscribeToCheckIns();
          console.log('[App] WebSocket initialized for real-time updates');
        }
        
        console.log('[App] App services initialized successfully');
      } catch (error) {
        console.error('[App] Error initializing app services:', error);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      networkStatusService.stopMonitoring();
      enhancedSyncService.stopPeriodicSync();
      
      // Disconnect WebSocket
      const websocketService = require('./services/websocketService').default;
      websocketService.disconnect();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.primary.white },
        }}
      >
        <Stack.Screen name="MainApp" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/**
 * Main App Component
 */
export default function App() {
  return (
    <DeviceRedirect>
      <Provider store={store}>
        <RootNavigator />
      </Provider>
    </DeviceRedirect>
  );
}
