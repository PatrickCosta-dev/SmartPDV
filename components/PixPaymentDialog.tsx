import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Dialog,
  Portal,
  Text,
} from 'react-native-paper';
import { PixService } from '../src/services/pixService';

interface PixPaymentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  amount: number | undefined;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export default function PixPaymentDialog({
  visible,
  onDismiss,
  amount,
  onPaymentSuccess,
  onPaymentError,
}: PixPaymentDialogProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [pixData, setPixData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [pixConfig, setPixConfig] = useState<any>(null);

  useEffect(() => {
    if (visible && amount && amount > 0) {
      generatePixQRCode();
    }
  }, [visible, amount]);

  const generatePixQRCode = async () => {
    setLoading(true);
    try {
      // Valida se as configurações PIX estão definidas
      const config = await PixService.loadConfig();
      
      if (!config.pixKey || !config.beneficiaryName || !config.beneficiaryCity) {
        onPaymentError('Configurações PIX incompletas. Configure seu CNPJ na tela de configurações.');
        return;
      }

      // Valida o CNPJ
      if (!PixService.validatePixKey(config.pixKey, 'cnpj')) {
        onPaymentError('CNPJ inválido. Verifique as configurações PIX.');
        return;
      }

      // Armazena as configurações para exibição
      setPixConfig(config);

      const qrCodeResult = await PixService.generatePixQRCodeWithConfig(
        amount || 0,
        `Pagamento SmartPDV - R$ ${(amount || 0).toFixed(2)}`
      );
      
      setQrCodeImage(qrCodeResult.qrCodeImage);
      setPixData(qrCodeResult.copyAndPaste);
      setTransactionId(`txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      onPaymentError('Erro ao gerar QR Code PIX. Verifique as configurações PIX.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!transactionId) return;

    setCheckingPayment(true);
    try {
      const result = await PixService.checkPixPayment(transactionId);
      
      if (result.status === 'completed') {
        Alert.alert(
          'Pagamento Confirmado!',
          `Pagamento de R$ ${(amount || 0).toFixed(2)} foi confirmado com sucesso.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess();
                onDismiss();
              }
            }
          ]
        );
      } else if (result.status === 'failed') {
        Alert.alert(
          'Pagamento Falhou',
          'O pagamento não foi confirmado. Tente novamente.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Pagamento Pendente',
          'O pagamento ainda está sendo processado. Aguarde um momento e tente verificar novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      Alert.alert('Erro', 'Não foi possível verificar o status do pagamento.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyPixData = async () => {
    try {
      await PixService.copyPixToClipboard(pixData);
      Alert.alert('Sucesso', 'Dados PIX copiados para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar dados PIX:', error);
      Alert.alert('Erro', 'Não foi possível copiar os dados PIX.');
    }
  };

  const simulatePayment = async () => {
    Alert.alert(
      'Simular Pagamento',
      'Deseja simular um pagamento bem-sucedido para teste?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Simular',
          onPress: () => {
            onPaymentSuccess();
            onDismiss();
          }
        }
      ]
    );
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>
          Pagamento PIX
        </Dialog.Title>
        
        <Dialog.Content>
          <ScrollView style={styles.scrollView}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Gerando QR Code PIX...</Text>
              </View>
            ) : (
              <>
                {/* QR Code */}
                {qrCodeImage && (
                  <Card style={styles.qrCodeCard}>
                    <Card.Content style={styles.qrCodeContent}>
                      <Text style={styles.qrCodeTitle}>QR Code PIX</Text>
                      <Image
                        source={{ uri: qrCodeImage }}
                        style={styles.qrCodeImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.qrCodeInstructions}>
                        Escaneie o QR Code com seu app bancário
                      </Text>
                    </Card.Content>
                  </Card>
                )}

                {/* Informações do Pagamento */}
                <Card style={styles.infoCard}>
                  <Card.Content>
                    <Text style={styles.infoTitle}>Informações do Pagamento</Text>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Empresa:</Text>
                      <Text style={styles.infoValue}>
                        {pixConfig ? pixConfig.beneficiaryName : 'Carregando...'}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>CNPJ:</Text>
                      <Text style={styles.infoValue}>
                        {pixConfig ? PixService.formatCNPJ(pixConfig.pixKey) : 'Carregando...'}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Valor:</Text>
                      <Text style={styles.infoValue}>
                        R$ {(amount || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <Text style={styles.infoValue}>Aguardando Pagamento</Text>
                    </View>
                  </Card.Content>
                </Card>

                {/* Ações */}
                <View style={styles.actionsContainer}>
                  <Button
                    mode="contained"
                    onPress={checkPaymentStatus}
                    loading={checkingPayment}
                    style={styles.actionButton}
                    icon="check-circle"
                  >
                    Verificar Pagamento
                  </Button>
                  
                  <Button
                    mode="outlined"
                    onPress={copyPixData}
                    style={styles.actionButton}
                    icon="content-copy"
                  >
                    Copiar Dados PIX
                  </Button>
                  
                  <Button
                    mode="outlined"
                    onPress={simulatePayment}
                    style={styles.actionButton}
                    icon="test-tube"
                  >
                    Simular Pagamento
                  </Button>
                </View>

                {/* Instruções */}
                <Card style={styles.instructionsCard}>
                  <Card.Content>
                    <Text style={styles.instructionsTitle}>Como Pagar:</Text>
                    <Text style={styles.instructionsText}>
                      1. Abra seu app bancário{'\n'}
                      2. Escaneie o QR Code acima{'\n'}
                      3. Confirme o pagamento{'\n'}
                      4. Clique em "Verificar Pagamento"
                    </Text>
                  </Card.Content>
                </Card>
              </>
            )}
          </ScrollView>
        </Dialog.Content>
        
        <Dialog.Actions>
          <Button onPress={onDismiss}>Fechar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = {
  dialog: {
    maxWidth: 400,
    alignSelf: 'center' as const
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const
  },
  scrollView: {
    maxHeight: 600
  },
  loadingContainer: {
    alignItems: 'center' as const,
    padding: 40
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  qrCodeCard: {
    marginBottom: 16,
    alignItems: 'center' as const
  },
  qrCodeContent: {
    alignItems: 'center' as const,
    padding: 20
  },
  qrCodeTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 16
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    marginBottom: 16
  },
  qrCodeInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const
  },
  infoCard: {
    marginBottom: 16
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold' as const
  },
  actionsContainer: {
    marginBottom: 16
  },
  actionButton: {
    marginBottom: 8
  },
  instructionsCard: {
    marginBottom: 16
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 8
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
}; 