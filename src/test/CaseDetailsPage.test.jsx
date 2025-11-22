import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CaseDetailsPage from '../components/CaseDetailsPage.jsx'
import { MemoryRouter } from 'react-router-dom'

// Case details page smoke test
// Default render shows a loading spinner when no :id param is provided.
// We assert the spinner and loading message are present.
describe('CaseDetailsPage', () => {
  it('renders loading state without route params', () => {
    render(
      <MemoryRouter>
        <CaseDetailsPage />
      </MemoryRouter>
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/Loading case details/i)).toBeInTheDocument()
  })
})
