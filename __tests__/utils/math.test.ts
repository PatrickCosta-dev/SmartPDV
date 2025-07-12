function soma(a: number, b: number) {
  return a + b;
}

describe('Função soma', () => {
  it('deve somar dois números corretamente', () => {
    expect(soma(2, 3)).toBe(5);
    expect(soma(-1, 1)).toBe(0);
  });
}); 