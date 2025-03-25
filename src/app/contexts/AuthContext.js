import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '../services/firebase';
import { FirebaseAuthService } from '../services/firebaseAuthService';
import * as LocalAuthentication from 'expo-local-authentication';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);

  // Verificar suporte a biometria
  useEffect(() => {
    const checkBiometricSupport = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBiometricSupported(compatible);
      
      if (compatible) {
        const savedPreference = await AsyncStorage.getItem('useBiometric');
        setUseBiometric(savedPreference === 'true');
      }
    };
    
    checkBiometricSupport();
  }, []);

  // Monitorar estado de autenticação do Firebase
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        setLoading(true);
        
        // Verificar se há uma sessão ativa no Firebase
        const { success, isAuthenticated } = await FirebaseAuthService.isAuthenticated();
        
        if (success && isAuthenticated) {
          // Obter dados do usuário atual
          const { success, user: userData } = await FirebaseAuthService.getCurrentUser();
          
          if (success && userData) {
            // Salvar dados do usuário localmente
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
          }
        } else {
          // Verificar se há dados salvos localmente
          const savedUser = await AsyncStorage.getItem('user');
          if (savedUser && useBiometric) {
            // Se o usuário optou por usar biometria, verificar antes de restaurar a sessão
            const biometricAuth = await authenticateWithBiometrics();
            if (biometricAuth.success) {
              setUser(JSON.parse(savedUser));
            } else {
              setUser(null);
              await AsyncStorage.removeItem('user');
            }
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Erro ao processar autenticação:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuthState();
    
    // Configurar listener para mudanças de autenticação
    const unsubscribe = getAuth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const { success, user: userData } = await FirebaseAuthService.getCurrentUser();
        if (success && userData) {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [useBiometric]);

  // Autenticação com biometria
  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar o SmartList',
        fallbackLabel: 'Use sua senha',
      });
      
      return { success: result.success };
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      return { success: false, error };
    }
  };

  // Login com email e senha
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const result = await FirebaseAuthService.loginUser(email, password);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao fazer login');
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Cadastro com email e senha
  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await FirebaseAuthService.registerUser(email, password, displayName);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao criar conta');
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    try {
      setLoading(true);
      const result = await FirebaseAuthService.logoutUser();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao fazer logout');
      }
      
      setUser(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Atualizar configuração de biometria
  const updateBiometricPreference = async (useIt) => {
    try {
      await AsyncStorage.setItem('useBiometric', useIt ? 'true' : 'false');
      setUseBiometric(useIt);
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar preferência biométrica:', err);
      return { success: false, error: err.message };
    }
  };

  // Recuperação de senha
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await FirebaseAuthService.resetPassword(email);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao enviar email de recuperação');
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        biometricSupported,
        useBiometric,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateBiometricPreference,
        authenticateWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);