import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
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
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Usuário autenticado
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          
          // Salvar dados do usuário localmente
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
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
    });

    return unsubscribe;
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
      await auth().signInWithEmailAndPassword(email, password);
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
      
      const { user } = await auth().createUserWithEmailAndPassword(email, password);
      
      // Atualizar perfil com nome de exibição
      if (displayName) {
        await user.updateProfile({ displayName });
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
      await auth().signOut();
      await AsyncStorage.removeItem('user');
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
        updateBiometricPreference,
        authenticateWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);