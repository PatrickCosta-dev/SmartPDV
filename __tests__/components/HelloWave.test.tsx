import { render } from '@testing-library/react-native';
import React from 'react';
import HelloWave from '../../components/HelloWave';

describe('HelloWave', () => {
  it('deve renderizar o texto de saudação', () => {
    const { getByText } = render(<HelloWave />);
    expect(getByText(/olá|hello|bem-vindo/i)).toBeTruthy();
  });
}); 