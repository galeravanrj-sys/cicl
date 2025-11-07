import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Ensure cleanup after each test to prevent DOM accumulation
afterEach(() => cleanup())
