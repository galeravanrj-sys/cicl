/*
Test overview for Navigation and Access:
- Dashboard loads successfully after login: nav bar visible, widgets visible.
- Navigation bar links: Home, Discharged, Cases, Program, Report, Settings navigate to correct modules.
- Settings access: clicking from nav opens Settings.
- Cases access: clicking from nav opens Cases.
- Discharged access: clicking from nav opens Discharged Cases and shows records area.
- Programs access: clicking from nav opens Programs module.
- Report access: clicking from nav opens Reports module.
- Successful Sign Out: clicking Sign Out in Settings triggers logout and redirect to Landing Page.

Notes:
- We mock CaseContext and NotificationContext to avoid network calls.
- We stub chart components to keep tests lightweight.
- Comments explain each scenario and expected result.
*/

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Dashboard from '../components/Dashboard.jsx';
import CaseManagement from '../components/CaseManagement.jsx';
import ArchivedCases from '../components/ArchivedCases.jsx';
import Program from '../components/Program.jsx';
import Reports from '../components/Reports.jsx';
import Settings from '../components/Settings.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

/* ------------------------------------------------------------------
 🧩 HOISTED MOCKS: router navigate + contexts
------------------------------------------------------------------ */
const { navigateMock, logoutMock, sampleCases } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  logoutMock: vi.fn(),
  sampleCases: [
    { id: 1, name: 'Active One', status: 'active', lastUpdated: '2025-01-10T00:00:00Z' },
    { id: 2, name: 'Archived Two', status: 'archived', lastUpdated: '2024-12-15T00:00:00Z' },
  ],
}));

// Replace react-router-dom's useNavigate with our mock spy
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Stub charts to avoid JSDOM/canvas issues
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
  Doughnut: () => <div data-testid="doughnut-chart" />,
  Pie: () => <div data-testid="pie-chart" />,
}));

// Mock CaseContext with stable data and no loading
vi.mock('../context/CaseContext', () => ({
  useCases: () => ({
    cases: sampleCases,
    allCases: sampleCases,
    fetchAllCases: vi.fn().mockResolvedValue(sampleCases),
    loading: false,
    error: null,
    addCase: vi.fn(),
    updateCase: vi.fn(),
    deleteCase: vi.fn(),
    lastUpdate: Date.now(),
  }),
}));

// Mock NotificationContext to prevent provider wiring
vi.mock('../context/NotificationContext.jsx', () => ({
  NotificationProvider: ({ children }) => <>{children}</>,
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    resetNotifications: vi.fn(),
    dismissedNotificationIds: new Set(),
  }),
}));

