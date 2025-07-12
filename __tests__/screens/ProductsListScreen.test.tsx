import { render } from '@testing-library/react-native';
import React from 'react';
import ProductsListScreen from '../../screens/ProductsListScreen';

describe('ProductsListScreen', () => {
  it('deve renderizar a tela de produtos', () => {
    const { getByText } = render(<ProductsListScreen />);
    expect(getByText(/produtos|lista de produtos|products/i)).toBeTruthy();
  });
}); 