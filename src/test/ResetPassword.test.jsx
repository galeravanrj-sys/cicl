import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ResetPassword from '../components/ResetPassword.jsx'
import { MemoryRouter } from 'react-router-dom'

// Reset password: without a token, it should say it's missing
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
