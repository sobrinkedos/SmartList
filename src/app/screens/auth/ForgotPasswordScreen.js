import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const { resetPassword, loading } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [email, setEmail] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Função para enviar email de recuperação de senha
  const handleResetPassword = async () => {
    if (!email) {
      setSnackbarMessage('Por favor, informe seu email');
      setSnackbarVisible(true);
      return;
    }

    const result = await resetPassword(email);
    
    if (result.success) {
      setSnackbarMessage('Email de recuperação enviado com sucesso!');
      setSnackbarVisible(true);
      // Aguardar um pouco antes de voltar para a tela de login
      setTimeout(() => {
        navigation.goBack();
      }, 3000);
    } else {
      setSnackbarMessage(result.error || 'Erro ao enviar email de recuperação');
      setSnackbarVisible(true);
    }
  };

  // Funu00e7u00e3o para voltar para a tela de login
  const navigateToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/images/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={[styles.appName, isDarkMode && styles.textLight]}>SmartList</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={[styles.title, isDarkMode && styles.textLight]}>Recuperar Senha</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.textLightSecondary]}>
          Informe seu email para receber as instruu00e7u00f5es de recuperau00e7u00e3o de senha
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          theme={{ colors: { primary: '#4CAF50' } }}
        />

        <Button 
          mode="contained" 
          onPress={handleResetPassword} 
          style={styles.resetButton}
          labelStyle={styles.buttonLabel}
          loading={loading}
          disabled={loading}
        >
          Enviar Email de Recuperau00e7u00e3o
        </Button>

        <TouchableOpacity onPress={navigateToLogin} style={styles.backContainer}>
          <Text style={[styles.backText, isDarkMode && styles.textLightSecondary]}>Voltar para o Login</Text>
        </TouchableOpacity>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  resetButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    marginBottom: 20,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  textLight: {
    color: '#fff',
  },
  textLightSecondary: {
    color: '#aaa',
  },
});

export default ForgotPasswordScreen;
