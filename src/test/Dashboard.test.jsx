import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Dashboard from '../components/Dashboard.jsx'
import { cases } from './fixtures/websiteData'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/CaseContext', () => ({
  useCases: () => ({
    fetchAllCases: async () => (cases),
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

// Just making sure the dashboard shows up and has some headings/widgets
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
