import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getFirestore } from './firebase';

/**
 * Serviço para gerenciar autenticação de usuários
 */
export const AuthService = {
  /**
   * Registrar novo usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @param {string} name - Nome do usuário
   */
  registerUser: async (email, password, name) => {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Atualizar perfil do usuário
      await userCredential.user.updateProfile({
        displayName: name
      });
      
      // Criar documento do usuário no Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email,
        displayName: name,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastLogin: firestore.FieldValue.serverTimestamp(),
        preferences: {}
      });
      
      return { success: true, user: userCredential.user };
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
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      
      // Atualizar último login no Firestore
      await firestore().collection('users').doc(userCredential.user.uid).update({
        lastLogin: firestore.FieldValue.serverTimestamp()
      });
      
      // Salvar dados do usuário localmente
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userCredential.user };
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
      await auth().signOut();
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
      await auth().sendPasswordResetEmail(email);
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
      const currentUser = auth().currentUser;
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }
      
      // Atualizar perfil no Firebase Auth
      const updateData = {};
      if (userData.displayName) updateData.displayName = userData.displayName;
      if (userData.photoURL) updateData.photoURL = userData.photoURL;
      
      await currentUser.updateProfile(updateData);
      
      // Atualizar dados no Firestore
      const firestoreData = { ...userData };
      delete firestoreData.password; // Remover senha se existir
      
      await firestore().collection('users').doc(currentUser.uid).update({
        ...firestoreData,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      
      // Atualizar dados locais
      const savedUserData = await AsyncStorage.getItem('user');
      if (savedUserData) {
        const parsedUserData = JSON.parse(savedUserData);
        const updatedUserData = { ...parsedUserData, ...updateData };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated: async () => {
    try {
      const currentUser = auth().currentUser;
      return { authenticated: !!currentUser, user: currentUser };
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { authenticated: false, error };
    }
  }
};