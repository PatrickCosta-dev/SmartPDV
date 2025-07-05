// App.tsx

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'; // Importado
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Telas
import AddProductScreen from './screens/AddProductScreen'; // Tela de formulário
import CustomersScreen from './screens/CustomersScreen';
import PDVScreen from './screens/PDVScreen'; // Supondo que você mantenha os outros
import ProductsListScreen from './screens/ProductsListScreen'; // Tela de lista
import ReportsScreen from './screens/ReportsScreen';

// Banco de Dados
import { initDatabase } from './src/database/productService';

// --- Navegador da Pilha de Produtos ---
const ProductStack = createStackNavigator();

function ProductStackNavigator() {
  return (
    <ProductStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#6200ee' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProductStack.Screen
        name="ProductList"
        component={ProductsListScreen}
        options={{ title: 'Meus Produtos' }}
      />
      <ProductStack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Adicionar Produto' }}
      />
    </ProductStack.Navigator>
  );
}

// --- Navegador Principal (Abas) ---
const Tab = createBottomTabNavigator();

export default function App() {
  // Inicializa o banco de dados quando o app carrega
  useEffect(() => {
    async function initializeDb() {
      try {
        await initDatabase();
        console.log('Banco de dados inicializado!');
      } catch (e) {
        console.error('Falha ao inicializar o banco de dados', e);
      }
    }
    initializeDb();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="PDV"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'PDV') iconName = 'point-of-sale';
              else if (route.name === 'ProdutosStack') iconName = focused ? 'package-variant-closed' : 'package-variant-closed-outline';
              else if (route.name === 'Clientes') iconName = focused ? 'account-group' : 'account-group-outline';
              else if (route.name === 'Relatórios') iconName = 'chart-bar';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6200ee',
            tabBarInactiveTintColor: 'gray',
            headerShown: false, // Esconde o header padrão das abas
          })}
        >
          {/* A aba "Produtos" agora usa o NAVEGADOR DE PILHA */}
          <Tab.Screen
            name="ProdutosStack"
            component={ProductStackNavigator}
            options={{ title: 'Produtos' }}
          />
          <Tab.Screen name="Clientes" component={CustomersScreen} options={{ headerShown: true }}/>
          <Tab.Screen name="PDV" component={PDVScreen} options={{ title: 'Frente de Caixa', headerShown: true }}/>
          <Tab.Screen name="Relatórios" component={ReportsScreen} options={{ headerShown: true }} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}