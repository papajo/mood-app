import React from 'react';
import { User } from 'lucide-react';
import NotificationButton from './NotificationButton';

const Layout = ({ children, onProfileClick }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-12 pb-4 px-4 relative overflow-hidden overflow-y-auto">
            {/* Background gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

            <main className="w-full max-w-md z-10 flex flex-col gap-6 relative">
                <header className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        MoodApp
                    </h1>
                    <div className="flex items-center gap-2">
                        <NotificationButton />
                        {onProfileClick && (
                            <button
                                onClick={onProfileClick}
                                className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center hover:scale-110 transition-transform"
                                title="Profile"
                            >
                                <User size={16} className="text-white" />
                            </button>
                        )}
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
};

export default Layout;
