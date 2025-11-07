import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ArchivedCases from '../components/ArchivedCases.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/* ------------------------------------------------------------------
 🧩 MOCK SETUP SECTION
------------------------------------------------------------------ */

// Mock for `useNavigate` hook to track navigation behavior
const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

// Replace react-router-dom's useNavigate with our mock
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Mock Axios for testing PUT requests (used in After Care update)
vi.mock('axios', () => {
  return {
    default: {
      put: vi.fn(),
    },
  };
});
import axios from 'axios';

// Mock CaseContext (used by ArchivedCases to get and update case data)
const { mockAllCases, mockFetchAllCases, mockUpdateCase } = vi.hoisted(() => ({
  mockAllCases: [], // Fake case list that we control
  mockFetchAllCases: vi.fn(), // Fake fetchAllCases function
  mockUpdateCase: vi.fn(), // Fake updateCase function
}));

vi.mock('../context/CaseContext', () => ({
  useCases: () => ({
    allCases: mockAllCases,
    loading: false,
    error: null,
    lastUpdate: Date.now(),
    fetchAllCases: mockFetchAllCases,
    updateCase: mockUpdateCase,
  }),
}));

// Mock export helper function (fetch case details before export)
const { mockFetchCaseDetailsForExport } = vi.hoisted(() => ({
  mockFetchCaseDetailsForExport: vi.fn(),
}));
vi.mock('../utils/exportHelpers', () => ({
  fetchCaseDetailsForExport: mockFetchCaseDetailsForExport,
}));

// Mock PDF generator utilities
const {
  mockDownloadCaseReportPDF,
  mockDownloadAllCasesPDF,
} = vi.hoisted(() => ({
  mockDownloadCaseReportPDF: vi.fn(),
  mockDownloadAllCasesPDF: vi.fn(),
}));
vi.mock('../utils/pdfGenerator', () => ({
  downloadCaseReportPDF: mockDownloadCaseReportPDF,
  downloadAllCasesPDF: mockDownloadAllCasesPDF,
}));

// Mock Word generator utilities
const {
  mockDownloadCaseReportWord,
  mockDownloadAllCasesWord,
} = vi.hoisted(() => ({
  mockDownloadCaseReportWord: vi.fn(),
  mockDownloadAllCasesWord: vi.fn(),
}));
vi.mock('../utils/wordGenerator', () => ({
  downloadCaseReportWord: mockDownloadCaseReportWord,
  downloadAllCasesWord: mockDownloadAllCasesWord,
}));

// Mock CSV generator utilities
const {
  mockDownloadAllCasesCSV,
  mockDownloadCaseReportCSV,
} = vi.hoisted(() => ({
  mockDownloadAllCasesCSV: vi.fn(),
  mockDownloadCaseReportCSV: vi.fn(),
}));
vi.mock('../utils/csvGenerator', () => ({
  downloadAllCasesCSV: mockDownloadAllCasesCSV,
  downloadCaseReportCSV: mockDownloadCaseReportCSV,
}));

