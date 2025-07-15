import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Dialog,
    IconButton,
    Portal,
    Searchbar,
    Text,
    TextInput
} from 'react-native-paper';
import ItemDiscountDialog from '../components/ItemDiscountDialog';
import PaymentDialog from '../components/PaymentDialog';
import PrintReceiptDialog from '../components/PrintReceiptDialog';
import type { Product } from '../src/database/productService';
import { db } from '../src/database/productService';
import { convertCartItemToSaleItem, salesDb } from '../src/database/salesService';
import type { CartItem } from '../src/store/cartStore';
import { useCartStore } from '../src/store/cartStore';

export default function PDVScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [discountPercentInput, setDiscountPercentInput] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);
  
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
    
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      // Converte itens do carrinho para itens de venda
      const saleItems = items.map(convertCartItemToSaleItem);
      
      // Cria a venda
      const sale = {
        items: saleItems,
        subtotal: getSubtotal(),
        total: getSubtotal(),
        discount: getTotalDiscount(),
        finalTotal: getTotal(),
        paymentMethod: 'dinheiro', // Será definido pelo PaymentDialog
        notes: saleNotes,
        customerName: customerName || undefined
      };

      // Salva a venda
      const savedSale = await salesDb.saveSale(sale);
      setLastSale(savedSale);
      
      // Limpa os campos do dialog
      setCustomerName('');
      setSaleNotes('');
      setDiscountInput('');
      setDiscountPercentInput('');
      setCouponCodeInput('');
      setDiscount(0);
      setDiscountPercent(0);
      
      // Pergunta se quer imprimir o comprovante
      Alert.alert(
        'Venda Finalizada!',
        'Venda finalizada com sucesso! Deseja imprimir o comprovante?',
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim', onPress: () => setShowPrintDialog(true) }
        ]
      );
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
    const discountPercentValue = parseFloat(value) || 0;
    setDiscountPercent(discountPercentValue);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = getItemDiscount(item);
    const finalItemTotal = itemTotal - itemDiscount;

    return (
      <Card style={styles.cartItem} mode="outlined">
        <Card.Content>
          <View style={styles.cartItemHeader}>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <Text style={styles.cartItemPrice}>
                {formatCurrency(item.price)} cada
              </Text>
            </View>
            <View style={styles.cartItemActions}>
              <IconButton
                icon="minus"
                size={20}
                onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              />
              <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleRemoveItem(item.id)}
                iconColor="#ff6b6b"
              />
            </View>
          </View>
          
          <View style={styles.cartItemDetails}>
            <Text style={styles.cartItemSubtotal}>
              Subtotal: {formatCurrency(itemTotal)}
            </Text>
            {itemDiscount > 0 && (
              <Text style={styles.cartItemDiscount}>
                Desconto: -{formatCurrency(itemDiscount)}
              </Text>
            )}
            <Text style={styles.cartItemTotal}>
              Total: {formatCurrency(finalItemTotal)}
            </Text>
          </View>

          <View style={styles.cartItemFooter}>
            <Button
              mode="outlined"
              onPress={() => handleItemDiscount(item)}
              compact
              icon="percent"
            >
              Desconto
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderProductSearchItem = ({ item }: { item: Product }) => (
    <Card style={styles.productItem} mode="outlined">
      <Card.Content>
        <View style={styles.productItemHeader}>
          <View style={styles.productItemInfo}>
            <Text style={styles.productItemName}>{item.name}</Text>
            <Text style={styles.productItemPrice}>
              {formatCurrency(item.price)}
            </Text>
            <Text style={styles.productItemStock}>
              Estoque: {item.stock}
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={() => handleAddProductToCart(item)}
            disabled={item.stock <= 0}
            compact
          >
            Adicionar
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
          <TextInput
            label="Código do Cupom"
            value={couponCodeInput}
            onChangeText={setCouponCodeInput}
            style={styles.input}
          />
          <Text style={styles.couponInfo}>
            Cupons disponíveis: DESCONTO10, FIXO5, MEGA20
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowCouponDialog(false)}>Cancelar</Button>
          <Button onPress={handleApplyCoupon}>Aplicar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Frente de Caixa</Text>
        <View style={styles.headerActions}>
          <Button
            mode="outlined"
            onPress={() => setShowCouponDialog(true)}
            icon="ticket-percent"
            compact
          >
            Cupom
          </Button>
          <Button
            mode="outlined"
            onPress={clearCart}
            icon="delete-sweep"
            compact
            disabled={items.length === 0}
          >
            Limpar
          </Button>
        </View>
      </View>

      {/* Busca de Produtos */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Buscar produtos..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          onFocus={() => setShowProductSearch(true)}
          style={styles.searchbar}
        />
        
        {showProductSearch && products.length > 0 && (
          <View style={styles.productSearchResults}>
            <FlatList
              data={products}
              renderItem={renderProductSearchItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.productList}
            />
          </View>
        )}
      </View>

      {/* Carrinho */}
      <View style={styles.cartSection}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>Carrinho ({getItemCount()} itens)</Text>
          <Text style={styles.cartTotal}>{formatCurrency(getTotal())}</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>
              Carrinho vazio. Adicione produtos para começar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.cartList}
          />
        )}
      </View>

      {/* Botão Finalizar */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleFinalizeSale}
          disabled={items.length === 0}
          style={styles.finalizeButton}
          icon="check"
        >
          Finalizar Venda ({formatCurrency(getTotal())})
        </Button>
      </View>

      {/* Diálogos */}
      {renderCouponDialog()}
      
      <PaymentDialog
        visible={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onSuccess={handlePaymentSuccess}
        total={getTotal()}
      />
      
      <ItemDiscountDialog
        visible={showDiscountDialog}
        onDismiss={() => setShowDiscountDialog(false)}
        item={selectedItem}
        onApplyDiscount={handleApplyItemDiscount}
      />

      <PrintReceiptDialog
        visible={showPrintDialog}
        onDismiss={() => setShowPrintDialog(false)}
        sale={lastSale}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchbar: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productSearchResults: {
    marginTop: 8,
    maxHeight: 200,
  },
  productList: {
    maxHeight: 200,
  },
  productItem: {
    marginBottom: 4,
  },
  productItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productItemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productItemStock: {
    fontSize: 12,
    color: '#999',
  },
  cartSection: {
    flex: 1,
    marginBottom: 16,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  cartItemDetails: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  cartItemSubtotal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cartItemDiscount: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 4,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  cartItemFooter: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  footer: {
    marginTop: 16,
  },
  finalizeButton: {
    backgroundColor: '#6200ee',
  },
  dialogContent: {
    paddingVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  paymentButtons: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  saleSummary: {
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  discountText: {
    color: '#ff6b6b',
    fontWeight: '500',
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
  couponInfo: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});