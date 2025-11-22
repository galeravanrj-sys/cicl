/*
Quick check on the Programs page:
- See the main categories
- Click one and it expands
Keeping it simple, no backend stuff here.
*/
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Program from '../components/Program.jsx'

describe('Program page', () => {
  it('renders program categories and expands details', () => {
    render(<Program />)
    expect(screen.getByRole('heading', { level: 2, name: /Programs/i })).toBeInTheDocument()
    expect(screen.getByText(/Children's Welfare and Development/i)).toBeInTheDocument()
    expect(screen.getByText(/Youth Welfare and Development/i)).toBeInTheDocument()
    expect(screen.getByText(/Crisis Intervention/i)).toBeInTheDocument()
    expect(screen.getByText(/Follow up /i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Children's Welfare and Development/i))
    expect(screen.getByRole('heading', { level: 4, name: /Residential Homes/i })).toBeInTheDocument()
  })
})
