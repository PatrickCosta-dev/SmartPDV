import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  List,
  Switch,
  Text,
  TextInput,
  Title
} from 'react-native-paper';
import BackupManagerDialog from '../components/BackupManagerDialog';
import PixTest from '../components/PixTest';
import { PixConfig, PixService } from '../src/services/pixService';

export default function ConfiguracoesScreen() {
  const [pixConfig, setPixConfig] = useState<PixConfig>({
    pixKey: '',
    pixKeyType: 'email',
    beneficiaryName: '',
    beneficiaryCity: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  useEffect(() => {
    loadPixConfig();
  }, []);

  const loadPixConfig = async () => {
    try {
      console.log('Carregando configurações PIX...');
      const config = await PixService.loadConfig();
      console.log('Configurações PIX carregadas:', config);
      setPixConfig(config);
    } catch (error) {
      console.error('Erro ao carregar configurações PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível carregar as configurações PIX: ${errorMessage}`);
    }
  };

  const savePixConfig = async () => {
    setIsLoading(true);
    try {
      // Validação das configurações
      if (!pixConfig.pixKey || !pixConfig.pixKey.trim()) {
        Alert.alert('Erro', 'A chave PIX é obrigatória');
        return;
      }

      if (!pixConfig.beneficiaryName || !pixConfig.beneficiaryName.trim()) {
        Alert.alert('Erro', 'O nome do beneficiário é obrigatório');
        return;
      }

      if (!pixConfig.beneficiaryCity || !pixConfig.beneficiaryCity.trim()) {
        Alert.alert('Erro', 'A cidade do beneficiário é obrigatória');
        return;
      }

      console.log('Tentando salvar configurações PIX:', pixConfig);
      await PixService.saveConfig(pixConfig);
      console.log('Configurações PIX salvas com sucesso');
      
      // Verificar se foi salvo corretamente
      const savedConfig = await PixService.loadConfig();
      console.log('Configurações carregadas após salvar:', savedConfig);
      
      Alert.alert('Sucesso', 'Configurações PIX salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível salvar as configurações PIX: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPixConfig = async () => {
    try {
      const result = await PixService.generatePixQRCodeWithConfig(10.00, 'Teste PIX');
      Alert.alert(
        'Teste PIX',
        `QR Code gerado com sucesso!\n\nChave: ${pixConfig.pixKey}\nValor: R$ 10,00\n\nDados PIX: ${result.qrCodeData.substring(0, 100)}...`
      );
    } catch (error) {
      console.error('Erro no teste PIX:', error);
      Alert.alert('Erro', 'Não foi possível gerar o QR Code de teste.');
    }
  };

  const clearPixConfig = async () => {
    try {
      await AsyncStorage.removeItem('@smartpdv_pix_config');
      Alert.alert('Sucesso', 'Configurações PIX limpas com sucesso!');
      loadPixConfig(); // Recarregar configurações
    } catch (error) {
      console.error('Erro ao limpar configurações PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível limpar as configurações PIX: ${errorMessage}`);
    }
  };

  const testAsyncStorage = async () => {
    try {
      console.log('Testando AsyncStorage...');
      
      // Teste de escrita
      await AsyncStorage.setItem('test_key', 'test_value');
      console.log('Valor salvo no AsyncStorage');
      
      // Teste de leitura
      const value = await AsyncStorage.getItem('test_key');
      console.log('Valor lido do AsyncStorage:', value);
      
      // Limpar teste
      await AsyncStorage.removeItem('test_key');
      console.log('Teste limpo');
      
      Alert.alert('Teste AsyncStorage', 'AsyncStorage está funcionando corretamente!');
    } catch (error) {
      console.error('Erro no teste AsyncStorage:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `AsyncStorage não está funcionando: ${errorMessage}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Configurações</Title>

      {/* Configurações PIX */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Configurações PIX</Title>
          <Text style={styles.cardDescription}>
            Configure suas informações PIX para receber pagamentos
          </Text>

          <Divider style={styles.divider} />

          <TextInput
            label="Chave PIX"
            value={pixConfig.pixKey}
            onChangeText={(text) => setPixConfig(prev => ({ ...prev, pixKey: text }))}
            mode="outlined"
            style={styles.input}
            placeholder="exemplo@email.com"
          />

          <Text style={styles.label}>Tipo de Chave PIX:</Text>
          <View style={styles.pixKeyTypes}>
            {[
              { value: 'email', label: 'Email' },
              { value: 'cpf', label: 'CPF' },
              { value: 'cnpj', label: 'CNPJ' },
              { value: 'phone', label: 'Telefone' },
              { value: 'random', label: 'Aleatória' }
            ].map((type) => (
              <Button
                key={type.value}
                mode={pixConfig.pixKeyType === type.value ? 'contained' : 'outlined'}
                onPress={() => setPixConfig(prev => ({ ...prev, pixKeyType: type.value as any }))}
                style={styles.pixKeyTypeButton}
                compact
              >
                {type.label}
              </Button>
            ))}
          </View>

          <TextInput
            label="Nome do Beneficiário"
            value={pixConfig.beneficiaryName}
            onChangeText={(text) => setPixConfig(prev => ({ ...prev, beneficiaryName: text }))}
            mode="outlined"
            style={styles.input}
            placeholder="Nome da sua empresa"
          />

          <TextInput
            label="Cidade do Beneficiário"
            value={pixConfig.beneficiaryCity}
            onChangeText={(text) => setPixConfig(prev => ({ ...prev, beneficiaryCity: text }))}
            mode="outlined"
            style={styles.input}
            placeholder="SAO PAULO"
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={testPixConfig}
              style={styles.button}
              icon="qrcode-scan"
            >
              Testar PIX
            </Button>
            
            <Button
              mode="contained"
              onPress={savePixConfig}
              loading={isLoading}
              style={styles.button}
              icon="content-save"
            >
              Salvar
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={clearPixConfig}
              style={styles.button}
              icon="delete"
              buttonColor="#ff4444"
            >
              Limpar Configurações
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={testAsyncStorage}
              style={styles.button}
              icon="bug"
              buttonColor="#ffaa00"
            >
              Testar AsyncStorage
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Teste PIX */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Teste PIX</Title>
          <Text style={styles.cardDescription}>
            Teste a funcionalidade PIX
          </Text>
          <PixTest />
        </Card.Content>
      </Card>

      {/* Configurações Gerais */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Configurações Gerais</Title>
          
          <List.Item
            title="Modo Escuro"
            description="Ativar tema escuro"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => <Switch value={false} onValueChange={() => {}} />}
          />
          
          <List.Item
            title="Notificações"
            description="Receber notificações de vendas"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />
          
          <List.Item
            title="Som de Venda"
            description="Tocar som ao finalizar venda"
            left={(props) => <List.Icon {...props} icon="volume-high" />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />
        </Card.Content>
      </Card>

      {/* Informações do Sistema */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Informações do Sistema</Title>
          
          <List.Item
            title="Versão"
            description="SmartPDV v1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          
          <List.Item
            title="Desenvolvedor"
            description="SmartPDV Team"
            left={(props) => <List.Icon {...props} icon="account-group" />}
          />
          
          <List.Item
            title="Suporte"
            description="contato@smartpdv.com"
            left={(props) => <List.Icon {...props} icon="email" />}
          />
        </Card.Content>
      </Card>

      {/* Backup e Sincronização */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Backup e Sincronização</Title>
          <Text style={styles.cardDescription}>
            Gerencie seus backups e sincronização na nuvem
          </Text>
          
          <Button
            mode="contained"
            onPress={() => setShowBackupDialog(true)}
            icon="backup-restore"
            style={styles.button}
          >
            Gerenciar Backups
          </Button>
        </Card.Content>
      </Card>

      <BackupManagerDialog
        visible={showBackupDialog}
        onDismiss={() => setShowBackupDialog(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f6f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  pixKeyTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pixKeyTypeButton: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
}); 