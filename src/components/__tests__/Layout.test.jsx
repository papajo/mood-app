import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { UserProvider } from '../../contexts/UserContext';
import Layout from '../Layout.jsx';

// Mock UserContext
const mockUser = { id: 1, username: 'TestUser', avatar: null };
vi.mock('../../contexts/UserContext', async () => {
    const actual = await vi.importActual('../../contexts/UserContext');
    return {
        ...actual,
        useUser: () => ({ user: mockUser, loading: false }),
        UserProvider: ({ children }) => children
    };
});

describe('Layout Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children correctly', () => {
        render(
            <UserProvider>
                <NotificationProvider>
                    <Layout>
                        <div data-testid="child-content">Child Content</div>
                    </Layout>
                </NotificationProvider>
            </UserProvider>
        );
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders header with title', () => {
        render(
            <UserProvider>
                <NotificationProvider>
                    <Layout>Content</Layout>
                </NotificationProvider>
            </UserProvider>
        );
        expect(screen.getByText('MoodApp')).toBeInTheDocument();
    });

    it('renders profile button when onProfileClick is provided', () => {
        const onProfileClick = vi.fn();
        render(
            <UserProvider>
                <NotificationProvider>
                    <Layout onProfileClick={onProfileClick}>Content</Layout>
                </NotificationProvider>
            </UserProvider>
        );

        const profileBtn = screen.getByRole('button', { name: /Profile/i });
        expect(profileBtn).toBeInTheDocument();

        fireEvent.click(profileBtn);
        expect(onProfileClick).toHaveBeenCalledTimes(1);
    });

    it('does not render profile button when onProfileClick is missing', () => {
        render(
            <UserProvider>
                <NotificationProvider>
                    <Layout>Content</Layout>
                </NotificationProvider>
            </UserProvider>
        );
        const profileBtn = screen.queryByRole('button', { name: /Profile/i });
        expect(profileBtn).not.toBeInTheDocument();
    });

    it('renders background gradients (visual check via class presence)', () => {
        const { container } = render(
            <UserProvider>
                <NotificationProvider>
                    <Layout>Content</Layout>
                </NotificationProvider>
            </UserProvider>
        );
        // Check for specific tailwind classes related to gradient blobs
        expect(container.getElementsByClassName('blur-[100px]').length).toBeGreaterThanOrEqual(2);
    });

});
