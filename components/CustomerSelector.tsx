import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Chip, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Customer, customerService } from '../src/database/customerService';
import { useCartStore } from '../src/store/cartStore';

interface CustomerSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function CustomerSelector({ visible, onClose }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { selectedCustomer, setCustomer } = useCartStore();

  useEffect(() => {
    if (visible) {
      loadCustomers();
    }
  }, [visible]);

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

  const handleSelectCustomer = (customer: Customer) => {
    setCustomer(customer);
    onClose();
  };

  const handleRemoveCustomer = () => {
    setCustomer(null);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const renderCustomerCard = (customer: Customer) => (
    <TouchableOpacity
      key={customer.id}
      onPress={() => handleSelectCustomer(customer)}
      style={[
        styles.customerCard,
        selectedCustomer?.id === customer.id && styles.selectedCustomerCard
      ]}
    >
      <Card>
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
          
          {selectedCustomer?.id === customer.id && (
            <View style={styles.selectedIndicator}>
              <Icon name="check-circle" size={20} color="#4caf50" />
              <Text style={styles.selectedText}>Cliente selecionado</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

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
            <Text style={styles.modalTitle}>Selecionar Cliente</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedCustomer && (
            <Card style={styles.currentCustomerCard}>
              <Card.Content>
                <Text style={styles.currentCustomerTitle}>Cliente Atual:</Text>
                <Text style={styles.currentCustomerName}>{selectedCustomer.name}</Text>
                <Text style={styles.currentCustomerEmail}>{selectedCustomer.email}</Text>
                <View style={styles.currentCustomerStats}>
                  <Chip icon="star" style={styles.loyaltyChip}>
                    {selectedCustomer.loyaltyPoints} pts
                  </Chip>
                  <Text style={styles.totalSpent}>
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={handleRemoveCustomer}
                  style={styles.removeButton}
                  textColor="#d32f2f"
                >
                  Remover Cliente
                </Button>
              </Card.Content>
            </Card>
          )}

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

          <View style={styles.modalFooter}>
            <Button mode="outlined" onPress={onClose} style={styles.footerButton}>
              Cancelar
            </Button>
            <Button 
              mode="contained" 
              onPress={onClose} 
              style={styles.footerButton}
              disabled={!selectedCustomer}
            >
              Confirmar
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
  currentCustomerCard: {
    marginBottom: 16,
    backgroundColor: '#e8f5e8',
  },
  currentCustomerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  currentCustomerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentCustomerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  currentCustomerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  removeButton: {
    marginTop: 8,
    borderColor: '#d32f2f',
  },
  searchBar: {
    marginBottom: 16,
  },
  customerList: {
    flex: 1,
    marginBottom: 16,
  },
  customerCard: {
    marginBottom: 8,
  },
  selectedCustomerCard: {
    borderWidth: 2,
    borderColor: '#4caf50',
    borderRadius: 8,
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
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