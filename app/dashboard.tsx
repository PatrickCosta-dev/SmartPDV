import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { customerService } from '../src/database/customerService';
import { inventoryService } from '../src/database/inventoryService';
import { paymentService } from '../src/database/paymentService';
import { salesDb as salesService } from '../src/database/salesService';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'hoje' | 'semana' | 'mes'>('hoje');
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calcular datas baseadas no período
      const now = new Date();
      let startDate: string;
      
      switch (period) {
        case 'hoje':
          startDate = now.toISOString().split('T')[0];
          break;
        case 'semana':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'mes':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = monthAgo.toISOString().split('T')[0];
          break;
      }

      const endDate = now.toISOString().split('T')[0];

      // Carregar dados em paralelo
      const [
        salesStats,
        customers,
        inventory,
        payments,
        salesByDate,
        topProductsData,
        customerStatsData
      ] = await Promise.all([
        salesService.getSalesStats(),
        customerService.getAllCustomers(),
        inventoryService.getInventoryReport(startDate, endDate),
        paymentService.getPaymentReport(startDate, endDate),
        getSalesByDate(startDate, endDate),
        getTopProducts(startDate, endDate),
        getCustomerStats(startDate, endDate)
      ]);

      setMetrics({
        totalSales: salesStats.totalSales,
        totalRevenue: salesStats.totalRevenue,
        averageTicket: salesStats.averageTicket,
        totalCustomers: customers.length,
        totalProducts: inventory.totalProducts,
        lowStockItems: inventory.lowStockProducts,
        outOfStockItems: inventory.outOfStockProducts,
      });

      setSalesData(salesByDate);
      setPaymentData(formatPaymentData(payments.paymentsByMethod));
      setTopProducts(topProductsData);
      setCustomerStats(customerStatsData);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSalesByDate = async (startDate: string, endDate: string) => {
    try {
      const sales = await salesService.getSalesByDateRange(startDate, endDate);
      
      // Agrupar vendas por data
      const salesByDate = sales.reduce((acc: any, sale: any) => {
        const date = sale.date.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, sales: 0, revenue: 0 };
        }
        acc[date].sales++;
        acc[date].revenue += sale.finalTotal;
        return acc;
      }, {});

      return Object.values(salesByDate).slice(-7); // Últimos 7 dias
    } catch (error) {
      console.error('Erro ao carregar vendas por data:', error);
      return [];
    }
  };

  const getTopProducts = async (startDate: string, endDate: string) => {
    try {
      const sales = await salesService.getSalesByDateRange(startDate, endDate);
      
      // Calcular produtos mais vendidos
      const productStats = sales.reduce((acc: any, sale: any) => {
        sale.items.forEach((item: any) => {
          if (!acc[item.name]) {
            acc[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          acc[item.name].quantity += item.quantity;
          acc[item.name].revenue += (item.price * item.quantity) - (item.discount || 0);
        });
        return acc;
      }, {});

      return Object.values(productStats)
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao carregar produtos mais vendidos:', error);
      return [];
    }
  };

  const getCustomerStats = async (startDate: string, endDate: string) => {
    try {
      const customers = await customerService.getAllCustomers();
      const purchases = await customerService.getAllCustomerPurchases();
      
      // Filtrar compras do período
      const periodPurchases = purchases.filter(purchase => 
        purchase.date >= startDate && purchase.date <= endDate
      );

      // Calcular estatísticas por cliente
      const customerStats = customers.map(customer => {
        const customerPurchases = periodPurchases.filter(p => p.customerId === customer.id);
        const totalSpent = customerPurchases.reduce((sum, p) => sum + p.amount, 0);
        const purchaseCount = customerPurchases.length;
        
        return {
          name: customer.name,
          totalSpent,
          purchaseCount,
          loyaltyPoints: customer.loyaltyPoints,
        };
      });

      return customerStats
        .filter(c => c.totalSpent > 0)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de clientes:', error);
      return [];
    }
  };

  const formatPaymentData = (paymentsByMethod: any) => {
    return Object.entries(paymentsByMethod).map(([method, data]: [string, any]) => ({
      name: getPaymentMethodName(method),
      amount: data.amount,
      count: data.count,
      color: getPaymentMethodColor(method),
    }));
  };

  const getPaymentMethodName = (method: string) => {
    const names: { [key: string]: string } = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_credito: 'Cartão Crédito',
      cartao_debito: 'Cartão Débito',
      vale: 'Vale',
    };
    return names[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      dinheiro: '#4caf50',
      pix: '#2196f3',
      cartao_credito: '#ff9800',
      cartao_debito: '#9c27b0',
      vale: '#607d8b',
    };
    return colors[method] || '#666';
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
    <Card style={styles.metricCard}>
      <Card.Content>
        <View style={styles.metricHeader}>
          <Icon name={icon} size={24} color={color} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
      </Card.Content>
    </Card>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity
        style={[styles.periodButton, period === 'hoje' && styles.activePeriod]}
        onPress={() => setPeriod('hoje')}
      >
        <Text style={[styles.periodText, period === 'hoje' && styles.activePeriodText]}>
          Hoje
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.periodButton, period === 'semana' && styles.activePeriod]}
        onPress={() => setPeriod('semana')}
      >
        <Text style={[styles.periodText, period === 'semana' && styles.activePeriodText]}>
          Semana
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.periodButton, period === 'mes' && styles.activePeriod]}
        onPress={() => setPeriod('mes')}
      >
        <Text style={[styles.periodText, period === 'mes' && styles.activePeriodText]}>
          Mês
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSalesChart = () => {
    if (salesData.length === 0) return null;

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Vendas por Período</Text>
          <View style={styles.chartPlaceholder}>
            <Icon name="chart-line" size={48} color="#ccc" />
            <Text style={styles.chartPlaceholderText}>
              Gráfico de vendas por período
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              {salesData.length} dias de dados disponíveis
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderPaymentChart = () => {
    if (paymentData.length === 0) return null;

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Pagamentos por Método</Text>
          <View style={styles.chartPlaceholder}>
            <Icon name="pie-chart" size={48} color="#ccc" />
            <Text style={styles.chartPlaceholderText}>
              Gráfico de pagamentos por método
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              {paymentData.length} métodos de pagamento
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderTopProducts = () => (
    <Card style={styles.listCard}>
      <Card.Content>
        <Text style={styles.listTitle}>Produtos Mais Vendidos</Text>
        {topProducts.map((product: any, index: number) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Text style={styles.listItemName}>{product.name}</Text>
              <Text style={styles.listItemQuantity}>{product.quantity} un</Text>
            </View>
            <Text style={styles.listItemRevenue}>
              {formatCurrency(product.revenue)}
            </Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderTopCustomers = () => (
    <Card style={styles.listCard}>
      <Card.Content>
        <Text style={styles.listTitle}>Melhores Clientes</Text>
        {customerStats.map((customer: any, index: number) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemHeader}>
              <Text style={styles.listItemName}>{customer.name}</Text>
              <Chip icon="star" style={styles.loyaltyChip}>
                {customer.loyaltyPoints} pts
              </Chip>
            </View>
            <View style={styles.customerStats}>
              <Text style={styles.listItemRevenue}>
                {formatCurrency(customer.totalSpent)}
              </Text>
              <Text style={styles.purchaseCount}>
                {customer.purchaseCount} compras
              </Text>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Button
          mode="contained"
          onPress={loadDashboardData}
          loading={loading}
          icon="refresh"
        >
          Atualizar
        </Button>
      </View>

      {renderPeriodSelector()}

      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          {renderMetricCard(
            'Vendas',
            metrics.totalSales,
            'shopping',
            '#4caf50'
          )}
          {renderMetricCard(
            'Receita',
            formatCurrency(metrics.totalRevenue),
            'currency-usd',
            '#2196f3'
          )}
        </View>
        <View style={styles.metricsRow}>
          {renderMetricCard(
            'Ticket Médio',
            formatCurrency(metrics.averageTicket),
            'chart-line',
            '#ff9800'
          )}
          {renderMetricCard(
            'Clientes',
            metrics.totalCustomers,
            'account-group',
            '#9c27b0'
          )}
        </View>
        <View style={styles.metricsRow}>
          {renderMetricCard(
            'Produtos',
            metrics.totalProducts,
            'package-variant',
            '#607d8b'
          )}
          {renderMetricCard(
            'Estoque Baixo',
            metrics.lowStockItems,
            'alert',
            '#f44336'
          )}
        </View>
      </View>

      {renderSalesChart()}
      {renderPaymentChart()}
      {renderTopProducts()}
      {renderTopCustomers()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  activePeriod: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  activePeriodText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  metricsGrid: {
    padding: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 6,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartCard: {
    margin: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listCard: {
    margin: 16,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  listItemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  listItemRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: 4,
  },
  loyaltyChip: {
    height: 24,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  purchaseCount: {
    fontSize: 12,
    color: '#666',
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
}); 