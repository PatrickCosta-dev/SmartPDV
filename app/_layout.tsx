import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { initDatabase } from '../src/database';
import { useCartStore } from '../src/store/cartStore';

export default function TabLayout() {
  const { loadCart, getItemCount } = useCartStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Inicializa todos os bancos de dados
        await initDatabase();
        
        // Carrega o carrinho salvo
        await loadCart();
        
        setIsInitialized(true);
        console.log('✅ Aplicativo inicializado com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao inicializar aplicativo:', error);
        // Mesmo com erro, marca como inicializado para não travar o app
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return null; // Tela de loading pode ser adicionada aqui
  }

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
            else if (route.name === 'estoque') iconName = focused ? 'warehouse' : 'warehouse';
            else if (route.name === 'configuracoes') iconName = focused ? 'cog' : 'cog-outline';
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
        <Tabs.Screen name="estoque" options={{ title: 'Estoque', headerShown: true }} />
        <Tabs.Screen name="configuracoes" options={{ title: 'Configurações', headerShown: true }} />
      </Tabs>
    </PaperProvider>
  );
}
