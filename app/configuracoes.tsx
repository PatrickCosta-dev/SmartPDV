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
import type { PixConfig } from '../src/services/pixService';
import { pixService } from '../src/services/pixService';

export default function ConfiguracoesScreen() {
  const [pixConfig, setPixConfig] = useState<PixConfig>({
    pixKey: 'smartpdv@exemplo.com',
    pixKeyType: 'email',
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
      // Em uma implementação real, carregaria do storage
      // Por enquanto, usa os valores padrão
    } catch (error) {
      console.error('Erro ao carregar configurações PIX:', error);
    }
  };

  const savePixConfig = async () => {
    setIsLoading(true);
    try {
      pixService.setConfig(pixConfig);
      Alert.alert('Sucesso', 'Configurações PIX salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações PIX:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações PIX.');
    } finally {
      setIsLoading(false);
    }
  };

  const testPixConfig = async () => {
    try {
      // Simula uma venda de teste
      const testSale = {
        id: 'test_001',
        items: [{ id: 1, name: 'Produto Teste', price: 10.00, quantity: 1 }],
        subtotal: 10.00,
        total: 10.00,
        discount: 0,
        finalTotal: 10.00,
        paymentMethod: 'pix',
        date: new Date().toISOString(),
        customerName: 'Cliente Teste',
        notes: 'Venda de teste'
      };

      const payment = await pixService.generatePixPayment(testSale);
      Alert.alert(
        'Teste PIX',
        `QR Code gerado com sucesso!\n\nChave: ${payment.pixKey}\nValor: R$ ${payment.amount.toFixed(2)}\n\nID do Pagamento: ${payment.id}`
      );
    } catch (error) {
      console.error('Erro no teste PIX:', error);
      Alert.alert('Erro', 'Não foi possível gerar o QR Code de teste.');
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