// Purpose: Verify ArchivedCases lists only archived entries.
// Technique: Mock useCases to return mixed statuses; assert filtering by helper is applied.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArchivedCases from '../../components/ArchivedCases'

// Provide deterministic cases including 'archived' and 'after care'
vi.mock('../../context/CaseContext', () => {
  const allCases = [
    { id: 1, name: 'Zed One', status: 'archived', programType: 'Children', birthdate: '2008-01-01', lastUpdated: new Date().toISOString() },
    { id: 2, name: 'Yara Two', status: 'after care', programType: 'Youth', birthdate: '2006-02-02', lastUpdated: new Date().toISOString() },
    { id: 3, name: 'Xeno Three', status: 'active', programType: 'Sanctuary', birthdate: '2005-03-03', lastUpdated: new Date().toISOString() }
  ]
  return {
    useCases: () => ({
      allCases,
      loading: false,
      error: null,
      lastUpdate: new Date().toISOString(),
      fetchAllCases: vi.fn(),
      updateCase: vi.fn()
    })
  }
})

// Ensures non-archived items are excluded from the rendered list
test('shows only archived cases', async () => {
  render(
    <MemoryRouter>
      <ArchivedCases />
    </MemoryRouter>
  )
  expect(screen.getByText('Zed One')).toBeInTheDocument()
  expect(screen.queryByText('Yara Two')).not.toBeInTheDocument()
  expect(screen.queryByText('Xeno Three')).not.toBeInTheDocument()
})
