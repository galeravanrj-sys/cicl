import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Notifications from '../components/Notifications.jsx'
import { notifications as websiteNotifications } from './fixtures/websiteData'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/NotificationContext.jsx', () => ({
  useNotifications: () => ({
    // Use the website notifications
    notifications: websiteNotifications,
    // Unread = all items here
    unreadCount: websiteNotifications.length,
    markAsRead: () => {},
    markAllAsRead: () => {},
    resetNotifications: () => {},
  }),
}))

// Just checking the notifications box shows up
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
