import { Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBCVMGOUMX_XYZ123456789ABCDEFGHIJK",
  authDomain: "smartlist-app.firebaseapp.com",
  projectId: "smartlist-app",
  storageBucket: "smartlist-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: "G-ABCDEFGHIJ"
};

/**
 * Inicializa o Firebase se ainda não estiver inicializado
 */
export const initializeFirebase = async () => {
  try {
    if (!firebase.apps.length) {
      await firebase.initializeApp(firebaseConfig);
      console.log('Firebase inicializado com sucesso');
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    return { success: false, error };
  }
};

/**
 * Verifica se o dispositivo está conectado ao Firebase
 */
export const checkFirebaseConnection = async () => {
  try {
    // Verificar conexão com o Firestore
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const firestoreCheck = firebase.firestore().collection('_connection_test_').doc('test').get();
    
    await Promise.race([firestoreCheck, timeout]);
    
    return { connected: true };
  } catch (error) {
    console.warn('Dispositivo offline ou erro de conexão com Firebase:', error);
    return { connected: false, error };
  }
};

/**
 * Obtém a instância do serviço de autenticação do Firebase
 */
export const getAuth = () => {
  return auth();
};

/**
 * Obtém a instância do Firestore
 */
export const getFirestore = () => {
  return firestore();
};

/**
 * Obtém a instância do Storage
 */
export const getStorage = () => {
  return storage();
};

/**
 * Sincroniza dados locais com o Firestore
 * @param {string} collection - Nome da coleção
 * @param {Array} localData - Dados locais a serem sincronizados
 */
export const syncDataWithFirestore = async (collection, localData) => {
  try {
    const db = getFirestore();
    const batch = db.batch();
    const collectionRef = db.collection(collection);
    
    // Processar itens para sincronização
    for (const item of localData) {
      if (item.is_deleted) {
        // Remover item do Firestore
        const docRef = collectionRef.doc(item.id);
        batch.delete(docRef);
      } else if (!item.is_synced) {
        // Adicionar ou atualizar item no Firestore
        const docRef = collectionRef.doc(item.id);
        const itemData = { ...item };
        delete itemData.is_synced;
        delete itemData.is_deleted;
        batch.set(docRef, itemData, { merge: true });
      }
    }
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`Erro ao sincronizar ${collection} com Firestore:`, error);
    return { success: false, error };
  }
};