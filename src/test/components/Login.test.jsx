// Purpose: Verify Login component submits credentials and routes to Google OAuth correctly.
// Technique: Render with MemoryRouter and provide AuthContext mock; interact with form via Testing Library.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { API_BASE } from '../../utils/apiBase'
import Login from '../../components/Login'

// Asserts that clicking "Sign In" calls the mocked login() with form values and remember=true
test('submits login form with remember', async () => {
  const login = vi.fn().mockResolvedValue(true)
  render(
    <AuthContext.Provider value={{ login, error: null }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  )
  await userEvent.type(screen.getByLabelText('Email'), 'a@b.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret123')
  await userEvent.click(screen.getByText('Remember me'))
  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }))
  expect(login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret123', remember: true })
})

// Asserts the Google button points the browser to the backend OAuth endpoint
test('google button navigates to oauth url', async () => {
  const login = vi.fn().mockResolvedValue(true)
  render(
    <AuthContext.Provider value={{ login, error: null }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  )
  await userEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }))
  expect(window.location.href).toMatch(`${API_BASE}/auth/google`)
})
