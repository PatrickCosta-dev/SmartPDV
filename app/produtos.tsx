// app/produtos.tsx

import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AddProductScreen from '../screens/AddProductScreen';
import ProductsListScreen from '../screens/ProductsListScreen';

const Stack = createStackNavigator();

// AGORA SEM O NAVIGATION CONTAINER EM VOLTA
export default function ProductStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // O header será controlado pelo layout principal
      }}
    >
      <Stack.Screen
        name="ProductList"
        component={ProductsListScreen}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
      />
    </Stack.Navigator>
  );
}