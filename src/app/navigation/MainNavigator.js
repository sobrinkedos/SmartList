import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Telas
import HomeScreen from '../screens/HomeScreen';
import ListsScreen from '../screens/ListsScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import ShoppingModeScreen from '../screens/ShoppingModeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import PriceAnalysisScreen from '../screens/PriceAnalysisScreen';
import BudgetScreen from '../screens/BudgetScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Componentes
import DrawerContent from '../components/DrawerContent';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Navegador de autenticação
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Navegador de listas
const ListsNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Lists" component={ListsScreen} options={{ title: 'Minhas Listas' }} />
    <Stack.Screen name="ListDetail" component={ListDetailScreen} options={({ route }) => ({ title: route.params?.listName || 'Detalhes da Lista' })} />
    <Stack.Screen name="ShoppingMode" component={ShoppingModeScreen} options={{ title: 'Modo Compra' }} />
  </Stack.Navigator>
);

// Navegador de produtos
const ProductsNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Produtos' }} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={({ route }) => ({ title: route.params?.productName || 'Detalhes do Produto' })} />
  </Stack.Navigator>
);

// Navegador de análise
const AnalysisNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="PriceAnalysis" component={PriceAnalysisScreen} options={{ title: 'Análise de Preços' }} />
    <Stack.Screen name="Budget" component={BudgetScreen} options={{ title: 'Orçamento' }} />
  </Stack.Navigator>
);

// Navegador de abas principal
const TabNavigator = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'HomeTab') {
            iconName = 'home';
          } else if (route.name === 'ListsTab') {
            iconName = 'format-list-bulleted';
          } else if (route.name === 'ProductsTab') {
            iconName = 'barcode-scan';
          } else if (route.name === 'AnalysisTab') {
            iconName = 'chart-line';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          title: 'Início',
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="ListsTab" 
        component={ListsNavigator} 
        options={{ 
          title: 'Listas',
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="ProductsTab" 
        component={ProductsNavigator} 
        options={{ 
          title: 'Produtos',
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="AnalysisTab" 
        component={AnalysisNavigator} 
        options={{ 
          title: 'Análise',
          headerShown: false 
        }} 
      />
    </Tab.Navigator>
  );
};

// Navegador principal com drawer
const MainDrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={props => <DrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Drawer.Screen name="Main" component={TabNavigator} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
    <Drawer.Screen name="Profile" component={ProfileScreen} />
  </Drawer.Navigator>
);

// Navegador raiz
const RootNavigator = () => {
  // Aqui seria implementada a lógica para verificar se o usuário está autenticado
  // e se já passou pelo onboarding
  const isAuthenticated = false; // Exemplo: substituir por lógica real
  const hasCompletedOnboarding = false; // Exemplo: substituir por lógica real
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Root" component={MainDrawerNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;