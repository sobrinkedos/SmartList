import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Snackbar, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const RegisterScreen = ({ navigation }) => {
  const { signUp, loading, error } = useAuth();
  const { isDarkMode } = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Validação de email
  const isEmailValid = () => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length === 0;
  };

  // Validação de senha
  const isPasswordValid = () => {
    return password.length >= 6 || password.length === 0;
  };

  // Validação de confirmação de senha
  const isConfirmPasswordValid = () => {
    return password === confirmPassword || confirmPassword.length === 0;
  };

  // Função para realizar cadastro
  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setSnackbarMessage('Por favor, preencha todos os campos');
      setSnackbarVisible(true);
      return;
    }

    if (!isEmailValid()) {
      setSnackbarMessage('Por favor, insira um email válido');
      setSnackbarVisible(true);
      return;
    }

    if (!isPasswordValid()) {
      setSnackbarMessage('A senha deve ter pelo menos 6 caracteres');
      setSnackbarVisible(true);
      return;
    }

    if (!isConfirmPasswordValid()) {
      setSnackbarMessage('As senhas não coincidem');
      setSnackbarVisible(true);
      return;
    }

    const result = await signUp(email, password, name);
    
    if (result.success) {
      // Cadastro bem-sucedido, navegar para a tela inicial
      navigation.replace('Root');
    } else {
      setSnackbarMessage(result.error || 'Erro ao criar conta');
      setSnackbarVisible(true);
    }
  };

  // Função para navegar para a tela de login
  const navigateToLogin = () => {
    navigation.navigate('Login');
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
          <Text style={[styles.tagline, isDarkMode && styles.textLightSecondary]}>Crie sua conta</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Nome completo"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: '#4CAF50' } }}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            theme={{ colors: { primary: '#4CAF50' } }}
            error={email.length > 0 && !isEmailValid()}
          />
          {email.length > 0 && !isEmailValid() && (
            <HelperText type="error" visible={true}>
              Email inválido
            </HelperText>
          )}

          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            theme={{ colors: { primary: '#4CAF50' } }}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            error={password.length > 0 && !isPasswordValid()}
          />
          {password.length > 0 && !isPasswordValid() && (
            <HelperText type="error" visible={true}>
              A senha deve ter pelo menos 6 caracteres
            </HelperText>
          )}

          <TextInput
            label="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
            theme={{ colors: { primary: '#4CAF50' } }}
            right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
            error={confirmPassword.length > 0 && !isConfirmPasswordValid()}
          />
          {confirmPassword.length > 0 && !isConfirmPasswordValid() && (
            <HelperText type="error" visible={true}>
              As senhas não coincidem
            </HelperText>
          )}

          <Button 
            mode="contained" 
            onPress={handleRegister} 
            style={styles.registerButton}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            Criar conta
          </Button>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
            <Text style={[styles.dividerText, isDarkMode && styles.textLightSecondary]}>ou</Text>
            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
          </View>

          <Button 
            mode="outlined" 
            icon="google" 
            onPress={() => {}} 
            style={[styles.socialButton, { borderColor: '#DB4437' }]}
            labelStyle={{ color: '#DB4437' }}
          >
            Continuar com Google
          </Button>

          <Button 
            mode="outlined" 
            icon="facebook" 
            onPress={() => {}} 
            style={[styles.socialButton, { borderColor: '#4267B2' }]}
            labelStyle={{ color: '#4267B2' }}
          >
            Continuar com Facebook
          </Button>
        </View>

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, isDarkMode && styles.textLightSecondary]}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>Entrar</Text>
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