import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Chip,
    DataTable,
    Dialog,
    Divider,
    IconButton,
    Portal,
    Searchbar,
    Text,
    Title
} from 'react-native-paper';
import type { Sale } from '../src/database/salesService';
import { salesDb } from '../src/database/salesService';

export default function RelatoriosScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchQuery]);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      await salesDb.init();
      const allSales = await salesDb.getAllSales();
      const salesStats = await salesDb.getSalesStats();
      
      setSales(allSales);
      setFilteredSales(allSales);
      setStats(salesStats);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vendas.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSales = () => {
    if (!searchQuery.trim()) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(sale => {
      const query = searchQuery.toLowerCase();
      return (
        sale.customerName?.toLowerCase().includes(query) ||
        sale.items.some(item => item.name.toLowerCase().includes(query)) ||
        sale.paymentMethod.toLowerCase().includes(query) ||
        sale.id.includes(query)
      );
    });

    setFilteredSales(filtered);
  };

  const handleDeleteSale = async (saleId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await salesDb.deleteSale(saleId);
              if (success) {
                await loadSales();
                Alert.alert('Sucesso', 'Venda excluída com sucesso!');
              } else {
                Alert.alert('Erro', 'Não foi possível excluir a venda.');
              }
            } catch (error) {
              console.error('Erro ao excluir venda:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir a venda.');
            }
          }
        }
      ]
    );
  };

  const handleViewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleDetails(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      money: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX',
      transfer: 'Transferência'
    };
    return methods[method] || method;
  };

  const renderSaleItem = (item: any, index: number) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = (item.discount || 0) + (item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0);
    const finalItemTotal = itemTotal - itemDiscount;

    return (
      <View key={index} style={styles.saleItem}>
        <View style={styles.saleItemHeader}>
          <Text style={styles.saleItemName}>{item.name}</Text>
          <Text style={styles.saleItemQuantity}>{item.quantity}x</Text>
        </View>
        <View style={styles.saleItemDetails}>
          <Text style={styles.saleItemPrice}>
            R$ {item.price.toFixed(2)} cada
          </Text>
          {itemDiscount > 0 && (
            <Text style={styles.saleItemDiscount}>
              Desconto: R$ {itemDiscount.toFixed(2)}
            </Text>
          )}
          <Text style={styles.saleItemTotal}>
            Total: R$ {finalItemTotal.toFixed(2)}
          </Text>
        </View>
        {item.notes && (
          <Text style={styles.saleItemNotes}>Obs: {item.notes}</Text>
        )}
      </View>
    );
  };

  const renderSaleDetails = () => (
    <Portal>
      <Dialog visible={showSaleDetails} onDismiss={() => setShowSaleDetails(false)}>
        <Dialog.Title>Detalhes da Venda</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.dialogContent}>
            {selectedSale && (
              <View>
                <View style={styles.saleDetailHeader}>
                  <Text style={styles.saleDetailId}>Venda #{selectedSale.id}</Text>
                  <Text style={styles.saleDetailDate}>
                    {formatDate(selectedSale.date)}
                  </Text>
                </View>

                {selectedSale.customerName && (
                  <View style={styles.saleDetailSection}>
                    <Text style={styles.saleDetailLabel}>Cliente:</Text>
                    <Text style={styles.saleDetailValue}>{selectedSale.customerName}</Text>
                  </View>
                )}

                <View style={styles.saleDetailSection}>
                  <Text style={styles.saleDetailLabel}>Forma de Pagamento:</Text>
                  <Text style={styles.saleDetailValue}>
                    {getPaymentMethodName(selectedSale.paymentMethod)}
                  </Text>
                </View>

                {selectedSale.appliedCoupon && (
                  <View style={styles.saleDetailSection}>
                    <Text style={styles.saleDetailLabel}>Cupom Aplicado:</Text>
                    <Text style={styles.saleDetailValue}>
                      {selectedSale.appliedCoupon.code} 
                      ({selectedSale.appliedCoupon.type === 'percentage' ? 
                        `${selectedSale.appliedCoupon.value}%` : 
                        `R$ ${selectedSale.appliedCoupon.value.toFixed(2)}`})
                    </Text>
                  </View>
                )}

                <Divider style={styles.saleDetailDivider} />

                <Text style={styles.saleDetailLabel}>Itens:</Text>
                {selectedSale.items.map(renderSaleItem)}

                <Divider style={styles.saleDetailDivider} />

                <View style={styles.saleDetailTotals}>
                  <View style={styles.saleDetailTotalRow}>
                    <Text>Subtotal:</Text>
                    <Text>{formatCurrency(selectedSale.subtotal)}</Text>
                  </View>
                  {selectedSale.discount > 0 && (
                    <View style={styles.saleDetailTotalRow}>
                      <Text>Total de Descontos:</Text>
                      <Text style={styles.discountText}>
                        -{formatCurrency(selectedSale.discount)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.saleDetailTotalRow}>
                    <Text style={styles.finalTotalLabel}>Total Final:</Text>
                    <Text style={styles.finalTotalValue}>
                      {formatCurrency(selectedSale.finalTotal)}
                    </Text>
                  </View>
                </View>

                {selectedSale.notes && (
                  <View style={styles.saleDetailSection}>
                    <Text style={styles.saleDetailLabel}>Observações:</Text>
                    <Text style={styles.saleDetailValue}>{selectedSale.notes}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowSaleDetails(false)}>Fechar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando relatórios...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Estatísticas Gerais */}
      {stats && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>Estatísticas Gerais</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalSales}</Text>
                <Text style={styles.statLabel}>Total de Vendas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
                <Text style={styles.statLabel}>Receita Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(stats.totalDiscounts)}</Text>
                <Text style={styles.statLabel}>Total de Descontos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(stats.averageTicket)}</Text>
                <Text style={styles.statLabel}>Ticket Médio</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Produtos Mais Vendidos */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Produtos Mais Vendidos</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Produto</DataTable.Title>
                <DataTable.Title numeric>Qtd</DataTable.Title>
                <DataTable.Title numeric>Receita</DataTable.Title>
              </DataTable.Header>

              {stats.topProducts.slice(0, 5).map((product: any, index: number) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{product.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{product.quantity}</DataTable.Cell>
                  <DataTable.Cell numeric>{formatCurrency(product.revenue)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      )}

      {/* Estatísticas por Forma de Pagamento */}
      {stats?.paymentStats && Object.keys(stats.paymentStats).length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Por Forma de Pagamento</Title>
            {Object.entries(stats.paymentStats).map(([method, data]: [string, any]) => (
              <View key={method} style={styles.paymentStat}>
                <Text style={styles.paymentMethod}>
                  {getPaymentMethodName(method)}
                </Text>
                <View style={styles.paymentDetails}>
                  <Text>{data.count} vendas</Text>
                  <Text style={styles.paymentTotal}>
                    {formatCurrency(data.total)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Lista de Vendas */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.salesHeader}>
            <Title>Histórico de Vendas</Title>
            <Button
              mode="outlined"
              onPress={loadSales}
              icon="refresh"
              compact
            >
              Atualizar
            </Button>
          </View>

          <Searchbar
            placeholder="Buscar vendas..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          {filteredSales.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
              </Text>
            </View>
          ) : (
            <View style={styles.salesList}>
              {filteredSales.map((sale) => (
                <Card key={sale.id} style={styles.saleCard} mode="outlined">
                  <Card.Content>
                    <View style={styles.saleHeader}>
                      <View style={styles.saleInfo}>
                        <Text style={styles.saleId}>Venda #{sale.id}</Text>
                        <Text style={styles.saleDate}>{formatDate(sale.date)}</Text>
                        {sale.customerName && (
                          <Text style={styles.saleCustomer}>Cliente: {sale.customerName}</Text>
                        )}
                      </View>
                      <View style={styles.saleActions}>
                        <IconButton
                          icon="eye"
                          size={20}
                          onPress={() => handleViewSaleDetails(sale)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => handleDeleteSale(sale.id)}
                          iconColor="#ff6b6b"
                        />
                      </View>
                    </View>

                    <View style={styles.saleSummary}>
                      <Chip icon="shopping" mode="outlined">
                        {sale.items.length} itens
                      </Chip>
                      <Chip icon="cash" mode="outlined">
                        {getPaymentMethodName(sale.paymentMethod)}
                      </Chip>
                      {sale.discount > 0 && (
                        <Chip icon="percent" mode="outlined" textStyle={{ color: '#ff6b6b' }}>
                          Desconto: {formatCurrency(sale.discount)}
                        </Chip>
                      )}
                    </View>

                    <View style={styles.saleTotal}>
                      <Text style={styles.saleTotalLabel}>Total:</Text>
                      <Text style={styles.saleTotalValue}>
                        {formatCurrency(sale.finalTotal)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {renderSaleDetails()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f6f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  paymentStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentDetails: {
    alignItems: 'flex-end',
  },
  paymentTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  salesList: {
    gap: 8,
  },
  saleCard: {
    marginBottom: 8,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  saleCustomer: {
    fontSize: 14,
    color: '#666',
  },
  saleActions: {
    flexDirection: 'row',
  },
  saleSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  saleTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saleTotalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  saleTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  dialogContent: {
    maxHeight: 400,
  },
  saleDetailHeader: {
    marginBottom: 16,
  },
  saleDetailId: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  saleDetailDate: {
    fontSize: 14,
    color: '#666',
  },
  saleDetailSection: {
    marginBottom: 12,
  },
  saleDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  saleDetailValue: {
    fontSize: 14,
    color: '#333',
  },
  saleDetailDivider: {
    marginVertical: 16,
  },
  saleItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  saleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleItemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  saleItemQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  saleItemDetails: {
    marginBottom: 4,
  },
  saleItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  saleItemDiscount: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  saleItemTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  saleItemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  saleDetailTotals: {
    marginTop: 16,
  },
  saleDetailTotalRow: {
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
});