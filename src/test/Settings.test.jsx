import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Settings from '../components/Settings.jsx'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

// Settings page smoke test
// Ensures basic render and presence of a top-level heading or form controls
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
// Settings page smoke test
// Provides a minimal AuthContext with userProfile and logout to satisfy
// the component’s useContext requirements. The goal is to ensure the
// page mounts and shows headings, without exercising backend calls.
