import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '../UserContext';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Test component to consume the context
const TestComponent = () => {
  const { user, loading, error, updateUserStatus, refreshUser } = useUser();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="user-id">{user?.id || 'no-user'}</div>
      <div data-testid="username">{user?.username || 'no-username'}</div>
      <button onClick={() => updateUserStatus('New status!')}>
        Update Status
      </button>
      <button onClick={refreshUser}>
        Refresh User
      </button>
    </div>
  );
};

describe('UserContext', () => {
  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create new user when none exists in localStorage', async () => {
    // Mock successful user creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        username: 'User1234',
        avatar: 'https://i.pravatar.cc/150?u=User1234',
        status: 'Just joined!',
        currentMoodId: null
      })
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Should show loading initially
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Wait for user creation
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Check user data
    expect(screen.getByTestId('user-id')).toHaveTextContent('1');
    expect(screen.getByTestId('username')).toHaveTextContent('User1234');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');

    // Check localStorage was set
    expect(localStorage.getItem('userId')).toBe('1');
    expect(localStorage.getItem('username')).toBe('User1234');

    // Check API call was made
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('User')
      })
    );
  });

  it('should retrieve existing user from localStorage and API', async () => {
    // Set existing user in localStorage
    localStorage.setItem('userId', '123');
    localStorage.setItem('username', 'TestUser');

    // Mock successful user retrieval
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 123,
        username: 'TestUser',
        avatar: 'https://example.com/avatar.jpg',
        status: 'Active',
        currentMoodId: 'happy'
      })
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user-id')).toHaveTextContent('123');
    expect(screen.getByTestId('username')).toHaveTextContent('TestUser');

    // Should call GET /api/users/:id (may be localhost or IP from .env)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/123')
    );
  });

  it('should create new user when localStorage user not found in API', async () => {
    // Set existing user in localStorage
    localStorage.setItem('userId', '999');
    localStorage.setItem('username', 'OldUser');

    // Mock failed user retrieval (404)
    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 456,
          username: 'NewUser123',
          avatar: 'https://i.pravatar.cc/150?u=NewUser123',
          status: 'Just joined!',
          currentMoodId: null
        })
      });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Should create new user
    expect(screen.getByTestId('user-id')).toHaveTextContent('456');
    expect(screen.getByTestId('username')).toHaveTextContent('NewUser123');

    // Should update localStorage
    expect(localStorage.getItem('userId')).toBe('456');
    expect(localStorage.getItem('username')).toBe('NewUser123');
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    fetch.mockRejectedValue(new Error('Network error'));

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Network error');
    expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
  });

  it('should update user status successfully', async () => {
    // Set up initial user
    localStorage.setItem('userId', '123');
    localStorage.setItem('username', 'TestUser');

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          username: 'TestUser',
          avatar: 'https://example.com/avatar.jpg',
          status: 'Active',
          currentMoodId: 'happy'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Click update status button
    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    // Should call PATCH /api/users/:id
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/123'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'New status!' })
        })
      );
    });
  });

  it('should handle status update errors gracefully', async () => {
    // Set up initial user
    localStorage.setItem('userId', '123');
    localStorage.setItem('username', 'TestUser');

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 123,
          username: 'TestUser',
          avatar: 'https://example.com/avatar.jpg',
          status: 'Active',
          currentMoodId: 'happy'
        })
      })
      .mockRejectedValueOnce(new Error('Failed to update'));

    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Click update status button
    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    // Should handle error gracefully
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update status:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});