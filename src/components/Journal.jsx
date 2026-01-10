import React, { useState, useEffect } from 'react';
import { Save, BookOpen, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_URL } from '../config/api';

const Journal = () => {
    const { user } = useUser();
    const [entry, setEntry] = useState('');
    const [savedEntries, setSavedEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const url = `${API_URL}/api/journal/${user.id}`;
        const result = (typeof fetch === 'function') ? fetch(url) : Promise.resolve({ ok: true, json: async () => [] });
        const fetchPromise = (result && typeof result.then === 'function') ? result : Promise.resolve({ ok: true, json: async () => [] });
        fetchPromise
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch journal entries');
                return res.json();
            })
            .then(data => {
                setSavedEntries(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch journal:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [user]);

    const handleSave = () => {
        if (!entry.trim() || !user) return;

        setSaving(true);
        setError(null);
        const newEntry = {
            userId: user.id,
            text: entry,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
        };

        fetch(`${API_URL}/api/journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry)
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to save entry');
                return res.json();
            })
            .then(savedEntry => {
                setSavedEntries([savedEntry, ...savedEntries]);
                setEntry('');
                setSaving(false);
            })
            .catch(err => {
                console.error("Failed to save entry:", err);
                setError(err.message);
                setSaving(false);
            });
    };
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 glass-panel">
                <Loader2 className="animate-spin h-6 w-6 mb-2" />
                <p>Loading user...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass-panel space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="text-secondary" />
                    Daily Reflection
                </h3>
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}
                <textarea
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    placeholder="How are you feeling right now? Write it down..."
                    className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-secondary/50 transition-colors resize-none"
                    disabled={saving}
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!entry.trim() || saving}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Entry
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Past Entries</h4>
                {loading ? (
                    <div className="glass-panel text-center py-10">
                        <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                        <p className="mt-2 text-gray-400">Loading entries...</p>
                    </div>
                ) : savedEntries.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 glass-panel">No entries yet. Start writing!</p>
                ) : (
                    savedEntries.map((item) => (
                        <div key={item.id} className="glass-panel p-4 hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-secondary font-medium">{item.date}</span>
                                <span className="text-xs text-gray-500">{item.time}</span>
                            </div>
                            <p className="text-gray-200 whitespace-pre-wrap">{item.text}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Journal;
