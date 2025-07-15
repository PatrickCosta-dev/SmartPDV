import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { PaymentReceipt } from '../src/database/paymentService';

interface ReceiptDialogProps {
  visible: boolean;
  onDismiss: () => void;
  receipt: PaymentReceipt | null;
}

export default function ReceiptDialog({ visible, onDismiss, receipt }: ReceiptDialogProps) {
  if (!receipt) return null;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPaymentMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'vale': 'Vale'
    };
    return methodNames[method] || method;
  };

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
            <Text style={styles.modalTitle}>Comprovante de Venda</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Cabeçalho do Comprovante */}
            <Card style={styles.headerCard}>
              <Card.Content>
                <Text style={styles.companyName}>SmartPDV Store</Text>
                <Text style={styles.companyInfo}>Rua das Flores, 123 - Centro</Text>
                <Text style={styles.companyInfo}>São Paulo - SP</Text>
                <Text style={styles.companyInfo}>CNPJ: 12.345.678/0001-90</Text>
                <Text style={styles.companyInfo}>Tel: (11) 99999-9999</Text>
                
                <Divider style={styles.divider} />
                
                <Text style={styles.receiptNumber}>Comprovante #{receipt.receiptNumber}</Text>
                <Text style={styles.receiptDate}>{formatDate(receipt.date)}</Text>
                
                {receipt.customerName && (
                  <>
                    <Divider style={styles.divider} />
                    <Text style={styles.customerLabel}>Cliente:</Text>
                    <Text style={styles.customerName}>{receipt.customerName}</Text>
                  </>
                )}
              </Card.Content>
            </Card>

            {/* Itens da Venda */}
            <Card style={styles.itemsCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Itens Comprados</Text>
                
                {receipt.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity}x {formatCurrency(item.unitPrice)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.totalPrice)}
                    </Text>
                  </View>
                ))}
                
                <Divider style={styles.divider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(receipt.subtotal)}</Text>
                </View>
                
                {receipt.discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Desconto:</Text>
                    <Text style={styles.discountValue}>-{formatCurrency(receipt.discount)}</Text>
                  </View>
                )}
                
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(receipt.total)}</Text>
                </View>
              </Card.Content>
            </Card>

            {/* Informações de Pagamento */}
            <Card style={styles.paymentCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
                <Text style={styles.paymentMethod}>
                  {getPaymentMethodName(receipt.paymentMethod)}
                </Text>
                
                {receipt.receivedAmount && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Valor Recebido:</Text>
                    <Text style={styles.paymentValue}>{formatCurrency(receipt.receivedAmount)}</Text>
                  </View>
                )}
                
                {receipt.change && receipt.change > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Troco:</Text>
                    <Text style={styles.paymentValue}>{formatCurrency(receipt.change)}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Rodapé */}
            <Card style={styles.footerCard}>
              <Card.Content>
                <Text style={styles.footerText}>Obrigado pela preferência!</Text>
                <Text style={styles.footerText}>Volte sempre!</Text>
                <Text style={styles.footerText}>www.smartpdv.com</Text>
              </Card.Content>
            </Card>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button mode="outlined" onPress={onDismiss} style={styles.footerButton}>
              Fechar
            </Button>
            <Button mode="contained" onPress={onDismiss} style={styles.footerButton}>
              Imprimir
            </Button>
          </View>
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
    marginBottom: 20,
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  companyInfo: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginBottom: 2,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginTop: 8,
  },
  receiptDate: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  customerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  itemsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#333',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  paymentCard: {
    marginBottom: 16,
    backgroundColor: '#e8f5e8',
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#333',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  footerCard: {
    backgroundColor: '#f8f9fa',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 8,
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