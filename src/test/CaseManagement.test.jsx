import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import CaseManagement from '../components/CaseManagement.jsx'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

const { sampleCases } = vi.hoisted(() => ({
  sampleCases: [
    { id: 1, name: 'Alice', status: 'active', programType: 'Children', birthdate: '2015-01-01', lastUpdated: '2025-10-10T00:00:00Z' },
    { id: 2, name: 'Bob', status: 'active', programType: 'Youth', birthdate: '2008-01-01', lastUpdated: '2025-10-11T00:00:00Z' },
    { id: 3, name: 'Charlie', status: 'archived', programType: 'Sanctuary', birthdate: '2010-01-01', lastUpdated: '2025-10-09T00:00:00Z' },
  ],
}))

vi.mock('../context/CaseContext', () => ({
  useCases: () => ({
    cases: sampleCases,
    loading: false,
    error: null,
    addCase: vi.fn(),
    updateCase: vi.fn(),
    deleteCase: vi.fn(),
  }),
}))

describe('Cases page', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-10-15T00:00:00Z'))
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => vi.clearAllMocks())

  it('renders and filters by search, program, and age', async () => {
    const authValue = { user: { role: 'Admin', name: 'Tester' } }
    const { container } = render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <CaseManagement />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 2, name: /Cases List/i })).toBeInTheDocument()

    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()

    const search = screen.getByPlaceholderText(/Search cases/i)
    fireEvent.change(search, { target: { value: 'alice' } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: '' } })
    const programSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(programSelect, { target: { value: 'Youth' } })
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()

    fireEvent.change(programSelect, { target: { value: '' } })
    const ageSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(ageSelect, { target: { value: '13-17' } })
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()

    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBeGreaterThan(0)
  })
})
// This test verifies the Cases list page renders and filters across search,
// program, and age. It mounts the component with a mocked CaseContext,
// passes an Admin user via AuthContext, and asserts the visible rows change
// as filters are applied. It focuses on UI state rather than backend calls.
