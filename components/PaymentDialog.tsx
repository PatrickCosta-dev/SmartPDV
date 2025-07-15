import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Button, Card, TextInput as PaperTextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PaymentMethod as PaymentMethodType, paymentService, type PaymentReceipt } from '../src/database/paymentService';
import { PAYMENT_METHODS, useCartStore } from '../src/store/cartStore';
import ReceiptDialog from './ReceiptDialog';

interface PaymentDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  total: number;
}

export default function PaymentDialog({ visible, onClose, onSuccess, total }: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('dinheiro');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [change, setChange] = useState(0);
  const [pixKey, setPixKey] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [installments, setInstallments] = useState('1');
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<PaymentReceipt | null>(null);
  
  const { 
    items,
    selectedCustomer, 
    loyaltyPointsUsed, 
    useLoyaltyPoints,
    getLoyaltyPointsEarned,
    getSubtotal,
    getTotalDiscount,
    clearCart 
  } = useCartStore();

  useEffect(() => {
    if (visible) {
      calculateChange();
    }
  }, [visible, receivedAmount, total]);

  const calculateChange = () => {
    if (selectedMethod === 'dinheiro' && receivedAmount) {
      const received = parseFloat(receivedAmount) || 0;
      const calculatedChange = Math.max(0, received - total);
      setChange(calculatedChange);
    } else {
      setChange(0);
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setReceivedAmount('');
    setChange(0);
    setPixKey('');
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCVV('');
    setInstallments('1');
  };

  const handleLoyaltyPointsChange = (points: string) => {
    const pointsValue = parseInt(points) || 0;
    if (selectedCustomer && pointsValue <= selectedCustomer.loyaltyPoints) {
      useLoyaltyPoints(pointsValue);
    }
  };

  const validatePayment = () => {
    if (selectedMethod === 'dinheiro') {
      if (!receivedAmount || parseFloat(receivedAmount) < total) {
        Alert.alert('Erro', 'Valor recebido deve ser maior ou igual ao total');
        return false;
      }
    } else if (selectedMethod === 'pix') {
      if (!pixKey.trim()) {
        Alert.alert('Erro', 'Informe a chave PIX');
        return false;
      }
    } else if (selectedMethod === 'cartao_credito' || selectedMethod === 'cartao_debito') {
      if (!cardNumber.trim() || !cardHolder.trim() || !cardExpiry.trim() || !cardCVV.trim()) {
        Alert.alert('Erro', 'Preencha todos os dados do cartão');
        return false;
      }
      if (!paymentService.validateCardNumber(cardNumber)) {
        Alert.alert('Erro', 'Número do cartão inválido');
        return false;
      }
    }
    return true;
  };

  const processPayment = async () => {
    if (!validatePayment()) return;

    setProcessing(true);
    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Gerar comprovante
      const receipt = await paymentService.generateReceipt({
        paymentId: Date.now().toString(),
        saleId: Date.now().toString(),
        customerName: selectedCustomer?.name,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        })),
        subtotal: getSubtotal(),
        discount: getTotalDiscount(),
        total: total,
        paymentMethod: selectedMethod as PaymentMethodType,
        receivedAmount: selectedMethod === 'dinheiro' ? parseFloat(receivedAmount) : undefined,
        change: selectedMethod === 'dinheiro' ? change : undefined,
      });

      setGeneratedReceipt(receipt);
      setShowReceipt(true);
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setGeneratedReceipt(null);
    clearCart();
    onSuccess();
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const renderPaymentMethod = (method: any) => (
    <TouchableOpacity
      key={method.id}
      onPress={() => handlePaymentMethodSelect(method.id)}
      style={[
        styles.methodCard,
        selectedMethod === method.id && styles.selectedMethod
      ]}
    >
      <View style={styles.methodContent}>
        <Icon name={method.icon} size={24} color={selectedMethod === method.id ? '#6200ee' : '#666'} />
        <Text style={[
          styles.methodName,
          selectedMethod === method.id && styles.selectedMethodText
        ]}>
          {method.name}
        </Text>
      </View>
      {selectedMethod === method.id && (
        <Icon name="check-circle" size={20} color="#6200ee" />
      )}
    </TouchableOpacity>
  );

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'dinheiro':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Valor Recebido</Text>
            <PaperTextInput
              mode="outlined"
              value={receivedAmount}
              onChangeText={setReceivedAmount}
              keyboardType="numeric"
              placeholder="0,00"
              left={<PaperTextInput.Affix text="R$" />}
              style={styles.input}
            />
            {change > 0 && (
              <View style={styles.changeContainer}>
                <Text style={styles.changeLabel}>Troco:</Text>
                <Text style={styles.changeValue}>{formatCurrency(change)}</Text>
              </View>
            )}
          </View>
        );

      case 'pix':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Chave PIX</Text>
            <PaperTextInput
              mode="outlined"
              value={pixKey}
              onChangeText={setPixKey}
              placeholder="Digite a chave PIX"
              style={styles.input}
            />
            <Text style={styles.helperText}>
              Chave PIX do cliente (CPF, email, telefone ou chave aleatória)
            </Text>
          </View>
        );

      case 'cartao_credito':
      case 'cartao_debito':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Número do Cartão</Text>
            <PaperTextInput
              mode="outlined"
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
              maxLength={19}
              style={styles.input}
            />
            
            <Text style={styles.formLabel}>Nome do Portador</Text>
            <PaperTextInput
              mode="outlined"
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="Nome como está no cartão"
              style={styles.input}
            />
            
            <View style={styles.cardRow}>
              <View style={styles.cardField}>
                <Text style={styles.formLabel}>Validade</Text>
                <PaperTextInput
                  mode="outlined"
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  placeholder="MM/AA"
                  keyboardType="numeric"
                  maxLength={5}
                  style={styles.input}
                />
              </View>
              <View style={styles.cardField}>
                <Text style={styles.formLabel}>CVV</Text>
                <PaperTextInput
                  mode="outlined"
                  value={cardCVV}
                  onChangeText={setCardCVV}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={4}
                  style={styles.input}
                />
              </View>
            </View>
            
            {selectedMethod === 'cartao_credito' && (
              <View style={styles.cardField}>
                <Text style={styles.formLabel}>Parcelas</Text>
                <PaperTextInput
                  mode="outlined"
                  value={installments}
                  onChangeText={setInstallments}
                  placeholder="1"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Finalizar Pagamento</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Card style={styles.totalCard}>
              <Card.Content>
                <Text style={styles.totalLabel}>Total a Pagar</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                
                {selectedCustomer && (
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerLabel}>Cliente: {selectedCustomer.name}</Text>
                    <Text style={styles.customerPoints}>
                      Pontos disponíveis: {selectedCustomer.loyaltyPoints}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            {selectedCustomer && (
              <Card style={styles.loyaltyCard}>
                <Card.Content>
                  <Text style={styles.formLabel}>Usar Pontos de Fidelidade</Text>
                  <PaperTextInput
                    mode="outlined"
                    value={loyaltyPointsUsed.toString()}
                    onChangeText={handleLoyaltyPointsChange}
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <Text style={styles.helperText}>
                    Pontos a serem ganhos nesta compra: {getLoyaltyPointsEarned()}
                  </Text>
                </Card.Content>
              </Card>
            )}

            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
            <View style={styles.methodsContainer}>
              {PAYMENT_METHODS.map(renderPaymentMethod)}
            </View>

            {renderPaymentForm()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button mode="outlined" onPress={onClose} style={styles.footerButton}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={processPayment}
              style={styles.footerButton}
              loading={processing}
              disabled={processing}
            >
              {processing ? 'Processando...' : 'Finalizar Venda'}
            </Button>
          </View>
        </View>
      </View>

      <ReceiptDialog
        visible={showReceipt}
        onDismiss={handleReceiptClose}
        receipt={generatedReceipt}
      />
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
    marginBottom: 20,
  },
  totalCard: {
    marginBottom: 16,
    backgroundColor: '#e8f5e8',
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  customerInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  customerLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  customerPoints: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loyaltyCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  methodsContainer: {
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedMethod: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  selectedMethodText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardField: {
    flex: 1,
    marginHorizontal: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginTop: 8,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  changeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 