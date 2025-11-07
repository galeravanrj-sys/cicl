import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App.jsx';

test('renders Log In and Sign Up links', () => {
  render(<App />);
  const loginLink = screen.getByText(/Log In/i);
  const signupLink = screen.getByText(/Sign Up/i);
  expect(loginLink).toBeInTheDocument();
  expect(signupLink).toBeInTheDocument();
});
``