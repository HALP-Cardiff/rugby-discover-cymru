import '../styles/Header.css';
import React from 'react';

interface PathwaysButtonProps {
  imageSrc: string;
  label: string;
  onToggle: () => void;
  isActive?: boolean;
}

export default function PathwaysButton({ 
  imageSrc, 
  label, 
  onToggle, 
  isActive = false 
}: PathwaysButtonProps) {
    return (
        <button 
            className={`relative w-48 h-32 rounded-lg overflow-hidden border-2 transition-all ${
              isActive 
                ? 'border-red-600 bg-red-50 shadow-lg' 
                : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
            }`}
            onClick={onToggle}
        >   
            <img
                src={imageSrc}
                alt={label}
                className={`w-full h-full object-cover transition-all ${
                  isActive ? 'grayscale-0' : 'grayscale'
                }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-semibold text-center px-2 drop-shadow-lg">
                {label}
              </span>
            </div>
        </button>
    );
}