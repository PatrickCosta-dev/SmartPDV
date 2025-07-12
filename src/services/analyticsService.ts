export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export interface UserProperties {
  userId?: string;
  userType?: 'admin' | 'operator' | 'viewer';
  storeName?: string;
  location?: string;
}

export class AnalyticsService {
  private static isInitialized = false;
  private static userProperties: UserProperties = {};
  private static events: AnalyticsEvent[] = [];

  /**
   * Inicializa o analytics
   */
  static async initialize(measurementId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Em produção, você integraria com Google Analytics, Mixpanel, etc.
      console.log('Analytics inicializado com measurementId:', measurementId);
      this.isInitialized = true;
      
      // Registra evento de inicialização
      await this.logEvent({
        name: 'app_initialized',
        properties: {
          measurement_id: measurementId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao inicializar analytics:', error);
    }
  }

  /**
   * Define propriedades do usuário
   */
  static setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  /**
   * Registra um evento
   */
  static async logEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const eventData = {
        ...event.properties,
        ...this.userProperties,
        timestamp: new Date().toISOString()
      };

      // Armazena evento localmente
      this.events.push({
        name: event.name,
        properties: eventData
      });

      // Em produção, enviaria para serviço de analytics
      console.log('Evento registrado:', event.name, eventData);
      
      // Limita o número de eventos armazenados
      if (this.events.length > 1000) {
        this.events = this.events.slice(-500);
      }
    } catch (error) {
      console.error('Erro ao registrar evento:', error);
    }
  }

  /**
   * Eventos específicos do SmartPDV
   */
  static async logSaleCompleted(saleData: {
    total: number;
    itemsCount: number;
    paymentMethod: string;
    customerId?: string;
    discount?: number;
  }): Promise<void> {
    await this.logEvent({
      name: 'sale_completed',
      properties: {
        sale_total: saleData.total,
        items_count: saleData.itemsCount,
        payment_method: saleData.paymentMethod,
        customer_id: saleData.customerId,
        discount_amount: saleData.discount || 0,
        currency: 'BRL'
      }
    });
  }

  static async logProductAdded(productData: {
    productId: number;
    productName: string;
    category: string;
    price: number;
  }): Promise<void> {
    await this.logEvent({
      name: 'product_added',
      properties: {
        product_id: productData.productId,
        product_name: productData.productName,
        category: productData.category,
        price: productData.price
      }
    });
  }

  static async logCustomerRegistered(customerData: {
    customerId: string;
    customerType: 'new' | 'returning';
    loyaltyPoints?: number;
  }): Promise<void> {
    await this.logEvent({
      name: 'customer_registered',
      properties: {
        customer_id: customerData.customerId,
        customer_type: customerData.customerType,
        loyalty_points: customerData.loyaltyPoints || 0
      }
    });
  }

  static async logInventoryMovement(movementData: {
    productId: number;
    productName: string;
    movementType: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason?: string;
  }): Promise<void> {
    await this.logEvent({
      name: 'inventory_movement',
      properties: {
        product_id: movementData.productId,
        product_name: movementData.productName,
        movement_type: movementData.movementType,
        quantity: movementData.quantity,
        reason: movementData.reason || 'manual'
      }
    });
  }

  static async logPaymentMethodUsed(paymentData: {
    method: string;
    amount: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.logEvent({
      name: 'payment_method_used',
      properties: {
        payment_method: paymentData.method,
        amount: paymentData.amount,
        success: paymentData.success,
        error_message: paymentData.errorMessage
      }
    });
  }

  static async logAppOpened(): Promise<void> {
    await this.logEvent({
      name: 'app_opened',
      properties: {
        app_version: '1.0.0',
        platform: 'mobile'
      }
    });
  }

  static async logScreenViewed(screenName: string): Promise<void> {
    await this.logEvent({
      name: 'screen_viewed',
      properties: {
        screen_name: screenName
      }
    });
  }

  static async logError(errorData: {
    errorType: string;
    errorMessage: string;
    screenName?: string;
    stackTrace?: string;
  }): Promise<void> {
    await this.logEvent({
      name: 'app_error',
      properties: {
        error_type: errorData.errorType,
        error_message: errorData.errorMessage,
        screen_name: errorData.screenName,
        stack_trace: errorData.stackTrace
      }
    });
  }

  static async logPerformance(performanceData: {
    metric: string;
    value: number;
    unit: string;
  }): Promise<void> {
    await this.logEvent({
      name: 'performance_metric',
      properties: {
        metric_name: performanceData.metric,
        metric_value: performanceData.value,
        metric_unit: performanceData.unit
      }
    });
  }

  /**
   * Gera relatório de uso
   */
  static async generateUsageReport(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    lastEventTime: string;
  }> {
    const eventsByType: Record<string, number> = {};
    
    this.events.forEach(event => {
      eventsByType[event.name] = (eventsByType[event.name] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      lastEventTime: this.events.length > 0 
        ? this.events[this.events.length - 1].properties?.timestamp || new Date().toISOString()
        : new Date().toISOString()
    };
  }

  /**
   * Exporta eventos para backup
   */
  static async exportEvents(): Promise<AnalyticsEvent[]> {
    return [...this.events];
  }

  /**
   * Limpa dados do usuário
   */
  static async clearUserData(): Promise<void> {
    this.userProperties = {};
    this.events = [];
  }

  /**
   * Obtém estatísticas de eventos
   */
  static getEventStats(): {
    totalEvents: number;
    uniqueEvents: string[];
    recentEvents: AnalyticsEvent[];
  } {
    const uniqueEvents = [...new Set(this.events.map(e => e.name))];
    const recentEvents = this.events.slice(-10); // Últimos 10 eventos

    return {
      totalEvents: this.events.length,
      uniqueEvents,
      recentEvents
    };
  }
} 