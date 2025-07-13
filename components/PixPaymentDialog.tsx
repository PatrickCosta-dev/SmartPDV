import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Dialog,
    Portal,
    Text,
} from 'react-native-paper';
import { AnalyticsService } from '../src/services/analyticsService';
import { PixService } from '../src/services/pixService';
=======
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Sale } from '../src/database/salesService';
import { pixService, type PixPaymentData } from '../src/services/pixService';
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220

interface PixPaymentDialogProps {
  visible: boolean;
  onDismiss: () => void;
<<<<<<< HEAD
  amount: number | undefined;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
=======
  sale: Sale | null;
  onPaymentSuccess?: (payment: PixPaymentData) => void;
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
}

export default function PixPaymentDialog({
  visible,
  onDismiss,
<<<<<<< HEAD
  amount,
  onPaymentSuccess,
  onPaymentError,
}: PixPaymentDialogProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [pixData, setPixData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');

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
        onPaymentError('Configurações PIX incompletas. Configure na tela de configurações.');
        return;
      }

      // Valida a chave PIX
      if (!PixService.validatePixKey(config.pixKey, config.pixKeyType)) {
        onPaymentError('Chave PIX inválida. Verifique as configurações PIX.');
        return;
      }

      const qrCodeResult = await PixService.generatePixQRCodeWithConfig(
        amount || 0,
        `Pagamento SmartPDV - R$ ${(amount || 0).toFixed(2)}`
      );
      
      setQrCodeImage(qrCodeResult.qrCodeImage);
      setPixData(qrCodeResult.copyAndPaste);
      setTransactionId(`txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

      // Registra evento de analytics
      await AnalyticsService.logPaymentMethodUsed({
        method: 'PIX',
        amount: amount || 0,
        success: true
      });

    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      onPaymentError('Erro ao gerar QR Code PIX. Verifique as configurações PIX.');
    } finally {
      setLoading(false);
=======
  sale,
  onPaymentSuccess
}: PixPaymentDialogProps) {
  const [payment, setPayment] = useState<PixPaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (visible && sale && !payment) {
      generatePayment();
    }
  }, [visible, sale]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (payment && payment.status === 'pending') {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const expiresAt = new Date(payment.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          checkPaymentStatus();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [payment]);

  const generatePayment = async () => {
    if (!sale) return;

    setIsLoading(true);
    try {
      const pixPayment = await pixService.generatePixPayment(sale);
      setPayment(pixPayment);
    } catch (error) {
      console.error('Erro ao gerar pagamento PIX:', error);
      Alert.alert('Erro', 'Não foi possível gerar o pagamento PIX.');
    } finally {
      setIsLoading(false);
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
    }
  };

  const checkPaymentStatus = async () => {
<<<<<<< HEAD
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

        // Registra evento de sucesso
        await AnalyticsService.logPaymentMethodUsed({
          method: 'PIX',
          amount: amount || 0,
          success: true
        });
      } else if (result.status === 'failed') {
        Alert.alert(
          'Pagamento Falhou',
          'O pagamento não foi confirmado. Tente novamente.',
          [{ text: 'OK' }]
        );

        await AnalyticsService.logPaymentMethodUsed({
          method: 'PIX',
          amount: amount || 0,
          success: false,
          errorMessage: 'Payment failed'
        });
      } else {
        Alert.alert(
          'Pagamento Pendente',
          'O pagamento ainda está sendo processado. Aguarde um momento e tente verificar novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      onPaymentError('Erro ao verificar status do pagamento');
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyPixData = async () => {
    try {
      await PixService.copyPixToClipboard(pixData);
      Alert.alert('Copiado!', 'Dados PIX copiados para área de transferência.');
    } catch (error) {
      console.error('Erro ao copiar dados PIX:', error);
      Alert.alert('Erro', 'Não foi possível copiar os dados PIX.');
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Pagamento PIX</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.amount}>
                  R$ {(amount || 0).toFixed(2)}
                </Text>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Gerando QR Code...</Text>
                  </View>
                ) : (
                  <>
                    {qrCodeImage && (
                      <View style={styles.qrCodeContainer}>
                        <Text variant="bodyMedium" style={styles.qrCodeLabel}>
                          Escaneie o QR Code com seu app bancário:
                        </Text>
                        <View style={styles.qrCodeImageContainer}>
                          <Image 
                            source={{ uri: qrCodeImage }} 
                            style={styles.qrCodeImage}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    )}

                    <View style={styles.buttonContainer}>
                      <Button
                        mode="contained"
                        onPress={copyPixData}
                        style={styles.button}
                        icon="content-copy"
                      >
                        Copiar Dados PIX
                      </Button>
                      
                      <Button
                        mode="outlined"
                        onPress={checkPaymentStatus}
                        style={styles.button}
                        loading={checkingPayment}
                        icon="refresh"
                      >
                        Verificar Pagamento
                      </Button>
                    </View>

                    <Text variant="bodySmall" style={styles.instructions}>
                      • Abra seu app bancário{'\n'}
                      • Escaneie o QR Code ou cole os dados PIX{'\n'}
                      • Confirme o pagamento{'\n'}
                      • Clique em "Verificar Pagamento" após confirmar{'\n\n'}
                      💡 Dica: Configure suas informações PIX na tela de configurações para gerar QR Codes válidos.
                    </Text>
                  </>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancelar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
=======
    if (!payment) return;

    setIsCheckingStatus(true);
    try {
      const updatedPayment = await pixService.checkPaymentStatus(payment.id);
      if (updatedPayment) {
        setPayment(updatedPayment);
        
        if (updatedPayment.status === 'paid' && onPaymentSuccess) {
          onPaymentSuccess(updatedPayment);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const simulatePayment = async () => {
    if (!payment) return;

    try {
      const success = await pixService.simulatePayment(payment.id);
      if (success) {
        await checkPaymentStatus();
        Alert.alert('Sucesso', 'Pagamento simulado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      Alert.alert('Erro', 'Não foi possível simular o pagamento.');
    }
  };

  const cancelPayment = async () => {
    if (!payment) return;

    Alert.alert(
      'Cancelar Pagamento',
      'Tem certeza que deseja cancelar este pagamento PIX?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await pixService.cancelPayment(payment.id);
              if (success) {
                await checkPaymentStatus();
                Alert.alert('Sucesso', 'Pagamento cancelado!');
              }
            } catch (error) {
              console.error('Erro ao cancelar pagamento:', error);
              Alert.alert('Erro', 'Não foi possível cancelar o pagamento.');
            }
          }
        }
      ]
    );
  };

  const copyPixCode = () => {
    if (!payment) return;

    // Em React Native, você pode usar Clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(payment.qrCodeText);
      Alert.alert('Sucesso', 'Código PIX copiado para a área de transferência!');
    } else {
      Alert.alert('Info', 'Código PIX copiado!');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'expired': return '#f44336';
      case 'cancelled': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Aguardando';
      case 'expired': return 'Expirado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'check-circle';
      case 'pending': return 'clock-outline';
      case 'expired': return 'close-circle';
      case 'cancelled': return 'cancel';
      default: return 'help-circle';
    }
  };

  if (!sale) return null;

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
            <Text style={styles.modalTitle}>Pagamento PIX</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Informações da Venda */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Venda #{sale.id}</Text>
                <Text style={styles.saleInfo}>
                  Total: R$ {sale.finalTotal.toFixed(2)}
                </Text>
                <Text style={styles.saleInfo}>
                  Cliente: {sale.customerName || 'Não informado'}
                </Text>
              </Card.Content>
            </Card>

            {isLoading ? (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.loadingContainer}>
                    <Icon name="loading" size={48} color="#6200ee" />
                    <Text style={styles.loadingText}>Gerando pagamento PIX...</Text>
                  </View>
                </Card.Content>
              </Card>
            ) : payment ? (
              <>
                {/* Status do Pagamento */}
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.statusContainer}>
                      <Icon 
                        name={getStatusIcon(payment.status)} 
                        size={32} 
                        color={getStatusColor(payment.status)} 
                      />
                      <View style={styles.statusInfo}>
                        <Text style={styles.statusText}>
                          {getStatusText(payment.status)}
                        </Text>
                        <Text style={styles.statusDescription}>
                          {payment.status === 'pending' && 'Aguardando pagamento'}
                          {payment.status === 'paid' && 'Pagamento confirmado'}
                          {payment.status === 'expired' && 'Tempo expirado'}
                          {payment.status === 'cancelled' && 'Pagamento cancelado'}
                        </Text>
                      </View>
                    </View>

                    {payment.status === 'pending' && (
                      <View style={styles.timerContainer}>
                        <Text style={styles.timerLabel}>Tempo restante:</Text>
                        <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
                      </View>
                    )}

                    {payment.status === 'paid' && payment.paidAt && (
                      <View style={styles.paidInfo}>
                        <Text style={styles.paidAt}>
                          Pago em: {payment.paidAt.toLocaleString('pt-BR')}
                        </Text>
                        {payment.transactionId && (
                          <Text style={styles.transactionId}>
                            ID: {payment.transactionId}
                          </Text>
                        )}
                      </View>
                    )}
                  </Card.Content>
                </Card>

                {/* QR Code */}
                {payment.status === 'pending' && (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text style={styles.cardTitle}>QR Code PIX</Text>
                      <View style={styles.qrCodeContainer}>
                        <img 
                          src={payment.qrCode} 
                          alt="QR Code PIX" 
                          style={styles.qrCode}
                        />
                      </View>
                      <Text style={styles.qrCodeInstructions}>
                        Escaneie o QR Code com seu app bancário
                      </Text>
                    </Card.Content>
                  </Card>
                )}

                {/* Informações PIX */}
                <Card style={styles.card}>
                  <Card.Content>
                    <Text style={styles.cardTitle}>Informações PIX</Text>
                    
                    <View style={styles.pixInfoRow}>
                      <Text style={styles.pixInfoLabel}>Chave PIX:</Text>
                      <Text style={styles.pixInfoValue}>{payment.pixKey}</Text>
                    </View>
                    
                    <View style={styles.pixInfoRow}>
                      <Text style={styles.pixInfoLabel}>Tipo:</Text>
                      <Text style={styles.pixInfoValue}>
                        {payment.pixKeyType === 'email' ? 'Email' :
                         payment.pixKeyType === 'cpf' ? 'CPF' :
                         payment.pixKeyType === 'cnpj' ? 'CNPJ' :
                         payment.pixKeyType === 'phone' ? 'Telefone' : 'Aleatória'}
                      </Text>
                    </View>
                    
                    <View style={styles.pixInfoRow}>
                      <Text style={styles.pixInfoLabel}>Beneficiário:</Text>
                      <Text style={styles.pixInfoValue}>{payment.beneficiaryName}</Text>
                    </View>
                    
                    <View style={styles.pixInfoRow}>
                      <Text style={styles.pixInfoLabel}>Cidade:</Text>
                      <Text style={styles.pixInfoValue}>{payment.beneficiaryCity}</Text>
                    </View>
                    
                    <View style={styles.pixInfoRow}>
                      <Text style={styles.pixInfoLabel}>Valor:</Text>
                      <Text style={styles.pixInfoValue}>
                        R$ {payment.amount.toFixed(2)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>

                {/* Ações */}
                <Card style={styles.card}>
                  <Card.Content>
                    <Text style={styles.cardTitle}>Ações</Text>
                    
                    <View style={styles.actionsContainer}>
                      {payment.status === 'pending' && (
                        <>
                          <Button
                            mode="outlined"
                            onPress={checkPaymentStatus}
                            loading={isCheckingStatus}
                            icon="refresh"
                            style={styles.actionButton}
                          >
                            Verificar Status
                          </Button>
                          
                          <Button
                            mode="outlined"
                            onPress={copyPixCode}
                            icon="content-copy"
                            style={styles.actionButton}
                          >
                            Copiar Código
                          </Button>
                          
                          <Button
                            mode="outlined"
                            onPress={cancelPayment}
                            icon="cancel"
                            style={styles.actionButton}
                            textColor="#f44336"
                          >
                            Cancelar
                          </Button>
                          
                          <Button
                            mode="contained"
                            onPress={simulatePayment}
                            icon="check"
                            style={styles.actionButton}
                          >
                            Simular Pagamento
                          </Button>
                        </>
                      )}
                      
                      {payment.status === 'paid' && (
                        <Button
                          mode="contained"
                          onPress={onDismiss}
                          icon="check"
                          style={styles.actionButton}
                        >
                          Concluir
                        </Button>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </>
            ) : (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={48} color="#f44336" />
                    <Text style={styles.errorText}>
                      Erro ao gerar pagamento PIX
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  dialog: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    marginVertical: 10,
  },
  amount: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
=======
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
  saleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
<<<<<<< HEAD
    marginTop: 10,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeLabel: {
    textAlign: 'center',
    marginBottom: 15,
  },
  qrCodeImageContainer: {
    alignItems: 'center',
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    marginVertical: 5,
  },
  instructions: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    lineHeight: 20,
=======
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginTop: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: '#856404',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#856404',
    marginTop: 4,
  },
  paidInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
  },
  paidAt: {
    fontSize: 14,
    color: '#155724',
    fontWeight: 'bold',
  },
  transactionId: {
    fontSize: 12,
    color: '#155724',
    marginTop: 4,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  qrCodeInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  pixInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pixInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pixInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginTop: 12,
    textAlign: 'center',
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
  },
}); 