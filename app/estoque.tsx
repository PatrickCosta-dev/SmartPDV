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
import { Badge, Button, Card, Chip, FAB, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { InventoryItem, InventoryMovement, inventoryService, StockAlert } from '../src/database/inventoryService';
import { productService } from '../src/database/productService';

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    minQuantity: '',
    maxQuantity: '',
  });

  // Estados para ajuste de estoque
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    reason: '',
    type: 'ajuste' as 'entrada' | 'saida' | 'ajuste',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [searchQuery, inventory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryData, productsData, alertsData] = await Promise.all([
        inventoryService.getAllInventory(),
        productService.getAllProducts(),
        inventoryService.getActiveAlerts(),
      ]);
      
      setInventory(inventoryData);
      setProducts(productsData);
      setAlerts(alertsData);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar dados do estoque');
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    if (!searchQuery.trim()) {
      setFilteredInventory(inventory);
      return;
    }

    const filtered = inventory.filter(item => {
      const product = products.find(p => p.id.toString() === item.productId);
      return product && product.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredInventory(filtered);
  };

  const handleAddInventoryItem = async () => {
    if (!formData.productId || !formData.quantity) {
      Alert.alert('Erro', 'Produto e quantidade são obrigatórios');
      return;
    }

    try {
      await inventoryService.addInventoryItem({
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        minQuantity: parseInt(formData.minQuantity) || 5,
        maxQuantity: parseInt(formData.maxQuantity) || 100,
      });
      
      setFormData({ productId: '', quantity: '', minQuantity: '', maxQuantity: '' });
      setModalVisible(false);
      loadData();
      Alert.alert('Sucesso', 'Item adicionado ao estoque!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao adicionar item ao estoque');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustmentData.quantity || !adjustmentData.reason) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios');
      return;
    }

    try {
      const newQuantity = adjustmentData.type === 'entrada' 
        ? selectedItem.quantity + parseInt(adjustmentData.quantity)
        : selectedItem.quantity - parseInt(adjustmentData.quantity);

      if (newQuantity < 0) {
        Alert.alert('Erro', 'Quantidade insuficiente em estoque');
        return;
      }

      await inventoryService.updateInventoryQuantity(
        selectedItem.productId,
        newQuantity,
        adjustmentData.reason,
        adjustmentData.type
      );

      setAdjustmentData({ quantity: '', reason: '', type: 'ajuste' });
      setSelectedItem(null);
      loadData();
      Alert.alert('Sucesso', 'Estoque ajustado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao ajustar estoque');
    }
  };

  const handleViewMovements = async (item: InventoryItem) => {
    try {
      const itemMovements = await inventoryService.getProductMovements(item.productId);
      setMovements(itemMovements);
      setSelectedItem(item);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar movimentações');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await inventoryService.resolveAlert(alertId);
      loadData();
      Alert.alert('Sucesso', 'Alerta resolvido!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao resolver alerta');
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    return product ? product.name : 'Produto não encontrado';
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { status: 'zerado', color: '#d32f2f', text: 'Sem estoque' };
    if (item.quantity <= item.minQuantity) return { status: 'baixo', color: '#ff9800', text: 'Estoque baixo' };
    if (item.quantity >= item.maxQuantity) return { status: 'alto', color: '#2196f3', text: 'Estoque alto' };
    return { status: 'normal', color: '#4caf50', text: 'Normal' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderInventoryCard = (item: InventoryItem) => {
    const productName = getProductName(item.productId);
    const stockStatus = getStockStatus(item);

    return (
      <Card key={item.id} style={styles.inventoryCard}>
        <Card.Content>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{productName}</Text>
              <Text style={styles.itemQuantity}>
                Quantidade: {item.quantity}
              </Text>
              <Text style={styles.itemLimits}>
                Mín: {item.minQuantity} | Máx: {item.maxQuantity}
              </Text>
            </View>
            <View style={styles.itemStatus}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: stockStatus.color }]}
                textStyle={{ color: 'white' }}
              >
                {stockStatus.text}
              </Chip>
            </View>
          </View>
          
          <View style={styles.itemActions}>
            <Button
              mode="outlined"
              onPress={() => handleViewMovements(item)}
              style={styles.actionButton}
            >
              <Icon name="history" size={16} />
              Movimentações
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedItem(item);
                setAdjustmentData({ quantity: '', reason: '', type: 'ajuste' });
              }}
              style={styles.actionButton}
            >
              <Icon name="pencil" size={16} />
              Ajustar
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAlertsSection = () => (
    <Card style={styles.alertsCard}>
      <Card.Content>
        <View style={styles.alertsHeader}>
          <Text style={styles.alertsTitle}>Alertas de Estoque</Text>
          <Badge>{alerts.length}</Badge>
        </View>
        
        {alerts.length === 0 ? (
          <Text style={styles.noAlerts}>Nenhum alerta ativo</Text>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertInfo}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertDate}>{formatDate(alert.date)}</Text>
              </View>
              <Button
                mode="outlined"
                onPress={() => handleResolveAlert(alert.id)}
                style={styles.resolveButton}
              >
                Resolver
              </Button>
            </View>
          ))
        )}
      </Card.Content>
    </Card>
  );

  const renderAddInventoryModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar ao Estoque</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.formLabel}>Produto</Text>
            <View style={styles.pickerContainer}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productOption,
                    formData.productId === product.id.toString() && styles.selectedProduct
                  ]}
                  onPress={() => setFormData({ ...formData, productId: product.id.toString() })}
                >
                  <Text style={styles.productOptionText}>{product.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Quantidade Inicial</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantidade"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Quantidade Mínima</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínima (padrão: 5)"
              value={formData.minQuantity}
              onChangeText={(text) => setFormData({ ...formData, minQuantity: text })}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Quantidade Máxima</Text>
            <TextInput
              style={styles.input}
              placeholder="Máxima (padrão: 100)"
              value={formData.maxQuantity}
              onChangeText={(text) => setFormData({ ...formData, maxQuantity: text })}
              keyboardType="numeric"
            />

            <Button
              mode="contained"
              onPress={handleAddInventoryItem}
              style={styles.addButton}
            >
              Adicionar ao Estoque
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAdjustmentModal = () => (
    <Modal
      visible={selectedItem !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedItem(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajustar Estoque</Text>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <>
              <Card style={styles.detailCard}>
                <Card.Content>
                  <Text style={styles.detailName}>
                    {getProductName(selectedItem.productId)}
                  </Text>
                  <Text style={styles.detailQuantity}>
                    Estoque atual: {selectedItem.quantity}
                  </Text>
                </Card.Content>
              </Card>

              <View style={styles.adjustmentTypeContainer}>
                <Text style={styles.formLabel}>Tipo de Ajuste</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      adjustmentData.type === 'entrada' && styles.selectedType
                    ]}
                    onPress={() => setAdjustmentData({ ...adjustmentData, type: 'entrada' })}
                  >
                    <Text style={styles.typeButtonText}>Entrada</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      adjustmentData.type === 'saida' && styles.selectedType
                    ]}
                    onPress={() => setAdjustmentData({ ...adjustmentData, type: 'saida' })}
                  >
                    <Text style={styles.typeButtonText}>Saída</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      adjustmentData.type === 'ajuste' && styles.selectedType
                    ]}
                    onPress={() => setAdjustmentData({ ...adjustmentData, type: 'ajuste' })}
                  >
                    <Text style={styles.typeButtonText}>Ajuste</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.formLabel}>Quantidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Quantidade"
                value={adjustmentData.quantity}
                onChangeText={(text) => setAdjustmentData({ ...adjustmentData, quantity: text })}
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Motivo</Text>
              <TextInput
                style={styles.input}
                placeholder="Motivo do ajuste"
                value={adjustmentData.reason}
                onChangeText={(text) => setAdjustmentData({ ...adjustmentData, reason: text })}
                multiline
              />

              <Button
                mode="contained"
                onPress={handleAdjustStock}
                style={styles.addButton}
              >
                Aplicar Ajuste
              </Button>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderMovementsModal = () => (
    <Modal
      visible={movements.length > 0}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setMovements([])}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Movimentações</Text>
            <TouchableOpacity onPress={() => setMovements([])}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.movementsList}>
            {movements.map((movement) => (
              <Card key={movement.id} style={styles.movementCard}>
                <Card.Content>
                  <View style={styles.movementHeader}>
                    <Text style={styles.movementType}>
                      {movement.type.toUpperCase()}
                    </Text>
                    <Text style={styles.movementQuantity}>
                      {movement.quantity}
                    </Text>
                  </View>
                  <Text style={styles.movementReason}>{movement.reason}</Text>
                  <Text style={styles.movementDate}>{formatDate(movement.date)}</Text>
                  <Text style={styles.movementDetails}>
                    {movement.previousQuantity} → {movement.newQuantity}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar produtos no estoque..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView style={styles.content}>
        {renderAlertsSection()}

        <Text style={styles.sectionTitle}>Estoque</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Carregando estoque...</Text>
        ) : filteredInventory.length === 0 ? (
          <Text style={styles.noItemsText}>
            {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto no estoque'}
          </Text>
        ) : (
          filteredInventory.map(renderInventoryCard)
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      {renderAddInventoryModal()}
      {renderAdjustmentModal()}
      {renderMovementsModal()}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  alertsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  noAlerts: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alertInfo: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
  },
  alertDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  resolveButton: {
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inventoryCard: {
    marginBottom: 12,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemLimits: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
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
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    maxHeight: 200,
  },
  productOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 8,
  },
  selectedProduct: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  productOptionText: {
    fontSize: 14,
    color: '#333',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailQuantity: {
    fontSize: 16,
    color: '#666',
  },
  adjustmentTypeContainer: {
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  movementsList: {
    maxHeight: 400,
  },
  movementCard: {
    marginBottom: 8,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  movementQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  movementReason: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  movementDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  movementDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  noItemsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
}); 