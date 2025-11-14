import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dashboard from '../components/Dashboard.jsx'

const { sampleCases } = vi.hoisted(() => ({
  sampleCases: [
    { id: 1, status: 'active', lastUpdated: '2025-10-10T00:00:00Z', programType: 'Children' },
    { id: 2, status: 'archived', lastUpdated: '2025-09-05T00:00:00Z', programType: 'Youth' },
    { id: 3, status: 'active', lastUpdated: '2025-02-20T00:00:00Z', programType: 'Sanctuary' },
    { id: 4, status: 'ARCHIVED', lastUpdated: '2025-02-21T00:00:00Z', programType: 'Crisis Intervention' },
  ],
}))

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }) => <div data-testid="bar-chart" data-chart={JSON.stringify(data)} />,
  Doughnut: ({ data }) => <div data-testid="doughnut-chart" data-chart={JSON.stringify(data)} />,
  Pie: ({ data }) => <div data-testid="pie-chart" data-chart={JSON.stringify(data)} />,
}))

vi.mock('../context/CaseContext', () => ({
  useCases: () => ({
    fetchAllCases: vi.fn().mockResolvedValue(sampleCases),
    loading: false,
    error: null,
  }),
}))

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-10-15T00:00:00Z'))
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => vi.clearAllMocks())

  it('renders heading, cards and charts with correct numbers', async () => {
    render(<Dashboard />)

    expect(screen.getByRole('heading', { level: 2, name: /Dashboard/i })).toBeInTheDocument()
    expect((await screen.findAllByText(/ACTIVE CASES/i)).length).toBeGreaterThan(0)

    const doughnut = await screen.findByTestId('doughnut-chart')
    const bar = await screen.findByTestId('bar-chart')
    const pie = await screen.findByTestId('pie-chart')
    expect(doughnut).toBeInTheDocument()
    expect(bar).toBeInTheDocument()
    expect(pie).toBeInTheDocument()

    const activeTitle = screen.getAllByText(/ACTIVE CASES/i)[0]
    const activeNumber = activeTitle.parentElement.querySelector('h1')
    const dischargedTitle = screen.getAllByText(/DISCHARGED/i)[0]
    const dischargedNumber = dischargedTitle.parentElement.querySelector('h1')
    const admissionsTitle = screen.getAllByText(/NEW ADMISSIONS/i)[0]
    const admissionsNumber = admissionsTitle.parentElement.querySelector('h1')

    const expectedActive = sampleCases.filter(c => {
      const s = String(c.status || '').toLowerCase()
      return s === 'active' || c.status === true || c.isActive === true || c.status == null
    }).length
    const expectedArchived = sampleCases.filter(c => String(c.status || '').toLowerCase().includes('archived')).length
    const expectedAdmissions = sampleCases.filter(c => {
      if (!c.lastUpdated) return false
      const d = new Date(c.lastUpdated)
      const thirty = new Date('2025-10-15T00:00:00Z')
      thirty.setDate(thirty.getDate() - 30)
      return d >= thirty
    }).length

    expect(activeNumber.textContent).toBe(String(expectedActive))
    expect(dischargedNumber.textContent).toBe(String(expectedArchived))
    expect(admissionsNumber.textContent).toBe(String(expectedAdmissions))
  })
})