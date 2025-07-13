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
        `QR Code gerado com sucesso!\n\nCNPJ: ${PixService.formatCNPJ('12345678000199')}\nValor: R$ 10,50\n\nDados PIX: ${result.qrCodeData.substring(0, 100)}...\n\nImagem: ${result.qrCodeImage.substring(0, 50)}...`
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
      { key: '12345678000199', type: 'cnpj', expected: true },
      { key: '12345678901234', type: 'cnpj', expected: true },
      { key: '11111111111111', type: 'cnpj', expected: false }, // CNPJ inválido
      { key: '12345678901', type: 'cnpj', expected: false }, // CPF em vez de CNPJ
    ];

    testCases.forEach(({ key, type, expected }) => {
      const result = PixService.validatePixKey(key, type);
      console.log(`Teste ${type}: ${key} -> ${result} (esperado: ${expected})`);
    });

    Alert.alert('Validação PIX', 'Verifique o console para ver os resultados dos testes de validação de CNPJ.');
  };

  const testCNPJFormatting = () => {
    const testCNPJs = [
      '12345678000199',
      '98765432000187',
      '11111111111111'
    ];

    testCNPJs.forEach(cnpj => {
      const formatted = PixService.formatCNPJ(cnpj);
      const cleaned = PixService.cleanCNPJ(formatted);
      console.log(`CNPJ: ${cnpj} -> Formatado: ${formatted} -> Limpo: ${cleaned}`);
    });

    Alert.alert('Formatação CNPJ', 'Verifique o console para ver os testes de formatação de CNPJ.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Testes PIX - CNPJ</Text>
      
      <Button
        mode="contained"
        onPress={testPixGeneration}
        loading={loading}
        style={styles.button}
        icon="qrcode-scan"
      >
        Testar Geração QR Code
      </Button>
      
      <Button
        mode="outlined"
        onPress={testPixValidation}
        style={styles.button}
        icon="check-circle"
      >
        Testar Validação CNPJ
      </Button>
      
      <Button
        mode="outlined"
        onPress={testCNPJFormatting}
        style={styles.button}
        icon="format-text"
      >
        Testar Formatação CNPJ
      </Button>
    </View>
  );
}

const styles = {
  container: {
    padding: 16
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 16,
    textAlign: 'center' as const
  },
  button: {
    marginBottom: 8
  }
}; 