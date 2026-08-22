import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';
import { AuthProvider, useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import OrderScreen from '../screens/OrderScreen';
import FAQScreen from '../screens/FAQScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackOpts = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '800' },
  headerShadowVisible: false,
};

// Stack auth: Login ↔ Register
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...stackOpts, headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="KatalogList" component={CatalogScreen} options={{ title: 'Katalog' }} />
      <Stack.Screen name="Pesan" component={OrderScreen} options={{ title: 'Form Pesanan' }} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="Beranda" component={HomeScreen} options={{ title: 'TITIP.JP' }} />
      <Stack.Screen name="Katalog" component={CatalogScreen} options={{ title: 'Katalog' }} />
      <Stack.Screen name="Pesan" component={OrderScreen} options={{ title: 'Form Pesanan' }} />
      <Stack.Screen name="Kalkulator" component={CalculatorScreen} options={{ title: 'Kalkulator' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Katalog: focused ? 'grid' : 'grid-outline',
            Kalkulator: focused ? 'calculator' : 'calculator-outline',
            Pesan: focused ? 'create' : 'create-outline',
            FAQ: focused ? 'help-circle' : 'help-circle-outline',
            Profil: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false, title: 'Beranda' }} />
      <Tab.Screen name="Katalog" component={CatalogStack} options={{ headerShown: false }} />
      <Tab.Screen name="Kalkulator" component={CalculatorScreen} options={{ title: 'Kalkulator' }} />
      <Tab.Screen name="Pesan" component={OrderScreen} options={{ title: 'Form Pesanan' }} />
      <Tab.Screen name="FAQ" component={FAQScreen} options={{ title: 'FAQ' }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

// Root: tampilkan AuthStack jika belum login, MainTabs jika sudah
function RootNavigator() {
  const { user } = useAuth();
  return user ? <MainTabs /> : <AuthStack />;
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
