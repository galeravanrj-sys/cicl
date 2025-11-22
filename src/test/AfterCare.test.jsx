import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import AfterCare from '../components/AfterCare.jsx'
import { MemoryRouter } from 'react-router-dom'
import { useCases } from '../context/CaseContext'
import { afterCareCases } from './fixtures/websiteData'
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

// Quick check: page shows the after-care list and the export works
// Flow:
// 1) Use a small after-care dataset
// 2) Render the page and look for the header
// 3) Click Export All → PDF and make sure it gets called
describe('AfterCare page', () => {
  beforeEach(() => {
    (useCases).mockReturnValue({
      allCases: afterCareCases,
      fetchAllCases: vi.fn(),
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
    await screen.findByRole('heading', { name: /After Care/i })
    const exportBtn = screen.getByTitle(/Export all After Care cases/i)
    fireEvent.click(exportBtn)
    fireEvent.click(screen.getByText(/Export All to PDF/i))

    await waitFor(() => {
      expect(downloadAllCasesPDF).toHaveBeenCalledTimes(1)
    })
  })
})
