# CICL - Child Information and Case Logging System

A comprehensive web application for managing child welfare cases, built with React frontend and Node.js backend.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Case Management**: Create, read, update, and delete child welfare cases
- **Dashboard**: Overview of case statistics and recent activities
- **Reports**: Generate and view case reports with data visualization
- **Settings**: User profile management and system configuration
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Chart.js** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Testing
- **Vitest** - Test framework
- **React Testing Library** - Component testing
- **Supertest** - API testing
- **@testing-library/user-event** - User interaction testing

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cicl
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In the server directory, create .env file
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   cd server
   node db.js
   ```

## 🚀 Running the Application

### Development Mode

**Option 1: Run all services together (Recommended)**
```bash
# From the root directory
npm run dev
```

**Option 2: Run services separately**
```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend development server
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Mode

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## 🧪 Testing

This project includes comprehensive testing across all layers:

### Quick Start
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests for specific component
npm run test:component frontend
npm run test:component server
npm run test:component integration
```

### Test Structure

```
├── frontend/src/test/          # Frontend component tests
│   ├── components/             # React component tests
│   ├── context/               # Context provider tests
│   ├── integration/           # Frontend integration tests
│   └── setupTests.js          # Test configuration
├── server/test/               # Backend API tests
│   ├── auth.test.js          # Authentication tests
│   ├── cases.test.js         # Case management tests
│   └── setup.js              # Test configuration
└── test/integration/          # Full system integration tests
    └── api.test.js           # End-to-end API tests
```

### Test Categories

#### 1. Unit Tests
- **Component Tests**: Individual React component functionality
- **Context Tests**: State management and context providers
- **Utility Tests**: Helper functions and utilities
- **API Tests**: Individual endpoint testing

#### 2. Integration Tests
- **User Workflows**: Complete user journeys (login, case creation, etc.)
- **API Integration**: Cross-service communication
- **Database Integration**: Data persistence and retrieval

#### 3. Coverage Requirements
- **Frontend**: 70% coverage threshold
- **Backend**: 70% coverage threshold
- **Integration**: 60% coverage threshold

### Test Commands

```bash
# Run all tests
npm test
npm run test:all

# Run specific test suites
npm run test:frontend          # Frontend tests only
npm run test:server           # Backend tests only
npm run test:main             # Integration tests only

# Watch mode for development
npm run test:watch            # Watch all test suites
cd frontend && npm run test:watch  # Watch frontend only
cd server && npm run test:watch    # Watch backend only

# Coverage reporting
npm run test:coverage         # Generate coverage for all suites
npm run test:ci              # CI-friendly: fail-fast with coverage

# Advanced test runner
node test-runner.js --help    # See all options
node test-runner.js --coverage --component frontend
node test-runner.js --fail-fast
```

### Test Configuration Files

- `vitest.config.js` - Main project test configuration
- `frontend/vitest.config.js` - Frontend-specific configuration
- `server/vitest.config.js` - Backend-specific configuration
- `test-runner.js` - Custom test runner with advanced features

## 📁 Project Structure

```
cicl/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/         # Context providers
│   │   ├── services/        # API services
│   │   └── test/           # Frontend tests
│   └── package.json
├── server/                   # Node.js backend application
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── test/               # Backend tests
│   └── package.json
├── database/                # Database schema and migrations
├── test/                    # Integration tests
├── test-runner.js          # Custom test runner
└── package.json            # Root package configuration
```

## 🔒 Environment Variables

### Server (.env)
```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
DB_PATH=./database.sqlite
```

## 🚀 Deployment

### Using Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
```bash
# Build the frontend
npm run build

# Set environment to production
export NODE_ENV=production

# Start the server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:coverage`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Maintain test coverage above 70%
- Follow existing code style
- Update documentation as needed
- Run `npm run test:ci` before submitting PRs

## 📊 Test Coverage Reports

After running tests with coverage, reports are generated in:
- `coverage/` - Main project coverage
- `frontend/coverage/` - Frontend coverage
- `server/coverage/` - Backend coverage

Open `coverage/index.html` in your browser to view detailed coverage reports.

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports 3000 and 5000
   npx kill-port 3000 5000
   ```

2. **Database connection issues**
   ```bash
   # Reinitialize the database
   cd server
   rm database.sqlite
   node db.js
   ```

3. **Test failures**
   ```bash
   # Clear test cache and run again
   npm run test:coverage -- --no-cache
   ```

4. **Module not found errors**
   ```bash
   # Clean install dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- COLLADO, REYMUND LUIS P.
- GALERA, VANRJ M.
- GALICIA, ANDREI JOSHUA C
- MACARAEG, JAZZENT NICO D.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

