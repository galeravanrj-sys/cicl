import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PrivateRoute from '../components/PrivateRoute.jsx'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

// Private route sanity check
// If logged in, I should see the protected content
describe('PrivateRoute', () => {
  it('renders children when authenticated', () => {
    // Auth says I'm logged in
    const auth = { isAuthenticated: true, loading: false, user: { role: 'Admin' } }
    render(
      <MemoryRouter>
        {/* Wrap with auth so the route knows I'm logged in */}
        <AuthContext.Provider value={auth}>
          <PrivateRoute>
            {/* Child should show when auth is true */}
            <div>Protected Content</div>
          </PrivateRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    // I should see the protected content on screen
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
