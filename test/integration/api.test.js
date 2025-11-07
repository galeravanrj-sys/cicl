import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock server setup for integration testing
const createTestServer = () => {
  const app = express();
  app.use(express.json());

  // Mock authentication middleware
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    // Mock token validation
    if (token === 'valid-token') {
      req.user = { id: 1, username: 'testuser' };
      next();
    } else {
      res.status(403).json({ message: 'Invalid token' });
    }
  };

  // Mock database
  let users = [];
  let cases = [];
  let nextUserId = 1;
  let nextCaseId = 1;

  // Auth routes
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
      id: nextUserId++,
      username,
      email,
      password: 'hashed_' + password // Mock hashed password
    };
    users.push(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user || user.password !== 'hashed_' + password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: 'valid-token',
      user: { id: user.id, username: user.username, email: user.email }
    });
  });

  // Case routes
  app.get('/api/cases', authenticateToken, (req, res) => {
    const userCases = cases.filter(c => c.userId === req.user.id);
    res.json(userCases);
  });

  app.post('/api/cases', authenticateToken, (req, res) => {
    const { childName, age, gender, guardianName, contactNumber, address, caseDescription } = req.body;
    
    if (!childName || !age || !guardianName) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const newCase = {
      id: nextCaseId++,
      userId: req.user.id,
      childName,
      age: parseInt(age),
      gender,
      guardianName,
      contactNumber,
      address,
      caseDescription,
      status: req.body.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    cases.push(newCase);
    res.status(201).json(newCase);
  });

  app.get('/api/cases/:id', authenticateToken, (req, res) => {
    const caseId = parseInt(req.params.id);
    const case_ = cases.find(c => c.id === caseId && c.userId === req.user.id);
    
    if (!case_) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json(case_);
  });

  app.put('/api/cases/:id', authenticateToken, (req, res) => {
    const caseId = parseInt(req.params.id);
    const caseIndex = cases.findIndex(c => c.id === caseId && c.userId === req.user.id);
    
    if (caseIndex === -1) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    const updatedCase = {
      ...cases[caseIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    cases[caseIndex] = updatedCase;
    res.json(updatedCase);
  });

  app.delete('/api/cases/:id', authenticateToken, (req, res) => {
    const caseId = parseInt(req.params.id);
    const caseIndex = cases.findIndex(c => c.id === caseId && c.userId === req.user.id);
    
    if (caseIndex === -1) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    cases.splice(caseIndex, 1);
    res.json({ message: 'Case deleted successfully' });
  });

  // User profile routes
  app.get('/api/user/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ id: user.id, username: user.username, email: user.email });
  });

  app.put('/api/user/profile', authenticateToken, (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updatedUser = {
      ...users[userIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;
    res.json({ id: updatedUser.id, username: updatedUser.username, email: updatedUser.email });
  });

  // Statistics routes
  app.get('/api/stats/dashboard', authenticateToken, (req, res) => {
    const userCases = cases.filter(c => c.userId === req.user.id);
    const stats = {
      totalCases: userCases.length,
      activeCases: userCases.filter(c => c.status === 'Active').length,
      pendingCases: userCases.filter(c => c.status === 'Pending').length,
      closedCases: userCases.filter(c => c.status === 'Closed').length,
      urgentCases: userCases.filter(c => c.status === 'Urgent').length
    };
    
    res.json(stats);
  });

  // Reset function for tests
  app._reset = () => {
    users = [];
    cases = [];
    nextUserId = 1;
    nextCaseId = 1;
  };

  return app;
};

describe('API Integration Tests', () => {
  let app;
  let authToken;

  beforeAll(() => {
    app = createTestServer();
  });

  beforeEach(() => {
    app._reset();
    authToken = null;
  });

  describe('Authentication Flow', () => {
    test('complete user registration and login flow', async () => {
      // Register a new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.message).toBe('User registered successfully');
      expect(registerResponse.body.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });

      // Login with the registered user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBe('valid-token');
      expect(loginResponse.body.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });

      authToken = loginResponse.body.token;
    });

    test('prevents duplicate user registration', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password456'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
    });

    test('rejects invalid login credentials', async () => {
      // Register a user first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      // Try to login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('Case Management Flow', () => {
    beforeEach(async () => {
      // Register and login a user for each test
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    test('complete case CRUD operations', async () => {
      // Create a new case
      const createResponse = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childName: 'John Doe',
          age: 15,
          gender: 'Male',
          guardianName: 'Jane Doe',
          contactNumber: '1234567890',
          address: '123 Main St',
          caseDescription: 'Test case description'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toMatchObject({
        id: 1,
        childName: 'John Doe',
        age: 15,
        status: 'Active'
      });

      const caseId = createResponse.body.id;

      // Read the created case
      const getResponse = await request(app)
        .get(`/api/cases/${caseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.childName).toBe('John Doe');

      // Update the case
      const updateResponse = await request(app)
        .put(`/api/cases/${caseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'Closed',
          caseDescription: 'Updated description'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('Closed');
      expect(updateResponse.body.caseDescription).toBe('Updated description');

      // Delete the case
      const deleteResponse = await request(app)
        .delete(`/api/cases/${caseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Case deleted successfully');

      // Verify case is deleted
      const getDeletedResponse = await request(app)
        .get(`/api/cases/${caseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getDeletedResponse.status).toBe(404);
    });

    test('lists user cases correctly', async () => {
      // Create multiple cases
      const case1Data = {
        childName: 'John Doe',
        age: 15,
        gender: 'Male',
        guardianName: 'Jane Doe',
        contactNumber: '1234567890',
        address: '123 Main St',
        caseDescription: 'First case'
      };

      const case2Data = {
        childName: 'Alice Smith',
        age: 12,
        gender: 'Female',
        guardianName: 'Bob Smith',
        contactNumber: '0987654321',
        address: '456 Oak Ave',
        caseDescription: 'Second case'
      };

      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(case1Data);

      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(case2Data);

      // Get all cases
      const response = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].childName).toBe('John Doe');
      expect(response.body[1].childName).toBe('Alice Smith');
    });

    test('requires authentication for case operations', async () => {
      // Try to create case without token
      const createResponse = await request(app)
        .post('/api/cases')
        .send({
          childName: 'John Doe',
          age: 15,
          guardianName: 'Jane Doe'
        });

      expect(createResponse.status).toBe(401);
      expect(createResponse.body.message).toBe('Access token required');

      // Try to get cases without token
      const getResponse = await request(app)
        .get('/api/cases');

      expect(getResponse.status).toBe(401);
    });
  });

  describe('User Profile Management', () => {
    beforeEach(async () => {
      // Register and login a user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    test('gets and updates user profile', async () => {
      // Get user profile
      const getResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });

      // Update user profile
      const updateResponse = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'updateduser'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.username).toBe('updateduser');
      expect(updateResponse.body.email).toBe('test@example.com');
    });
  });

  describe('Dashboard Statistics', () => {
    beforeEach(async () => {
      // Register and login a user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
    });

    test('calculates dashboard statistics correctly', async () => {
      // Create cases with different statuses
      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childName: 'Active Case',
          age: 15,
          guardianName: 'Guardian 1',
          status: 'Active'
        });

      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childName: 'Pending Case',
          age: 16,
          guardianName: 'Guardian 2',
          status: 'Pending'
        });

      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childName: 'Closed Case',
          age: 14,
          guardianName: 'Guardian 3',
          status: 'Closed'
        });

      // Get dashboard statistics
      const response = await request(app)
        .get('/api/stats/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        totalCases: 3,
        activeCases: 1,
        pendingCases: 1,
        closedCases: 1,
        urgentCases: 0
      });
    });
  });

  describe('Error Handling', () => {
    test('handles malformed requests', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('All fields are required');
    });

    test('handles invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });
});