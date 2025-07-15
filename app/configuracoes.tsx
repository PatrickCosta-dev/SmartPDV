import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
    Button,
    Card,
    List,
    Switch,
    Text,
    Title
} from 'react-native-paper';
import BackupManagerDialog from '../components/BackupManagerDialog';

export default function ConfiguracoesScreen() {
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Configurações</Title>



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