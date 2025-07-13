import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
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
import { PixConfig, PixService } from '../src/services/pixService';

export default function ConfiguracoesScreen() {
  const [pixConfig, setPixConfig] = useState<PixConfig>({
    pixKey: '12345678000199',
    pixKeyType: 'cnpj',
    beneficiaryName: 'SmartPDV Store',
    beneficiaryCity: 'SAO PAULO'
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
        Alert.alert('Erro', 'O CNPJ é obrigatório');
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

      // Validar CNPJ
      if (!PixService.validatePixKey(pixConfig.pixKey, 'cnpj')) {
        Alert.alert('Erro', 'CNPJ inválido. Verifique o número digitado.');
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
        `QR Code gerado com sucesso!\n\nCNPJ: ${PixService.formatCNPJ(pixConfig.pixKey)}\nValor: R$ 10,00\n\nDados PIX: ${result.qrCodeData.substring(0, 100)}...`
      );
    } catch (error) {
      console.error('Erro no teste PIX:', error);
      Alert.alert('Erro', 'Não foi possível gerar o QR Code de teste.');
    }
  };

  const clearPixConfig = async () => {
    try {
      await PixService.saveConfig({
        pixKey: '58631747000128',
        pixKeyType: 'cnpj',
        beneficiaryName: 'SmartPDV Store',
        beneficiaryCity: 'SAO PAULO'
      });
      Alert.alert('Sucesso', 'Configurações PIX resetadas para padrão!');
      loadPixConfig(); // Recarregar configurações
    } catch (error) {
      console.error('Erro ao resetar configurações PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível resetar as configurações PIX: ${errorMessage}`);
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
            Configure seu CNPJ para receber pagamentos PIX
          </Text>

          <Divider style={styles.divider} />

          <TextInput
            label="CNPJ"
            value={pixConfig.pixKey}
            onChangeText={(text) => {
              const cleanText = text.replace(/\D/g, '');
              setPixConfig(prev => ({ ...prev, pixKey: cleanText }));
            }}
            mode="outlined"
            style={styles.input}
            placeholder="58631747000128"
            keyboardType="numeric"
            maxLength={18}
          />

          <Text style={styles.helperText}>
            CNPJ formatado: {pixConfig.pixKey ? PixService.formatCNPJ(pixConfig.pixKey) : 'Não informado'}
          </Text>

          <TextInput
            label="Nome da Empresa"
            value={pixConfig.beneficiaryName}
            onChangeText={(text) => setPixConfig(prev => ({ ...prev, beneficiaryName: text }))}
            mode="outlined"
            style={styles.input}
            placeholder="Nome da sua empresa"
          />

          <TextInput
            label="Cidade"
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
              icon="refresh"
              buttonColor="#ffaa00"
            >
              Resetar Configurações
            </Button>
          </View>
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

const styles = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 20,
    textAlign: 'center' as const
  },
  card: {
    marginBottom: 16,
    elevation: 4
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 8
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  divider: {
    marginVertical: 16
  },
  input: {
    marginBottom: 16
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic' as const
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 8
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 16
  },
  button: {
    flex: 1,
    marginHorizontal: 4
  }
}; 