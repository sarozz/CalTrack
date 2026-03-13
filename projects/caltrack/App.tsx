import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen, type HomeStackParamList } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LegalScreen } from './src/screens/LegalScreen';
import { LogScreen } from './src/screens/LogScreen';
import { BarcodeScanScreen } from './src/screens/BarcodeScanScreen';
import { EditEntryScreen } from './src/screens/EditEntryScreen';
import { HistoryScreen, type HistoryStackParamList } from './src/screens/HistoryScreen';
import { DayDetailScreen } from './src/screens/DayDetailScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const LogStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'CalTrack' }} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <HomeStack.Screen name="Legal" component={LegalScreen} options={{ title: 'Legal' }} />
      <HomeStack.Screen name="EditEntry" component={EditEntryScreen} options={{ title: 'Edit entry' }} />
    </HomeStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <HistoryStack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Weekly Insights' }} />
      <HistoryStack.Screen name="DayDetail" component={DayDetailScreen} options={{ title: 'Day' }} />
      <HistoryStack.Screen name="EditEntry" component={EditEntryScreen} options={{ title: 'Edit entry' }} />
    </HistoryStack.Navigator>
  );
}

function LogStackNavigator() {
  return (
    <LogStack.Navigator>
      <LogStack.Screen name="Log" component={LogScreen} options={{ title: 'Log' }} />
      <LogStack.Screen name="BarcodeScan" component={BarcodeScanScreen} options={{ title: 'Scan barcode' }} />
    </LogStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: '#f6f6f6' },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: 'rgba(236, 72, 153, 0.9)',
          tabBarInactiveTintColor: 'rgba(17,17,17,0.55)',
          tabBarIcon: ({ color, size }) => {
            const name =
              route.name === 'HomeTab'
                ? 'home'
                : route.name === 'LogTab'
                  ? 'add-circle'
                  : 'time';
            return <Ionicons name={name as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            title: 'Home',
          }}
        />
        <Tab.Screen
          name="LogTab"
          component={LogStackNavigator}
          options={{
            title: 'Log',
          }}
        />
        <Tab.Screen
          name="HistoryTab"
          component={HistoryStackNavigator}
          options={{
            title: 'History',
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
