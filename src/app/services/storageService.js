import { getStorage } from './firebase';
import storage from '@react-native-firebase/storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Serviço para gerenciar arquivos no Firebase Storage
 */
export const StorageService = {
  /**
   * Fazer upload de uma imagem para o Firebase Storage
   * @param {string} uri - URI local da imagem
   * @param {string} path - Caminho no Storage onde a imagem será salva
   * @param {function} onProgress - Callback para progresso do upload
   */
  uploadImage: async (uri, path, onProgress = null) => {
    try {
      // Referência para o arquivo no Storage
      const storageRef = storage().ref(path);
      
      // Preparar URI para upload
      const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      
      // Iniciar upload
      const task = storageRef.putFile(fileUri);
      
      // Monitorar progresso se callback fornecido
      if (onProgress) {
        task.on('state_changed', snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }
      
      // Aguardar conclusão do upload
      await task;
      
      // Obter URL de download
      const downloadUrl = await storageRef.getDownloadURL();
      
      return { success: true, url: downloadUrl };
    } catch (error) {
      console.error('Erro ao fazer upload de imagem:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Fazer download de uma imagem do Firebase Storage
   * @param {string} url - URL da imagem no Storage
   * @param {string} localPath - Caminho local onde a imagem será salva
   * @param {function} onProgress - Callback para progresso do download
   */
  downloadImage: async (url, localPath, onProgress = null) => {
    try {
      // Verificar se o arquivo já existe localmente
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        return { success: true, uri: localPath };
      }
      
      // Fazer download do arquivo
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        (downloadProgress) => {
          if (onProgress) {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite * 100;
            onProgress(progress);
          }
        }
      );
      
      const result = await downloadResumable.downloadAsync();
      
      return { success: true, uri: result.uri };
    } catch (error) {
      console.error('Erro ao fazer download de imagem:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Excluir um arquivo do Firebase Storage
   * @param {string} path - Caminho do arquivo no Storage
   */
  deleteFile: async (path) => {
    try {
      // Referência para o arquivo no Storage
      const storageRef = storage().ref(path);
      
      // Excluir arquivo
      await storageRef.delete();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Obter URL de download de um arquivo no Firebase Storage
   * @param {string} path - Caminho do arquivo no Storage
   */
  getDownloadURL: async (path) => {
    try {
      // Referência para o arquivo no Storage
      const storageRef = storage().ref(path);
      
      // Obter URL de download
      const url = await storageRef.getDownloadURL();
      
      return { success: true, url };
    } catch (error) {
      console.error('Erro ao obter URL de download:', error);
      return { success: false, error };
    }
  }
};