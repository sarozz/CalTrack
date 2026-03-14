import React from 'react';
import { Appearance } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen, type HomeStackParamList } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LegalScreen } from './src/screens/LegalScreen';
import { LogScreen } from './src/screens/LogScreen';
import { BarcodeScanScreen } from './src/screens/BarcodeScanScreen';
import { EditEntryScreen } from './src/screens/EditEntryScreen';
import { HistoryScreen, type HistoryStackParamList } from './src/screens/HistoryScreen';
import { DayDetailScreen } from './src/screens/DayDetailScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { loadSettings } from './src/storage/store';
import { makeNavTheme } from './src/styles/navTheme';
import { ThemeCtx, colorsForScheme, type Scheme } from './src/styles/appTheme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
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
      <HistoryStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
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

function MainTabs() {
  const themeCtx = React.useContext(require('./src/styles/appTheme').ThemeCtx) as any;
  const scheme = (themeCtx?.scheme as 'light' | 'dark') || 'light';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: scheme === 'dark' ? '#111827' : '#ffffff',
          borderTopColor: scheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
        },
        tabBarActiveTintColor: scheme === 'dark' ? 'rgba(236, 72, 153, 0.95)' : 'rgba(236, 72, 153, 0.9)',
        tabBarInactiveTintColor: scheme === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,17,0.55)',
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'HomeTab'
              ? 'home'
              : route.name === 'LogTab'
                ? 'add-circle'
                : 'person-circle';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="LogTab" component={LogStackNavigator} options={{ title: 'Log' }} />
      <Tab.Screen name="HistoryTab" component={HistoryStackNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [boot, setBoot] = React.useState<'loading' | 'onboarding' | 'ready'>('loading');
  const [scheme, setScheme] = React.useState<Scheme>('dark');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const start = Date.now();
      const s = await loadSettings();
      const elapsed = Date.now() - start;

      // Make the loading screen visible (otherwise it flashes too fast to notice).
      const minMs = 1500;
      if (elapsed < minMs) {
        await new Promise((r) => setTimeout(r, minMs - elapsed));
      }

      if (!alive) return;
      const needs = !s.onboardingDone || !s.name || !s.gender || !s.age;

      const mode = s.themeMode || 'auto';
      if (mode === 'light' || mode === 'dark') {
        setScheme(mode);
      } else {
        const sys = Appearance.getColorScheme();
        if (sys === 'dark' || sys === 'light') {
          setScheme(sys);
        } else {
          const h = new Date().getHours();
          setScheme(h >= 19 || h < 7 ? 'dark' : 'light');
        }
      }

      setBoot(needs ? 'onboarding' : 'ready');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const colors = colorsForScheme(scheme);

  return (
    <ThemeCtx.Provider value={{ scheme, setScheme, colors }}>
      <NavigationContainer theme={makeNavTheme(scheme)}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {boot === 'loading' ? <RootStack.Screen name="Loading" component={LoadingScreen} /> : null}
          {boot === 'onboarding' ? (
            <RootStack.Screen name="Onboarding">
              {() => <OnboardingScreen onFinished={() => setBoot('ready')} />}
            </RootStack.Screen>
          ) : null}
          {boot === 'ready' ? <RootStack.Screen name="Main" component={MainTabs} /> : null}
        </RootStack.Navigator>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </ThemeCtx.Provider>
  );
}
