import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoodTracker from '../MoodTracker';
import { moods } from '../../constants/moods';

describe('MoodTracker', () => {
    const mockOnMoodChange = vi.fn();

    beforeEach(() => {
        mockOnMoodChange.mockClear();
    });

    it('should render all mood options', () => {
        render(<MoodTracker currentMood={null} onMoodChange={() => { }} />);

        moods.forEach(mood => {
            expect(screen.getByText(mood.label)).toBeInTheDocument();
            expect(screen.getByText(mood.emoji)).toBeInTheDocument();
        });

        // Check header exists
        expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should call onMoodChange when a mood is clicked', async () => {
        const handleMoodChange = vi.fn();
        render(<MoodTracker currentMood={null} onMoodChange={handleMoodChange} />);

        const firstMood = moods[0];
        const moodButton = screen.getByText(firstMood.label).closest('button');

        fireEvent.click(moodButton);

        // Wait a tick for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(handleMoodChange).toHaveBeenCalledTimes(1);
        expect(handleMoodChange).toHaveBeenCalledWith(firstMood);
    });

    it('should highlight current mood', () => {
        const currentMood = moods[0];
        render(<MoodTracker currentMood={currentMood} onMoodChange={() => { }} />);

        const moodButton = screen.getByText(currentMood.label).closest('button');

        // Check for active classes
        expect(moodButton.className).toContain('bg-white/10');
        expect(moodButton.className).toContain('ring-2');
        expect(moodButton.className).toContain('ring-primary');
        expect(moodButton.className).toContain('shadow-lg');
    });

    it('should not highlight any mood when no mood is selected', () => {
        render(<MoodTracker currentMood={null} onMoodChange={mockOnMoodChange} />);

        moods.forEach(mood => {
            const button = screen.getByText(mood.label).closest('button');
            expect(button.className).not.toContain('bg-white/10');
            expect(button.className).not.toContain('ring-2');
            expect(button.className).not.toContain('ring-primary');
        });
    });

    it('should have hover state for non-selected moods', () => {
        render(<MoodTracker currentMood={null} onMoodChange={mockOnMoodChange} />);

        moods.forEach(mood => {
            const button = screen.getByText(mood.label).closest('button');
            expect(button.className).toContain('hover:bg-white/5');
        });
    });

    it('should call onMoodChange with correct mood data for each mood', async () => {
        render(<MoodTracker currentMood={null} onMoodChange={mockOnMoodChange} />);

        // Test each mood click one at a time
        for (const mood of moods) {
            mockOnMoodChange.mockClear();
            
            // Find button by label since it's more unique in this context
            const button = screen.getByText(mood.label).closest('button');
            fireEvent.click(button);

            // Wait a tick for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockOnMoodChange).toHaveBeenCalledTimes(1);
            expect(mockOnMoodChange).toHaveBeenCalledWith(mood);
        }
    });

    it('should have correct structure and CSS classes', () => {
        render(<MoodTracker currentMood={null} onMoodChange={mockOnMoodChange} />);

        // Check main container exists
        const glassPanel = document.querySelector('.glass-panel');
        expect(glassPanel).toBeInTheDocument();

        // Check header exists
        const heading = screen.getByRole('heading');
        expect(heading).toBeInTheDocument();

        // Check grid layout
        const grid = glassPanel.querySelector('.grid');
        expect(grid).toHaveClass('grid-cols-5', 'gap-2');

        // Check each button has base classes
        moods.forEach(mood => {
            const button = screen.getByText(mood.emoji).closest('button');
            expect(button).toHaveClass('flex', 'flex-col', 'items-center', 'gap-2', 'p-2', 'rounded-xl', 'transition-all');
        });
    });

    it('should handle accessibility correctly', () => {
        render(<MoodTracker currentMood={null} onMoodChange={mockOnMoodChange} />);

        // All buttons should be accessible
        moods.forEach(mood => {
            const button = screen.getByText(mood.emoji).closest('button');
            expect(button).toBeInTheDocument();
            expect(button).toBeEnabled();
        });
    });

    it('should display correct mood labels and emojis', () => {
        render(<MoodTracker currentMood={null} onMoodChange={mockOnMoodChange} />);

        const expectedMoods = [
            { label: 'Vibing', emoji: '😊' },
            { label: 'Chill', emoji: '😌' },
            { label: 'Hyped', emoji: '⚡' },
            { label: 'Low', emoji: '😔' },
            { label: 'Love', emoji: '🥰' }
        ];

        expectedMoods.forEach(expected => {
            expect(screen.getByText(expected.label)).toBeInTheDocument();
            expect(screen.getByText(expected.emoji)).toBeInTheDocument();
        });
    });
});