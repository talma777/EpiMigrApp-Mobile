import React, { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, ActivityIndicator } from 'react-native';

// Context & API
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { api } from './src/services/api';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import EpisodeScreen from './src/screens/EpisodeScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LegalConsentScreen from './src/screens/LegalConsentScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SOSScreen from './src/screens/SOSScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const linking = {
  prefixes: ['https://epi-client-v1100.onrender.com', 'epimigrapp://'],
  config: {
    screens: {
      Welcome: 'bienvenida',
      Login: 'login',
      Register: 'registro',
      Main: {
        path: '',
        screens: {
          Home: 'inicio',
          History: 'diario',
          Insights: 'analisis',
        },
      },
      Profile: 'perfil',
      SOS: 'sos',
      Episode: 'evento',
    },
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused }) => {
          const iconMap: Record<string, string> = {
            Home: focused ? '🏠' : '🏠',
            History: focused ? '📅' : '📅',
            Insights: focused ? '📊' : '📊',
          };
          return (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
              {iconMap[route.name] || '•'}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Diario' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: 'Análisis' }} />
    </Tab.Navigator>
  );
}

function MainNavigation() {
  const { state, signOut } = useContext(AuthContext);
  const [checking, setChecking] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (state.userToken && state.userId) {
      setChecking(true);
      Promise.all([
        api.get(`/legal/status/${state.userId}`),
        api.get(`/clinical/profile/${state.userId}`)
      ]).then(([legalRes, clinicalRes]) => {
        if (!isMounted) return;
        setNeedsConsent(legalRes && !legalRes.valid);
        setNeedsProfile(clinicalRes && !clinicalRes.exists);
      }).catch(err => {
        console.error("Critical Flow Check Error:", err);
        if (isMounted) {
          setNeedsConsent(false);
          setNeedsProfile(true);
        }
      }).finally(() => {
        if (isMounted) setChecking(false);
      });
    }
    return () => { isMounted = false; };
  }, [state.userToken, state.userId]);

  const handleConsentAccepted = () => {
    setNeedsConsent(false);
  };

  // This works.

  if (state.isLoading || (state.userToken && checking)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 24, fontSize: 13, fontWeight: '800', color: '#94A3B8', letterSpacing: 2 }}>
          {state.isLoading ? 'INICIALIZANDO...' : 'SINCRONIZANDO EXPEDIENTE...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {state.userToken == null ? (
        <AuthStack.Navigator id="AuthStack" screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      ) : needsConsent ? (
        <LegalConsentScreen
          userId={state.userId!}
          onConsent={handleConsentAccepted}
          onLogout={signOut}
        />
      ) : needsProfile ? (
        <ProfileSetupScreen onComplete={() => setNeedsProfile(false)} />
      ) : (
        <Stack.Navigator id="AppStack" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Episode"
            component={EpisodeScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="SOS" component={SOSScreen} options={{ presentation: 'modal', gestureEnabled: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}