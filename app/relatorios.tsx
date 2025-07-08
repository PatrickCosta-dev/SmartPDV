import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RelatoriosScreen() {
  return (
    <View style={placeholderStyles.container}>
      <Text>Tela de Relatórios</Text>
    </View>
  );
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});