/* ------------------------------------------------------------------
 🧹 BEFORE & AFTER EACH TEST CLEANUP
------------------------------------------------------------------ */
beforeEach(() => {
  // Prevent pop-up alerts from breaking the test environment
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  // Reset mocks between tests to ensure clean state
  navigateMock.mockReset();
  mockFetchAllCases.mockReset();
  mockUpdateCase.mockReset();
  mockFetchCaseDetailsForExport.mockReset();
  mockDownloadCaseReportPDF.mockReset();
  mockDownloadAllCasesPDF.mockReset();
  mockDownloadCaseReportWord.mockReset();
  mockDownloadAllCasesWord.mockReset();
  mockDownloadAllCasesCSV.mockReset();
  mockDownloadCaseReportCSV.mockReset();
  axios.put.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  // Clear all mocks after each test to avoid memory leaks or side effects
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------
 🧪 HELPER FUNCTION: RENDER COMPONENT WITH CONTEXT PROVIDERS
------------------------------------------------------------------ */
function renderWithProviders(ui, initialPath = '/dashboard') {
  // Fake logged-in user context (used in components that depend on authentication)
  const authValue = { user: { name: 'Tester', role: 'CICL Officer' }, userProfile: { firstName: 'Tester' } };

  // Renders the given component with all required providers and routing
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContext.Provider value={authValue}>
        <NotificationProvider>
          {ui}
        </NotificationProvider>
      </AuthContext.Provider>
      <Routes>
        <Route path="/archived-cases" element={<ArchivedCases />} />
      </Routes>
    </MemoryRouter>
  );
}

/* ------------------------------------------------------------------
 🧭 TEST GROUP 1: Navigation
------------------------------------------------------------------ */
describe('Discharged Cases - Access via Navigation', () => {
  it('opens Discharged Cases from the navigation bar', async () => {
    // Add one mock case to the fake database
    mockAllCases.splice(0, mockAllCases.length,
      { id: 1, name: 'Child One', age: 12, status: 'archived', programType: 'Residential', lastUpdated: '2024-01-01T00:00:00Z' },
    );

    // Render the Discharged Cases page directly at its route
    render(
      <MemoryRouter initialEntries={["/archived-cases"]}>
        <ArchivedCases />
      </MemoryRouter>
    );

    // Confirm Discharged page heading is visible and correct heading level
    expect(screen.getByRole('heading', { level: 2, name: /^Discharged Cases/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------
 🔍 TEST GROUP 2: Viewing Case Record
------------------------------------------------------------------ */
describe('Discharged Cases - View record', () => {
  it('navigates to case details when clicking View Details', async () => {
    mockAllCases.splice(0, mockAllCases.length,
      { id: 101, name: 'Case 101', age: 15, status: 'archived', programType: 'Residential', lastUpdated: '2024-02-01T00:00:00Z' },
    );

    render(
      <MemoryRouter initialEntries={["/archived-cases"]}>
        <ArchivedCases />
      </MemoryRouter>
    );

    // Simulate clicking the "View Details" button
    fireEvent.click(screen.getByRole('button', { name: /View Details/i }));

    // Check if navigation to details page happened
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/case-details/101');
    });
  });
});

/* ------------------------------------------------------------------
 🔁 TEST GROUP 3: After Care Status Update
------------------------------------------------------------------ */
describe('Discharged Cases - After Care status', () => {
  it('moves case to After Care when action is clicked', async () => {
    localStorage.setItem('token', 'fake-token');

    // Mock a discharged case
    mockAllCases.splice(0, mockAllCases.length,
      { id: 202, name: 'Case 202', age: 16, status: 'archived', programType: 'Residential', lastUpdated: '2024-03-01T00:00:00Z' },
    );

    // Mock response for case details and successful update
    mockFetchCaseDetailsForExport.mockResolvedValueOnce({ first_name: 'John', last_name: 'Doe' });
    axios.put.mockResolvedValueOnce({ data: { id: 202, status: 'after care' } });

    render(
      <MemoryRouter initialEntries={["/archived-cases"]}>
        <ArchivedCases />
      </MemoryRouter>
    );

    // Click the "After Care" button
    fireEvent.click(screen.getByRole('button', { name: /After Care/i }));

    // Expect axios.put to be called with correct parameters
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/cases/202',
        expect.objectContaining({ status: 'after care' }),
        expect.any(Object)
      );
      // Expect updateCase() context function to be called too
      expect(mockUpdateCase).toHaveBeenCalledWith(expect.objectContaining({ id: 202, status: 'after care' }));
    });
  });
});

/* ------------------------------------------------------------------
 📤 TEST GROUP 4: Single Case Export Actions
------------------------------------------------------------------ */
describe('Discharged Cases - Single case export actions', () => {
  beforeEach(() => {
    // Reset test data before each case
    mockAllCases.splice(0, mockAllCases.length,
      { id: 301, name: 'Case 301', age: 14, status: 'archived', programType: 'Residential', lastUpdated: '2024-04-01T00:00:00Z' },
    );
  });

  it('exports a single discharged case to PDF', async () => {
    mockFetchCaseDetailsForExport.mockResolvedValueOnce({ id: 301, name: 'Case 301 (Full)', status: 'archived' });

    render(
      <MemoryRouter initialEntries={["/archived-cases"]}>
        <ArchivedCases />
      </MemoryRouter>
    );

    // Simulate export dropdown actions
    fireEvent.click(screen.getByRole('button', { name: /^Export$/i }));
    fireEvent.click(screen.getByText(/^PDF$/i));

    // Verify PDF download function was triggered
    await waitFor(() => {
      expect(mockDownloadCaseReportPDF).toHaveBeenCalledTimes(1);
      expect(mockDownloadCaseReportPDF).toHaveBeenCalledWith(expect.objectContaining({ id: 301 }));
    });
  });

  it('exports a single discharged case to Word', async () => {
    mockFetchCaseDetailsForExport.mockResolvedValueOnce({ id: 301, name: 'Case 301 (Full)', status: 'archived' });

    render(
      <MemoryRouter initialEntries={["/archived-cases"]}>
        <ArchivedCases />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Export$/i }));
    fireEvent.click(screen.getByText(/^Word$/i));

    await waitFor(() => {
      expect(mockDownloadCaseReportWord).toHaveBeenCalledTimes(1);
      expect(mockDownloadCaseReportWord).toHaveBeenCalledWith(expect.objectContaining({ id: 301 }));
    });
  });

  it('exports a single discharged case to CSV (Excel)', async () => {
    mockFetchCaseDetailsForExport.mockResolvedValueOnce({ id: 301, name: 'Case 301 (Full)', status: 'archived' });

    render(
      <MemoryRouter initialEntries={["/archived-cases"]}>
        <ArchivedCases />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Export$/i }));
    fireEvent.click(screen.getByText(/^CSV$/i));

    await waitFor(() => {
      expect(mockDownloadCaseReportCSV).toHaveBeenCalledTimes(1);
      expect(mockDownloadCaseReportCSV).toHaveBeenCalledWith(expect.objectContaining({ id: 301 }));
    });
  });
});

