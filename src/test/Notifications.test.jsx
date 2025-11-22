import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Notifications from '../components/Notifications.jsx'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/NotificationContext.jsx', () => ({
  useNotifications: () => ({
    notifications: [
      { id: 1, type: 'info', title: 'Sample', message: 'Hello', timestamp: new Date() },
    ],
    unreadCount: 1,
    markAsRead: () => {},
    markAllAsRead: () => {},
    resetNotifications: () => {},
  }),
}))

// Notifications component smoke test
describe('Notifications', () => {
  it('renders notifications container', () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    )
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument()
  })
})
