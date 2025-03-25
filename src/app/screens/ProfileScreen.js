import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Avatar, Text, Button, TextInput, Divider, ActivityIndicator, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../services/storageService';

const ProfileScreen = () => {
  const { user, updateProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState({
    totalLists: 0,
    totalProducts: 0,
    totalSaved: 0
  });
  
  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || null);
      
      // Carregar estatísticas do usuário (simulado)
      loadUserStats();
    }
  }, [user]);
  
  // Função para carregar estatísticas do usuário
  const loadUserStats = async () => {
    // Aqui seria implementada a lógica para buscar estatísticas reais do banco de dados
    // Por enquanto, usamos dados simulados
    setStats({
      totalLists: 12,
      totalProducts: 87,
      totalSaved: 156.75
    });
  };
  
  // Selecionar imagem da galeria
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão necessária', 'É necessário permitir acesso à galeria de fotos.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };
  
  // Tirar foto com a câmera
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão necessária', 'É necessário permitir acesso à câmera.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    }
  };
  
  // Salvar alterações no perfil
  const saveProfile = async () => {
    try {
      setLoading(true);
      
      let photoURLToSave = user.photoURL;
      
      // Se a foto foi alterada, fazer upload
      if (photoURL && photoURL !== user.photoURL) {
        const uploadResult = await uploadImage(photoURL, `users/${user.uid}/profile`);
        if (uploadResult.success) {
          photoURLToSave = uploadResult.downloadURL;
        } else {
          throw new Error('Falha ao fazer upload da imagem');
        }
      }
      
      // Atualizar perfil
      const updateResult = await updateProfile({
        displayName,
        photoURL: photoURLToSave
      });
      
      if (updateResult.success) {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        setEditMode(false);
      } else {
        throw new Error(updateResult.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error