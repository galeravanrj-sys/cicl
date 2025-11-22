import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LandingPage from '../components/LandingPage.jsx'
import { MemoryRouter } from 'react-router-dom'

// Landing page smoke test
// Verifies that the initial CTA or title renders
describe('Landing page', () => {
  it('renders landing content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    )
    // Assert presence of primary CTAs
    expect(screen.getByText(/Log In/i)).toBeInTheDocument()
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument()
  })
})
