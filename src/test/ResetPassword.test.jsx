import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResetPassword from '../components/ResetPassword.jsx'
import { MemoryRouter } from 'react-router-dom'

// ResetPassword page smoke test
// The ResetPassword component shows a form only when a valid token is present.
// This smoke test validates the default message appears in absence of a token.
describe('ResetPassword page', () => {
  it('renders heading and token missing message', () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /Reset Password/i })).toBeInTheDocument()
    expect(screen.getByText(/Missing reset token/i)).toBeInTheDocument()
  })
})
