import { PixService } from '../../src/services/pixService';

describe('PixService', () => {
  describe('validatePixKey', () => {
    it('deve validar email correto', () => {
      expect(PixService.validatePixKey('teste@exemplo.com', 'email')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(PixService.validatePixKey('email-invalido', 'email')).toBe(false);
    });

    it('deve validar CPF correto', () => {
      expect(PixService.validatePixKey('12345678909', 'cpf')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(PixService.validatePixKey('12345678901', 'cpf')).toBe(false);
    });

    it('deve validar telefone correto', () => {
      expect(PixService.validatePixKey('11999999999', 'phone')).toBe(true);
    });

    it('deve rejeitar telefone inválido', () => {
      expect(PixService.validatePixKey('123', 'phone')).toBe(false);
    });

    it('deve validar chave aleatória', () => {
      const randomKey = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
      expect(PixService.validatePixKey(randomKey, 'random')).toBe(true);
    });
  });

  describe('generatePixData', () => {
    it('deve gerar dados PIX válidos', () => {
      const pixData = {
        key: 'teste@exemplo.com',
        keyType: 'email' as const,
        merchantName: 'SmartPDV',
        merchantCity: 'SAO PAULO',
        amount: 100.50,
        description: 'Teste de pagamento'
      };

      const result = PixService.generatePixData(pixData);
      expect(result).toContain('000201');
      expect(result).toContain('010212');
      expect(result).toContain('5303986');
    });

    it('deve gerar dados PIX sem valor', () => {
      const pixData = {
        key: 'teste@exemplo.com',
        keyType: 'email' as const,
        merchantName: 'SmartPDV',
        merchantCity: 'SAO PAULO'
      };

      const result = PixService.generatePixData(pixData);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateRandomPixKey', () => {
    it('deve gerar chave com 32 caracteres', () => {
      const key = PixService.generateRandomPixKey();
      expect(key).toHaveLength(32);
    });

    it('deve gerar chave apenas com letras e números', () => {
      const key = PixService.generateRandomPixKey();
      expect(key).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe('formatPixAmount', () => {
    it('deve formatar valor corretamente', () => {
      expect(PixService.formatPixAmount(100.50)).toBe('10050');
      expect(PixService.formatPixAmount(0.99)).toBe('099');
      expect(PixService.formatPixAmount(1000)).toBe('100000');
    });
  });

  describe('checkPixPayment', () => {
    it('deve retornar status de pagamento', async () => {
      const result = await PixService.checkPixPayment('test-transaction');
      
      expect(result).toHaveProperty('status');
      expect(['pending', 'completed', 'failed']).toContain(result.status);
    });

    it('deve retornar dados completos quando aprovado', async () => {
      // Mock para simular pagamento aprovado
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // 90% chance de aprovação
      
      const result = await PixService.checkPixPayment('test-transaction');
      
      if (result.status === 'completed') {
        expect(result.amount).toBeDefined();
        expect(result.timestamp).toBeDefined();
      }
      
      jest.restoreAllMocks();
    });
  });
}); 