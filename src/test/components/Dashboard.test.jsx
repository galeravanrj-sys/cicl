// Purpose: Verify Dashboard renders numeric summaries without depending on chart rendering.
// Technique: Mock charts to no-op and mock useCases to deliver deterministic data.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../../components/Dashboard'

// Prevent ChartJS components from mounting a canvas in jsdom
vi.mock('react-chartjs-2', () => ({
  Bar: () => null,
  Doughnut: () => null,
  Pie: () => null
}))

// Provide fixed data via useCases mock to exercise stats and memoized calculations
vi.mock('../../context/CaseContext', () => {
  const allCases = [
    { status: 'active', lastUpdated: new Date().toISOString(), programType: 'Children' },
    { status: 'active', lastUpdated: new Date().toISOString(), programType: 'Youth' },
    { status: 'archived', lastUpdated: new Date().toISOString(), programType: 'Sanctuary' },
    { status: 'archived', lastUpdated: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(), programType: 'Crisis' },
    { status: 'active', lastUpdated: new Date().toISOString(), programType: 'Children' }
  ]
  return {
    useCases: () => ({
      fetchAllCases: vi.fn().mockResolvedValue(allCases),
      loading: false,
      error: null
    })
  }
})

// Assert three summary numbers (Active, Discharged, Admissions) are present
test('renders dashboard summary numbers', async () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
  const headings = await screen.findAllByRole('heading', { level: 1 })
  expect(headings[0].textContent).toMatch(/\d+/)
  expect(headings[1].textContent).toMatch(/\d+/)
  expect(headings[2].textContent).toMatch(/\d+/)
})
