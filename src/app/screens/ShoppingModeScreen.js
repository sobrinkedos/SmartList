import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Appbar, Card, Checkbox, Chip, FAB, Portal, Dialog, Button, TextInput, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLists } from '../contexts/ListsContext';

const ShoppingModeScreen = ({ route, navigation }) => {
  const { isDarkMode } = useTheme();
  const { getListById, updateListItem } = useLists();
  
  const { listId, listName } = route.params || {};
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'checked'
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemPrice, setItemPrice] = useState('');
  const [sortBy, setSortBy] = useState('category'); // 'category', 'name', 'price'
  
  // Carregar dados da lista
  useEffect(() => {
    const loadList = async () => {
      try {
        if (listId) {
          const listData = await getListById(listId);
          if (listData) {
            setList(listData);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar lista:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da lista');
      } finally {
        setLoading(false);
      }
    };
    
    loadList();
  }, [listId, getListById]);
  
  // Filtrar e ordenar itens
  const getFilteredItems = () => {
    if (!list || !list.items) return [];
    
    let filteredItems = [...list.items];
    
    // Aplicar filtro
    if (filter === 'pending') {
      filteredItems = filteredItems.filter(item => !item.checked);
    } else if (filter === 'checked') {
      filteredItems = filteredItems.filter(item => item.checked);
    }
    
    // Aplicar ordenação
    if (sortBy === 'category') {
      filteredItems.sort((a, b) => {
        const catA = a.category || 'Sem categoria';
        const catB = b.category || 'Sem categoria';
        return catA.localeCompare(catB) || a.name.localeCompare(b.name);
      });
    } else if (sortBy === 'name') {
      filteredItems.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price') {
      filteredItems.sort((a, b) => {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceB - priceA; // Ordenar do mais caro para o mais barato
      });
    }
    
    return filteredItems;
  };
  
  // Marcar/desmarcar item
  const toggleItemCheck = async (item) => {
    try {
      const updatedItem = { ...item, checked: !item.checked, updated_at: Date.now() };
      const result = await updateListItem(list.id, updatedItem);
      
      if (result.success) {
        setList(result.list);
      } else {
        throw new Error(result.error || 'Erro ao atualizar item');
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o item');
    }
  };
  
  // Atualizar preço do item
  const updateItemPrice = async () => {
    if (!currentItem) return;
    
    try {
      const price = itemPrice ? parseFloat(itemPrice.replace(',', '.')) : null;
      
      if (isNaN(price)) {
        Alert.alert('Erro', 'Por favor, insira um preço válido');
        return;
      }
      
      const updatedItem = { 
        ...currentItem, 
        price, 
        updated_at: Date.now() 
      };
      
      const result = await updateListItem(list.id, updatedItem);
      
      if (result.success) {
        setList(result.list);
        setShowPriceDialog(false);
        setCurrentItem(null);
        setItemPrice('');
      } else {
        throw new Error(result.error || 'Erro ao atualizar preço');
      }
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o preço do item');
    }
  };
  
  // Calcular totais
  const calculateTotals = () => {
    if (!list || !list.items) return { total: 0, checked: 0, pending: 0 };
    
    const total = list.items.reduce((sum, item) => {
      return sum + (item.price ? item.price * item.quantity : 0);
    }, 0);
    
    const checked = list.items.filter(item => item.checked).length;
    const pending = list.items.length - checked;
    
    return { total, checked, pending };
  };
  
  const totals = calculateTotals();
  
  // Renderizar item da lista
  const renderItem = ({ item, index, section }) => {
    const formattedPrice = item.price ? `R$ ${item.price.toFixed(2)}` : 'Preço não definido';
    const totalItemPrice = item.price ? `R$ ${(item.price * item.quantity).toFixed(2)}` : '-';
    
    return (
      <Card 
        style={[
          styles.itemCard, 
          isDarkMode && styles.cardDark,
          item.checked && styles.checkedItemCard
        ]} 
        mode="outlined"
      >
        <Card.Content style={styles.itemContent}>
          <View style={styles.itemLeftSection}>
            <Checkbox
              status={item.checked ? 'checked' : 'unchecked'}
              onPress={() => toggleItemCheck(item)}
              color={isDarkMode ? '#0077cc' : '#0066cc'}
            />
            <View style={styles.itemDetails}>
              <Text style={[
                styles.itemName, 
                isDarkMode && styles.textLight,
                item.checked && styles.checkedItem
              ]}>
                {item.name}
              </Text>
              <Text style={[styles.itemInfo, isDarkMode && styles.textLightSecondary]}>
                {item.quantity} {item.unit} - {formattedPrice}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.priceButton}
            onPress={() => {
              setCurrentItem(item);
              setItemPrice(item.price ? item.price.toString() : '');
              setShowPriceDialog(true);
            }}
          >
            <Text style={[styles.totalPrice, isDarkMode && styles.textLight]}>{totalItemPrice}</Text>
            <Icon name="pencil" size={16} color={isDarkMode ? '#aaa' : '#666'} />
          </TouchableOpacity>
        </Card.Content>
      </Card>
    );
  };
  
  // Renderizar cabeçalho da lista
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.filterContainer}>
        <Chip 
          selected={filter === 'all'} 
          onPress={() => setFilter('all')}
          style={[styles.filterChip, isDarkMode && styles.chipDark]}
        >
          Todos ({list?.items?.length || 0})
        </Chip>
        <Chip 
          selected={filter === 'pending'} 
          onPress={() => setFilter('pending')}
          style={[styles.filterChip, isDarkMode && styles.chipDark]}
        >
          Pendentes ({totals.pending})
        </Chip>
        <Chip 
          selected={filter === 'checked'} 
          onPress={() => setFilter('checked')}
          style={[styles.filterChip, isDarkMode && styles.chipDark]}
        >
          Comprados ({totals.checked})
        </Chip>
      </View>
      
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, isDarkMode && styles.textLightSecondary]}>Ordenar por:</Text>
        <Chip 
          selected={sortBy === 'category'} 
          onPress={() => setSortBy('category')}
          style={[styles.sortChip, isDarkMode && styles.chipDark]}
          compact
        >
          Categoria
        </Chip>
        <Chip 
          selected={sortBy === 'name'} 
          onPress={() => setSortBy('name')}
          style={[styles.sortChip, isDarkMode && styles.chipDark]}
          compact
        >
          Nome
        </Chip>
        <Chip 
          selected={sortBy === 'price'} 
          onPress={() => setSortBy('price')}
          style={[styles.sortChip, isDarkMode && styles.chipDark]}
          compact
        >
          Preço
        </Chip>
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryLabel, isDarkMode && styles.textLightSecondary]}>
          Total estimado:
        </Text>
        <Text style={[styles.summaryValue, isDarkMode && styles.textLight]}>
          R$ {totals.total.toFixed(2)}
        </Text>
      </View>
    </View>
  );
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Appbar.Header style={isDarkMode ? styles.appbarDark : styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={listName || 'Modo Compra'} />
        <Appbar.Action icon="check-all" onPress={() => Alert.alert('Finalizar', 'Deseja finalizar a compra?')} />
      </Appbar.Header>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDarkMode && styles.textLight]}>Carregando...</Text>
        </View>
      ) : (
        <>
          {renderHeader()}
          
          <FlatList
            data={getFilteredItems()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
          
          <Portal>
            <Dialog
              visible={showPriceDialog}
              onDismiss={() => setShowPriceDialog(false)}
              style={isDarkMode && styles.dialogDark}
            >
              <Dialog.Title style={isDarkMode && styles.textLight}>
                Atualizar Preço
              </Dialog.Title>
              <Dialog.Content>
                <Text style={[styles.dialogText, isDarkMode && styles.textLightSecondary]}>
                  {currentItem?.name} ({currentItem?.quantity} {currentItem?.unit})
                </Text>
                <TextInput
                  label="Preço"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="decimal-pad"
                  style={[styles.priceInput, isDarkMode && styles.inputDark]}
                  mode="outlined"
                  left={<TextInput.Affix text="R$" />}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowPriceDialog(false)}>Cancelar</Button>
                <Button onPress={updateItemPrice}>Salvar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  appbar: {
    backgroundColor: '#ffffff',
  },
  appbarDark: {
    backgroundColor: '#1e1e1e',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContainerDark: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  chipDark: {
    backgroundColor: '#333',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sortLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  sortChip: {
    marginRight: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 8,
  },
  cardDark: {
    backgroundColor: '#333',
  },
  checkedItemCard: {
    opacity: 0.5,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetails: {
    marginLeft: 8,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  textLight: {
    color: '#fff',
  },
  checkedItem: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  itemInfo: {
    fontSize: 14,
    color: '#666',
  },
  textLightSecondary: {
    color: '#aaa',
  },
  priceButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  totalPrice: {
    fontSize: 16,
    color: '#333',
  },
  dialogDark: {
    backgroundColor: '#1e1e1e',
  },
  dialogText: {
    fontSize: 16,
    color: '#333',
  },
  priceInput: {
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  inputDark: {
    backgroundColor: '#333',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ShoppingModeScreen;