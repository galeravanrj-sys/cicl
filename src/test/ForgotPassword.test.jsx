import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ForgotPassword from '../components/ForgotPassword.jsx'
import { MemoryRouter } from 'react-router-dom'

// Forgot password: page shows the reset form
describe('ForgotPassword page', () => {
  it('renders and shows request reset form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    )
    // Just check there are some text inputs
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0)
  })
})
