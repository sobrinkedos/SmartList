import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Avatar, Title, Caption, Paragraph, Drawer, Text, TouchableRipple, Switch } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const DrawerContent = (props) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const handleSignOut = async () => {
    await signOut();
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <View style={styles.userInfoSection}>
          <View style={styles.userRow}>
            <Avatar.Image 
              source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/default-avatar.png')} 
              size={50} 
            />
            <View style={styles.userInfo}>
              <Title style={styles.title}>{user?.displayName || 'Usuário'}</Title>
              <Caption style={styles.caption}>{user?.email || 'Sem email'}</Caption>
            </View>
          </View>
        </View>

        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem 
            icon={({color, size}) => (
              <Icon name="home-outline" color={color} size={size} />
            )}
            label="Início"
            onPress={() => {props.navigation.navigate('HomeTab')}}
          />
          <DrawerItem 
            icon={({color, size}) => (
              <Icon name="format-list-bulleted" color={color} size={size} />
            )}
            label="Minhas Listas"
            onPress={() => {props.navigation.navigate('ListsTab')}}
          />
          <DrawerItem 
            icon={({color, size}) => (
              <Icon name="barcode-scan" color={color} size={size} />
            )}
            label="Produtos"
            onPress={() => {props.navigation.navigate('ProductsTab')}}
          />
          <DrawerItem 
            icon={({color, size}) => (
              <Icon name="chart-line" color={color} size={size} />
            )}
            label="Análise de Preços"
            onPress={() => {props.navigation.navigate('AnalysisTab')}}
          />
        </Drawer.Section>

        <Drawer.Section title="Preferências">
          <TouchableRipple onPress={toggleTheme}>
            <View style={styles.preference}>
              <Text>Tema Escuro</Text>
              <View pointerEvents="none">
                <Switch value={isDarkTheme} />
              </View>
            </View>
          </TouchableRipple>
        </Drawer.Section>

        <Drawer.Section style={styles.bottomDrawerSection}>
          <DrawerItem 
            icon={({color, size}) => (
              <Icon name="account-outline" color={color} size={size} />
            )}
            label="Perfil"
            onPress={() => {props.navigation.navigate('Profile')}}
          />
          <DrawerItem 
            icon={({color, size}) => (
              <Icon name="cog-outline" color={color} size={size} />
            )}
            label="Configurações"
            onPress={() => {props.navigation.navigate('Settings')}}
          />
          <DrawerItem 
            icon={({color, size}) => (
              <Icon name="exit-to-app" color={color} size={size} />
            )}
            label="Sair"
            onPress={handleSignOut}
          />
        </Drawer.Section>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
    paddingVertical: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 15,
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    marginTop: 3,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  drawerSection: {
    marginTop: 15,
  },
  bottomDrawerSection: {
    marginBottom: 15,
    borderTopColor: '#f4f4f4',
    borderTopWidth: 1,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

export default DrawerContent;