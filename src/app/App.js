import React, { useState, useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removida importação do Supabase

// Navegação
import MainNavigator from './navigation/MainNavigator';

// Contextos
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { ListsProvider } from './contexts/ListsContext';
import { StoresProvider } from './contexts/StoresContext';
import { SyncProvider } from './contexts/SyncContext';

// Serviços
import { initializeFirebase } from './services/firebase';
import { initializeDatabase } from './services/database';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Inicialização do aplicativo
  useEffect(() => {
    const prepare = async () => {
      try {
        // Inicializar Firebase
        await initializeFirebase();
        
        // Inicializar banco de dados local
        await initializeDatabase();
        
        // Supabase foi removido, usando apenas Firebase
        
        // Carregar preferências do usuário
        const themePreference = await AsyncStorage.getItem('theme');
        if (themePreference) {
          setIsDarkMode(themePreference === 'dark');
        }
        
        // Simular tempo de carregamento para mostrar splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('Erro na inicialização:', e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  // Tema personalizado
  const theme = isDarkMode ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#4CAF50',
      accent: '#8BC34A',
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#4CAF50',
      accent: '#8BC34A',
    },
  };

  if (!isReady) {
    // Aqui poderia retornar um componente de splash screen
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <ThemeProvider initialTheme={isDarkMode ? 'dark' : 'light'}>
          <AuthProvider>
            <SyncProvider>
              <ProductsProvider>
                <StoresProvider>
                  <ListsProvider>
                    <NavigationContainer theme={theme}>
                      <MainNavigator />
                      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                    </NavigationContainer>
                  </ListsProvider>
                </StoresProvider>
              </ProductsProvider>
            </SyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}