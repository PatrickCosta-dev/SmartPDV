// screens/ProductsListScreen.tsx

import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, FAB, List, Snackbar, Title } from 'react-native-paper';
import type { Product } from '../src/database/productService';
import { db } from '../src/database/productService'; // Importa a 'db' correta
import { useCartStore } from '../src/store/cartStore';

export default function ProductsListScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Carrinho store
  const { addToCart, getItemById } = useCartStore();

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

  const handleAddToCart = (product: Product) => {
    // Verifica se já existe no carrinho
    const existingItem = getItemById(product.id);
    
    if (existingItem && existingItem.quantity >= product.stock) {
      setSnackbarMessage('Estoque insuficiente!');
      setSnackbarVisible(true);
      return;
    }

    // Adiciona ao carrinho
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock
    });

    setSnackbarMessage(`${product.name} adicionado ao carrinho!`);
    setSnackbarVisible(true);
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const cartItem = getItemById(item.id);
    const quantityInCart = cartItem?.quantity || 0;
    const availableStock = item.stock - quantityInCart;

    return (
      <List.Item
        title={item.name}
        description={`Estoque: ${item.stock} | Preço: R$ ${item.price.toFixed(2)}`}
        left={props => <List.Icon {...props} icon="package-variant-closed" />}
        right={() => (
          <View style={styles.itemActions}>
            {quantityInCart > 0 && (
              <Text style={styles.cartQuantity}>
                {quantityInCart} no carrinho
              </Text>
            )}
            <Button
              mode="contained"
              onPress={() => handleAddToCart(item)}
              disabled={availableStock <= 0}
              style={styles.addButton}
              compact
            >
              {availableStock <= 0 ? 'Sem estoque' : 'Adicionar'}
            </Button>
          </View>
        )}
      />
    );
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
          renderItem={renderProductItem}
        />
      )}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={navigateToAddProduct}
      />
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  itemActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  addButton: { 
    minWidth: 80 
  },
  cartQuantity: { 
    fontSize: 12, 
    color: '#666',
    marginRight: 8
  },
});