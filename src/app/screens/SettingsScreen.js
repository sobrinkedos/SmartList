import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Text, List, Divider, Button, Dialog, Portal, TextInput } from 'react-native-paper';
import AsyncStorage from '../services/async-storage-mock';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { clearDatabase } from '../services/database';

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, updateBiometricPreference } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [email, setEmail] = useState('');
  
  // Carregar configurações salvas
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const notificationsValue = await AsyncStorage.getItem('notifications_enabled');
      const biometricValue = await AsyncStorage.getItem('biometric_enabled');
      const syncValue = await AsyncStorage.getItem('sync_enabled');
      const offlineValue = await AsyncStorage.getItem('offline_mode');
      
      setNotificationsEnabled(notificationsValue === 'true');
      setBiometricEnabled(biometricValue === 'true');
      setSyncEnabled(syncValue !== 'false'); // Por padrão é true
      setOfflineMode(offlineValue === 'true');
      
      if (user) {
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };
  
  const saveSettings = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, String(value));
      return true;
    } catch (error) {
      console.error(`Erro ao salvar configuração ${key}:`, error);
      return false;
    }
  };
  
  const handleNotificationsToggle = async () => {
    const newValue = !notificationsEnabled;
    if (await saveSettings('notifications_enabled', newValue)) {
      setNotificationsEnabled(newValue);
    }
  };
  
  const handleBiometricToggle = async () => {
    const newValue = !biometricEnabled;
    const result = await updateBiometricPreference(newValue);
    
    if (result.success) {
      setBiometricEnabled(newValue);
      await saveSettings('biometric_enabled', newValue);
    } else {
      Alert.alert('Erro', 'Não foi possível atualizar a configuração biométrica.');
    }
  };
  
  const handleSyncToggle = async () => {
    const newValue = !syncEnabled;
    if (await saveSettings('sync_enabled', newValue)) {
      setSyncEnabled(newValue);
      
      // Se desativar sincronização, ativar modo offline
      if (!newValue && !offlineMode) {
        setOfflineMode(true);
        await saveSettings('offline_mode', true);
      }
    }
  };
  
  const handleOfflineModeToggle = async () => {
    const newValue = !offlineMode;
    if (await saveSettings('offline_mode', newValue)) {
      setOfflineMode(newValue);
      
      // Se desativar modo offline, ativar sincronização
      if (!newValue && !syncEnabled) {
        setSyncEnabled(true);
        await saveSettings('sync_enabled', true);
      }
    }
  };
  
  const handleClearData = async () => {
    try {
      setShowClearDataDialog(false);
      
      // Limpar banco de dados local
      const result = await clearDatabase();
      
      if (result.success) {
        Alert.alert('Sucesso', 'Dados locais limpos com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao limpar dados');
      }
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      Alert.alert('Erro', 'Não foi possível limpar os dados. Tente novamente.');
    }
  };
  
  const handleResetPassword = async () => {
    try {
      setShowResetPasswordDialog(false);
      
      // Implementar lógica para redefinir senha
      Alert.alert('Sucesso', 'Email de redefinição de senha enviado!');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      Alert.alert('Erro', 'Não foi possível enviar o email de redefinição. Tente novamente.');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aparência</Text>
        <List.Item
          title="Tema Escuro"
          description="Alterna entre tema claro e escuro"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
            />
          )}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        <List.Item
          title="Ativar Notificações"
          description="Receba alertas sobre ofertas e lembretes"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
            />
          )}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segurança</Text>
        <List.Item
          title="Autenticação Biométrica"
          description="Use impressão digital ou reconhecimento facial"
          left={props => <List.Icon {...props} icon="fingerprint" />}
          right={() => (
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
            />
          )}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sincronização</Text>
        <List.Item
          title="Sincronizar Dados"
          description="Sincronize seus dados com o servidor"
          left={props => <List.Icon {...props} icon="cloud-sync" />}
          right={() => (
            <Switch
              value={syncEnabled}
              onValueChange={handleSyncToggle}
            />
          )}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo Offline</Text>
        <List.Item
          title="Modo Offline"
          description="Ative para usar o aplicativo sem conexão com a internet"
          left={props => <List.Icon {...props} icon="cloud-off-outline" />}
          right={() => (
            <Switch
              value={offlineMode}
              onValueChange={handleOfflineModeToggle}
            />
          )}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações</Text>
        <List.Item
          title="Limpar Dados Locais"
          description="Limpe todos os dados locais do aplicativo"
          left={props => <List.Icon {...props} icon="delete" />}
          right={() => (
            <Button
              mode="contained"
              onPress={() => setShowClearDataDialog(true)}
            >
              Limpar
            </Button>
          )}
        />
        <Portal>
          <Dialog
            visible={showClearDataDialog}
            onDismiss={() => setShowClearDataDialog(false)}
          >
            <Dialog.Title>Limpar Dados Locais</Dialog.Title>
            <Dialog.Content>
              <Text>Tem certeza que deseja limpar todos os dados locais?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowClearDataDialog(false)}>Cancelar</Button>
              <Button onPress={handleClearData}>Limpar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <List.Item
          title="Redefinir Senha"
          description="Redefina sua senha de acesso"
          left={props => <List.Icon {...props} icon="lock-reset" />}
          right={() => (
            <Button
              mode="contained"
              onPress={() => setShowResetPasswordDialog(true)}
            >
              Redefinir
            </Button>
          )}
        />
        <Portal>
          <Dialog
            visible={showResetPasswordDialog}
            onDismiss={() => setShowResetPasswordDialog(false)}
          >
            <Dialog.Title>Redefinir Senha</Dialog.Title>
            <Dialog.Content>
              <Text>Digite seu email para receber as instruções de redefinição de senha</Text>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowResetPasswordDialog(false)}>Cancelar</Button>
              <Button onPress={handleResetPassword}>Redefinir</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default SettingsScreen;