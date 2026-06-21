/**
 * @description Reusable Card component with variant support for consistent styling across the app.
 * Follows design system tokens for border-radius and shadows.
 */
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    variant?: 'default' | 'glass' | 'elevated' | 'outline';
    padding?: 'sm' | 'md' | 'lg' | 'none';
    rounded?: 'lg' | 'xl' | '2xl' | '3xl';
    children: React.ReactNode;
}

// Variant styles mapping
const variants = {
    default: 'bg-white border border-surface-100 shadow-card',
    glass: 'bg-white/70 backdrop-blur-xl border border-white/40 shadow-card',
    elevated: 'bg-white shadow-elevated',
    outline: 'bg-transparent border border-surface-200',
};

// Padding styles mapping
const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
};

// Border radius mapping
const roundedStyles = {
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-[2rem]',
};

const Card: React.FC<CardProps> = ({
    variant = 'default',
    padding = 'md',
    rounded = '2xl',
    children,
    className = '',
    ...props
}) => {
    const baseClasses = `${variants[variant]} ${paddings[padding]} ${roundedStyles[rounded]} ring-1 ring-black/5 transition-all`;

    return (
        <motion.div
            className={`${baseClasses} ${className}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
