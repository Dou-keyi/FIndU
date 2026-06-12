// MediaGrid.jsx — upload preview grid for composer (1/2/3/4 layout with remove)
import React from 'react';
import { X } from 'lucide-react';

export default function MediaGrid({ files, onRemove }) {
  if (!files || files.length === 0) return null;

  const renderThumb = (file, index, className = '') => {
    const url = file.preview || URL.createObjectURL(file.file || file);
    const isVideo = (file.type || file.file?.type || '').startsWith('video');

    return (
      <div key={index} className={`relative rounded-xl overflow-hidden bg-gray-100 ${className}`}>
        {isVideo ? (
          <video
            src={url}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={url}
            alt={file.alt || `Upload ${index + 1}`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Remove button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          aria-label={`Remove ${isVideo ? 'video' : 'image'} ${index + 1}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Video label */}
        {isVideo && (
          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white">
            VIDEO
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="my-3">
      {files.length === 1 && (
        <div className="max-h-[240px] rounded-xl overflow-hidden">
          {renderThumb(files[0], 0, 'w-full max-h-[240px]')}
        </div>
      )}

      {files.length === 2 && (
        <div className="grid grid-cols-2 gap-1.5 max-h-[200px]">
          {files.map((f, i) => renderThumb(f, i, 'h-[200px]'))}
        </div>
      )}

      {files.length === 3 && (
        <div className="grid grid-cols-2 gap-1.5 max-h-[200px]">
          {renderThumb(files[0], 0, 'row-span-2 h-[200px]')}
          <div className="flex flex-col gap-1.5">
            {renderThumb(files[1], 1, 'h-[97px]')}
            {renderThumb(files[2], 2, 'h-[97px]')}
          </div>
        </div>
      )}

      {files.length >= 4 && (
        <div className="grid grid-cols-2 gap-1.5 max-h-[200px]">
          {files.slice(0, 4).map((f, i) => renderThumb(f, i, 'h-[97px]'))}
        </div>
      )}
    </div>
  );
}
