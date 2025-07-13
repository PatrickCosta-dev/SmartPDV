import React, { useEffect, useState } from 'react';
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
  );
}

const styles = StyleSheet.create({
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
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
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
  },
}); 