import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductService } from '../services/productService';
import { useAuth } from './AuthContext';

const ProductsContext = createContext({});

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'offline'
  const { user, isAuthenticated } = useAuth();

  // Carregar produtos ao iniciar
  useEffect(() => {
    loadProducts();
  }, []);

  // Carregar produtos do banco de dados local
  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await ProductService.getAllProducts();
      setProducts(result);
      return { success: true, products: result };
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Obter produto por ID
  const getProductById = async (id) => {
    try {
      const product = await ProductService.getProductById(id);
      return product;
    } catch (error) {
      console.error('Erro ao obter produto:', error);
      return null;
    }
  };

  // Adicionar novo produto
  const addProduct = async (productData) => {
    try {
      // Adicionar ID do usuário se estiver autenticado
      if (isAuthenticated && user) {
        productData.userId = user.uid;
      }

      const result = await ProductService.addProduct(productData);
      
      if (result.success) {
        // Atualizar lista de produtos
        setProducts(prevProducts => [...prevProducts, result.product]);
        
        // Tentar sincronizar com o Firestore se estiver autenticado
        if (isAuthenticated) {
          syncWithFirestore();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      return { success: false, error: error.message || 'Erro ao adicionar produto' };
    }
  };

  // Atualizar produto existente
  const updateProduct = async (productData) => {
    try {
      const result = await ProductService.updateProduct(productData);
      
      if (result.success) {
        // Atualizar lista de produtos
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productData.id ? result.product : product
          )
        );
        
        // Tentar sincronizar com o Firestore se estiver autenticado
        if (isAuthenticated) {
          syncWithFirestore();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return { success: false, error: error.message || 'Erro ao atualizar produto' };
    }
  };

  // Excluir produto
  const deleteProduct = async (productId) => {
    try {
      const result = await ProductService.deleteProduct(productId);
      
      if (result.success) {
        // Atualizar lista de produtos
        setProducts(prevProducts => 
          prevProducts.filter(product => product.id !== productId)
        );
        
        // Tentar sincronizar com o Firestore se estiver autenticado
        if (isAuthenticated) {
          syncWithFirestore();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      return { success: false, error: error.message || 'Erro ao excluir produto' };
    }
  };

  // Buscar produtos por texto
  const searchProducts = async (query) => {
    try {
      const result = await ProductService.searchProducts(query);
      return { success: true, products: result };
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return { success: false, error: error.message || 'Erro ao buscar produtos' };
    }
  };

  // Filtrar produtos por categoria
  const filterByCategory = async (category) => {
    try {
      const result = await ProductService.filterByCategory(category);
      return { success: true, products: result };
    } catch (error) {
      console.error('Erro ao filtrar produtos por categoria:', error);
      return { success: false, error: error.message || 'Erro ao filtrar produtos' };
    }
  };

  // Sincronizar com o Firestore
  const syncWithFirestore = async () => {
    try {
      setSyncStatus('syncing');
      const result = await ProductService.syncWithFirestore();
      setSyncStatus(result.success ? 'synced' : 'offline');
      return result;
    } catch (error) {
      console.error('Erro ao sincronizar com Firestore:', error);
      setSyncStatus('offline');
      return { success: false, error: error.message || 'Erro ao sincronizar com Firestore' };
    }
  };

  // Obter histórico de preços de um produto
  const getPriceHistory = async (productId) => {
    try {
      const result = await ProductService.getPriceHistory(productId);
      return { success: true, priceHistory: result };
    } catch (error) {
      console.error('Erro ao obter histórico de preços:', error);
      return { success: false, error: error.message || 'Erro ao obter histórico de preços' };
    }
  };

  // Adicionar registro de preço ao histórico
  const addPriceRecord = async (productId, price, storeId = null) => {
    try {
      const result = await ProductService.addPriceRecord(productId, price, storeId);
      return result;
    } catch (error) {
      console.error('Erro ao adicionar registro de preço:', error);
      return { success: false, error: error.message || 'Erro ao adicionar registro de preço' };
    }
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        syncStatus,
        loadProducts,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
        searchProducts,
        filterByCategory,
        syncWithFirestore,
        getPriceHistory,
        addPriceRecord,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => useContext(ProductsContext);