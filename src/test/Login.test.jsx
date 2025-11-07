/*
Simple overview of Login tests:
Unit-like:
- Valid credentials navigate to `/dashboard`.
- Invalid credentials show error; no redirect.
- "Sign in with Google" sets window.location to OAuth URL.
- Validation errors when fields are missing (none, password-only, email-only).
- Incorrect password shows error.
- "Remember me" toggles Google OAuth `remember=1`.
Integration (AuthProvider + axios):
- Successful login sets token in axios headers and redirects.
- Token stored in `sessionStorage` or `localStorage` based on Remember Me.
- Failed login shows error and does not redirect.
*/

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Login from '../components/Login.jsx';
import { AuthContext, AuthProvider } from '../context/AuthContext.jsx';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// Single file: unit-like tests + integration tests.
// Simple comments for easy explanation.

// Spy for useNavigate redirects
const navigateMock = vi.fn();

// Mock router to return our navigate spy
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock axios and inspect default headers for integration tests
vi.mock('axios', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      defaults: { headers: { common: {} } },
    },
  };
});

/**
 * Render Login with a tiny mocked AuthContext and MemoryRouter.
 * - loginImpl controls success/failure
 * - initialError seeds an error message
 */
function renderWithAuth(ui, { loginImpl, initialError } = {}) {
  // Minimal Auth provider for tests
  const MockAuthProvider = ({ children }) => {
    const [error, setError] = useState(initialError || null);

    // Fake login: call loginImpl and set error on failure
    const login = async ({ email, password, remember }) => {
      const ok = typeof loginImpl === 'function' ? !!loginImpl({ email, password, remember }) : !!loginImpl;
      if (!ok) setError('Invalid credentials');
      return ok;
    };

    return (
      <AuthContext.Provider value={{ login, error }}>
        {children}
      </AuthContext.Provider>
    );
  };

  return render(
    <MemoryRouter>
      <MockAuthProvider>
        {ui}
      </MockAuthProvider>
    </MemoryRouter>
  );
}

// Reset shared state before each test
beforeEach(() => {
  navigateMock.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});

// Clear all mocks
afterEach(() => {
  vi.clearAllMocks();
});

// Unit-like tests: use mocked AuthContext
describe('Login Page', () => {
  // Test: valid login → redirects to dashboard
  it('logs in with a valid account and navigates to dashboard', async () => {
    renderWithAuth(<Login />, {
      loginImpl: ({ email, password }) => email === 'galeravanrj@gmail.com' && password === 'olddine15',
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'galeravanrj@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'olddine15' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  // Invalid account shows error, no redirect
  it('shows error for non-registered account (invalid credentials)', async () => {
    renderWithAuth(<Login />, { loginImpl: () => false });

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: '13luiscarl@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'samplepass13' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Google button sends to OAuth URL
  it('redirects to Google OAuth when clicking Sign in with Google', async () => {
    // Stub window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/' },
      writable: true,
      configurable: true,
    });

    renderWithAuth(<Login />, { loginImpl: () => false });

    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));

    expect(window.location.href).toBe('http://localhost:5000/api/auth/google?remember=0');

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
  });

  // Empty form shows validation, no redirect
  it('shows validation error when no credentials are provided', async () => {
    renderWithAuth(<Login />, { loginImpl: () => false });

    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Password only shows validation
  it('shows validation error when password is provided without email', async () => {
    renderWithAuth(<Login />, { loginImpl: () => false });

    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'olddine15' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Email only shows validation
  it('shows validation error when email is provided without password', async () => {
    renderWithAuth(<Login />, { loginImpl: () => false });

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'yukis4779@gmail.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Wrong password shows error
  it('shows error for incorrect password with valid email', async () => {
    renderWithAuth(<Login />, {
      loginImpl: ({ email, password }) => email === 'olddine@gmail.com' && password === 'olddine15',
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'olddine@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'wrongpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Remember me sets remember=1 for Google
  it('sets remember=1 for Google when Remember me is checked', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/' },
      writable: true,
      configurable: true,
    });

    renderWithAuth(<Login />, { loginImpl: () => false });

    fireEvent.click(screen.getByLabelText(/Remember me/i));
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));

    expect(window.location.href).toBe('http://localhost:5000/api/auth/google?remember=1');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
  });
});

// Integration tests: Login + real AuthProvider, axios mocked.
describe('Login Integration (AuthProvider + axios)', () => {
  // remember=false: success → redirect, token set in header
  it('logs in successfully and navigates to dashboard (remember=false → sessionStorage)', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token',
        user: { email: 'yukis4779@gmail.com', first_name: 'Yuki', last_name: 'Dine', name: 'Yuki Dine' },
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'yukis4779@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'olddine15' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    expect(axios.defaults.headers.common['x-auth-token']).toBe('fake-token');
  });

  // remember=true: persist token and set header
  it('stores token in localStorage when Remember me is checked', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token',
        user: { email: 'yukis4779@gmail.com', first_name: 'Yuki', last_name: 'Dine' },
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'yukis4779@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'olddine15' } });
    fireEvent.click(screen.getByLabelText(/Remember me/i));
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    expect(axios.defaults.headers.common['x-auth-token']).toBe('fake-token');
  });

  // Backend says invalid credentials → show error, no redirect
  it('shows invalid credentials error for non-registered account', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: '13luiscarl@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'samplepass13' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Wrong password → show error, no redirect
  it('shows invalid credentials error with wrong password', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'yukis4779@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), { target: { value: 'wrongpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Empty form → validation, no axios call, no redirect
  it('shows validation error when fields are empty (no axios call)', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});