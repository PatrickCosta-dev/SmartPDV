// screens/ProductsListScreen.tsx

import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Appbar, FAB, List, Title } from 'react-native-paper';
import type { Product } from '../src/database/productService';
import { db } from '../src/database/productService'; // Importa a 'db' correta

export default function ProductsListScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await db.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchProducts();
    }
  }, [isFocused]);
  
  const navigateToAddProduct = () => {
    navigation.navigate('AddProduct' as never);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Meus Produtos" />
      </Appbar.Header>
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={styles.loading} />
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Title>Nenhum produto cadastrado</Title>
          <Text>Use o botão '+' para adicionar seu primeiro produto.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={`Estoque: ${item.stock} | Preço: R$ ${item.price.toFixed(2)}`}
              left={props => <List.Icon {...props} icon="package-variant-closed" />}
            />
          )}
        />
      )}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={navigateToAddProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});