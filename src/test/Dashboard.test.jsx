import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Dashboard from '../components/Dashboard.jsx'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/CaseContext', () => ({
  useCases: () => ({
    fetchAllCases: async () => ([
      { id: 1, status: 'active', lastUpdated: new Date().toISOString() },
      { id: 2, status: 'archived', lastUpdated: new Date().toISOString() },
    ]),
    loading: false,
    error: null,
  }),
}))

// Stub react-chartjs-2 to avoid Chart.js DOM usage in tests
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
  Doughnut: () => <div data-testid="doughnut-chart" />,
  Pie: () => <div data-testid="pie-chart" />,
}))

// Basic render test for Dashboard
// Purpose: ensure the page mounts and shows the REPORTS/overview widgets header
describe('Dashboard page', () => {
  it('renders dashboard layout', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    // Loosely assert presence of top headings/widgets
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
