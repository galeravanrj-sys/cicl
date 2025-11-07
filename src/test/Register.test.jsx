/*
Simple overview of Register tests:
Unit-like:
- Valid details call register and navigate to `/dashboard`.
- Duplicate email shows error; no redirect.
- Empty required fields show validation; no redirect.
- Missing required field (last name) shows validation; no redirect.
Integration (AuthProvider + axios):
- Successful registration sets token headers and redirects.
- Backend duplicate email error shows message; no redirect.
- Invalid email format error from backend displays; no redirect.

Notes:
- We mirror the style of Login.test.jsx for consistency.
- Comments explain the scenario and the function/behavior under test.
*/

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Register from '../components/Register.jsx';
import { AuthContext, AuthProvider } from '../context/AuthContext.jsx';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

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
 * Helper to query inputs by name attribute, since labels are not linked via htmlFor.
 */
function getInputByName(container, name) {
  return container.querySelector(`input[name="${name}"]`);
}

/**
 * Render Register with a tiny mocked AuthContext and MemoryRouter.
 * - registerImpl controls success/failure and optionally sets a custom error message.
 * - initialError seeds an error message before submission.
 */
function renderWithAuth(ui, { registerImpl, initialError } = {}) {
  const MockAuthProvider = ({ children }) => {
    const [error, setError] = useState(initialError || null);

    // Fake register: call registerImpl and set error on failure
    const register = async (payload) => {
      const ok = typeof registerImpl === 'function' ? !!registerImpl(payload) : !!registerImpl;
      if (!ok) setError('User already exists with that email or username');
      return ok;
    };

    return (
      <AuthContext.Provider value={{ register, error }}>
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

beforeEach(() => {
  navigateMock.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  // Ensure axios headers are clean between tests
  delete axios.defaults.headers.common['x-auth-token'];
  delete axios.defaults.headers.common['Authorization'];
});

afterEach(() => {
  // Clear calls/implementations but keep module mocks in place
  vi.clearAllMocks();
});

// Unit-like tests: use mocked AuthContext
describe('Register Page (Unit-like)', () => {
  // Scenario: Sign up with valid details → success and navigate
  it('registers successfully with valid details and navigates to dashboard', async () => {
    const { container } = renderWithAuth(<Register />, {
      registerImpl: ({ email, password, firstName, lastName }) => !!email && !!password && !!firstName && !!lastName,
    });

    fireEvent.change(getInputByName(container, 'firstName'), { target: { value: 'Jazzent' } });
    fireEvent.change(getInputByName(container, 'middleName'), { target: { value: 'Nico' } });
    fireEvent.change(getInputByName(container, 'lastName'), { target: { value: 'Macaraeg' } });
    fireEvent.change(getInputByName(container, 'email'), { target: { value: 'jazzentnico@gmail.com' } });
    fireEvent.change(getInputByName(container, 'password'), { target: { value: 'PaSSword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // Rely on real timers; wait for navigate after Register sets a small timeout
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  // Scenario: Sign up with already registered email → show error; no redirect
  it('shows error when email is already registered and stays on page', async () => {
    const { container } = renderWithAuth(<Register />, {
      registerImpl: () => false, // force failure
      initialError: null,
    });

    fireEvent.change(getInputByName(container, 'firstName'), { target: { value: 'Jazzent' } });
    fireEvent.change(getInputByName(container, 'middleName'), { target: { value: 'Nico' } });
    fireEvent.change(getInputByName(container, 'lastName'), { target: { value: 'Macaraeg' } });
    fireEvent.change(getInputByName(container, 'email'), { target: { value: 'jazzentnico@gmail.com' } });
    fireEvent.change(getInputByName(container, 'password'), { target: { value: 'PaSSword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/User already exists with that email or username/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Scenario: Sign up with empty fields → validation message; no redirect
  it('shows validation error when all fields are empty', async () => {
    const { container } = renderWithAuth(<Register />, { registerImpl: () => false });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Scenario: Sign up with missing required fields (e.g., no last name) → validation
  it('shows validation error when last name is missing', async () => {
    const { container } = renderWithAuth(<Register />, { registerImpl: () => false });

    fireEvent.change(getInputByName(container, 'firstName'), { target: { value: 'And' } });
    fireEvent.change(getInputByName(container, 'email'), { target: { value: 'and@example.com' } });
    fireEvent.change(getInputByName(container, 'password'), { target: { value: 'Anaconda12' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

// Integration tests: Register + real AuthProvider, axios mocked.
describe('Register Integration (AuthProvider + axios)', () => {
  // Scenario: Successful registration → token saved in headers and redirect
  it('registers successfully and navigates to dashboard', async () => {
    axios.get.mockResolvedValue({ data: { ok: true } }); // prevent mount-side verify errors if any
    axios.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token',
        user: { email: 'jazzentnico@gmail.com', first_name: 'Jazzent', last_name: 'Macaraeg', name: 'Jazzent Macaraeg' },
      },
    });

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(getInputByName(container, 'firstName'), { target: { value: 'Jazzent' } });
    fireEvent.change(getInputByName(container, 'middleName'), { target: { value: 'Nico' } });
    fireEvent.change(getInputByName(container, 'lastName'), { target: { value: 'Macaraeg' } });
    fireEvent.change(getInputByName(container, 'email'), { target: { value: 'jazzentnico@gmail.com' } });
    fireEvent.change(getInputByName(container, 'password'), { target: { value: 'PaSSword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    expect(axios.defaults.headers.common['x-auth-token']).toBe('fake-token');
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer fake-token');
  });

  // Scenario: Duplicate email → backend error shown; no redirect
  it('shows backend duplicate email error and does not redirect', async () => {
    axios.get.mockResolvedValue({ data: { ok: true } }); // prevent mount-side verify errors
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'User already exists with that email or username' } } });

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(getInputByName(container, 'firstName'), { target: { value: 'Jazzent' } });
    fireEvent.change(getInputByName(container, 'middleName'), { target: { value: 'Nico' } });
    fireEvent.change(getInputByName(container, 'lastName'), { target: { value: 'Macaraeg' } });
    fireEvent.change(getInputByName(container, 'email'), { target: { value: 'jazzentnico@gmail.com' } });
    fireEvent.change(getInputByName(container, 'password'), { target: { value: 'PaSSword123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // Assert error message appears and no redirect
    expect(await screen.findByText(/User already exists with that email or username/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalled();
  });

  // Scenario: Invalid email format → backend validation error shown; no redirect
  it('shows invalid email format error from backend and does not redirect', async () => {
    axios.get.mockResolvedValue({ data: { ok: true } }); // stabilize mount
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid email format' } } });

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(getInputByName(container, 'firstName'), { target: { value: 'And' } });
    fireEvent.change(getInputByName(container, 'middleName'), { target: { value: 'nd' } });
    fireEvent.change(getInputByName(container, 'lastName'), { target: { value: 'Gal' } });
    // Use a syntactically valid email so native validation does not block
    fireEvent.change(getInputByName(container, 'email'), { target: { value: 'and@example.com' } });
    fireEvent.change(getInputByName(container, 'password'), { target: { value: 'Anaconda12' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // Backend error should be surfaced by AuthProvider
    expect(await screen.findByText(/Invalid email format/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalled();
  });

  // Scenario: Empty fields → front-end validation, no axios call, no redirect
  it('shows validation error when fields are empty (no axios call)', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});