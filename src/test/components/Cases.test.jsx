// Purpose: Validate CaseManagement filters out archived cases and applies search input.
// Technique: Mock useCases to provide cases; wrap with AuthContext since component reads user role.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import CaseManagement from '../../components/CaseManagement'

// Mock context data so the table renders predictable rows
vi.mock('../../context/CaseContext', () => {
  const cases = [
    { id: 1, name: 'Alice Smith', birthdate: '2008-01-01', programType: 'Children', status: 'active', lastUpdated: new Date().toISOString() },
    { id: 2, name: 'Bob Jones', birthdate: '2005-05-05', programType: 'Youth', status: 'active', lastUpdated: new Date().toISOString() },
    { id: 3, name: 'Charlie Ray', birthdate: '2003-07-07', programType: 'Sanctuary', status: 'archived', lastUpdated: new Date().toISOString() }
  ]
  return {
    useCases: () => ({
      cases,
      loading: false,
      error: null,
      addCase: vi.fn(),
      updateCase: vi.fn(),
      deleteCase: vi.fn()
    })
  }
})

// Ensures archived row disappears and search narrows list
test('filters cases by search and excludes archived', async () => {
  render(
    <AuthContext.Provider value={{ user: { role: 'admin' } }}>
      <MemoryRouter>
        <CaseManagement />
      </MemoryRouter>
    </AuthContext.Provider>
  )
  expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  expect(screen.queryByText('Charlie Ray')).not.toBeInTheDocument()
  await userEvent.type(screen.getByPlaceholderText('Search cases...'), 'Alice')
  expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
})
