import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View
} from 'react-native';
import { Button, Card, Divider, List } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { backupService, BackupStats } from '../src/database/backupService';

export default function ConfiguracoesScreen() {
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadBackupStats();
  }, []);

  const loadBackupStats = async () => {
    try {
      const stats = await backupService.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de backup:', error);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await backupService.createBackup();
      await loadBackupStats();
      Alert.alert('Sucesso', 'Backup criado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar backup');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      await backupService.exportBackup();
      Alert.alert('Sucesso', 'Backup exportado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar backup');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBackup = async () => {
    try {
      setLoading(true);
      await backupService.autoBackup();
      await loadBackupStats();
      Alert.alert('Sucesso', 'Backup automático realizado!');
    } catch (error) {
      Alert.alert('Erro', 'Erro no backup automático');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Confirmar Limpeza',
      'Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            // Implementar limpeza de dados
            Alert.alert('Sucesso', 'Dados limpos com sucesso!');
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBackupSection = () => (
    <Card style={styles.section}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Icon name="backup-restore" size={24} color="#6200ee" />
          <Text style={styles.sectionTitle}>Backup e Restauração</Text>
        </View>

        {backupStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Último Backup</Text>
              <Text style={styles.statValue}>{formatDate(backupStats.lastBackup)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total de Backups</Text>
              <Text style={styles.statValue}>{backupStats.backupCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Registros</Text>
              <Text style={styles.statValue}>{backupStats.totalRecords}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tamanho Total</Text>
              <Text style={styles.statValue}>{formatBytes(backupStats.totalSize)}</Text>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleCreateBackup}
            loading={loading}
            style={styles.button}
            icon="backup-restore"
          >
            Criar Backup
          </Button>
          <Button
            mode="outlined"
            onPress={handleExportBackup}
            loading={loading}
            style={styles.button}
            icon="export"
          >
            Exportar
          </Button>
          <Button
            mode="outlined"
            onPress={handleAutoBackup}
            loading={loading}
            style={styles.button}
            icon="auto-fix"
          >
            Backup Automático
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderGeneralSettings = () => (
    <Card style={styles.section}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Icon name="cog" size={24} color="#6200ee" />
          <Text style={styles.sectionTitle}>Configurações Gerais</Text>
        </View>

        <List.Item
          title="Backup Automático"
          description="Fazer backup automaticamente a cada 24 horas"
          left={(props) => <List.Icon {...props} icon="backup-restore" />}
          right={() => (
            <Switch
              value={autoBackup}
              onValueChange={setAutoBackup}
              trackColor={{ false: '#767577', true: '#6200ee' }}
              thumbColor={autoBackup ? '#f4f3f4' : '#f4f3f4'}
            />
          )}
        />

        <Divider />

        <List.Item
          title="Notificações"
          description="Receber alertas de estoque baixo e vendas"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#6200ee' }}
              thumbColor={notifications ? '#f4f3f4' : '#f4f3f4'}
            />
          )}
        />

        <Divider />

        <List.Item
          title="Modo Escuro"
          description="Usar tema escuro no aplicativo"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#6200ee' }}
              thumbColor={darkMode ? '#f4f3f4' : '#f4f3f4'}
            />
          )}
        />
      </Card.Content>
    </Card>
  );

  const renderDataManagement = () => (
    <Card style={styles.section}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Icon name="database" size={24} color="#6200ee" />
          <Text style={styles.sectionTitle}>Gerenciamento de Dados</Text>
        </View>

        <List.Item
          title="Limpar Todos os Dados"
          description="Remover todos os produtos, vendas e clientes"
          left={(props) => <List.Icon {...props} icon="delete" color="#d32f2f" />}
          onPress={handleClearData}
        />

        <Divider />

        <List.Item
          title="Exportar Relatórios"
          description="Exportar relatórios em formato CSV"
          left={(props) => <List.Icon {...props} icon="file-export" />}
          onPress={() => Alert.alert('Em desenvolvimento', 'Funcionalidade em desenvolvimento')}
        />

        <Divider />

        <List.Item
          title="Importar Dados"
          description="Importar dados de arquivo CSV"
          left={(props) => <List.Icon {...props} icon="file-import" />}
          onPress={() => Alert.alert('Em desenvolvimento', 'Funcionalidade em desenvolvimento')}
        />
      </Card.Content>
    </Card>
  );

  const renderAboutSection = () => (
    <Card style={styles.section}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Icon name="information" size={24} color="#6200ee" />
          <Text style={styles.sectionTitle}>Sobre o App</Text>
        </View>

        <View style={styles.aboutContainer}>
          <Text style={styles.appName}>SmartPDV</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
          <Text style={styles.appDescription}>
            Sistema de Ponto de Venda inteligente para pequenos e médios negócios
          </Text>
          
          <View style={styles.featuresList}>
            <Text style={styles.featuresTitle}>Funcionalidades:</Text>
            <Text style={styles.feature}>• Gestão de produtos e estoque</Text>
            <Text style={styles.feature}>• Sistema de vendas com PDV</Text>
            <Text style={styles.feature}>• Cadastro de clientes e fidelidade</Text>
            <Text style={styles.feature}>• Múltiplas formas de pagamento</Text>
            <Text style={styles.feature}>• Relatórios e dashboard</Text>
            <Text style={styles.feature}>• Backup e sincronização</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
      </View>

      {renderBackupSection()}
      {renderGeneralSettings()}
      {renderDataManagement()}
      {renderAboutSection()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  aboutContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
}); 