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
import { Button, Card, Chip, Divider, FAB, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Customer, CustomerPurchase, customerService } from '../src/database/customerService';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPurchases, setCustomerPurchases] = useState<CustomerPurchase[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const allCustomers = await customerService.getAllCustomers();
      setCustomers(allCustomers);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.cpf.includes(searchQuery)
    );
    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }

    try {
      await customerService.addCustomer(formData);
      setFormData({ name: '', email: '', phone: '', cpf: '', address: '' });
      setModalVisible(false);
      loadCustomers();
      Alert.alert('Sucesso', 'Cliente adicionado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao adicionar cliente');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerService.deleteCustomer(customerId);
              loadCustomers();
              Alert.alert('Sucesso', 'Cliente excluído com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir cliente');
            }
          },
        },
      ]
    );
  };

  const handleViewCustomerDetails = async (customer: Customer) => {
    try {
      const purchases = await customerService.getCustomerPurchases(customer.id);
      setCustomerPurchases(purchases);
      setSelectedCustomer(customer);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar histórico do cliente');
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderCustomerCard = (customer: Customer) => (
    <Card key={customer.id} style={styles.customerCard}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerEmail}>{customer.email}</Text>
            <Text style={styles.customerPhone}>{customer.phone}</Text>
          </View>
          <View style={styles.customerStats}>
            <Chip icon="star" style={styles.loyaltyChip}>
              {customer.loyaltyPoints} pts
            </Chip>
            <Text style={styles.totalSpent}>
              {formatCurrency(customer.totalSpent)}
            </Text>
          </View>
        </View>
        
        <View style={styles.customerActions}>
          <Button
            mode="outlined"
            onPress={() => handleViewCustomerDetails(customer)}
            style={styles.actionButton}
          >
            <Icon name="history" size={16} />
            Histórico
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleDeleteCustomer(customer.id)}
            style={[styles.actionButton, styles.deleteButton]}
            textColor="#d32f2f"
          >
            <Icon name="delete" size={16} />
            Excluir
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCustomerDetailsModal = () => (
    <Modal
      visible={selectedCustomer !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedCustomer(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhes do Cliente</Text>
            <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedCustomer && (
            <>
              <Card style={styles.detailCard}>
                <Card.Content>
                  <Text style={styles.detailName}>{selectedCustomer.name}</Text>
                  <Text style={styles.detailEmail}>{selectedCustomer.email}</Text>
                  <Text style={styles.detailPhone}>{selectedCustomer.phone}</Text>
                  <Text style={styles.detailCpf}>CPF: {selectedCustomer.cpf}</Text>
                  <Text style={styles.detailAddress}>{selectedCustomer.address}</Text>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Pontos de Fidelidade</Text>
                      <Text style={styles.statValue}>{selectedCustomer.loyaltyPoints}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Gasto</Text>
                      <Text style={styles.statValue}>{formatCurrency(selectedCustomer.totalSpent)}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              <Text style={styles.sectionTitle}>Histórico de Compras</Text>
              
              <ScrollView style={styles.purchasesList}>
                {customerPurchases.length === 0 ? (
                  <Text style={styles.noPurchases}>Nenhuma compra registrada</Text>
                ) : (
                  customerPurchases.map((purchase) => (
                    <Card key={purchase.id} style={styles.purchaseCard}>
                      <Card.Content>
                        <View style={styles.purchaseHeader}>
                          <Text style={styles.purchaseDate}>
                            {formatDate(purchase.date)}
                          </Text>
                          <Text style={styles.purchaseAmount}>
                            {formatCurrency(purchase.amount)}
                          </Text>
                        </View>
                        <Text style={styles.purchasePoints}>
                          +{purchase.pointsEarned} pontos
                        </Text>
                      </Card.Content>
                    </Card>
                  ))
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderAddCustomerModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar Cliente</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Telefone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="CPF"
              value={formData.cpf}
              onChangeText={(text) => setFormData({ ...formData, cpf: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Endereço"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
            />

            <Button
              mode="contained"
              onPress={handleAddCustomer}
              style={styles.addButton}
            >
              Adicionar Cliente
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar clientes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView style={styles.customerList}>
        {loading ? (
          <Text style={styles.loadingText}>Carregando clientes...</Text>
        ) : filteredCustomers.length === 0 ? (
          <Text style={styles.noCustomersText}>
            {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </Text>
        ) : (
          filteredCustomers.map(renderCustomerCard)
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      {renderAddCustomerModal()}
      {renderCustomerDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  customerList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  customerCard: {
    marginBottom: 12,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  customerStats: {
    alignItems: 'flex-end',
  },
  loyaltyChip: {
    marginBottom: 8,
  },
  totalSpent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    borderColor: '#d32f2f',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
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
  formContainer: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    marginTop: 16,
  },
  detailCard: {
    marginBottom: 16,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  detailPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  detailCpf: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  detailAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  purchasesList: {
    maxHeight: 300,
  },
  purchaseCard: {
    marginBottom: 8,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseDate: {
    fontSize: 14,
    color: '#666',
  },
  purchaseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  purchasePoints: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 4,
  },
  noPurchases: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  noCustomersText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
});