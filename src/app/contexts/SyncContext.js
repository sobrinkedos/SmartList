import React, { createContext, useState, useEffect, useContext } from 'react';
import { SyncService } from '../services/syncService';
import { useAuth } from './AuthContext';
import NetInfo from '@react-native-community/netinfo';

const SyncContext = createContext({});

export const SyncProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'offline'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Monitorar status da conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      
      // Se voltou a ficar online, tentar sincronizar
      if (state.isConnected && syncStatus === 'offline' && isAuthenticated) {
        syncData();
      }
    });
    
    return () => unsubscribe();
  }, [syncStatus, isAuthenticated]);

  // Sincronizar dados quando o usuário fizer login
  useEffect(() => {
    if (isAuthenticated && user && isOnline) {
      syncData();
    }
  }, [isAuthenticated, user]);

  // Sincronizar dados periodicamente quando estiver online
  useEffect(() => {
    let syncInterval;
    
    if (isAuthenticated && user && isOnline) {
      // Sincronizar a cada 15 minutos
      syncInterval = setInterval(() => {
        syncData();
      }, 15 * 60 * 1000);
    }
    
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isAuthenticated, user, isOnline]);

  // Função para sincronizar dados
  const syncData = async () => {
    if (!isAuthenticated || !user || !isOnline) {
      setSyncStatus('offline');
      return { success: false, error: 'Não é possível sincronizar' };
    }
    
    try {
      setSyncStatus('syncing');
      
      const result = await SyncService.syncAllData(user.uid);
      
      if (result.success) {
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('offline');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      setSyncStatus('offline');
      return { success: false, error };
    }
  };

  // Verificar status da conexão
  const checkConnection = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected);
      return { connected: netInfo.isConnected };
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      return { connected: false, error };
    }
  };

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        lastSyncTime,
        isOnline,
        syncData,
        checkConnection
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);