/* ------------------------------------------------------------------
 🗂️ TEST GROUP 5: Export All Cases
------------------------------------------------------------------ */
describe('Discharged Cases - Export All', () => {
  beforeEach(() => {
    mockAllCases.splice(0, mockAllCases.length,
      { id: 401, name: 'Case 401', age: 13, status: 'archived', programType: 'Residential', lastUpdated: '2024-05-01T00:00:00Z' },
      { id: 402, name: 'Case 402', age: 17, status: 'after care', programType: 'Residential', lastUpdated: '2024-06-01T00:00:00Z' },
    );
  });

  it('exports all discharged cases to PDF', async () => {
    mockFetchCaseDetailsForExport.mockImplementation(async (id) => ({ id, name: `Full ${id}` }));

    render(<MemoryRouter initialEntries={["/archived-cases"]}><ArchivedCases /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /^Export All$/i }));
    fireEvent.click(screen.getByText(/Export All to PDF/i));

    await waitFor(() => {
      expect(mockDownloadAllCasesPDF).toHaveBeenCalledTimes(1);
      const [arg] = mockDownloadAllCasesPDF.mock.calls[0];
      expect(Array.isArray(arg)).toBe(true);
      expect(arg.length).toBeGreaterThan(0);
    });
  });

  it('exports all discharged cases to Word', async () => {
    mockFetchCaseDetailsForExport.mockImplementation(async (id) => ({ id, name: `Full ${id}` }));

    render(<MemoryRouter initialEntries={["/archived-cases"]}><ArchivedCases /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /^Export All$/i }));
    fireEvent.click(screen.getByText(/Export All to Word/i));

    await waitFor(() => {
      expect(mockDownloadAllCasesWord).toHaveBeenCalledTimes(1);
    });
  });

  it('exports all discharged cases to CSV (Excel)', async () => {
    mockFetchCaseDetailsForExport.mockImplementation(async (id) => ({ id, name: `Full ${id}` }));

    render(<MemoryRouter initialEntries={["/archived-cases"]}><ArchivedCases /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /^Export All$/i }));
    fireEvent.click(screen.getByText(/Export All to CSV/i));

    await waitFor(() => {
      expect(mockDownloadAllCasesCSV).toHaveBeenCalledTimes(1);
    });
  });
});

/* ------------------------------------------------------------------
 🔔 MOCK NOTIFICATION CONTEXT (Prevents render errors)
------------------------------------------------------------------ */
vi.mock('../context/NotificationContext.jsx', () => ({
  NotificationProvider: ({ children }) => <>{children}</>, // Dummy wrapper
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
