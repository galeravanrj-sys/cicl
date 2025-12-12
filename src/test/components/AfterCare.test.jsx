// Purpose: Verify AfterCare page renders only 'after care' status entries.
// Technique: Mock useCases to supply cases and assert filtered list.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AfterCare from '../../components/AfterCare'

// Provide mixed statuses; component filters with isAfterCareStatus logic
vi.mock('../../context/CaseContext', () => {
  const allCases = [
    { id: 1, name: 'Case A', status: 'after care', programType: 'Children', birthdate: '2008-01-01', lastUpdated: new Date().toISOString() },
    { id: 2, name: 'Case B', status: 'after care', programType: 'Youth', birthdate: '2007-02-02', lastUpdated: new Date().toISOString() },
    { id: 3, name: 'Case C', status: 'archived', programType: 'Sanctuary', birthdate: '2006-03-03', lastUpdated: new Date().toISOString() }
  ]
  return {
    useCases: () => ({
      allCases,
      fetchAllCases: vi.fn(),
      lastUpdate: new Date().toISOString(),
      updateCase: vi.fn()
    })
  }
})

// Ensures only after-care cases appear
test('renders after care cases list', async () => {
  render(
    <MemoryRouter>
      <AfterCare />
    </MemoryRouter>
  )
  expect(screen.getByText('Case A')).toBeInTheDocument()
  expect(screen.getByText('Case B')).toBeInTheDocument()
  expect(screen.queryByText('Case C')).not.toBeInTheDocument()
})
