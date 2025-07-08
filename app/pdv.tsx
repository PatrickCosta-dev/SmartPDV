import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text, Title } from 'react-native-paper';

const cartItems = [
  { id: '1', name: 'Produto A', qty: 2, price: 10.50 },
  { id: '2', name: 'Produto B', qty: 1, price: 25.00 },
];

export default function PDVScreen() {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <View style={pdvStyles.container}>
      <Card style={pdvStyles.cartContainer}>
        <Card.Content>
          <Title>Carrinho de Compras</Title>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={pdvStyles.cartItem}>
                <Text style={pdvStyles.itemName}>{item.qty}x {item.name}</Text>
                <Text style={pdvStyles.itemPrice}>R$ {(item.price * item.qty).toFixed(2)}</Text>
              </View>
            )}
          />
          <View style={pdvStyles.totalContainer}>
            <Title>Total:</Title>
            <Title>R$ {total.toFixed(2)}</Title>
          </View>
        </Card.Content>
      </Card>
      <Button icon="cash-register" mode="contained" onPress={() => alert('Venda Finalizada!')}>
        Finalizar Venda
      </Button>
    </View>
  );
}

const pdvStyles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6f6f6' },
  cartContainer: { flex: 1, marginBottom: 16 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#333' },
});