import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FAB, Card, Button, Searchbar, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLists } from '../contexts/ListsContext';

const ListsScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { lists, loading, createList, deleteList } = useLists();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLists, setFilteredLists] = useState([]);

  // Filtrar listas com base na pesquisa
  useEffect(() => {
    if (lists) {
      if (searchQuery.trim() === '') {
        setFilteredLists(lists);
      } else {
        const filtered = lists.filter(list =>
          list.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredLists(filtered);
      }
    }
  }, [lists, searchQuery]);

  // Função para criar uma nova lista
  const handleCreateList = () => {
    navigation.navigate('ListDetail', { isNew: true });
  };

  // Função para abrir uma lista existente
  const handleOpenList = (list) => {
    navigation.navigate('ListDetail', { listId: list.id, listName: list.name });
  };

  // Renderizar item da lista
  const renderListItem = ({ item }) => {
    const lastUpdated = new Date(item.updated_at || item.created_at);
    const formattedDate = lastUpdated.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return (
      <Card
        style={[styles.listCard, isDarkMode && styles.cardDark]}
        mode="outlined"
        onPress={() => handleOpenList(item)}
      >
        <Card.Content>
          <View style={styles.listHeader}>
            <Text style={[styles.listName, isDarkMode && styles.textLight]}>{item.name}</Text>
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => showListOptions(item)}
            />
          </View>
          
          <View style={styles.listInfo}>
            <View style={styles.infoItem}>
              <Icon name="cart-outline" size={16} color={isDarkMode ? '#e0e0e0' : '#666'} />
              <Text style={[styles.infoText, isDarkMode && styles.textLightSecondary]}>
                {item.itemCount || 0} itens
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="currency-usd" size={16} color={isDarkMode ? '#e0e0e0' : '#666'} />
              <Text style={[styles.infoText, isDarkMode && styles.textLightSecondary]}>
                R$ {(item.totalPrice || 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="clock-outline" size={16} color={isDarkMode ? '#e0e0e0' : '#666'} />
              <Text style={[styles.infoText, isDarkMode && styles.textLightSecondary]}>
                {formattedDate}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Mostrar opções da lista (editar, excluir, compartilhar)
  const showListOptions = (list) => {
    // Implementar modal ou menu de opções
    console.log('Mostrar opções para lista:', list.id);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Searchbar
        placeholder="Buscar listas"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, isDarkMode && styles.searchBarDark]}
        inputStyle={isDarkMode && styles.textLight}
        iconColor={isDarkMode ? '#e0e0e0' : undefined}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#e0e0e0' : '#0066cc'} />
          <Text style={[styles.loadingText, isDarkMode && styles.textLight]}>Carregando listas...</Text>
        </View>
      ) : filteredLists.length > 0 ? (
        <FlatList
          data={filteredLists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="format-list-bulleted" size={80} color={isDarkMode ? '#555' : '#ccc'} />
          <Text style={[styles.emptyText, isDarkMode && styles.textLight]}>
            {searchQuery ? 'Nenhuma lista encontrada' : 'Você ainda não tem listas'}
          </Text>
          <Button 
            mode="contained" 
            onPress={handleCreateList}
            style={styles.createButton}
          >
            Criar Nova Lista
          </Button>
        </View>
      )}

      <FAB
        style={[styles.fab, isDarkMode && styles.fabDark]}
        icon="plus"
        onPress={handleCreateList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  searchBarDark: {
    backgroundColor: '#333',
  },
  listContainer: {
    paddingBottom: 80,
  },
  listCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1e1e1e',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066cc',
  },
  fabDark: {
    backgroundColor: '#0077cc',
  },
  createButton: {
    marginTop: 8,
  },
  textLight: {
    color: '#e0e0e0',
  },
  textLightSecondary: {
    color: '#aaa',
  },
});

export default ListsScreen;