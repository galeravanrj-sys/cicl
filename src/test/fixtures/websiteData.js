export const users = {
  admin: { email: 'galeravanrj@gmail.com', name: 'Admin User' },
  yuki: { email: 'yukis4779@gmail.com', name: 'Yuki Dine' },
  olddine: { email: 'olddine@gmail.com', name: 'Olddine' },
}

export const cases = [
  { id: 1, name: 'Maria Santos', status: 'active', programType: 'Children', birthdate: '2015-01-01', lastUpdated: '2025-10-10T00:00:00Z' },
  { id: 2, name: 'Juan Dela Cruz', status: 'archived', programType: 'Youth', birthdate: '2010-04-15', lastUpdated: '2025-09-05T00:00:00Z' },
  { id: 3, name: 'Ana Reyes', status: 'active', programType: 'Sanctuary', birthdate: '2012-02-20', lastUpdated: '2025-02-20T00:00:00Z' },
  { id: 4, name: 'Pedro Santos', status: 'ARCHIVED', programType: 'Crisis Intervention', birthdate: '2011-01-21', lastUpdated: '2025-02-21T00:00:00Z' },
  { id: 5, name: 'Carlo Cruz', status: 'after care', programType: 'Residential', birthdate: '2009-07-12', lastUpdated: '2025-10-01T00:00:00Z' },
  { id: 6, name: 'Liza Ramos', status: 'after care', programType: 'Residential', birthdate: '2008-11-03', lastUpdated: '2025-10-02T00:00:00Z' },
]

export const afterCareCases = cases.filter(c => String(c.status).toLowerCase().includes('after'))

export const notifications = [
  { id: 1, type: 'info', title: 'Welcome', message: 'Welcome to Hopetrack', timestamp: new Date() },
]
