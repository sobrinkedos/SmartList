import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Dados das telas de onboarding
  const onboardingData = [
    {
      id: '1',
      title: 'Bem-vindo ao SmartList',
      description: 'O aplicativo inteligente para gerenciar suas listas de compras e economizar dinheiro.',
      image: require('../../assets/images/onboarding1.png'),
    },
    {
      id: '2',
      title: 'Organize suas compras',
      description: 'Crie e gerencie múltiplas listas, categorize produtos automaticamente e compartilhe com amigos e família.',
      image: require('../../assets/images/onboarding2.png'),
    },
    {
      id: '3',
      title: 'Economize com inteligência',
      description: 'Acompanhe preços, receba alertas de ofertas e veja previsões de quando é melhor comprar.',
      image: require('../../assets/images/onboarding3.png'),
    },
    {
      id: '4',
      title: 'Pronto para começar?',
      description: 'Crie sua conta agora e comece a aproveitar todos os recursos do SmartList.',
      image: require('../../assets/images/onboarding4.png'),
    },
  ];

  // Função para avançar para a próxima tela
  const goToNextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Função para pular o onboarding e ir para a tela de login
  const skipOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.error('Erro ao salvar estado de onboarding:', error);
    }
  };

  // Função para finalizar o onboarding e ir para a tela de login
  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.error('Erro ao salvar estado de onboarding:', error);
    }
  };

  // Renderizar cada slide do onboarding
  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        <Text style={[styles.title, isDarkMode && styles.textLight]}>{item.title}</Text>
        <Text style={[styles.description, isDarkMode && styles.textLight]}>{item.description}</Text>
      </View>
    );
  };

  // Renderizar indicadores de página
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: index === currentIndex ? '#4CAF50' : '#ccc' },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderPagination()}

      <View style={styles.buttonContainer}>
        {currentIndex < onboardingData.length - 1 ? (
          <>
            <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
              <Text style={[styles.skipButtonText, isDarkMode && styles.textLight]}>Pular</Text>
            </TouchableOpacity>
            <Button
              mode="contained"
              onPress={goToNextSlide}
              style={styles.nextButton}
              labelStyle={styles.buttonLabel}
            >
              Próximo
            </Button>
          </>
        ) : (
          <Button
            mode="contained"
            onPress={finishOnboarding}
            style={styles.getStartedButton}
            labelStyle={styles.buttonLabel}
          >
            Começar
          </Button>
        )}
      </View>
    </View>
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
  slide: {
    width,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 20,
  },
  textLight: {
    color: '#fff',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    flex: 1,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default OnboardingScreen;