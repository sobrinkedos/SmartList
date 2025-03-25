import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { TextInput, Button, IconButton, Divider, Chip, ActivityIndicator, Portal, Dialog, Menu } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useTheme } from '../contexts/ThemeContext';

const ProductDetailScreen = ({ route, navigation }) => {
  const { isDarkMode } = useTheme();
  const { productId, isNew } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(isNew ? {
    name: '',
    brand: '',
    category: 'outros',
    barcode: '',
    price: '',
    unit: 'un',
    quantity: '1',
    imageUrl: null,
  } : null);
  
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  
  // Categorias disponíveis
  const categories = [
    { id: 'alimentos', name: 'Alimentos' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'limpeza', name: 'Limpeza' },
    { id: 'higiene', name: 'Higiene' },
    { id: 'outros', name: 'Outros' },
  ];
  
  // Unidades disponíveis
  const units = [
    { id: 'un', name: 'Unidade' },
    { id: 'kg', name: 'Quilograma' },
    { id: 'g', name: 'Grama' },
    { id: 'l', name: 'Litro' },
    { id: 'ml', name: 'Mililitro' },
    { id: 'cx', name: 'Caixa' },
    { id: 'pct', name: 'Pacote' },
  ];
  
  // Carregar dados do produto
  useEffect(() => {
    const loadProduct = async () => {
      if (isNew) {
        setLoading(false);
        return;
      }
      
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
          ];
          
          const foundProduct = mockProducts.find(p => p.id === productId);
          if (foundProduct) {
            setProduct({
              ...foundProduct,
              price: foundProduct.price.toString(),
              quantity: foundProduct.quantity.toString(),
            });
          }
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do produto');
        setLoading(false);
      }
    };
    
    // Verificar permissão da câmera
    const checkCameraPermission = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    };
    
    loadProduct();
    checkCameraPermission();
  }, [productId, isNew]);
  
  // Atualizar campo do produto
  const updateField = (field, value) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };
  
  // Selecionar imagem da galeria
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateField('imageUrl', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };
  
  // Capturar código de barras
  const handleBarCodeScanned = ({ type, data }) => {
    updateField('barcode', data);
    setShowBarcodeScanner(false);
    Alert.alert('Sucesso', `Código de barras capturado: ${data}`);
  };
  
  // Salvar produto
  const handleSaveProduct = () => {
    if (!product.name.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o produto');
      return;
    }
    
    try {
      // Converter campos numéricos
      const price = product.price ? parseFloat(product.price.replace(',', '.')) : null;
      const quantity = parseFloat(product.quantity) || 1;
      
      const productToSave = {
        ...product,
        price,
        quantity,
        lastPurchase: new Date(),
      };
      
      if (isNew) {
        // Adicionar ID para novo produto
        productToSave.id = Date.now().toString();
      }
      
      // Em uma implementação real, aqui salvaria no banco de dados
      console.log('Produto salvo:', productToSave);
      
      Alert.alert('Sucesso', 'Produto salvo com sucesso', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Não foi possível salvar o produto');
    }
  };
  
  // Excluir produto
  const handleDeleteProduct = () => {
    Alert.alert(
      'Excluir Produto',
      'Tem certeza que deseja excluir este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          onPress: () => {
            // Em uma implementação real, aqui excluiria do banco de dados
            console.log('Produto excluído:', productId);
            navigation.goBack();
          },
          style: 'destructive' 
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#e0e0e0' : '#0066cc'} />
        <Text style={[styles.loadingText, isDarkMode && styles.textLight]}>Carregando...</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Imagem do produto */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.imagePlaceholder, isDarkMode && styles.imagePlaceholderDark]}>
              <Icon name="image-outline" size={80} color={isDarkMode ? '#555' : '#ccc'} />
            </View>
          )}
          <Button 
            mode="contained" 
            onPress={pickImage}
            style={styles.imageButton}
            icon="camera"
          >
            {product.imageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
          </Button>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Informações básicas */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>Informações Básicas</Text>
          
          <TextInput
            label="Nome do Produto"
            value={product.name}
            onChangeText={(text) => updateField('name', text)}
            style={[styles.input, isDarkMode && styles.inputDark]}
            mode="outlined"
          />
          
          <TextInput
            label="Marca"
            value={product.brand}
            onChangeText={(text) => updateField('brand', text)}
            style={[styles.input, isDarkMode && styles.inputDark]}
            mode="outlined"
          />
          
          <View style={styles.categoryContainer}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textLightSecondary]}>Categoria</Text>
            <TouchableOpacity 
              style={[styles.categorySelector, isDarkMode && styles.categorySelectorDark]}
              onPress={() => setShowCategoryMenu(true)}
            >
              <Text style={isDarkMode && styles.textLight}>
                {categories.find(cat => cat.id === product.category)?.name || 'Selecione uma categoria'}
              </Text>
              <Icon name="chevron-down" size={20} color={isDarkMode ? '#e0e0e0' : '#666'} />
            </TouchableOpacity>
            
            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={<View />}
              style={[styles.menu, isDarkMode && styles.menuDark]}
            >
              {categories.map(category => (
                <Menu.Item
                  key={category.id}
                  onPress={() => {
                    updateField('category', category.id);
                    setShowCategoryMenu(false);
                  }}
                  title={category.name}
                />
              ))}
            </Menu>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Código de barras */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>Código de Barras</Text>
          
          <View style={styles.barcodeContainer}>
            <TextInput
              label="Código de Barras"
              value={product.barcode}
              onChangeText={(text) => updateField('barcode', text)}
              style={[styles.barcodeInput, isDarkMode && styles.inputDark]}
              mode="outlined"
              keyboardType="numeric"
            />
            <IconButton
              icon="barcode-scan"
              size={24}
              onPress={() => setShowBarcodeScanner(true)}
              style={styles.scanButton}
            />
          </View>
          
          {showBarcodeScanner && (
            <Portal>
              <Dialog visible={showBarcodeScanner} onDismiss={() => setShowBarcodeScanner(false)}>
                <Dialog.Title>Escanear Código de Barras</Dialog.Title>
                <Dialog.Content>
                  {hasCameraPermission === null ? (
                    <Text>Solicitando permissão da câmera...</Text>
                  ) : hasCameraPermission === false ? (
                    <Text>Sem acesso à câmera</Text>
                  ) : (
                    <View style={styles.scannerContainer}>
                      <BarCodeScanner
                        onBarCodeScanned={handleBarCodeScanned}
                        style={styles.scanner}
                      />
                    </View>
                  )}
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowBarcodeScanner(false)}>Cancelar</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Preço e quantidade */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>Preço e Quantidade</Text>
          
          <View style={styles.rowContainer}>
            <TextInput
              label="Preço"
              value={product.price}
              onChangeText={(text) => updateField('price', text)}
              style={[styles.input, styles.halfInput, isDarkMode && styles.inputDark]}
              mode="outlined"
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="R$" />}
            />
            
            <View style={styles.unitContainer}>
              <TextInput
                label="Quantidade"
                value={product.quantity}
                onChangeText={(text) => updateField('quantity', text)}
                style={[styles.input, styles.quantityInput, isDarkMode && styles.inputDark]}
                mode="outlined"
                keyboardType="decimal-pad"
              />
              
              <View style={styles.unitSelector}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.textLightSecondary]}>Unidade</Text>
                <TouchableOpacity 
                  style={[styles.unitButton, isDarkMode && styles.unitButtonDark]}
                  onPress={() => {
                    // Adicionar lógica para selecionar unidade
                  }}
                >
                  <Text style={isDarkMode && styles.textLight}>
                    {units.find(unit => unit.id === product.unit)?.name || 'Selecione uma unidade'}
                  </Text>
                  <Icon name="chevron-down" size={20} color={isDarkMode ? '#e0e0e0' : '#666'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={handleSaveProduct}
            style={styles.saveButton}
            icon="content-save"
          >
            Salvar
          </Button>
          {!isNew && (
            <Button 
              mode="contained" 
              onPress={handleDeleteProduct}
              style={styles.deleteButton}
              icon="delete"
            >
              Excluir
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductDetailScreen;