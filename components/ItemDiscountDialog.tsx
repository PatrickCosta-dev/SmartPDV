import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    Button,
    Dialog,
    Divider,
    Portal,
    SegmentedButtons,
    Text,
    TextInput,
    Title
} from 'react-native-paper';
import type { CartItem } from '../src/store/cartStore';

interface ItemDiscountDialogProps {
  visible: boolean;
  onDismiss: () => void;
  item: CartItem | null;
  onApplyDiscount: (productId: number, discount: number, discountPercent: number) => void;
}

export default function ItemDiscountDialog({ 
  visible, 
  onDismiss, 
  item, 
  onApplyDiscount 
}: ItemDiscountDialogProps) {
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  const handleApply = () => {
    if (!item) return;

    const fixedDiscount = discountType === 'fixed' ? parseFloat(discountValue) || 0 : 0;
    const percentDiscount = discountType === 'percent' ? parseFloat(discountPercent) || 0 : 0;

    onApplyDiscount(item.id, fixedDiscount, percentDiscount);
    onDismiss();
    
    // Limpa os campos
    setDiscountValue('');
    setDiscountPercent('');
  };

  const handleClear = () => {
    if (!item) return;
    
    onApplyDiscount(item.id, 0, 0);
    onDismiss();
    
    // Limpa os campos
    setDiscountValue('');
    setDiscountPercent('');
  };

  const getCurrentDiscount = () => {
    if (!item) return 0;
    
    const itemTotal = item.price * item.quantity;
    const fixedDiscount = item.discount || 0;
    const percentDiscount = item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0;
    
    return fixedDiscount + percentDiscount;
  };

  const getDiscountPreview = () => {
    if (!item) return 0;
    
    const itemTotal = item.price * item.quantity;
    
    if (discountType === 'fixed') {
      const discount = parseFloat(discountValue) || 0;
      return Math.min(discount, itemTotal);
    } else {
      const percent = parseFloat(discountPercent) || 0;
      return (itemTotal * percent) / 100;
    }
  };

  const getFinalPrice = () => {
    if (!item) return 0;
    
    const itemTotal = item.price * item.quantity;
    const discount = getDiscountPreview();
    return itemTotal - discount;
  };

  if (!item) return null;

  const itemTotal = item.price * item.quantity;
  const currentDiscount = getCurrentDiscount();
  const previewDiscount = getDiscountPreview();
  const finalPrice = getFinalPrice();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Aplicar Desconto</Dialog.Title>
        <Dialog.Content>
          <View style={styles.container}>
            <View style={styles.itemInfo}>
              <Title style={styles.itemName}>{item.name}</Title>
              <Text style={styles.itemDetails}>
                {item.quantity}x R$ {item.price.toFixed(2)} = R$ {itemTotal.toFixed(2)}
              </Text>
              {currentDiscount > 0 && (
                <Text style={styles.currentDiscount}>
                  Desconto atual: R$ {currentDiscount.toFixed(2)}
                </Text>
              )}
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Tipo de Desconto:</Text>
            <SegmentedButtons
              value={discountType}
              onValueChange={(value) => setDiscountType(value as 'fixed' | 'percent')}
              buttons={[
                { value: 'fixed', label: 'Valor Fixo' },
                { value: 'percent', label: 'Percentual' }
              ]}
              style={styles.segmentedButtons}
            />

            {discountType === 'fixed' ? (
              <TextInput
                label="Desconto (R$)"
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="0.00"
                maxLength={10}
              />
            ) : (
              <TextInput
                label="Desconto (%)"
                value={discountPercent}
                onChangeText={setDiscountPercent}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="0"
                maxLength={3}
              />
            )}

            <Divider style={styles.divider} />

            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Preview:</Text>
              <View style={styles.previewRow}>
                <Text>Subtotal do item:</Text>
                <Text>R$ {itemTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text>Desconto:</Text>
                <Text style={styles.discountText}>-R$ {previewDiscount.toFixed(2)}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.finalPriceLabel}>Preço final:</Text>
                <Text style={styles.finalPriceValue}>R$ {finalPrice.toFixed(2)}</Text>
              </View>
            </View>

            {previewDiscount > itemTotal && (
              <Text style={styles.warning}>
                ⚠️ O desconto não pode ser maior que o valor do item
              </Text>
            )}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          {currentDiscount > 0 && (
            <Button onPress={handleClear} textColor="#ff6b6b">
              Remover Desconto
            </Button>
          )}
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button 
            mode="contained" 
            onPress={handleApply}
            disabled={previewDiscount > itemTotal}
          >
            Aplicar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  itemInfo: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 18,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentDiscount: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  preview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  discountText: {
    color: '#ff6b6b',
    fontWeight: '500',
  },
  finalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  warning: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
}); 