import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Settings from '../components/Settings.jsx'
import { AuthContext } from '../context/AuthContext.jsx'
import { MemoryRouter } from 'react-router-dom'

const { navigateMock, logoutMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

describe('Settings page', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    logoutMock.mockReset()
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => vi.clearAllMocks())

  it('renders and triggers logout + navigate on Sign Out', () => {
    const authValue = {
      userProfile: { firstName: 'Test', email: 'test@example.com' },
      setUserProfile: vi.fn(),
      logout: logoutMock,
    }

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <Settings />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 2, name: /Settings/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }))
    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith('/')
  })
})