// PostMediaGrid.jsx — responsive photo grid with lightbox trigger
import React, { useState } from 'react';
import Lightbox from './Lightbox';

function gridClass(count) {
  switch (count) {
    case 1: return 'grid-cols-1';
    case 2: return 'grid-cols-2';
    default: return 'grid-cols-2';
  }
}

export default function PostMediaGrid({ urls = [], altTexts = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const images = urls.filter(Boolean);

  if (images.length === 0) return null;

  const renderImage = (url, index, className = '') => (
    <button
      key={index}
      onClick={() => setLightboxIndex(index)}
      className={`relative overflow-hidden rounded-xl bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${className}`}
    >
      <img
        src={url}
        alt={altTexts[index] || `Photo ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
    </button>
  );

  return (
    <>
      <div className="mb-3">
        {images.length === 1 && (
          <div className="rounded-xl overflow-hidden max-h-[420px]">
            {renderImage(images[0], 0, 'w-full max-h-[420px]')}
          </div>
        )}

        {images.length === 2 && (
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden max-h-[320px]">
            {images.map((url, i) => renderImage(url, i, 'h-[320px]'))}
          </div>
        )}

        {images.length === 3 && (
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden max-h-[320px]">
            {renderImage(images[0], 0, 'row-span-2 h-[320px]')}
            <div className="flex flex-col gap-1">
              {renderImage(images[1], 1, 'h-[158px]')}
              {renderImage(images[2], 2, 'h-[158px]')}
            </div>
          </div>
        )}

        {images.length >= 4 && (
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden max-h-[320px]">
            {images.slice(0, 4).map((url, i) => renderImage(url, i, 'h-[158px]'))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        images={images}
        altTexts={altTexts}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
