import React, { useEffect, useState } from 'react';
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

interface PixPaymentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  sale: Sale | null;
  onPaymentSuccess?: (payment: PixPaymentData) => void;
}

export default function PixPaymentDialog({
  visible,
  onDismiss,
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
    }
  };

  const checkPaymentStatus = async () => {
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
  saleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
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
  },
}); 