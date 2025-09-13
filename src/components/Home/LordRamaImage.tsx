import React from 'react';

export default function LordRamaImage() {
  return (
    <div className="relative w-60 h-60 md:w-72 md:h-72 rounded-full overflow-hidden bg-orange-100 border-4 border-orange-300 flex items-center justify-center">
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-orange-50 text-orange-800">
        <div className="text-lg font-bold text-center px-4">
          Lord Rama Image Placeholder
        </div>
        <div className="text-xs text-center mt-2 px-4">
          (Replace with actual image of Lord Rama from Unsplash or a proper source)
        </div>
      </div>
    </div>
  );
}
