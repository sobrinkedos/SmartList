import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Searchbar, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const PriceAnalysisScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 3m, 6m, 1y
  
  // Carregar dados de produtos
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
              category: 'Alimentos',
              currentPrice: 22.90,
              lowestPrice: 18.50,
              highestPrice: 24.99,
              priceHistory: [
                { date: '2023-01', price: 21.90 },
                { date: '2023-02', price: 22.50 },
                { date: '2023-03', price: 23.90 },
                { date: '2023-04', price: 24.99 },
                { date: '2023-05', price: 23.50 },
                { date: '2023-06', price: 22.90 },
                { date: '2023-07', price: 21.50 },
                { date: '2023-08', price: 20.90 },
                { date: '2023-09', price: 19.90 },
                { date: '2023-10', price: 18.50 },
                { date: '2023-11', price: 19.90 },
                { date: '2023-12', price: 22.90 },
              ],
              prediction: {
                nextMonth: 21.50,
                trend: 'down',
                confidence: 0.85,
              },
              stores: [
                { name: 'Supermercado A', price: 22.90 },
                { name: 'Supermercado B', price: 23.50 },
                { name: 'Supermercado C', price: 21.90 },
              ],
            },
            {
              id: '2',
              name: 'Leite Desnatado',
              brand: 'Marca B',
              category: 'Laticínios',
              currentPrice: 4.99,
              lowestPrice: 4.50,
              highestPrice: 5.99,
              priceHistory: [
                { date: '2023-01', price: 4.50 },
                { date: '2023-02', price: 4.50 },
                { date: '2023-03', price: 4.75 },
                { date: '2023-04', price: 4.90 },
                { date: '2023-05', price: 5.25 },
                { date: '2023-06', price: 5.50 },
                { date: '2023-07', price: 5.99 },
                { date: '2023-08', price: 5.75 },
                { date: '2023-09', price: 5.50 },
                { date: '2023-10', price: 5.25 },
                { date: '2023-11', price: 4.99 },
                { date: '2023-12', price: 4.99 },
              ],
              prediction: {
                nextMonth: 5.25,
                trend: 'up',
                confidence: 0.70,
              },
              stores: [
                { name: 'Supermercado A', price: 4.99 },
                { name: 'Supermercado B', price: 5.25 },
                { name: 'Supermercado C', price: 4.75 },
              ],
            },
          ];
          
          setProducts(mockProducts);
          setFilteredProducts(mockProducts);
          setSelectedProduct(mockProducts[0]);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Erro ao carregar dados de produtos:', error);
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Filtrar produtos com base na pesquisa
  useEffect(() => {
    if (products.length > 0) {
      if (searchQuery.trim() === '') {
        setFilteredProducts(products);
      } else {
        const filtered = products.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
      }
    }
  }, [products, searchQuery]);
  
  // Filtrar dados do histórico de preços com base no intervalo de tempo selecionado
  const getFilteredPriceHistory = () => {
    if (!selectedProduct || !selectedProduct.priceHistory || !selectedProduct.priceHistory.length) {
      return [];
    }

    const now = new Date();
    let filterDate = new Date();

    switch (timeRange) {
      case '1m':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        filterDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return selectedProduct.priceHistory;
    }

    return selectedProduct.priceHistory.filter(item => new Date(item.date) >= filterDate);
  };
  
  return (
    <View style={styles.container}>
      {/* Resto do componente */}
    </View>
  );
};

export default PriceAnalysisScreen;