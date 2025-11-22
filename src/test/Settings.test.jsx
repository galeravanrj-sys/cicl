import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Settings from '../components/Settings.jsx'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

// Settings quick check
// Page should render and show some headings/controls
describe('Settings page', () => {
  it('renders settings UI', () => {
    const auth = { userProfile: { firstName: 'Tester' }, setUserProfile: () => {}, logout: () => {} }
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth}>
          <Settings />
        </AuthContext.Provider>
      </MemoryRouter>
    )
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
// Minimal auth context so the page mounts; not testing backend here