/* ------------------------------------------------------------------
 🔧 Render helper: wrap with AuthContext + MemoryRouter + Routes
------------------------------------------------------------------ */
function renderWithProviders(initialRoute = '/dashboard') {
  const authValue = {
    isAuthenticated: true,
    loading: false,
    user: { role: 'Admin', name: 'Test Admin' },
    userProfile: { firstName: 'Test', email: 'test@example.com' },
    logout: logoutMock,
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/cases" element={<Layout><CaseManagement /></Layout>} />
          <Route path="/archived-cases" element={<Layout><ArchivedCases /></Layout>} />
          <Route path="/program" element={<Layout><Program /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------
 🧭 TEST 1: Dashboard loads successfully after login
- Steps: login → redirected to dashboard
- Expected: nav bar visible, dashboard heading and widgets visible
------------------------------------------------------------------ */
describe('Dashboard loads successfully', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => vi.clearAllMocks());

  it('shows sidebar and widgets on dashboard', async () => {
    renderWithProviders('/dashboard');

    // Verify navigation bar is visible on the left
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Verify dashboard heading
    expect(screen.getByRole('heading', { level: 2, name: /Dashboard/i })).toBeInTheDocument();

    // Verify a key dashboard widget is present
    expect(screen.getAllByText(/ACTIVE CASES/i)[0]).toBeInTheDocument();

    // Verify key nav links exist
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cases/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Discharged/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Program/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Report/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------
 🧭 TEST 2: Navigation Bar Display → correct modules open
Steps:
1. Click Home → Dashboard
2. Click Discharged → Discharged Cases
3. Click Cases → Cases List
4. Click Program → Programs
5. Click Report → REPORTS
6. Click Settings → Settings
------------------------------------------------------------------ */
describe('Navigation Bar routes', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => vi.clearAllMocks());

  it('navigates to each module from the sidebar', async () => {
    renderWithProviders('/dashboard');

    // Home → Dashboard
    fireEvent.click(screen.getByRole('link', { name: /Home/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Dashboard/i })).toBeInTheDocument();

    // Discharged → Discharged Cases
    fireEvent.click(screen.getByRole('link', { name: /Discharged/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Discharged Cases/i })).toBeInTheDocument();

    // Cases → Cases List
    fireEvent.click(screen.getByRole('link', { name: /Cases/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Cases List/i })).toBeInTheDocument();

    // Program → Programs
    fireEvent.click(screen.getByRole('link', { name: /Program/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Programs/i })).toBeInTheDocument();

    // Report → REPORTS
    fireEvent.click(screen.getByRole('link', { name: /Report/i }));
    expect(screen.getAllByRole('heading', { level: 2, name: /REPORTS/i }).length).toBeGreaterThan(0);

    // Settings → Settings
    fireEvent.click(screen.getByRole('link', { name: /Settings/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Settings/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------
 ⚙️ TEST 3: Settings Access from nav bar
Steps:
1. Click Settings in the navigation bar
Expected: Settings module loads successfully
------------------------------------------------------------------ */
describe('Settings access from sidebar', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('opens Settings from nav bar', async () => {
    renderWithProviders('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: /Settings/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Settings/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------
 📂 TEST 4: Cases Access from nav bar
Steps:
1. Click Cases in nav bar
Expected: Cases module loads successfully
------------------------------------------------------------------ */
describe('Cases access from sidebar', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('opens Cases from nav bar', async () => {
    renderWithProviders('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: /Cases/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Cases List/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------
 ✅ TEST 5: Discharged Access from nav bar
Steps:
1. Click Discharged in nav bar
Expected: Discharged module loads and displays discharged case records area
------------------------------------------------------------------ */
describe('Discharged access from sidebar', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('opens Discharged Cases from nav bar', async () => {
    renderWithProviders('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: /Discharged/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Discharged Cases/i })).toBeInTheDocument();
    // Optional: search input exists (records area)
    expect(screen.getByPlaceholderText(/Search discharged cases/i)).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------
 🗂️ TEST 6: Programs Access from nav bar
Steps:
1. Click Program in nav bar
Expected: Programs module loads successfully
------------------------------------------------------------------ */
describe('Programs access from sidebar', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('opens Programs from nav bar', async () => {
    renderWithProviders('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: /Program/i }));
    expect(screen.getByRole('heading', { level: 2, name: /Programs/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------
 📊 TEST 7: Report Access from nav bar
Steps:
1. Click Report in nav bar
Expected: Report module loads successfully
------------------------------------------------------------------ */
describe('Reports access from sidebar', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('opens Reports from nav bar', async () => {
    renderWithProviders('/dashboard');
    fireEvent.click(screen.getByRole('link', { name: /Report/i }));
    // Reports shows multiple REPORTS headings; ensure at least one
    expect(screen.getAllByRole('heading', { level: 2, name: /REPORTS/i }).length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------
 🚪 TEST 8: Successful Sign Out
Steps:
1. Navigate to Settings
2. Click Sign Out
Expected: logout is called and user is redirected to Landing Page
------------------------------------------------------------------ */
describe('Successful Sign Out', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('logs out and redirects to Landing Page', async () => {
    renderWithProviders('/settings');

    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));

    // Ensure logout() was called
    expect(logoutMock).toHaveBeenCalledTimes(1);

    // Ensure redirect to Landing Page ('/') happened
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });
});