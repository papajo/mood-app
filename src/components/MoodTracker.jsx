import React from 'react';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { moods } from '../constants/moods';

const MoodTracker = ({ currentMood, onMoodChange }) => {
    const handleMoodSelect = async (mood) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // Ignore (fails in browser if not PWA, or if on strictly web)
        }
        onMoodChange(mood);
    };

    return (
        <div className="glass-panel">
            <h2 className="text-lg font-semibold mb-4 text-center text-gray-200">How's the energy?</h2>
            <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => (
                    <motion.button
                        key={mood.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMoodSelect(mood)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${currentMood?.id === mood.id
                            ? 'bg-white/10 ring-2 ring-primary shadow-lg shadow-primary/20'
                            : 'hover:bg-white/5'
                            }`}
                    >
                        <span className="text-2xl filter drop-shadow-md">{mood.emoji}</span>
                        <span className="text-xs font-medium text-gray-400">{mood.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default MoodTracker;
