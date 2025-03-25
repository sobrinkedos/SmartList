import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FirebaseAuthService } from '../../services/firebaseAuthService';

const LoginScreen = ({ navigation }) => {
  const { signIn, loading, error } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Função para realizar login
  const handleLogin = async () => {
    if (!email || !password) {
      setSnackbarMessage('Por favor, preencha todos os campos');
      setSnackbarVisible(true);
      return;
    }

    const result = await signIn(email, password);
    
    if (!result.success) {
      setSnackbarMessage(result.error || 'Erro ao fazer login');
      setSnackbarVisible(true);
    }
  };

  // Função para navegar para a tela de cadastro
  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={[styles.appName, isDarkMode && styles.textLight]}>SmartList</Text>
          <Text style={[styles.tagline, isDarkMode && styles.textLightSecondary]}>Sua lista de compras inteligente</Text>
        </View>

        <View style={styles.formContainer}>
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

          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            theme={{ colors: { primary: '#4CAF50' } }}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
          />

          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={[styles.forgotPassword, isDarkMode && styles.textLightSecondary]}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.loginButton}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            Entrar
          </Button>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
            <Text style={[styles.dividerText, isDarkMode && styles.textLightSecondary]}>ou</Text>
            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
          </View>

          <Button 
            mode="outlined" 
            icon="google" 
            onPress={async () => {
              try {
                setSnackbarMessage('Iniciando login com Google...');
                setSnackbarVisible(true);
                const result = await FirebaseAuthService.loginWithGoogle();
                if (!result.success) {
                  throw new Error(result.error?.message || 'Erro ao fazer login com Google');
                }
              } catch (error) {
                setSnackbarMessage(error.message);
                setSnackbarVisible(true);
              }
            }} 
            style={[styles.socialButton, { borderColor: '#DB4437' }]}
            labelStyle={{ color: '#DB4437' }}
          >
            Continuar com Google
          </Button>

          <Button 
            mode="outlined" 
            icon="facebook" 
            onPress={async () => {
              try {
                setSnackbarMessage('Iniciando login com Facebook...');
                setSnackbarVisible(true);
                const result = await FirebaseAuthService.loginWithFacebook();
                if (!result.success) {
                  throw new Error(result.error?.message || 'Erro ao fazer login com Facebook');
                }
              } catch (error) {
                setSnackbarMessage(error.message);
                setSnackbarVisible(true);
              }
            }} 
            style={[styles.socialButton, { borderColor: '#4267B2' }]}
            labelStyle={{ color: '#4267B2' }}
          >
            Continuar com Facebook
          </Button>
        </View>

        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, isDarkMode && styles.textLightSecondary]}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={navigateToRegister}>
            <Text style={styles.registerLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    marginBottom: 20,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerDark: {
    backgroundColor: '#333',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  socialButton: {
    marginBottom: 15,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  textLight: {
    color: '#fff',
  },
  textLightSecondary: {
    color: '#aaa',
  },
});

export default LoginScreen;