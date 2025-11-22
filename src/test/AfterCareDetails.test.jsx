import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AfterCareDetails from '../components/AfterCareDetails.jsx'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// After Care details: I load one case and poke the edit buttons
describe('AfterCareDetails page', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 999,
        first_name: 'Juan', last_name: 'Dela Cruz',
        birthdate: '2010-01-01',
        educationalAttainment: [ { level: 'High School', school_name: 'HS1', school_address: 'HS Addr', year_completed: '2023' } ],
        present_address: 'Somewhere',
      })
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders client info and allows editing school/address', async () => {
    render(
      <MemoryRouter initialEntries={["/after-care/999"]}>
        <Routes>
          <Route path="/after-care/:id" element={<AfterCareDetails />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText(/After Care Details/i)).toBeInTheDocument()
      expect(screen.getByText(/Viewing details for case #999/i)).toBeInTheDocument()
    })

    // Toggle school edit (first Edit button in the page)
    fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[0])
    await waitFor(() => {
      expect(screen.getByText(/Grade Level/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})
