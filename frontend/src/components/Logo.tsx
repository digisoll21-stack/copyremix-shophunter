import React from 'react';
import { Target } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'default' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16'
  };

  const colors = {
    default: 'text-brand-primary',
    white: 'text-white'
  };

  return (
    <div className={`flex items-center justify-center ${colors[variant]}`}>
      <Target className={sizes[size]} strokeWidth={1.5} />
    </div>
  );
};
