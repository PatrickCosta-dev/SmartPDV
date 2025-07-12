import { PrintService, SaleReceipt } from '../../src/services/printService';

describe('PrintService', () => {
  const mockReceipt: SaleReceipt = {
    id: 'VDA001',
    date: '2024-01-15 14:30:00',
    items: [
      {
        name: 'Produto Teste 1',
        quantity: 2,
        price: 10.50,
        total: 21.00
      },
      {
        name: 'Produto Teste 2',
        quantity: 1,
        price: 15.75,
        total: 15.75
      }
    ],
    subtotal: 36.75,
    discount: 5.00,
    total: 31.75,
    paymentMethod: 'PIX',
    customerName: 'João Silva'
  };

  describe('generateReceiptHTML', () => {
    it('deve gerar HTML válido', async () => {
      const html = await PrintService.generateReceiptHTML(mockReceipt);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('SmartPDV');
      expect(html).toContain('Venda #VDA001');
      expect(html).toContain('João Silva');
      expect(html).toContain('PIX');
    });

    it('deve incluir todos os itens', async () => {
      const html = await PrintService.generateReceiptHTML(mockReceipt);
      
      expect(html).toContain('Produto Teste 1');
      expect(html).toContain('Produto Teste 2');
      expect(html).toContain('2');
      expect(html).toContain('1');
      expect(html).toContain('R$ 10.50');
      expect(html).toContain('R$ 15.75');
    });

    it('deve calcular totais corretamente', async () => {
      const html = await PrintService.generateReceiptHTML(mockReceipt);
      
      expect(html).toContain('R$ 36.75');
      expect(html).toContain('R$ 5.00');
      expect(html).toContain('R$ 31.75');
    });

    it('deve funcionar sem cliente', async () => {
      const receiptWithoutCustomer = { ...mockReceipt };
      delete receiptWithoutCustomer.customerName;
      
      const html = await PrintService.generateReceiptHTML(receiptWithoutCustomer);
      
      expect(html).not.toContain('Cliente:');
      expect(html).toContain('Venda #VDA001');
    });

    it('deve funcionar sem desconto', async () => {
      const receiptWithoutDiscount = { ...mockReceipt, discount: 0 };
      
      const html = await PrintService.generateReceiptHTML(receiptWithoutDiscount);
      
      expect(html).not.toContain('Desconto: -R$');
      expect(html).toContain('R$ 36.75');
    });
  });

  describe('generatePDF', () => {
    it('deve gerar PDF válido', async () => {
      const uri = await PrintService.generatePDF(mockReceipt);
      
      expect(uri).toBeDefined();
      expect(typeof uri).toBe('string');
      expect(uri.length).toBeGreaterThan(0);
    });

    it('deve lançar erro em caso de falha', async () => {
      // Mock para simular erro
      const originalGenerateHTML = PrintService.generateReceiptHTML;
      PrintService.generateReceiptHTML = jest.fn().mockRejectedValue(new Error('Erro de teste'));
      
      await expect(PrintService.generatePDF(mockReceipt)).rejects.toThrow('Falha ao gerar PDF');
      
      // Restaura função original
      PrintService.generateReceiptHTML = originalGenerateHTML;
    });
  });

  describe('printReceipt', () => {
    it('deve executar sem erros', async () => {
      // Mock para simular ambiente web
      const originalWindow = global.window;
      global.window = {
        open: jest.fn().mockReturnValue({
          document: {
            write: jest.fn(),
            close: jest.fn()
          },
          print: jest.fn()
        })
      } as any;

      await expect(PrintService.printReceipt(mockReceipt)).resolves.not.toThrow();
      
      // Restaura window original
      global.window = originalWindow;
    });
  });
}); 