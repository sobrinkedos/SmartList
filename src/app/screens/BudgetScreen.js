import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, TextInput, Button, ProgressBar, Divider, FAB, Portal, Dialog, IconButton } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const BudgetScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingBudget, setEditingBudget] = useState(null);
  
  // Meses para seleção
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Carregar dados de orçamento
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        // Simulação de carregamento de dados
        // Em uma implementação real, esses dados viriam do banco de dados
        setTimeout(() => {
          const mockBudgets = [
            {
              id: '1',
              name: 'Orçamento Mensal',
              amount: 500,
              spent: 320.50,
              month: new Date().getMonth(),
              year: new Date().getFullYear(),
              categories: [
                { name: 'Alimentos', amount: 200, spent: 180.30, color: '#FF6384' },
                { name: 'Limpeza', amount: 100, spent: 65.20, color: '#36A2EB' },
                { name: 'Bebidas', amount: 80, spent: 45.00, color: '#FFCE56' },
                { name: 'Outros', amount: 120, spent: 30.00, color: '#4BC0C0' },
              ],
            },
            {
              id: '2',
              name: 'Festa de Aniversário',
              amount: 300,
              spent: 150.75,
              month: new Date().getMonth(),
              year: new Date().getFullYear(),
              categories: [
                { name: 'Comida', amount: 150, spent: 120.50, color: '#FF6384' },
                { name: 'Bebidas', amount: 100, spent: 30.25, color: '#36A2EB' },
                { name: 'Decoração', amount: 50, spent: 0, color: '#FFCE56' },
              ],
            },
          ];
          
          setBudgets(mockBudgets);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar dados de orçamento:', error);
        setLoading(false);
      }
    };
    
    loadBudgets();
  }, []);
  
  // Filtrar orçamentos por mês e ano
  const getFilteredBudgets = () => {
    return budgets.filter(budget => 
      budget.month === selectedMonth && budget.year === selectedYear
    );
  };
  
  // Calcular totais
  const calculateTotals = () => {
    const filtered = getFilteredBudgets();
    
    const total = filtered.reduce((sum, budget) => sum + budget.amount, 0);
    const spent = filtered.reduce((sum, budget) => sum + budget.spent, 0);
    const remaining = total - spent;
    const percentage = total > 0 ? Math.round((spent / total) * 100) : 0;
    
    return { total, spent, remaining, percentage };
  };
  
  // Adicionar novo orçamento
  const handleAddBudget = () => {
    if (!budgetName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o orçamento');
      return;
    }
    
    const amount = parseFloat(budgetAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido para o orçamento');
      return;
    }
    
    const newBudget = {
      id: Date.now().toString(),
      name: budgetName.trim(),
      amount,
      spent: 0,
      month: selectedMonth,
      year: selectedYear,
      categories: [],
    };
    
    setBudgets([...budgets, newBudget]);
    setBudgetName('');
    setBudgetAmount('');
    setShowAddDialog(false);
  };
  
  // Atualizar orçamento existente
  const handleUpdateBudget = () => {
    if (!editingBudget) return;
    
    if (!budgetName.trim()) {
      Alert.alert('Erro', 'Por favor, insira um nome para o orçamento');
      return;
    }
    
    const amount = parseFloat(budgetAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido para o orçamento');
      return;
    }
    
    const updatedBudgets = budgets.map(budget => {
      if (budget.id === editingBudget.id) {
        return {
          ...budget,
          name: budgetName.trim(),
          amount,
        };
      }
      return budget;
    });
    
    setBudgets(updatedBudgets);
    setBudgetName('');
    setBudgetAmount('');
    setEditingBudget(null);
    setShowAddDialog(false);
  };
  
  // Remover orçamento
  const handleRemoveBudget = (budgetId) => {
    Alert.alert(
      'Remover Orçamento',
      'Tem certeza que deseja remover este orçamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          onPress: () => {
            const updatedBudgets = budgets.filter(budget => budget.id !== budgetId);
            setBudgets(updatedBudgets);
          },
          style: 'destructive' 
        }
      ]
    );
  };
  
  // Preparar dados para o gráfico
  const getChartData = (budget) => {
    return budget.categories.map(category => ({
      name: category.name,
      spent: category.spent,
      color: category.color,
      legendFontColor: isDarkMode ? '#e0e0e0' : '#7F7F7F',
      legendFontSize: 12,
    }));
  };
  
  // Renderizar orçamento
  const renderBudgetItem = (budget) => {
    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) : 0;
    const remaining = budget.amount - budget.spent;
    
    return (
      <Card 
        key={budget.id} 
        style={[styles.budgetCard, isDarkMode && styles.cardDark]} 
        mode="outlined"
      >
        <Card.Content>
          <View style={styles.budgetHeader}>
            <Title style={isDarkMode && styles.textLight}>{budget.name}</Title>
            <View style={styles.budgetActions}>
              <IconButton
                icon="pencil-outline"
                size={20}
                onPress={() => {
                  setEditingBudget(budget);
                  setBudgetName(budget.name);
                  setBudgetAmount(budget.amount.toString());
                  setShowAddDialog(true);
                }}
              />
              <IconButton
                icon="delete-outline"
                size={20}
                onPress={() => handleRemoveBudget(budget.id)}
              />
            </View>
          </View>
          
          <View style={styles.budgetInfo}>
            <View style={styles.budgetAmounts}>
              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, isDarkMode && styles.textLightSecondary]}>Total</Text>
                <Text style={[styles.amountValue, isDarkMode && styles.textLight]}>R$ {budget.amount.toFixed(2)}</Text>
              </View>
              
              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, isDarkMode && styles.textLightSecondary]}>Gasto</Text>
                <Text style={[styles.amountValue, isDarkMode && styles.textLight]}>R$ {budget.spent.toFixed(2)}</Text>
              </View>
              
              <View style={styles.amountItem}>
                <Text style={[styles.amountLabel, isDarkMode && styles.textLightSecondary]}>Restante</Text>
                <Text style={[styles.amountValue, isDarkMode && styles.textLight]}>R$ {remaining.toFixed(2)}</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={percentage} 
                color={percentage > 0.9 ? '#F44336' : '#4CAF50'} 
                style={styles.progressBar} 
              />
              <Text style={[styles.progressText, isDarkMode && styles.textLightSecondary]}>
                {Math.round(percentage * 100)}% utilizado
              </Text>
            </View>
          </View>
          
          {budget.categories.length > 0 && (
            <View style={styles.categoriesContainer}>
              <Divider style={styles.divider} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>Categorias</Text>
              
              <View style={styles.chartContainer}>
                <PieChart
                  data={getChartData(budget)}
                  width={width - 64}
                  height={180}
                  chartConfig={{
                    color: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="spent"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
              
              {budget.categories.map(category => {
                const catPercentage = category.amount > 0 ? (category.spent / category.amount) : 0;
                const catRemaining = category.amount - category.spent;
                
                return (
                  <View key={category.name} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryNameContainer}>
                        <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                        <Text style={[styles.categoryName, isDarkMode && styles.textLight]}>{category.name}</Text>
                      </View>
                      <Text style={[styles.categoryAmount, isDarkMode && styles.textLight]}>
                        R$ {category.spent.toFixed(2)} / R$ {category.amount.toFixed(2)}
                      </Text>
                    </View>
                    
                    <ProgressBar 
                      progress={catPercentage} 
                      color={category.color} 
                      style={styles.categoryProgress} 
                    />
                  </View>
                );
              })}
            </View>
          )}
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('CategoryDetail', { budgetId: budget.id })}
            style={styles.detailButton}
          >
            Gerenciar Categorias
          </Button>
        </Card.Content>
      </Card>
    );
  };
  
  const totals = calculateTotals();
  
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.monthSelector}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={() => {
            if (selectedMonth === 0) {
              setSelectedMonth(11);
              setSelectedYear(selectedYear - 1);
            } else {
              setSelectedMonth(selectedMonth - 1);
            }
          }}
        />
        <Text style={[styles.monthYear, isDarkMode && styles.textLight]}>
          {months[selectedMonth]} {selectedYear}
        </Text>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={() => {
            if (selectedMonth === 11) {
              setSelectedMonth(0);
              setSelectedYear(selectedYear + 1);
            } else {
              setSelectedMonth(selectedMonth + 1);
            }
          }}
        />
      </View>
      
      <Card style={[styles.summaryCard, isDarkMode && styles.cardDark]} mode="outlined">
        <Card.Content>
          <Text style={[styles.summaryTitle, isDarkMode && styles.textLight]}>Resumo do Mês</Text>
          
          <View style={styles.summaryInfo}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, isDarkMode && styles.textLightSecondary]}>Orçamento Total</Text>
              <Text style={[styles.summaryValue, isDarkMode && styles.textLight]}>R$ {totals.total.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, isDarkMode && styles.textLightSecondary]}>Gasto Total</Text>
              <Text style={[styles.summaryValue, isDarkMode && styles.textLight]}>R$ {totals.spent.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, isDarkMode && styles.textLightSecondary]}>Restante</Text>
              <Text style={[styles.summaryValue, isDarkMode && styles.textLight]}>R$ {totals.remaining.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, isDarkMode && styles.textLightSecondary]}>Percentual Utilizado</Text>
              <Text style={[styles.summaryValue, isDarkMode && styles.textLight]}>{totals.percentage}%</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDarkMode && styles.textLight]}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView style={styles.budgetsContainer}>
          {getFilteredBudgets().map(budget => renderBudgetItem(budget))}
        </ScrollView>
      )}
      
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title style={[styles.dialogTitle, isDarkMode && styles.textLight]}>Adicionar Orçamento</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome do Orçamento"
              value={budgetName}
              onChangeText={text => setBudgetName(text)}
              style={[styles.textInput, isDarkMode && styles.textInputDark]}
            />
            <TextInput
              label="Valor do Orçamento"
              value={budgetAmount}
              onChangeText={text => setBudgetAmount(text)}
              style={[styles.textInput, isDarkMode && styles.textInputDark]}
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onPress={editingBudget ? handleUpdateBudget : handleAddBudget}>Salvar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <FAB
        icon="plus"
        style={[styles.fab, isDarkMode && styles.fabDark]}
        onPress={() => setShowAddDialog(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  containerDark: {
    backgroundColor: '#333',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: {
    margin: 16,
  },
  cardDark: {
    backgroundColor: '#444',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  budgetsContainer: {
    flex: 1,
    padding: 16,
  },
  budgetCard: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetInfo: {
    padding: 16,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    padding: 16,
  },
  progressBar: {
    height: 10,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chartContainer: {
    height: 200,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryNameContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryColor: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryProgress: {
    height: 10,
    borderRadius: 10,
  },
  detailButton: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textInput: {
    height: 40,
    borderColor: '#CCC',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  textInputDark: {
    backgroundColor: '#444',
    borderColor: '#555',
    color: '#FFF',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  fabDark: {
    backgroundColor: '#666',
  },
  textLight: {
    color: '#FFF',
  },
  textLightSecondary: {
    color: '#CCC',
  },
});

export default BudgetScreen;