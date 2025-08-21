import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
        <h2 className="text-white text-2xl font-bold mb-2">Loading Game...</h2>
        <p className="text-white/80">Preparing your experience</p>
      </div>
    </div>
  );
};