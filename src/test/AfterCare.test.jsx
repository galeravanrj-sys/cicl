import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AfterCare from '../components/AfterCare.jsx'
import { MemoryRouter } from 'react-router-dom'
import { useCases } from '../context/CaseContext'
import { fetchCaseDetailsForExport } from '../utils/exportHelpers'
import { downloadAllCasesPDF } from '../utils/pdfGenerator'

vi.mock('../context/CaseContext', () => ({
  useCases: vi.fn(),
}))
vi.mock('../utils/exportHelpers', () => ({
  fetchCaseDetailsForExport: vi.fn(),
}))
vi.mock('../utils/pdfGenerator', () => ({
  downloadAllCasesPDF: vi.fn(),
}))

// This test suite validates the AfterCare list page renders, filters,
// and triggers the export-all action. The high-level flow:
// 1) Provide a mocked CaseContext with a small dataset of after-care cases
// 2) Render the page and assert core UI elements
// 3) Click "Export All" → "Export All to PDF" and ensure the export util is called
describe('AfterCare page', () => {
  beforeEach(() => {
    (useCases).mockReturnValue({
      cases: [
        { id: 101, name: 'AC One', status: 'after care', programType: 'Residential', lastUpdated: '2025-10-01T00:00:00Z' },
        { id: 102, name: 'AC Two', status: 'after care', programType: 'Residential', lastUpdated: '2025-10-02T00:00:00Z' },
      ],
      loading: false,
      error: null,
    })
    ;(fetchCaseDetailsForExport).mockResolvedValue({ id: 101, name: 'AC One (Full)' })
    ;(downloadAllCasesPDF).mockResolvedValue()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })
  afterEach(() => vi.clearAllMocks())

  it('renders and exports all After Care cases to PDF', async () => {
    render(
      <MemoryRouter>
        <AfterCare />
      </MemoryRouter>
    )

    // Basic presence checks (header, export button)
    expect(screen.getByText(/After Care/i)).toBeInTheDocument()
    const exportBtn = screen.getByRole('button', { name: /Export All/i })
    fireEvent.click(exportBtn)
    fireEvent.click(screen.getByText(/Export All to PDF/i))

    await waitFor(() => {
      expect(downloadAllCasesPDF).toHaveBeenCalledTimes(1)
    })
  })
})

