// screens/AddProductScreen.tsx

import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, TextInput } from 'react-native-paper';
import { db } from '../src/database/productService'; // Importa a 'db' correta

export default function AddProductScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const handleSaveProduct = async () => {
    // ... (lógica de validação continua a mesma)
    if (!name || !price || !stock) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    const priceFloat = parseFloat(price.replace(',', '.'));
    const stockInt = parseInt(stock, 10);
     if (isNaN(priceFloat) || isNaN(stockInt)) {
      alert('Preço e estoque devem ser números válidos.');
      return;
    }

    try {
      await db.addProduct({ name, price: priceFloat, stock: stockInt });
      alert('Produto salvo com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Ocorreu um erro ao salvar o produto.');
    }
  };

  return (
    <View style={styles.container}>
       <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Adicionar Produto" />
      </Appbar.Header>
      <View style={styles.formContainer}>
        <TextInput label="Nome do Produto" value={name} onChangeText={setName} style={styles.input} mode="outlined"/>
        <TextInput label="Preço (ex: 19.99)" value={price} onChangeText={setPrice} style={styles.input} keyboardType="numeric" mode="outlined"/>
        <TextInput label="Quantidade em Estoque" value={stock} onChangeText={setStock} style={styles.input} keyboardType="numeric" mode="outlined"/>
        <Button mode="contained" onPress={handleSaveProduct} style={styles.button}>
          Salvar Produto
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  formContainer: { flex: 1, padding: 16 },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
});