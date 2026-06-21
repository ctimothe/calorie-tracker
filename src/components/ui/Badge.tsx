/**
 * @description Reusable Badge component for consistent indicator styling across the app.
 * Used for calories, macros, status indicators, tags, etc.
 */
import React from 'react';

interface BadgeProps {
    variant?: 'default' | 'calories' | 'protein' | 'carbs' | 'fat' | 'success' | 'warning' | 'purple';
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

// Variant color mapping
const variants = {
    default: 'bg-surface-100 text-content-subtle border-surface-200',
    calories: 'bg-orange-50 text-orange-600 border-orange-100',
    protein: 'bg-blue-50 text-blue-600 border-blue-100',
    carbs: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    fat: 'bg-amber-50 text-amber-600 border-amber-100',
    success: 'bg-brand-50 text-brand-600 border-brand-100',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
};

// Size mapping
const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
};

const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    size = 'md',
    icon,
    children,
    className = '',
}) => {
    return (
        <span
            className={`inline-flex items-center font-bold rounded-lg border ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

export default Badge;
