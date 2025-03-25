import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getFirestore } from './firebase';

/**
 * Serviço para gerenciar autenticação de usuários com Firebase
 */
export const FirebaseAuthService = {
  /**
   * Login com Google
   */
  loginWithGoogle: async () => {
    try {
      // Configurar GoogleSignin
      GoogleSignin.configure({
        webClientId: '352783072850-rvvv9i7kk7qc6dej1u8m4aatn0vhfnl4.apps.googleusercontent.com', // Obtido do console do Firebase
      });
      
      // Fazer login com Google
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      
      // Criar credencial para o Firebase
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Fazer login no Firebase com a credencial
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      // Verificar se o usuário já existe no Firestore
      const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) {
        // Criar documento do usuário no Firestore
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastLogin: firestore.FieldValue.serverTimestamp(),
          preferences: {}
        });
      } else {
        // Atualizar último login
        await firestore().collection('users').doc(userCredential.user.uid).update({
          lastLogin: firestore.FieldValue.serverTimestamp()
        });
      }
      
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
      console.error('Erro ao fazer login com Google:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Login com Facebook
   */
  loginWithFacebook: async () => {
    try {
      // Fazer login com Facebook
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        throw new Error('Usuário cancelou o login');
      }
      
      // Obter token de acesso
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        throw new Error('Falha ao obter token de acesso');
      }
      
      // Criar credencial para o Firebase
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
      
      // Fazer login no Firebase com a credencial
      const userCredential = await auth().signInWithCredential(facebookCredential);
      
      // Verificar se o usuário já existe no Firestore
      const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) {
        // Criar documento do usuário no Firestore
        await firestore().collection('users').doc(userCredential.user.uid).set({
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastLogin: firestore.FieldValue.serverTimestamp(),
          preferences: {}
        });
      } else {
        // Atualizar último login
        await firestore().collection('users').doc(userCredential.user.uid).update({
          lastLogin: firestore.FieldValue.serverTimestamp()
        });
      }
      
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
   * Obter usuário atual
   */
  getCurrentUser: async () => {
    try {
      const currentUser = auth().currentUser;
      
      if (currentUser) {
        return {
          success: true,
          user: {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || ''
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
      const currentUser = auth().currentUser;
      return { success: true, isAuthenticated: !!currentUser };
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { success: false, isAuthenticated: false, error };
    }
  }
};