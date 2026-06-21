import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="fixed inset-0 w-full bg-surface-200/50 flex justify-center font-sans text-content antialiased">
            {/* Mobile App Container: Centered, constrained width, app-like behavior */}
            <div className="w-full max-w-md h-full bg-surface-50 flex flex-col relative overflow-hidden shadow-2xl ring-1 ring-black/5">
                {children}
            </div>
        </div>
    );
};
