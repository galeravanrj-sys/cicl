// Purpose: Verify Settings toggles edit mode, updates a field, and saves via context.
// Technique: Render with AuthContext providing userProfile and setUserProfile mock; interact with form controls.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Settings from '../../components/Settings'
import { AuthContext } from '../../context/AuthContext'

// Ensures clicking Edit allows changes and Save calls setUserProfile
test('edits and saves profile', async () => {
  const setUserProfile = vi.fn()
  const logout = vi.fn()
  const userProfile = { firstName: 'Jane', lastName: 'Doe', middleName: '', email: 'jane@doe.com', profileImage: null }
  render(
    <AuthContext.Provider value={{ userProfile, setUserProfile, logout }}>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </AuthContext.Provider>
  )
  await userEvent.click(screen.getByRole('button', { name: /Edit settings/i }))
  await userEvent.clear(screen.getByLabelText('First Name'))
  await userEvent.type(screen.getByLabelText('First Name'), 'Janet')
  await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
  expect(setUserProfile).toHaveBeenCalled()
})
