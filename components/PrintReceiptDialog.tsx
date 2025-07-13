import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Checkbox, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Sale } from '../src/database/salesService';
import { PixService } from '../src/services/pixService';
import { printService, type PrintOptions, type ReceiptData } from '../src/services/printService';

interface PrintReceiptDialogProps {
  visible: boolean;
  onDismiss: () => void;
  sale: Sale | null;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    cnpj: string;
    website?: string;
  };
}

export default function PrintReceiptDialog({
  visible,
  onDismiss,
  sale,
  companyInfo
}: PrintReceiptDialogProps) {
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    includeLogo: true,
    includeQRCode: true,
    includeFooter: true,
    paperSize: '80mm',
    copies: 1
  });

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pixConfig, setPixConfig] = useState<any>(null);

  // Carrega as configurações PIX quando o componente é montado
  useEffect(() => {
    const loadPixConfig = async () => {
      try {
        const config = await PixService.loadConfig();
        setPixConfig(config);
      } catch (error) {
        console.error('Erro ao carregar configurações PIX:', error);
      }
    };

    if (visible) {
      loadPixConfig();
    }
  }, [visible]);

  const handlePrint = async () => {
    if (!sale) return;

    setIsLoading(true);
    try {
      const receiptData: ReceiptData = {
        sale,
        companyInfo: companyInfo || {
          name: pixConfig?.beneficiaryName || 'SmartPDV Store',
          address: 'Rua das Flores, 123 - Centro',
          phone: '(11) 99999-9999',
          cnpj: pixConfig ? PixService.formatCNPJ(pixConfig.pixKey) : '12.345.678/0001-90',
          website: 'www.smartpdv.com'
        },
        printOptions
      };

      await printService.printReceipt(receiptData);
      Alert.alert('Sucesso', 'Comprovante enviado para impressão!');
      onDismiss();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao imprimir o comprovante.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!sale) return;

    setIsLoading(true);
    try {
      const receiptData: ReceiptData = {
        sale,
        companyInfo: companyInfo || {
          name: pixConfig?.beneficiaryName || 'SmartPDV Store',
          address: 'Rua das Flores, 123 - Centro',
          phone: '(11) 99999-9999',
          cnpj: pixConfig ? PixService.formatCNPJ(pixConfig.pixKey) : '12.345.678/0001-90',
          website: 'www.smartpdv.com'
        },
        printOptions
      };

      await printService.shareReceipt(receiptData);
      Alert.alert('Sucesso', 'Comprovante compartilhado!');
      onDismiss();
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao compartilhar o comprovante.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!sale || !email.trim()) {
      Alert.alert('Erro', 'Por favor, informe um email válido.');
      return;
    }

    Alert.alert('Funcionalidade em Desenvolvimento', 'O envio por email será implementado em breve.');
  };

  const updatePrintOption = (key: keyof PrintOptions, value: any) => {
    setPrintOptions(prev => ({ ...prev, [key]: value }));
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
            <Text style={styles.modalTitle}>Imprimir Comprovante</Text>
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

            {/* Informações da Empresa */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Informações da Empresa</Text>
                <Text style={styles.saleInfo}>
                  Nome: {pixConfig?.beneficiaryName || 'SmartPDV Store'}
                </Text>
                <Text style={styles.saleInfo}>
                  CNPJ: {pixConfig ? PixService.formatCNPJ(pixConfig.pixKey) : '12.345.678/0001-90'}
                </Text>
                <Text style={styles.saleInfo}>
                  Cidade: {pixConfig?.beneficiaryCity || 'SAO PAULO'}
                </Text>
                <Text style={styles.saleInfo}>
                  Endereço: Rua das Flores, 123 - Centro
                </Text>
                <Text style={styles.saleInfo}>
                  Telefone: (11) 99999-9999
                </Text>
              </Card.Content>
            </Card>

            {/* Opções de Impressão */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Opções de Impressão</Text>
                
                <View style={styles.optionRow}>
                  <Checkbox
                    status={printOptions.includeLogo ? 'checked' : 'unchecked'}
                    onPress={() => updatePrintOption('includeLogo', !printOptions.includeLogo)}
                  />
                  <Text style={styles.optionText}>Incluir Logo da Empresa</Text>
                </View>

                <View style={styles.optionRow}>
                  <Checkbox
                    status={printOptions.includeQRCode ? 'checked' : 'unchecked'}
                    onPress={() => updatePrintOption('includeQRCode', !printOptions.includeQRCode)}
                  />
                  <Text style={styles.optionText}>Incluir QR Code PIX</Text>
                </View>

                <View style={styles.optionRow}>
                  <Checkbox
                    status={printOptions.includeFooter ? 'checked' : 'unchecked'}
                    onPress={() => updatePrintOption('includeFooter', !printOptions.includeFooter)}
                  />
                  <Text style={styles.optionText}>Incluir Rodapé</Text>
                </View>

                <Divider style={styles.divider} />

                <Text style={styles.sectionTitle}>Tamanho do Papel</Text>
                <View style={styles.paperSizeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paperSizeButton,
                      printOptions.paperSize === '80mm' && styles.selectedPaperSize
                    ]}
                    onPress={() => updatePrintOption('paperSize', '80mm')}
                  >
                    <Text style={styles.paperSizeText}>80mm</Text>
                    <Text style={styles.paperSizeLabel}>Terminal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paperSizeButton,
                      printOptions.paperSize === '58mm' && styles.selectedPaperSize
                    ]}
                    onPress={() => updatePrintOption('paperSize', '58mm')}
                  >
                    <Text style={styles.paperSizeText}>58mm</Text>
                    <Text style={styles.paperSizeLabel}>Mini</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paperSizeButton,
                      printOptions.paperSize === 'A4' && styles.selectedPaperSize
                    ]}
                    onPress={() => updatePrintOption('paperSize', 'A4')}
                  >
                    <Text style={styles.paperSizeText}>A4</Text>
                    <Text style={styles.paperSizeLabel}>Papel</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            {/* Envio por Email */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Enviar por Email</Text>
                <TextInput
                  style={styles.emailInput}
                  placeholder="Digite o email do cliente"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
                <Button
                  mode="outlined"
                  onPress={handleEmail}
                  loading={isLoading}
                  disabled={!email.trim()}
                  style={styles.emailButton}
                  icon="email"
                >
                  Enviar por Email
                </Button>
              </Card.Content>
            </Card>
          </ScrollView>

          {/* Botões de Ação */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handlePrint}
              loading={isLoading}
              style={[styles.actionButton, styles.printButton]}
              icon="printer"
            >
              Imprimir
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleShare}
              loading={isLoading}
              style={styles.actionButton}
              icon="share"
            >
              Compartilhar
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
    maxHeight: '80%',
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  paperSizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paperSizeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPaperSize: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  paperSizeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  paperSizeLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  emailButton: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  printButton: {
    backgroundColor: '#6200ee',
  },
}); 