import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Searchbar, FAB, Card, Chip, IconButton, ActivityIndicator, Button, Menu, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

const ProductsScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Categorias disponíveis
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'alimentos', name: 'Alimentos' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'limpeza', name: 'Limpeza' },
    { id: 'higiene', name: 'Higiene' },
    { id: 'outros', name: 'Outros' },
  ];
  
  // Carregar produtos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Simulação de carregamento de dados
        // Em uma implementação real, esses dados viriam do banco de dados
        setTimeout(() => {
          const mockProducts = [
            {
              id: '1',
              name: 'Arroz Integral',
              brand: 'Marca A',
              category: 'alimentos',
              barcode: '7891234567890',
              price: 22.90,
              unit: 'kg',
              quantity: 1,
              imageUrl: null,
              lastPurchase: new Date(2023, 11, 15),
            },
            {
              id: '2',
              name: 'Leite Desnatado',
              brand: 'Marca B',
              category: 'bebidas',
              barcode: '7899876543210',
              price: 4.99,
              unit: 'l',
              quantity: 1,
              imageUrl: null,
              lastPurchase: new Date(2023, 11, 20),
            },
            {
              id: '3',
              name: 'Detergente',
              brand: 'Marca C',
              category: 'limpeza',
              barcode: '7890123456789',
              price: 3.50,
              unit: 'un',
              quantity: 1,
              imageUrl: null,
              lastPurchase: new Date(2023, 11, 10),
            },
            {
              id: '4',
              name: 'Sabonete',
              brand: 'Marca D',
              category: 'higiene',
              barcode: '7891234567891',
              price: 2.99,
              unit: 'un',
              quantity: 1,
              imageUrl: null,
              lastPurchase: new Date(2023, 11, 5),
            },
          ];
          
          setProducts(mockProducts);
          setFilteredProducts(mockProducts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Filtrar produtos com base na pesquisa e categoria selecionada
  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products];
      
      // Filtrar por categoria
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(product => product.category === selectedCategory);
      }
      
      // Filtrar por texto de pesquisa
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.barcode.includes(query)
        );
      }
      
      setFilteredProducts(filtered);
    }
  }, [products, searchQuery, selectedCategory]);
  
  // Abrir detalhes do produto
  const handleOpenProduct = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };
  
  // Adicionar novo produto
  const handleAddProduct = () => {
    navigation.navigate('ProductDetail', { isNew: true });
  };
  
  // Mostrar menu de opções do produto
  const showProductMenu = (product) => {
    setSelectedProduct(product);
    setMenuVisible(true);
  };
  
  // Renderizar item da lista de produtos
  const renderProductItem = ({ item }) => {
    const formattedPrice = `R$ ${item.price.toFixed(2)}`;
    const formattedDate = item.lastPurchase.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return (
      <Card 
        style={[styles.productCard, isDarkMode && styles.cardDark]} 
        mode="outlined"
        onPress={() => handleOpenProduct(item)}
      >
        <Card.Content>
          <View style={styles.productHeader}>
            <View>
              <Text style={[styles.productName, isDarkMode && styles.textLight]}>{item.name}</Text>
              <Text style={[styles.productBrand, isDarkMode && styles.textLightSecondary]}>{item.brand}</Text>
            </View>
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => showProductMenu(item)}
            />
          </View>
          
          <View style={styles.productInfo}>
            <View style={styles.infoItem}>
              <Icon name="tag-outline" size={16} color={isDarkMode ? '#e0e0e0' : '#666'} />
              <Text style={[styles.infoText, isDarkMode && styles.textLightSecondary]}>
                {formattedPrice}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="barcode-scan" size={16} color={isDarkMode ? '#e0e0e0' : '#666'} />
              <Text style={[styles.infoText, isDarkMode && styles.textLightSecondary]}>
                {item.barcode}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="calendar-outline" size={16} color={isDarkMode ? '#e0e0e0' : '#666'} />
              <Text style={[styles.infoText, isDarkMode && styles.textLightSecondary]}>
                {formattedDate}
              </Text>
            </View>
          </View>
          
          <Chip 
            style={[styles.categoryChip, isDarkMode && styles.chipDark]} 
            textStyle={isDarkMode && styles.textLight}
            compact
          >
            {categories.find(cat => cat.id === item.category)?.name || 'Categoria'}
          </Chip>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Searchbar
        placeholder="Buscar produtos"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, isDarkMode && styles.searchBarDark]}
        inputStyle={isDarkMode && styles.textLight}
        iconColor={isDarkMode ? '#e0e0e0' : undefined}
      />
      
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map(category => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[styles.categoryFilterChip, isDarkMode && styles.chipDark]}
              textStyle={isDarkMode && styles.textLight}
            >
              {category.name}
            </Chip>
          ))}
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#e0e0e0' : '#0066cc'} />
          <Text style={[styles.loadingText, isDarkMode && styles.textLight]}>Carregando produtos...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="package-variant" size={80} color={isDarkMode ? '#555' : '#ccc'} />
          <Text style={[styles.emptyText, isDarkMode && styles.textLight]}>
            {searchQuery || selectedCategory !== 'all' ? 'Nenhum produto encontrado' : 'Você ainda não tem produtos cadastrados'}
          </Text>
          <Button 
            mode="contained" 
            onPress={handleAddProduct}
            style={styles.addButton}
          >
            Cadastrar Produto
          </Button>
        </View>
      )}
      
      <FAB
        style={[styles.fab, isDarkMode && styles.fabDark]}
        icon="plus"
        onPress={handleAddProduct}
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
            if (selectedProduct) {
              navigation.navigate('ProductDetail', { productId: selectedProduct.id });
            }
          }} 
          title="Editar produto" 
          leadingIcon="pencil"
        />
        <Menu.Item 
          onPress={() => {
            setMenuVisible(false);
            if (selectedProduct) {
              navigation.navigate('PriceAnalysis', { productId: selectedProduct.id });
            }
          }} 
          title="Análise de preços" 
          leadingIcon="chart-line"
        />
        <Divider />
        <Menu.Item 
          onPress={() => {
            setMenuVisible(false);
            if (selectedProduct) {
              Alert.alert(
                'Excluir Produto',
                `Deseja excluir o produto "${selectedProduct.name}"?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Excluir', 
                    onPress: () => {
                      // Implementar exclusão
                      const updatedProducts = products.filter(p => p.id !== selectedProduct.id);
                      setProducts(updatedProducts);
                      Alert.alert('Sucesso', 'Produto excluído com sucesso');
                    },
                    style: 'destructive' 
                  }
                ]
              );
            }
          }} 
          title="Excluir produto" 
          leadingIcon="delete"
        />
      </Menu>
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
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingRight: 16,
  },
  categoryFilterChip: {
    marginRight: 8,
  },
  chipDark: {
    backgroundColor: '#333',
  },
  listContainer: {
    paddingBottom: 80,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1e1e1e',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
  },
  productInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
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