// Função utilitária de formatação de moeda
export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

describe('formatCurrency', () => {
  it('deve formatar número para moeda brasileira', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('deve formatar número para dólar', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toMatch(/\$/);
    expect(result).toMatch(/1\.234,56/);
  });

  it('deve formatar zero corretamente', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('deve formatar números negativos', () => {
    expect(formatCurrency(-1234.56)).toBe('-R$ 1.234,56');
  });
}); 