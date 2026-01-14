# How to Run and Review Tests

## Quick Start

### 1. Run All Tests
```bash
# Frontend tests (React/Vitest)
npm test

# Backend tests (Server/Jest)
cd server && npm test

# Both at once
npm run test:all
```

### 2. Run Specific Test Files
```bash
# Frontend - Notification tests
npm test src/__tests__/integration/Notifications.test.jsx

# Frontend - Room tests
npm test src/__tests__/integration/Rooms.test.jsx

# Backend - Notification API tests
cd server && npm test __tests__/notifications-api.test.js
```

### 3. Run Tests in Watch Mode
```bash
# Frontend (auto-reruns on file changes)
npm run test:watch

# Backend
cd server && npm run test:watch
```

### 4. Run Tests with Coverage
```bash
# Frontend coverage report
npm run test:coverage

# This will show:
# - Which lines are covered
# - Which functions are tested
# - Coverage percentage per file
```

## Understanding Test Results

### Test Output Format

When you run tests, you'll see:

```
✓ should send a heart notification (15ms)  ← Passing test
✕ should accept a chat request (20ms)     ← Failing test
```

### Reading Test Failures

When a test fails, you'll see:

1. **Test Name**: Which test failed
2. **Error Message**: What went wrong
3. **Expected vs Received**: What was expected vs what actually happened
4. **Stack Trace**: Where the error occurred

Example:
```
✕ should accept a chat request

Expected: 200
Received: 400

at Object.<anonymous> (__tests__/notifications-api.test.js:206:36)
```

### Test Summary

At the end, you'll see a summary:
```
Test Suites: 2 passed, 1 failed, 3 total
Tests:       15 passed, 5 failed, 20 total
```

## Reviewing Test Results

### Option 1: Terminal Output (Default)
Just run the tests and read the output in your terminal.

### Option 2: Test UI (Visual)
```bash
npm run test:ui
```
This opens a visual test runner in your browser where you can:
- See all tests in a tree view
- Click on tests to see details
- Filter tests by status
- See code coverage visually

### Option 3: Coverage Report
```bash
npm run test:coverage
```
Then open `coverage/index.html` in your browser to see:
- Which files are tested
- Which lines are covered
- Coverage percentages

### Option 4: Test Results File
Check `TEST_RESULTS.md` for a summary of:
- Current test status
- What's passing/failing
- Known issues
- Recommendations

## Common Test Commands

```bash
# Run all tests once
npm test

# Run tests and watch for changes
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run only tests matching a pattern
npm test -- --grep "notification"

# Run tests in a specific file
npm test src/__tests__/integration/Notifications.test.jsx

# Run tests and update snapshots
npm test -- -u

# Run tests in verbose mode (more details)
npm test -- --verbose
```

## What Tests Cover

### Backend Tests (`server/__tests__/`)
- ✅ User creation and management
- ✅ Mood setting and retrieval
- ✅ Heart notifications (send, retrieve, mark read, delete)
- ✅ Chat requests (create, accept, reject, delete)
- ✅ Database operations

### Frontend Tests (`src/__tests__/`)
- ✅ Component rendering
- ✅ User interactions
- ✅ Notification display and actions
- ✅ Room joining/leaving
- ✅ Message sending/receiving
- ✅ Typing indicators

## Debugging Failed Tests

### 1. Read the Error Message
The error message tells you what went wrong:
- `Expected: 200, Received: 400` → API returned wrong status
- `Cannot find element` → Element not rendered or wrong selector
- `Timeout` → Test took too long (async issue)

### 2. Check the Test File
Look at the failing test to understand what it's trying to do.

### 3. Run Tests in Watch Mode
```bash
npm run test:watch
```
This helps you see changes as you fix issues.

### 4. Add Console Logs
Temporarily add `console.log()` in tests to see what's happening:
```javascript
it('should do something', async () => {
    console.log('Starting test...');
    const result = await someFunction();
    console.log('Result:', result);
    expect(result).toBe(expected);
});
```

### 5. Run Single Test
Focus on one failing test:
```bash
npm test -- --grep "should accept a chat request"
```

## Tips for Reviewing Tests

1. **Start with the summary**: Check how many tests pass/fail
2. **Read failing test names**: They describe what should work
3. **Check error messages**: They tell you what went wrong
4. **Look at test code**: Understand what each test is verifying
5. **Check coverage**: See which parts of code are tested

## Next Steps After Reviewing

1. **If tests pass**: ✅ Great! Your code works as expected
2. **If tests fail**: 
   - Read the error messages
   - Check the test code
   - Fix the issues
   - Re-run tests to verify fixes

## Getting Help

- Check `TEST_RESULTS.md` for known issues
- Look at test file comments for explanations
- Check the test code to understand what's being tested
- Review error messages carefully - they're usually helpful
