# Testing Guide for MoodMingle

## 🧪 Test Suite Overview

MoodMingle includes comprehensive automated testing for:
- Unit tests (components, utilities)
- Integration tests (user flows, API interactions)
- E2E test scripts (API endpoints)

## Running Tests

### Frontend Tests

```bash
# Run all frontend tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage report
npm run test:coverage
```

### Backend Tests

```bash
cd server
npm test
```

### All Tests

```bash
# Run comprehensive test suite (frontend + backend + API)
npm run test:all
```

## Test Structure

```
src/
├── __tests__/
│   ├── integration/        # Integration tests
│   │   ├── App.test.jsx
│   │   ├── MoodFlow.test.jsx
│   │   └── ChatFlow.test.jsx
│   └── unit/               # Unit tests (existing)
│
server/
└── __tests__/
    └── integration/        # Backend integration tests
        └── api.test.js

scripts/
└── test-app.sh             # API endpoint testing
```

## Test Coverage

### Frontend Coverage

- ✅ Component rendering
- ✅ User interactions
- ✅ State management
- ✅ API integration
- ✅ Error handling
- ✅ Navigation flows

### Backend Coverage

- ✅ User management APIs
- ✅ Mood tracking APIs
- ✅ Matching system
- ✅ Journal APIs
- ✅ Message APIs
- ✅ Database operations

## Writing New Tests

### Component Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
    it('should render correctly', () => {
        render(<MyComponent />);
        expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
});
```

### Integration Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import App from '../../App';

describe('Feature Flow', () => {
    it('should complete user flow', async () => {
        render(<App />);
        // Test user interactions
    });
});
```

## Test Data

- Tests use mocked API responses
- LocalStorage is cleared between tests
- Socket.io is mocked for chat tests
- Test database can be configured for backend tests

## Continuous Integration

To set up CI/CD:

1. Add test scripts to CI pipeline
2. Run `npm run test:all` on each commit
3. Generate coverage reports
4. Fail build if tests fail

## Debugging Tests

### View Test Output

```bash
# Verbose output
npm test -- --reporter=verbose

# Watch mode for debugging
npm run test:watch
```

### Debug Specific Test

```bash
# Run single test file
npm test -- App.test.jsx

# Run tests matching pattern
npm test -- -t "should render"
```

## Coverage Goals

- **Target**: 80%+ code coverage
- **Critical paths**: 100% coverage
- **Components**: 70%+ coverage
- **Utilities**: 90%+ coverage

## Best Practices

1. **Test user flows, not implementation**
2. **Use meaningful test descriptions**
3. **Keep tests independent**
4. **Mock external dependencies**
5. **Test error cases**
6. **Test edge cases**

## Troubleshooting

### Tests failing randomly
- Check for race conditions
- Add proper waitFor() calls
- Ensure mocks are reset between tests

### Socket.io tests failing
- Verify socket mock is set up
- Check event handlers are properly mocked

### API tests failing
- Ensure server is running
- Check API endpoints are correct
- Verify test data setup
