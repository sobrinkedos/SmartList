import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '../services/async-storage-mock';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children, initialTheme = 'light' }) => {
  const [theme, setTheme] = useState(initialTheme);
  const [loading, setLoading] = useState(true);

  // Carregar tema salvo
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedTheme();
  }, []);

  // Alternar entre temas claro e escuro
  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      await AsyncStorage.setItem('theme', newTheme);
      setTheme(newTheme);
      return { success: true };
    } catch (error) {
      console.error('Erro ao alternar tema:', error);
      return { success: false, error };
    }
  };

  // Definir tema específico
  const setThemeMode = async (mode) => {
    try {
      if (mode !== 'light' && mode !== 'dark') {
        throw new Error('Tema inválido. Use "light" ou "dark"');
      }
      
      await AsyncStorage.setItem('theme', mode);
      setTheme(mode);
      return { success: true };
    } catch (error) {
      console.error('Erro ao definir tema:', error);
      return { success: false, error };
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === 'dark',
        loading,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);