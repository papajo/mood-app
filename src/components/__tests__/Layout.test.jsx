import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../Layout.jsx';

describe('Layout Component', () => {
    it('renders children correctly', () => {
        render(
            <Layout>
                <div data-testid="child-content">Child Content</div>
            </Layout>
        );
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders header with title', () => {
        render(<Layout>Content</Layout>);
        expect(screen.getByText('MoodMingle')).toBeInTheDocument();
    });

    it('renders profile button when onProfileClick is provided', () => {
        const onProfileClick = vi.fn();
        render(<Layout onProfileClick={onProfileClick}>Content</Layout>);

        const profileBtn = screen.getByRole('button', { name: /Profile/i });
        expect(profileBtn).toBeInTheDocument();

        fireEvent.click(profileBtn);
        expect(onProfileClick).toHaveBeenCalledTimes(1);
    });

    it('does not render profile button when onProfileClick is missing', () => {
        render(<Layout>Content</Layout>);
        const profileBtn = screen.queryByRole('button', { name: /Profile/i });
        expect(profileBtn).not.toBeInTheDocument();
    });

    it('renders background gradients (visual check via class presence)', () => {
        const { container } = render(<Layout>Content</Layout>);
        // Check for specific tailwind classes related to the gradient blobs
        expect(container.getElementsByClassName('blur-[100px]').length).toBeGreaterThanOrEqual(2);
    });
});
