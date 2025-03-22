import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Appbar, FAB, Card, Checkbox, TextInput, IconButton, Divider, Menu, Portal, Dialog, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useLists } from '../contexts/ListsContext';

const ListDetailScreen = ({ route, navigation }) => {
  const { isDarkMode } = useTheme();
  const { getListById, updateList, addItemToList, updateListItem, removeItemFromList } = useLists();
  
  const { listId, isNew } = route.params || {};
  const [list, setList] = useState(isNew ? { name: '', items: [] } : null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUnit, setItemUnit] = useState('un');
  const [menuVisible, setMenuVisible] = useState(false);
  const [editListName, setEditListName] = useState(false);
  const [listNameInput, setListNameInput] = useState('');
  
  // Carregar dados da lista
  useEffect(() => {
    const loadList = async () => {
      if (isNew) {
        setLoading(false);
        return;
      }
      
      try {
        if (listId) {
          const listData = await getListById(listId);
          if (listData) {
            setList(listData);
            setListNameInput(listData.name);
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
  }, [listId, isNew, getListById]);
  
  // Salvar nova lista
  const handleSaveNewList = async () => {
    if (!listNameInput.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para a lista');
      return;
    }
    
    try {
      const newList = {
        name: listNameInput.trim(),
        created_at: Date.now(),
        updated_at: Date.now(),
        items: [],
      };
      
      const result = await updateList(newList);
      if (result.success) {
        setList(result.list);
        navigation.setParams({ listId: result.list.id, listName: result.list.name, isNew: false });
      } else {
        throw new Error(result.error || 'Erro ao criar lista');
      }
    } catch (error) {
      console.error('Erro ao salvar nova lista:', error);
      Alert.alert('Erro', 'Não foi possível criar a lista');
    }
  };
  
  // Atualizar nome da lista
  const handleUpdateListName = async () => {
    if (!listNameInput.trim()) {
      Alert.alert('Erro', 'O nome da lista não pode estar vazio');
      return;
    }
    
    try {
      const updatedList = {
        ...list,
        name: listNameInput.trim(),
        updated_at: Date.now(),
      };
      
      const result = await updateList(updatedList);
      if (result.success) {
        setList(result.list);
        navigation.setParams({ listName: result.list.name });
        setEditListName(false);
      } else {
        throw new Error(result.error || 'Erro ao atualizar lista');
      }
    } catch (error) {
      console.error('Erro ao atualizar nome da lista:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o nome da lista');
    }
  };
  
  // Adicionar novo item à lista
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o item');
      return;
    }
    
    try {
      const quantity = parseFloat(itemQuantity) || 1;
      const price = itemPrice ? parseFloat(itemPrice.replace(',', '.')) : null;
      
      const newItem = {
        name: newItemName.trim(),
        quantity,
        unit: itemUnit,
        price,
        checked: false,
        created_at: Date.now(),
      };
      
      const result = await addItemToList(list.id, newItem);
      if (result.success) {
        setList(result.list);
        setNewItemName('');
        setItemQuantity('1');
        setItemPrice('');
        setItemUnit('un');
        setShowAddDialog(false);
      } else {
        throw new Error(result.error || 'Erro ao adicionar item');
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o item à lista');
    }
  };
  
  // Atualizar item da lista
  const handleUpdateItem = async (item, changes) => {
    try {
      const updatedItem = { ...item, ...changes, updated_at: Date.now() };
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
  
  // Remover item da lista
  const handleRemoveItem = async (itemId) => {
    try {
      const result = await removeItemFromList(list.id, itemId);
      
      if (result.success) {
        setList(result.list);
      } else {
        throw new Error(result.error || 'Erro ao remover item');
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      Alert.alert('Erro', 'Não foi possível remover o item da lista');
    }
  };
  
  // Iniciar modo de compra
  const startShoppingMode = () => {
    navigation.navigate('ShoppingMode', { listId: list.id, listName: list.name });
  };
  
  // Renderizar item da lista
  const renderItem = ({ item }) => {
    const formattedPrice = item.price ? `R$ ${item.price.toFixed(2)}` : 'Preço não definido';
    
    return (
      <Card style={[styles.itemCard, isDarkMode && styles.cardDark]} mode="outlined">
        <Card.Content style={styles.itemContent}>
          <View style={styles.itemLeftSection}>
            <Checkbox
              status={item.checked ? 'checked' : 'unchecked'}
              onPress={() => handleUpdateItem(item, { checked: !item.checked })}
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
          
          <View style={styles.itemActions}>
            <IconButton
              icon="pencil-outline"
              size={20}
              onPress={() => {
                setEditingItem(item);
                setNewItemName(item.name);
                setItemQuantity(item.quantity.toString());
                setItemPrice(item.price ? item.price.toString() : '');
                setItemUnit(item.unit || 'un');
                setShowAddDialog(true);
              }}
            />
            <IconButton
              icon="delete-outline"
              size={20}
              onPress={() => {
                Alert.alert(
                  'Remover Item',
                  `Deseja remover "${item.name}" da lista?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Remover', onPress: () => handleRemoveItem(item.id), style: 'destructive' }
                  ]
                );
              }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Calcular totais
  const calculateTotals = () => {
    if (!list || !list.items) return { count: 0, price: 0 };
    
    const count = list.items.length;
    const price = list.items.reduce((total, item) => {
      return total + (item.price ? item.price * item.quantity : 0);
    }, 0);
    
    return { count, price };
  };
  
  const totals = calculateTotals();
  
  // Renderizar cabeçalho da lista
  const renderHeader = () => {
    if (isNew || editListName) {
      return (
        <View style={styles.headerContainer}>
          <TextInput
            label="Nome da lista"
            value={listNameInput}
            onChangeText={setListNameInput}
            style={[styles.listNameInput, isDarkMode && styles.inputDark]}
            mode="outlined"
          />
          <Button 
            mode="contained" 
            onPress={isNew ? handleSaveNewList : handleUpdateListName}
            style={styles.saveButton}
          >
            Salvar
          </Button>
        </View>
      );
    }
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryText, isDarkMode && styles.textLightSecondary]}>
            {totals.count} {totals.count === 1 ? 'item' : 'itens'}
          </Text>
          <Text style={[styles.summaryPrice, isDarkMode && styles.textLight]}>
            Total: R$ {totals.price.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryActions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => setEditListName(true)}
          />
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => setMenuVisible(true)}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<View />}
            style={[styles.menu, isDarkMode && styles.menuDark]}
          >
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                startShoppingMode();
              }} 
              title="Iniciar modo compra" 
              leadingIcon="cart"
            />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                // Implementar compartilhamento
                Alert.alert('Info', 'Função de compartilhamento será implementada em breve');
              }} 
              title="Compartilhar lista" 
              leadingIcon="share"
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                Alert.alert(
                  'Excluir Lista',
                  'Tem certeza que deseja excluir esta lista?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Excluir', 
                      onPress: () => {
                        // Implementar exclusão
                        navigation.goBack();
                      },
                      style: 'destructive' 
                    }
                  ]
                );
              }} 
              title="Excluir lista" 
              leadingIcon="delete"
            />
          </Menu>
        </View>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDarkMode && styles.textLight]}>Carregando...</Text>
        </View>
      ) : (
        <>
          {renderHeader()}
          
          {list && list.items && list.items.length > 0 ? (
            <FlatList
              data={list.items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="cart-outline" size={80} color={isDarkMode ? '#555' : '#ccc'} />
              <Text style={[styles.emptyText, isDarkMode && styles.textLight]}>
                {isNew ? 'Salve a lista e adicione itens' : 'Nenhum item na lista'}
              </Text>
              {!isNew && (
                <Button 
                  mode="contained" 
                  onPress={() => setShowAddDialog(true)}
                  style={styles.addButton}
                >
                  Adicionar Item
                </Button>
              )}
            </View>
          )}
          
          {!isNew && (
            <FAB
              style={[styles.fab, isDarkMode &&