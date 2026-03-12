import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { HomeScreen, type HomeStackParamList } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LogScreen } from './src/screens/LogScreen';
import { HistoryScreen, type HistoryStackParamList } from './src/screens/HistoryScreen';
import { DayDetailScreen } from './src/screens/DayDetailScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'CalTrack' }} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </HomeStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <HistoryStack.Screen name="DayDetail" component={DayDetailScreen} options={{ title: 'Day' }} />
    </HistoryStack.Navigator>
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
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0a66ff',
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            title: 'Home',
          }}
        />
        <Tab.Screen
          name="Log"
          component={LogScreen}
          options={{
            title: '+',
            headerShown: true,
            headerTitle: 'Log',
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
