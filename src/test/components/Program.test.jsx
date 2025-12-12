// Purpose: Verify Program page expands cards and shows section titles.
// Technique: Click program cards and assert section headers are visible.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Program from '../../components/Program'

// Ensures expanding each program reveals its section title
test('renders program sections', async () => {
  render(
    <MemoryRouter>
      <Program />
    </MemoryRouter>
  )
  await userEvent.click(screen.getByText(/Children's Welfare and Development/i))
  expect(screen.getAllByText(/Residential Homes/i).length).toBeGreaterThan(0)
  await userEvent.click(screen.getByText(/Crisis Intervention \(Individual \/ Family\)/i))
  expect(screen.getAllByText(/Temporary Shelter/i).length).toBeGreaterThan(0)
  await userEvent.click(screen.getByText(/Follow up \/ After Care/i))
  expect(screen.getAllByText(/Post-Discharge Support/i).length).toBeGreaterThan(0)
})
