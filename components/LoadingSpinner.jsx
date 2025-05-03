import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#106996]"></div>
      <span className="sr-only">Chargement...</span>
    </div>
  );
}; 