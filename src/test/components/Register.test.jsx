// Purpose: Verify Register component submits required fields and triggers Google signup URL.
// Technique: Render with MemoryRouter and mock AuthContext; simulate typing and button clicks.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { API_BASE } from '../../utils/apiBase'
import Register from '../../components/Register'

// Ensures Register calls register() with composed payload and remember=true
test('submits register form and navigates', async () => {
  const register = vi.fn().mockResolvedValue(true)
  render(
    <AuthContext.Provider value={{ register, error: null }}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </AuthContext.Provider>
  )
  await userEvent.type(screen.getByLabelText('First Name'), 'John')
  await userEvent.type(screen.getByLabelText('Last Name'), 'Doe')
  await userEvent.type(screen.getByLabelText('Email'), 'john@doe.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret123')
  await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))
  expect(register).toHaveBeenCalledWith({
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    email: 'john@doe.com',
    password: 'secret123',
    remember: true
  })
})

// Ensures Google signup triggers backend OAuth URL
test('google signup navigates to oauth url', async () => {
  const register = vi.fn().mockResolvedValue(true)
  render(
    <AuthContext.Provider value={{ register, error: null }}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </AuthContext.Provider>
  )
  await userEvent.click(screen.getByRole('button', { name: /Sign up with Google/i }))
  expect(window.location.href).toMatch(`${API_BASE}/auth/google`)
})
