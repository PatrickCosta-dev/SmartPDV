import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { PixService } from '../src/services/pixService';

export default function PixTest() {
  const [loading, setLoading] = useState(false);

  const testPixGeneration = async () => {
    setLoading(true);
    try {
      const result = await PixService.generatePixQRCodeWithConfig(10.50, 'Teste PIX - R$ 10,50');
      
      Alert.alert(
        'PIX Teste - Sucesso!',
        `QR Code gerado com sucesso!\n\nDados PIX: ${result.qrCodeData.substring(0, 100)}...\n\nImagem: ${result.qrCodeImage.substring(0, 50)}...`
      );
    } catch (error) {
      console.error('Erro no teste PIX:', error);
      Alert.alert('Erro', `Falha ao gerar PIX: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testPixValidation = () => {
    const testCases = [
      { key: 'teste@email.com', type: 'email', expected: true },
      { key: '12345678901', type: 'cpf', expected: true },
      { key: '12345678901234', type: 'cnpj', expected: true },
      { key: '11999999999', type: 'phone', expected: true },
      { key: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456', type: 'random', expected: true },
    ];

    testCases.forEach(({ key, type, expected }) => {
      const result = PixService.validatePixKey(key, type);
      console.log(`Teste ${type}: ${key} -> ${result} (esperado: ${expected})`);
    });

    Alert.alert('Validação PIX', 'Verifique o console para ver os resultados dos testes de validação.');
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text variant="headlineSmall">Teste PIX</Text>
      
      <Button
        mode="contained"
        onPress={testPixGeneration}
        loading={loading}
        icon="qrcode"
      >
        Testar Geração QR Code
      </Button>

      <Button
        mode="outlined"
        onPress={testPixValidation}
        icon="check-circle"
      >
        Testar Validação de Chaves
      </Button>
    </View>
  );
} 