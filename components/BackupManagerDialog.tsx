import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Chip, IconButton, List, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { cloudSyncService, type CloudBackup, type SyncConfig, type SyncStats } from '../src/services/cloudSyncService';

interface BackupManagerDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function BackupManagerDialog({
  visible,
  onDismiss
}: BackupManagerDialogProps) {
  const [backups, setBackups] = useState<CloudBackup[]>([]);
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<CloudBackup | null>(null);
  const [backupDescription, setBackupDescription] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (visible && isMounted) {
      loadData();
    }
  }, [visible, isMounted]);

  const loadData = useCallback(async () => {
    if (!isMounted) return;
    
    setIsLoading(true);
    try {
      const [backupsList, config, stats] = await Promise.all([
        cloudSyncService.listBackups(),
        cloudSyncService.getConfig(),
        cloudSyncService.getSyncStats()
      ]);
      
      if (isMounted) {
        setBackups(backupsList);
        setSyncConfig(config);
        setSyncStats(stats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (isMounted) {
        Alert.alert('Erro', 'Não foi possível carregar os dados de backup.');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [isMounted]);

  const handleCreateBackup = useCallback(async () => {
    if (!backupDescription.trim()) {
      Alert.alert('Erro', 'Por favor, informe uma descrição para o backup.');
      return;
    }

    if (!isMounted) return;

    setIsLoading(true);
    try {
      const backup = await cloudSyncService.createBackup(backupDescription);
      if (isMounted) {
        setBackupDescription('');
        await loadData();
        Alert.alert('Sucesso', 'Backup criado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      if (isMounted) {
        Alert.alert('Erro', 'Não foi possível criar o backup.');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [backupDescription, isMounted, loadData]);

  const handleRestoreBackup = useCallback(async (backup: CloudBackup) => {
    Alert.alert(
      'Confirmar Restauração',
      `Tem certeza que deseja restaurar o backup "${backup.description}"?\n\nEsta ação irá substituir todos os dados atuais.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            if (!isMounted) return;
            
            setIsLoading(true);
            try {
              await cloudSyncService.restoreBackup(backup.id);
              if (isMounted) {
                Alert.alert('Sucesso', 'Backup restaurado com sucesso! O app será reiniciado.');
                onDismiss();
              }
            } catch (error) {
              console.error('Erro ao restaurar backup:', error);
              if (isMounted) {
                Alert.alert('Erro', 'Não foi possível restaurar o backup.');
              }
            } finally {
              if (isMounted) {
                setIsLoading(false);
              }
            }
          }
        }
      ]
    );
  }, [isMounted, onDismiss]);

  const handleExportBackup = useCallback(async (backup: CloudBackup) => {
    try {
      await cloudSyncService.exportBackup(backup.id);
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      if (isMounted) {
        Alert.alert('Erro', 'Não foi possível exportar o backup.');
      }
    }
  }, [isMounted]);

  const handleDeleteBackup = useCallback(async (backup: CloudBackup) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o backup "${backup.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await cloudSyncService.deleteBackup(backup.id);
              if (isMounted) {
                await loadData();
                Alert.alert('Sucesso', 'Backup excluído com sucesso!');
              }
            } catch (error) {
              console.error('Erro ao deletar backup:', error);
              if (isMounted) {
                Alert.alert('Erro', 'Não foi possível excluir o backup.');
              }
            }
          }
        }
      ]
    );
  }, [isMounted, loadData]);

  const handleImportBackup = useCallback(async () => {
    try {
      const success = await cloudSyncService.importBackup();
      if (success && isMounted) {
        Alert.alert('Sucesso', 'Backup importado e restaurado com sucesso!');
        onDismiss();
      }
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      if (isMounted) {
        Alert.alert('Erro', 'Não foi possível importar o backup.');
      }
    }
  }, [isMounted, onDismiss]);

  const handleUpdateConfig = useCallback(async (updates: Partial<SyncConfig>) => {
    if (!syncConfig || !isMounted) return;

    const newConfig = { ...syncConfig, ...updates };
    cloudSyncService.setConfig(newConfig);
    setSyncConfig(newConfig);
  }, [syncConfig, isMounted]);

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Função utilitária para garantir string
  const getLastBackupString = (lastBackup: string | Date | null) => {
    if (!lastBackup) return '';
    if (typeof lastBackup === 'string') return lastBackup;
    if (lastBackup instanceof Date) return lastBackup.toISOString();
    return '';
  };

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'idle': return '#4caf50';
      case 'syncing': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#666';
    }
  }, []);

  // Não renderiza nada se não estiver montado
  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gerenciador de Backup</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Estatísticas */}
            {syncStats && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Estatísticas</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{syncStats.totalBackups}</Text>
                      <Text style={styles.statLabel}>Total de Backups</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{formatBytes(syncStats.totalSize)}</Text>
                      <Text style={styles.statLabel}>Tamanho Total</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {syncStats.lastBackup
                          ? formatDate(getLastBackupString(syncStats.lastBackup))
                          : 'Nunca'}
                      </Text>
                      <Text style={styles.statLabel}>Último Backup</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Chip 
                        icon="sync" 
                        textStyle={{ color: getStatusColor(syncStats.syncStatus) }}
                      >
                        {syncStats.syncStatus === 'idle' ? 'Ocioso' :
                         syncStats.syncStatus === 'syncing' ? 'Sincronizando' : 'Erro'}
                      </Chip>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Configurações */}
            {syncConfig && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Configurações</Text>
                  
                  <List.Item
                    title="Backup Automático"
                    description="Fazer backup automaticamente"
                    left={(props) => <List.Icon {...props} icon="backup-restore" />}
                    right={() => (
                      <Button
                        mode={syncConfig.autoBackup ? 'contained' : 'outlined'}
                        onPress={() => handleUpdateConfig({ autoBackup: !syncConfig.autoBackup })}
                        compact
                      >
                        {syncConfig.autoBackup ? 'Ativo' : 'Inativo'}
                      </Button>
                    )}
                  />

                  <List.Item
                    title="Intervalo de Backup"
                    description={`A cada ${syncConfig.backupInterval} horas`}
                    left={(props) => <List.Icon {...props} icon="clock" />}
                  />

                  <List.Item
                    title="Máximo de Backups"
                    description={`Manter ${syncConfig.maxBackups} backups`}
                    left={(props) => <List.Icon {...props} icon="database" />}
                  />

                  <List.Item
                    title="Provedor de Nuvem"
                    description={syncConfig.cloudProvider}
                    left={(props) => <List.Icon {...props} icon="cloud" />}
                  />
                </Card.Content>
              </Card>
            )}

            {/* Criar Backup */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Criar Novo Backup</Text>
                <TextInput
                  label="Descrição do Backup"
                  value={backupDescription}
                  onChangeText={setBackupDescription}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Ex: Backup antes da atualização"
                />
                <Button
                  mode="contained"
                  onPress={handleCreateBackup}
                  loading={isLoading}
                  disabled={!backupDescription.trim()}
                  icon="backup-restore"
                  style={styles.button}
                >
                  Criar Backup
                </Button>
              </Card.Content>
            </Card>

            {/* Importar Backup */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Importar Backup</Text>
                <Button
                  mode="outlined"
                  onPress={handleImportBackup}
                  icon="file-import"
                  style={styles.button}
                >
                  Importar de Arquivo
                </Button>
              </Card.Content>
            </Card>

            {/* Lista de Backups */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Backups Disponíveis</Text>
                
                {backups.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon name="database-off" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>
                      Nenhum backup encontrado
                    </Text>
                  </View>
                ) : (
                  backups.map((backup) => (
                    <View key={backup.id} style={styles.backupItem}>
                      <View style={styles.backupInfo}>
                        <Text style={styles.backupDescription}>
                          {backup.description}
                        </Text>
                        <Text style={styles.backupDetails}>
                          {formatDate(backup.timestamp)} • {formatBytes(backup.size)}
                        </Text>
                        <Text style={styles.backupVersion}>
                          Versão: {backup.version}
                        </Text>
                      </View>
                      
                      <View style={styles.backupActions}>
                        <IconButton
                          icon="download"
                          size={20}
                          onPress={() => handleExportBackup(backup)}
                        />
                        <IconButton
                          icon="restore"
                          size={20}
                          onPress={() => handleRestoreBackup(backup)}
                          iconColor="#4caf50"
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => handleDeleteBackup(backup)}
                          iconColor="#f44336"
                        />
                      </View>
                    </View>
                  ))
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  backupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backupInfo: {
    flex: 1,
  },
  backupDescription: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  backupDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  backupVersion: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  backupActions: {
    flexDirection: 'row',
  },
}); 