import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../src/database/productService';
import { salesDb } from '../src/database/salesService';
import { useCartStore } from '../src/store/cartStore';

export default function TabLayout() {
  const { loadCart, getItemCount } = useCartStore();

  useEffect(() => {
    // Inicializa o banco de dados de produtos
    db.initDatabase();
    
    // Inicializa o banco de dados de vendas
    salesDb.init();
    
    // Carrega o carrinho salvo
    loadCart();
  }, []);

  return (
    <PaperProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'help-circle';
            // NOME DO ÍCONE CORRIGIDO ABAIXO
            if (route.name === 'produtos') iconName = focused ? 'package-variant-closed' : 'package-variant';
            else if (route.name === 'clientes') iconName = focused ? 'account-group' : 'account-group-outline';
            else if (route.name === 'pdv') iconName = 'point-of-sale';
            else if (route.name === 'relatorios') iconName = 'chart-bar';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6200ee',
          headerShown: false,
        })}
      >
        <Tabs.Screen name="produtos" options={{ title: 'Produtos' }} />
        <Tabs.Screen name="clientes" options={{ title: 'Clientes', headerShown: true }} />
        <Tabs.Screen 
          name="pdv" 
          options={{ 
            title: 'Frente de Caixa', 
            headerShown: true,
            tabBarBadge: getItemCount() > 0 ? getItemCount() : undefined,
          }} 
        />
        <Tabs.Screen name="relatorios" options={{ title: 'Relatórios', headerShown: true }} />
      </Tabs>
    </PaperProvider>
  );
}
