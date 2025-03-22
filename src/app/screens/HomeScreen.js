import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Card, FAB, Appbar, Chip, Button, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentLists, setRecentLists] = useState([]);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [priceAlerts, setPriceAlerts] = useState([]);
  
  // Carregar dados ao iniciar a tela
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulação de carregamento de dados
        // Em uma implementação real, esses dados viriam do banco de dados
        setTimeout(() => {
          // Dados de exemplo
          setRecentLists([
            { id: '1', name: 'Compras da Semana', itemCount: 12, totalPrice: 120.50, lastUpdated: new Date() },
            { id: '2', name: 'Festa de Aniversário', itemCount: 8, totalPrice: 85.75, lastUpdated: new Date(Date.now() - 86400000) },
          ]);
          
          setBudgetInfo({
            total: 500,
            spent: 320.50,
            remaining: 179.50,
            percentage: 64
          });
          
          setPriceAlerts([
            { id: '1', productName: 'Arroz Integral', oldPrice: 22.90, newPrice: 18.50, store: 'Supermercado ABC' },
            { id: '2', productName: 'Leite Desnatado', oldPrice: 5.80, newPrice: 4.99, store: 'Mercado XYZ' },
          ]);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar dados da tela inicial:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Renderizar item da lista recente
  const renderListItem = ({ item }) => {
    const formattedDate = new Date(item.lastUpdated).toLocaleDateString('pt-BR');
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('ListsTab', { 
          screen: 'ListDetail',
          params: { listId: item.id, listName: item.name }
        })}
      >
        <Card style={[styles.card, isDarkMode && styles.cardDark]} mode="outlined">
          <Card.Content>
            <View style={styles.listItemHeader}>
              <Text style={[styles.listName, isDarkMode && styles.textLight]}>{item.name}</Text>
              <Icon name="chevron-right" size={24} color={isDarkMode ? '#aaa' : '#666'} />
            </View>
            <View style={styles.listItemDetails}>
              <View style={styles.listItemDetail}>
                <Icon name="format-list-bulleted" size={16} color="#4CAF50" />
                <Text style={[styles.listItemText, isDarkMode && styles.textLightSecondary]}>
                  {item.itemCount} itens
                </Text>
              </View>
              <View style={styles.listItemDetail}>
                <Icon name="cash" size={16} color="#4CAF50" />
                <Text style={[styles.listItemText, isDarkMode && styles.textLightSecondary]}>
                  R$ {item.totalPrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.listItemDetail}>
                <Icon name="clock-outline" size={16} color="#4CAF50" />
                <Text style={[styles.listItemText, isDarkMode && styles.textLightSecondary]}>
                  {formattedDate}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  // Renderizar alerta de preço
  const renderPriceAlert = ({ item }) => {
    const discount = ((item.oldPrice - item.newPrice) / item.oldPrice * 100).toFixed(0);
    
    return (
      <Card style={[styles.alertCard, isDarkMode && styles.cardDark]} mode="outlined">
        <Card.Content>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, isDarkMode && styles.textLight]}>{item.productName}</Text>
            <Chip icon="percent" style={styles.discountChip}>{discount}% OFF</Chip>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.oldPrice, isDarkMode && styles.textLightSecondary]}>R$ {item.oldPrice.toFixed(2)}</Text>
            <Text style={styles.newPrice}>R$ {item.newPrice.toFixed(2)}</Text>
          </View>
          <Text style={[styles.storeText, isDarkMode && styles.textLightSecondary]}>{item.store}</Text>
        </Card.Content>
      </Card>
    );
  };
  
  // Tela de carregamento
  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={[styles.loadingText, isDarkMode && styles.textLight]}>Carregando...</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Appbar.Header style={isDarkMode ? styles.headerDark : styles.header}>
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
        <Appbar.Content title="SmartList" />
        <Appbar.Action icon="bell" onPress={() => {}} />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Saudação */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, isDarkMode && styles.textLight]}>
            Olá, {user?.displayName || 'Usuário'}
          </Text>
          <Text style={[styles.date, isDarkMode && styles.textLightSecondary]}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        
        {/* Listas recentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>Listas Recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ListsTab')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {recentLists.length > 0 ? (
            <FlatList
              data={recentLists}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Card style={[styles.emptyCard, isDarkMode && styles.cardDark]} mode="outlined">
              <Card.Content>
                <Text style={[styles.emptyText, isDarkMode && styles.textLight]}>
                  Você ainda não tem listas. Crie sua primeira lista agora!
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('ListsTab')}
                  style={styles.createButton}
                >
                  Criar Lista
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
        
        {/* Orçamento */}
        {budgetInfo && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>Orçamento Mensal</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AnalysisTab', { screen: 'Budget' })}>
                <Text style={styles.seeAllText}>Detalhes</Text>
              </TouchableOpacity>
            </View>
            
            <Card style={[styles.budgetCard, isDarkMode && styles.cardDark]} mode="outlined">
              <Card.Content>
                <View style={styles.budgetHeader}>
                  <View>
                    <Text style={[styles.budgetLabel, isDarkMode && styles.textLightSecondary]}>Total</Text>
                    <Text style={[styles.budgetValue, isDarkMode && styles.textLight]}>R$ {budgetInfo.total.toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.budgetLabel, isDarkMode && styles.textLightSecondary]}>Gasto</Text>
                    <Text style={[styles.budgetValue, isDarkMode && styles.textLight]}>R$ {budgetInfo.spent.toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.budgetLabel, isDarkMode && styles.textLightSecondary]}>Restante</Text>
                    <Text style={[styles.budgetValue, isDarkMode && styles.textLight]}>R$ {budgetInfo.remaining.toFixed(2)}</Text>
                  </View>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[styles.progressBar, { width: `${budgetInfo.percentage}%` }]}
                    />
                  </View>
                  <Text style={[styles.progressText, isDarkMode && styles.textLightSecondary]}>
                    {budgetInfo.percentage}% utilizado
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
        
        {/* Alertas de preço */}
        {priceAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>Alertas de Preço</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProductsTab')}>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={priceAlerts}
              renderItem={renderPriceAlert}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.alertsContainer}
            />
          </View>
        )}
      </ScrollView>
      
      <FAB
        style={[styles.fab, { backgroundColor: '#4CAF50' }]}
        icon="plus"
        onPress={() => navigation.navigate('ListsTab', { screen: 'Lists', params: { action: 'create' } })}
      />
    </View>
  );
};