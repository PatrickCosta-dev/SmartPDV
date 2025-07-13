// App.tsx

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'; // Importado
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

<<<<<<< HEAD
// Logger
import log from './src/utils/logger';

=======
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
// Telas
import CustomersScreen from './app/clientes'; // Tela de clientes
import ConfiguracoesScreen from './app/configuracoes'; // Tela de configurações
import DashboardScreen from './app/dashboard'; // Tela de dashboard
import InventoryScreen from './app/estoque'; // Tela de estoque
import PDVScreen from './app/pdv'; // Tela do PDV
import ReportsScreen from './app/relatorios'; // Tela de relatórios
import AddProductScreen from './screens/AddProductScreen'; // Tela de formulário
import ProductsListScreen from './screens/ProductsListScreen'; // Tela de lista

// Banco de Dados
import { initDatabase } from './src/database';

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
<<<<<<< HEAD
        log.info('Banco de dados inicializado com sucesso!');
      } catch (e) {
        log.error('Falha ao inicializar o banco de dados:', e);
=======
        console.log('Banco de dados inicializado!');
      } catch (e) {
        console.error('Falha ao inicializar o banco de dados', e);
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
      }
    }
    initializeDb();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Dashboard"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName = 'help'; // Icon padrão
              if (route.name === 'Dashboard') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              else if (route.name === 'PDV') iconName = 'point-of-sale';
              else if (route.name === 'ProdutosStack') iconName = focused ? 'package-variant-closed' : 'package-variant-closed-outline';
              else if (route.name === 'Clientes') iconName = focused ? 'account-group' : 'account-group-outline';
              else if (route.name === 'Estoque') iconName = focused ? 'warehouse' : 'warehouse-outline';
              else if (route.name === 'Relatórios') iconName = 'chart-bar';
              else if (route.name === 'Configurações') iconName = focused ? 'cog' : 'cog-outline';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6200ee',
            tabBarInactiveTintColor: 'gray',
            headerShown: false, // Esconde o header padrão das abas
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: true, title: 'Dashboard' }}/>
          <Tab.Screen name="PDV" component={PDVScreen} options={{ title: 'Frente de Caixa', headerShown: true }}/>
          {/* A aba "Produtos" agora usa o NAVEGADOR DE PILHA */}
          <Tab.Screen
            name="ProdutosStack"
            component={ProductStackNavigator}
            options={{ title: 'Produtos' }}
          />
          <Tab.Screen name="Clientes" component={CustomersScreen} options={{ headerShown: true }}/>
          <Tab.Screen name="Estoque" component={InventoryScreen} options={{ headerShown: true }}/>
          <Tab.Screen name="Relatórios" component={ReportsScreen} options={{ headerShown: true }} />
          <Tab.Screen name="Configurações" component={ConfiguracoesScreen} options={{ headerShown: true }} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}