import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Chip,
    Dialog,
    Divider,
    IconButton,
    Portal,
    Searchbar,
    SegmentedButtons,
    Text,
    TextInput,
    Title
} from 'react-native-paper';
import ItemDiscountDialog from '../components/ItemDiscountDialog';
import type { Product } from '../src/database/productService';
import { db } from '../src/database/productService';
import { convertCartItemToSaleItem, salesDb } from '../src/database/salesService';
import type { CartItem } from '../src/store/cartStore';
import { DEFAULT_COUPONS, PAYMENT_METHODS, useCartStore } from '../src/store/cartStore';

export default function PDVScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('money');
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  
  const { 
    items, 
    getTotal, 
    getSubtotal,
    getItemCount, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    loadCart,
    discount,
    discountPercent,
    appliedCoupon,
    couponCode,
    setDiscount,
    setDiscountPercent,
    applyCoupon,
    removeCoupon,
    setCouponCode,
    getTotalDiscount,
    getItemDiscount,
    setItemDiscount,
    setItemDiscountPercent,
    setPaymentMethod: setCartPaymentMethod,
    setCustomerName: setCartCustomerName,
    setSaleNotes: setCartSaleNotes
  } = useCartStore();

  // Carrega o carrinho ao iniciar
  useEffect(() => {
    loadCart();
  }, []);

  // Busca produtos quando necessário
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProducts([]);
      return;
    }

    try {
      const allProducts = await db.getAllProducts();
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setProducts(filtered);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    searchProducts(query);
  };

  const handleAddProductToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock
    });
    setSearchQuery('');
    setProducts([]);
    setShowProductSearch(false);
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: number) => {
    Alert.alert(
      'Remover Item',
      'Tem certeza que deseja remover este item do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', onPress: () => removeFromCart(productId), style: 'destructive' }
      ]
    );
  };

  const handleItemDiscount = (item: CartItem) => {
    setSelectedItem(item);
    setShowDiscountDialog(true);
  };

  const handleApplyItemDiscount = (productId: number, discount: number, discountPercent: number) => {
    setItemDiscount(productId, discount);
    setItemDiscountPercent(productId, discountPercent);
  };

  const handleApplyCoupon = () => {
    if (applyCoupon(couponCodeInput)) {
      setCouponCodeInput('');
      setShowCouponDialog(false);
    }
  };

  const handleFinalizeSale = () => {
    if (items.length === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione produtos ao carrinho antes de finalizar a venda.');
      return;
    }

    // Preenche os dados do carrinho com os valores do dialog
    setCartCustomerName(customerName);
    setCartSaleNotes(saleNotes);
    setCartPaymentMethod(paymentMethod);
    
    setShowFinalizeDialog(true);
  };

  const confirmFinalizeSale = async () => {
    try {
      // Converte itens do carrinho para itens de venda
      const saleItems = items.map(convertCartItemToSaleItem);
      
      // Cria a venda
      const sale = {
        items: saleItems,
        total: getSubtotal(),
        discount: getTotalDiscount(),
        finalTotal: getTotal(),
        paymentMethod: paymentMethod,
        notes: saleNotes,
        customerName: customerName || undefined
      };

      // Salva a venda
      await salesDb.saveSale(sale);

      // Limpa o carrinho
      clearCart();
      
      // Limpa os campos do dialog
      setCustomerName('');
      setSaleNotes('');
      setDiscountInput('');
      setDiscountPercentInput('');
      setCouponCodeInput('');
      setPaymentMethod('money');
      setDiscount(0);
      setDiscountPercent(0);
      
      setShowFinalizeDialog(false);
      
      Alert.alert('Sucesso!', 'Venda finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao finalizar a venda.');
    }
  };

  const handleDiscountChange = (value: string) => {
    setDiscountInput(value);
    const discountValue = parseFloat(value) || 0;
    setDiscount(discountValue);
  };

  const handleDiscountPercentChange = (value: string) => {
    setDiscountPercentInput(value);
    const percentValue = parseFloat(value) || 0;
    setDiscountPercent(percentValue);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = getItemDiscount(item);
    const finalItemTotal = itemTotal - itemDiscount;

    return (
      <Card style={styles.cartItemCard} mode="outlined">
        <Card.Content>
          <View style={styles.cartItemHeader}>
            <View style={styles.cartItemInfo}>
              <Title style={styles.itemName}>{item.name}</Title>
              <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
              {itemDiscount > 0 && (
                <Text style={styles.itemDiscount}>
                  Desconto: R$ {itemDiscount.toFixed(2)}
                </Text>
              )}
            </View>
            <View style={styles.cartItemActions}>
              <IconButton
                icon="percent"
                size={20}
                onPress={() => handleItemDiscount(item)}
                style={styles.discountButton}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleRemoveItem(item.id)}
                style={styles.deleteButton}
              />
            </View>
          </View>
          
          <View style={styles.quantityControls}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            />
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            />
            <Text style={styles.itemTotal}>R$ {finalItemTotal.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderProductSearchItem = ({ item }: { item: Product }) => (
    <Card style={styles.searchItemCard} mode="outlined">
      <Card.Content>
        <View style={styles.searchItemContent}>
          <View>
            <Title style={styles.searchItemName}>{item.name}</Title>
            <Text style={styles.searchItemPrice}>R$ {item.price.toFixed(2)}</Text>
            <Text style={styles.searchItemStock}>Estoque: {item.stock}</Text>
          </View>
          <Button
            mode="contained"
            onPress={() => handleAddProductToCart(item)}
            disabled={item.stock <= 0}
            compact
          >
            {item.stock <= 0 ? 'Sem estoque' : 'Adicionar'}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCouponDialog = () => (
    <Portal>
      <Dialog visible={showCouponDialog} onDismiss={() => setShowCouponDialog(false)}>
        <Dialog.Title>Aplicar Cupom</Dialog.Title>
        <Dialog.Content>
          <View style={styles.couponContent}>
            <TextInput
              label="Código do Cupom"
              value={couponCodeInput}
              onChangeText={setCouponCodeInput}
              style={styles.couponInput}
              mode="outlined"
              autoCapitalize="characters"
            />
            
            <Text style={styles.couponsTitle}>Cupons Disponíveis:</Text>
            {DEFAULT_COUPONS.map((coupon) => (
              <View key={coupon.id} style={styles.couponItem}>
                <Text style={styles.couponCode}>{coupon.code}</Text>
                <Text style={styles.couponDetails}>
                  {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}
                  {coupon.minPurchase && ` - Mín: R$ ${coupon.minPurchase.toFixed(2)}`}
                </Text>
              </View>
            ))}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowCouponDialog(false)}>Cancelar</Button>
          <Button mode="contained" onPress={handleApplyCoupon}>
            Aplicar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderFinalizeDialog = () => (
    <Portal>
      <Dialog visible={showFinalizeDialog} onDismiss={() => setShowFinalizeDialog(false)}>
        <Dialog.Title>Finalizar Venda</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            <View style={styles.dialogContent}>
              <TextInput
                label="Nome do Cliente (opcional)"
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.dialogInput}
                mode="outlined"
              />

              <TextInput
                label="Observações (opcional)"
                value={saleNotes}
                onChangeText={setSaleNotes}
                style={styles.dialogInput}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <TextInput
                label="Desconto Fixo (R$)"
                value={discountInput}
                onChangeText={handleDiscountChange}
                style={styles.dialogInput}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0.00"
              />

              <TextInput
                label="Desconto Percentual (%)"
                value={discountPercentInput}
                onChangeText={handleDiscountPercentChange}
                style={styles.dialogInput}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0"
              />

              <Text style={styles.paymentLabel}>Forma de Pagamento:</Text>
              <SegmentedButtons
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                buttons={PAYMENT_METHODS.map(method => ({
                  value: method.id,
                  label: method.name,
                  icon: method.icon,
                }))}
                style={styles.paymentButtons}
              />

              <Divider style={styles.dialogDivider} />

              <View style={styles.dialogTotals}>
                <View style={styles.dialogTotalRow}>
                  <Text>Subtotal:</Text>
                  <Text>R$ {getSubtotal().toFixed(2)}</Text>
                </View>
                {getTotalDiscount() > 0 && (
                  <View style={styles.dialogTotalRow}>
                    <Text>Total de Descontos:</Text>
                    <Text style={styles.discountText}>-R$ {getTotalDiscount().toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.dialogTotalRow}>
                  <Text style={styles.finalTotalLabel}>Total:</Text>
                  <Text style={styles.finalTotalValue}>R$ {getTotal().toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowFinalizeDialog(false)}>Cancelar</Button>
          <Button mode="contained" onPress={confirmFinalizeSale}>
            Confirmar Venda
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <View style={styles.container}>
      {/* Header com busca */}
      <Card style={styles.searchCard}>
        <Card.Content>
          <View style={styles.searchHeader}>
            <Searchbar
              placeholder="Buscar produtos..."
              onChangeText={handleSearchChange}
              value={searchQuery}
              style={styles.searchbar}
              onFocus={() => setShowProductSearch(true)}
            />
            <Button
              mode="outlined"
              onPress={() => setShowProductSearch(!showProductSearch)}
              style={styles.toggleSearchButton}
            >
              {showProductSearch ? 'Ocultar' : 'Buscar'}
            </Button>
          </View>
          
          {showProductSearch && searchQuery.length > 0 && (
            <View style={styles.searchResults}>
              <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProductSearchItem}
                style={styles.searchList}
                nestedScrollEnabled
              />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Carrinho */}
      <Card style={styles.cartContainer}>
        <Card.Content>
          <View style={styles.cartHeader}>
            <Title>Carrinho de Compras</Title>
            <Chip icon="shopping-cart" mode="outlined">
              {getItemCount()} itens
            </Chip>
          </View>
          
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>
                Seu carrinho está vazio
              </Text>
              <Text style={styles.emptyCartSubtext}>
                Use a busca acima para adicionar produtos
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCartItem}
              style={styles.cartList}
              nestedScrollEnabled
            />
          )}
          
          {items.length > 0 && (
            <View style={styles.totalContainer}>
              <Divider style={styles.divider} />
              <View style={styles.totalRow}>
                <Text>Subtotal:</Text>
                <Text>R$ {getSubtotal().toFixed(2)}</Text>
              </View>
              {getTotalDiscount() > 0 && (
                <View style={styles.totalRow}>
                  <Text>Total de Descontos:</Text>
                  <Text style={styles.discountText}>-R$ {getTotalDiscount().toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Title>Total:</Title>
                <Title style={styles.totalValue}>R$ {getTotal().toFixed(2)}</Title>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Botões de ação */}
      <View style={styles.actionButtons}>
        {items.length > 0 && (
          <>
            <Button
              mode="outlined"
              onPress={() => setShowCouponDialog(true)}
              style={styles.couponButton}
              icon="ticket-percent"
            >
              Cupom
            </Button>
            <Button
              mode="outlined"
              onPress={clearCart}
              style={styles.clearButton}
              icon="delete-sweep"
            >
              Limpar
            </Button>
          </>
        )}
        <Button
          icon="cash-register"
          mode="contained"
          onPress={handleFinalizeSale}
          style={styles.finalizeButton}
          disabled={items.length === 0}
        >
          Finalizar Venda
        </Button>
      </View>

      {/* Cupom aplicado */}
      {appliedCoupon && (
        <Card style={styles.couponCard}>
          <Card.Content>
            <View style={styles.couponApplied}>
              <Text style={styles.couponAppliedText}>
                Cupom aplicado: {appliedCoupon.code}
              </Text>
              <IconButton
                icon="close"
                size={16}
                onPress={removeCoupon}
                style={styles.removeCouponButton}
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {renderCouponDialog()}
      {renderFinalizeDialog()}
      <ItemDiscountDialog
        visible={showDiscountDialog}
        onDismiss={() => setShowDiscountDialog(false)}
        item={selectedItem}
        onApplyDiscount={handleApplyItemDiscount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f6f6',
  },
  searchCard: {
    marginBottom: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
  },
  toggleSearchButton: {
    minWidth: 80,
  },
  searchResults: {
    marginTop: 8,
    maxHeight: 200,
  },
  searchList: {
    maxHeight: 200,
  },
  searchItemCard: {
    marginBottom: 4,
  },
  searchItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchItemName: {
    fontSize: 16,
    marginBottom: 4,
  },
  searchItemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchItemStock: {
    fontSize: 12,
    color: '#999',
  },
  cartContainer: {
    flex: 1,
    marginBottom: 16,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  cartList: {
    flex: 1,
  },
  cartItemCard: {
    marginBottom: 8,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cartItemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemDiscount: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  cartItemActions: {
    flexDirection: 'row',
  },
  discountButton: {
    margin: 0,
  },
  deleteButton: {
    margin: 0,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  totalContainer: {
    marginTop: 16,
  },
  divider: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  totalValue: {
    color: '#6200ee',
  },
  discountText: {
    color: '#ff6b6b',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  couponButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
  },
  finalizeButton: {
    flex: 2,
  },
  couponCard: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponAppliedText: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  removeCouponButton: {
    margin: 0,
  },
  couponContent: {
    paddingVertical: 8,
  },
  couponInput: {
    marginBottom: 16,
  },
  couponsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  couponItem: {
    paddingVertical: 4,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '500',
  },
  couponDetails: {
    fontSize: 12,
    color: '#666',
  },
  dialogContent: {
    paddingVertical: 8,
  },
  dialogInput: {
    marginBottom: 16,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  paymentButtons: {
    marginBottom: 16,
  },
  dialogDivider: {
    marginVertical: 16,
  },
  dialogTotals: {
    marginTop: 8,
  },
  dialogTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
});