import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renderiza a marca', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Recordare' })).toBeInTheDocument();
});
