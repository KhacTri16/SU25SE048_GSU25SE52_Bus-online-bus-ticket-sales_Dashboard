import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeStatus: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20 p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          theme === 'dark' 
            ? 'bg-blue-500' 
            : 'bg-yellow-500'
        }`}></div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          Theme: {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </div>
    </div>
  );
};

export default ThemeStatus; 