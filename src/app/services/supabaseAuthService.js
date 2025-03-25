import { getAuth } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Serviço para gerenciar autenticação de usuários com Supabase
 */
export const SupabaseAuthService = {
  /**
   * Login com Google
   */
  loginWithGoogle: async () => {
    try {
      const { data, error } = await getAuth().signInWithOAuth({
        provider: 'google',
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Login com Facebook
   */
  loginWithFacebook: async () => {
    try {
      const { data, error } = await getAuth().signInWithOAuth({
        provider: 'facebook',
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao fazer login com Facebook:', error);
      return { success: false, error };
    }
  },
  /**
   * Registrar novo usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @param {string} name - Nome do usuário
   */
  registerUser: async (email, password, name) => {
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await getAuth().signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          }
        }
      });
      
      if (authError) throw authError;
      
      return { success: true, user: authData.user };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Login de usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   */
  loginUser: async (email, password) => {
    try {
      const { data, error } = await getAuth().signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Salvar dados do usuário localmente
      const userData = {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name || '',
        photoURL: data.user.user_metadata?.avatar_url || ''
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Logout de usuário
   */
  logoutUser: async () => {
    try {
      const { error } = await getAuth().signOut();
      
      if (error) throw error;
      
      // Remover dados do usuário do armazenamento local
      await AsyncStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Recuperar senha
   * @param {string} email - Email do usuário
   */
  resetPassword: async (email) => {
    try {
      const { error } = await getAuth().resetPasswordForEmail(email);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar email de recuperação de senha:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Atualizar perfil do usuário
   * @param {object} userData - Dados do usuário para atualizar
   */
  updateUserProfile: async (userData) => {
    try {
      const { error } = await getAuth().updateUser({
        data: {
          display_name: userData.displayName,
          avatar_url: userData.photoURL
        }
      });
      
      if (error) throw error;
      
      // Atualizar dados do usuário no armazenamento local
      const currentUser = await AsyncStorage.getItem('user');
      if (currentUser) {
        const parsedUser = JSON.parse(currentUser);
        const updatedUser = { ...parsedUser, ...userData };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Obter usuário atual
   */
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await getAuth().getUser();
      
      if (error) throw error;
      
      if (user) {
        return {
          success: true,
          user: {
            uid: user.id,
            email: user.email,
            displayName: user.user_metadata?.display_name || '',
            photoURL: user.user_metadata?.avatar_url || ''
          }
        };
      }
      
      return { success: false, user: null };
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated: async () => {
    try {
      const { data: { session }, error } = await getAuth().getSession();
      
      if (error) throw error;
      
      return { success: true, isAuthenticated: !!session };
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { success: false, isAuthenticated: false, error };
    }
  }
};